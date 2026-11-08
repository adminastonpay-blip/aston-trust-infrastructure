/** Universal Decision Contract states (ATI 2.0 §5) */

export type DecisionState =
  | "RECEIVED"
  | "IDENTIFIED"
  | "AUTHORIZED"
  | "DENIED"
  | "BUDGET_RESERVED"
  | "EXECUTING"
  | "EXECUTED"
  | "VERIFIED"
  | "EVIDENCE_STORED"
  | "TIMESTAMP_PENDING"
  | "TIMESTAMP_CONFIRMED"
  | "FAILED"
  | "REVOKED";

const ALLOWED: Record<DecisionState, DecisionState[]> = {
  RECEIVED: ["IDENTIFIED", "FAILED"],
  IDENTIFIED: ["AUTHORIZED", "DENIED", "FAILED"],
  AUTHORIZED: ["BUDGET_RESERVED", "DENIED", "FAILED"],
  DENIED: [],
  BUDGET_RESERVED: ["EXECUTING", "FAILED", "DENIED"],
  EXECUTING: ["EXECUTED", "FAILED"],
  EXECUTED: ["VERIFIED", "FAILED"],
  VERIFIED: ["EVIDENCE_STORED", "FAILED"],
  EVIDENCE_STORED: ["TIMESTAMP_PENDING", "REVOKED"],
  TIMESTAMP_PENDING: ["TIMESTAMP_CONFIRMED", "FAILED"],
  TIMESTAMP_CONFIRMED: ["REVOKED"],
  FAILED: [],
  REVOKED: [],
};

export function canTransition(from: DecisionState, to: DecisionState): boolean {
  return (ALLOWED[from] || []).includes(to);
}

export type DecisionTrace = {
  decision_id: string;
  states: { state: DecisionState; at: number; note?: string }[];
  current: DecisionState;
};

export function newTrace(decision_id: string): DecisionTrace {
  return {
    decision_id,
    states: [{ state: "RECEIVED", at: Date.now() }],
    current: "RECEIVED",
  };
}

export function advance(
  trace: DecisionTrace,
  to: DecisionState,
  note?: string
): DecisionTrace {
  if (!canTransition(trace.current, to)) {
    return {
      ...trace,
      states: [
        ...trace.states,
        { state: "FAILED", at: Date.now(), note: `illegal_transition:${trace.current}->${to}` },
      ],
      current: "FAILED",
    };
  }
  return {
    ...trace,
    states: [...trace.states, { state: to, at: Date.now(), note }],
    current: to,
  };
}
