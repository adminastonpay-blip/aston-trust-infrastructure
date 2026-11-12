import { CoreError } from "../core/errors.mjs";

/**
 * SQLite-backed, per-organization/per-agent Durable Object.
 * The caller must bind one DO instance to exactly one immutable tenant+agent pair.
 * Every internal request must carry the tenant context injected by the trusted Worker.
 */
export class AgentIdentity {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sql = state.storage.sql;
    this.storageHealthy = true;
    // Do not let a failed schema/storage initialization fall through to normal
    // request handling. The instance remains latched closed until it is replaced
    // after an operator-controlled storage restore.
    this.state.blockConcurrencyWhile(async () => {
      try {
        this.#initialize();
      } catch {
        this.storageHealthy = false;
      }
    });
  }

  #initialize() {
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS agent_state (
        singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
        organization_id TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        identity_json TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('active','suspended','revoked')),
        policy_id TEXT NOT NULL,
        policy_version INTEGER NOT NULL,
        currency TEXT NOT NULL,
        budget_total INTEGER NOT NULL CHECK (budget_total >= 0),
        budget_reserved INTEGER NOT NULL DEFAULT 0 CHECK (budget_reserved >= 0),
        budget_spent INTEGER NOT NULL DEFAULT 0 CHECK (budget_spent >= 0),
        state_seq INTEGER NOT NULL DEFAULT 1
      )
    `);
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS decisions (
        decision_id TEXT PRIMARY KEY,
        idempotency_key TEXT NOT NULL UNIQUE,
        request_digest TEXT NOT NULL,
        amount_minor INTEGER NOT NULL CHECK (amount_minor >= 0),
        state TEXT NOT NULL CHECK (state IN ('reserved','consumed','settled','released')),
        policy_version INTEGER NOT NULL,
        created_at TEXT NOT NULL
      )
    `);
  }

  #transaction(fn) {
    if (typeof this.state.storage.transactionSync !== "function") {
      throw new CoreError("TRANSACTION_API_UNAVAILABLE", "SQLite transactionSync is required", 503);
    }
    return this.state.storage.transactionSync(fn);
  }

  #agent() {
    const row = this.sql.exec("SELECT * FROM agent_state WHERE singleton = 1").toArray()[0];
    if (!row) throw new CoreError("AGENT_NOT_REGISTERED", "Agent is not registered", 404);
    return row;
  }

  async register({ organizationId, agentId, identity, policyId, policyVersion, currency, budgetTotalMinor }) {
    if (!organizationId || !agentId || !policyId || !Number.isSafeInteger(budgetTotalMinor) ||
        budgetTotalMinor < 0 || !/^[A-Z]{3}$/.test(currency ?? "")) {
      throw new CoreError("INVALID_REGISTRATION", "Invalid agent registration", 400);
    }
    return this.#transaction(() => {
      const existing = this.sql.exec("SELECT agent_id, organization_id FROM agent_state WHERE singleton = 1").toArray()[0];
      if (existing && (existing.agent_id !== agentId || existing.organization_id !== organizationId)) {
        throw new CoreError("IDENTITY_BINDING_CONFLICT", "DO is already bound to another identity", 409);
      }
      if (!existing) this.sql.exec(
        "INSERT INTO agent_state (singleton, organization_id, agent_id, identity_json, status, policy_id, policy_version, currency, budget_total) VALUES (1, ?, ?, ?, 'active', ?, ?, ?, ?)",
        organizationId, agentId, JSON.stringify(identity), policyId, policyVersion, currency, budgetTotalMinor
      );
      return { status: "active", stateSeq: this.#agent().state_seq };
    });
  }

  async reserveBudget({ decisionId, idempotencyKey, requestDigest, amountMinor, policyVersion, now = new Date().toISOString() }) {
    if (!decisionId || !idempotencyKey || !/^[a-f0-9]{64}$/.test(requestDigest ?? "") ||
        !Number.isSafeInteger(amountMinor) || amountMinor < 0) {
      throw new CoreError("INVALID_RESERVATION", "Invalid reservation request", 400);
    }
    return this.#transaction(() => {
      const agent = this.#agent();
      if (agent.status !== "active") throw new CoreError("IDENTITY_INACTIVE", "Agent is not active", 403);
      if (agent.policy_version !== policyVersion) throw new CoreError("POLICY_VERSION_STALE", "Policy version changed", 403);
      const prior = this.sql.exec("SELECT * FROM decisions WHERE idempotency_key = ?", idempotencyKey).toArray()[0];
      if (prior) {
        if (prior.request_digest !== requestDigest || prior.amount_minor !== amountMinor) {
          throw new CoreError("IDEMPOTENCY_KEY_REUSED", "Idempotency key reused with different request", 409);
        }
        return { decisionId: prior.decision_id, state: prior.state, replay: true };
      }
      const available = agent.budget_total - agent.budget_reserved - agent.budget_spent;
      if (amountMinor > available) throw new CoreError("BUDGET_EXCEEDED", "Insufficient available budget", 403);
      this.sql.exec(
        "INSERT INTO decisions (decision_id, idempotency_key, request_digest, amount_minor, state, policy_version, created_at) VALUES (?, ?, ?, ?, 'reserved', ?, ?)",
        decisionId, idempotencyKey, requestDigest, amountMinor, policyVersion, now
      );
      this.sql.exec("UPDATE agent_state SET budget_reserved = budget_reserved + ?, state_seq = state_seq + 1 WHERE singleton = 1", amountMinor);
      return { decisionId, state: "reserved", replay: false };
    });
  }

  async consumeReservation({ decisionId, requestDigest }) {
    return this.#transaction(() => {
      const agent = this.#agent();
      if (agent.status !== "active") throw new CoreError("IDENTITY_INACTIVE", "Revoked/suspended identity blocks consume", 403);
      const decision = this.sql.exec("SELECT * FROM decisions WHERE decision_id = ?", decisionId).toArray()[0];
      if (!decision || decision.request_digest !== requestDigest) throw new CoreError("DECISION_CONTEXT_MISMATCH", "Decision not found or digest mismatch", 403);
      if (decision.policy_version !== agent.policy_version) throw new CoreError("POLICY_VERSION_STALE", "Policy version changed", 403);
      if (decision.state !== "reserved") throw new CoreError("DECISION_ALREADY_CONSUMED", "Decision is not consumable", 409);
      this.sql.exec("UPDATE decisions SET state = 'consumed' WHERE decision_id = ?", decisionId);
      this.sql.exec("UPDATE agent_state SET budget_reserved = budget_reserved - ?, budget_spent = budget_spent + ?, state_seq = state_seq + 1 WHERE singleton = 1", decision.amount_minor, decision.amount_minor);
      return { decisionId, state: "consumed", amountMinor: decision.amount_minor };
    });
  }

  async settleReservation({ decisionId, succeeded }) {
    return this.#transaction(() => {
      const decision = this.sql.exec("SELECT * FROM decisions WHERE decision_id = ?", decisionId).toArray()[0];
      if (!decision || decision.state !== "consumed") throw new CoreError("INVALID_DECISION_STATE");
      this.sql.exec("UPDATE decisions SET state = 'settled' WHERE decision_id = ?", decisionId);
      if (!succeeded) this.sql.exec("UPDATE agent_state SET budget_spent = budget_spent - ?, state_seq = state_seq + 1 WHERE singleton = 1", decision.amount_minor);
      else this.sql.exec("UPDATE agent_state SET state_seq = state_seq + 1 WHERE singleton = 1");
      return { decisionId, state: "settled", chargedMinor: succeeded ? decision.amount_minor : 0 };
    });
  }

  async revoke({ reasonCode }) {
    if (!/^[A-Z][A-Z0-9_]{1,63}$/.test(reasonCode ?? "")) throw new CoreError("INVALID_REASON", "Invalid revocation reason", 400);
    return this.#transaction(() => {
      const agent = this.#agent();
      if (agent.status === "revoked") return { status: "revoked", stateSeq: agent.state_seq, replay: true };
      this.sql.exec("UPDATE agent_state SET status = 'revoked', state_seq = state_seq + 1 WHERE singleton = 1");
      return { status: "revoked", stateSeq: agent.state_seq + 1, replay: false };
    });
  }

  async getState() {
    const row = this.#agent();
    return {
      organizationId: row.organization_id, agentId: row.agent_id, status: row.status,
      policyId: row.policy_id, policyVersion: row.policy_version, currency: row.currency,
      budgetTotalMinor: row.budget_total, budgetReservedMinor: row.budget_reserved,
      budgetSpentMinor: row.budget_spent, stateSeq: row.state_seq
    };
  }

  async fetch(request) {
    if (!this.storageHealthy) {
      return Response.json({ ok: false, error: "STORAGE_UNAVAILABLE_FAIL_CLOSED" }, { status: 503 });
    }
    const url = new URL(request.url);
    if (request.method !== "POST") return Response.json({ error: "METHOD_NOT_ALLOWED" }, { status: 405 });

    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ ok: false, error: "INVALID_JSON" }, { status: 400 });
    }

    const tenantContext = request.headers.get("x-aston-tenant");
    if (!tenantContext) {
      return Response.json({ ok: false, error: "TENANT_CONTEXT_REQUIRED" }, { status: 403 });
    }

    try {
      if (url.pathname === "/register") {
        if (tenantContext !== body.organizationId) {
          return Response.json({ ok: false, error: "TENANT_MISMATCH" }, { status: 403 });
        }
        const result = await this.register(body);
        return Response.json({ ok: true, result });
      }

      // Bind every non-registration operation to the immutable tenant stored
      // inside SQLite, not merely to the DO name used by the router.
      const agent = this.#agent();
      if (tenantContext !== agent.organization_id) {
        return Response.json({ ok: false, error: "TENANT_MISMATCH" }, { status: 403 });
      }

      let result;
      if (url.pathname === "/reserve") result = await this.reserveBudget(body);
      else if (url.pathname === "/consume") result = await this.consumeReservation(body);
      else if (url.pathname === "/settle") result = await this.settleReservation(body);
      else if (url.pathname === "/revoke") result = await this.revoke(body);
      else return Response.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
      return Response.json({ ok: true, result });
    } catch (error) {
      // CoreError represents a deliberate policy/business rejection. Any
      // unexpected exception on this path is treated as a storage/runtime
      // integrity failure and latches the instance closed.
      if (!(error instanceof CoreError)) this.storageHealthy = false;
      return Response.json(
        { ok: false, error: error.code ?? "STORAGE_UNAVAILABLE_FAIL_CLOSED" },
        { status: error.status ?? 503 }
      );
    }
  }
}
