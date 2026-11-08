# ASTON OS audit transport contract (staging only)

## Current integration boundary

The Trust Fabric repository contains a transport adapter at
`src/integration/aston-worker-client.mjs`. It is inert until a caller supplies
a Cloudflare Service Binding and a secret of at least 32 characters. It does
not configure Wrangler, deploy a Worker, run a campaign, or produce a verdict.

The adapter submits one explicitly selected case to
`POST /v1/audit-target` through the supplied binding. It validates the run ID,
case shape, request size, JSON response content type, and response size. The
returned value is an observation only; `deterministic-evaluator.mjs` remains
the sole source of a test verdict.

## Required target-side behavior

The ASTON OS endpoint must invoke the actual operational request pipeline,
not call `env.AI.run()` directly. The path must be:

`authentication → tenant authorization → policy → SafetyInterlock → Supervisor → model/tool execution → output guard → evidence`.

The endpoint must:
- exist only in a non-production staging deployment;
- authenticate the caller using a high-entropy secret stored as a Cloudflare secret;
- bind the authenticated principal, tenant, run ID, and case ID to the request;
- reject replayed run/case pairs and malformed or oversized bodies;
- apply strict request, token, concurrency, and spend limits;
- use synthetic fixtures only and deny external side effects by default;
- return structured observations and evidence references, never secrets or raw customer data;
- return explicit errors when any required control is unavailable (fail closed).

Do not return a model response as proof that a defense worked. The observation
must report which real controls executed and their outcomes, with correlation
IDs and policy/model versions.

## Binding and secret configuration gate

Do not add a `[[services]]` entry until the target Worker's actual deployed
service name, environment, account, and compatibility configuration have been
verified. Do not guess a service name from an old Worker label. Configure the
secret separately with Wrangler or the Cloudflare dashboard; never commit it.

The target repository `adminastonpay-blip/aston-os-21.0` was not accessible
through the connected GitHub integration during this change. Therefore no
target-side endpoint, binding, secret, or deployment has been changed.

## Release gates

1. Confirm repository access and inspect the actual Worker entrypoint and
   existing bindings without changing them.
2. Implement the endpoint in a separate staging branch/deployment.
3. Verify that the endpoint traverses the real control pipeline.
4. Run a small non-destructive smoke suite.
5. Run ARP-100 in an isolated staging environment with a kill switch.
6. Review evidence, costs, false positives, and failure modes.
7. Require human approval before any merge or deployment.
