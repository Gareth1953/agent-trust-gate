# AWS AgentCore interceptor-contract / Cedar research

Local synthetic implementation of a narrow **MCP REQUEST interceptor** contract,
using the actual `@cedar-policy/cedar-wasm` engine, pinned to 4.14.0 in the npm
lockfile. This has not been deployed to AWS Lambda or a managed AgentCore
Gateway. It is not an AWS partnership, certification or production integration.

## What is implemented

The input/output envelope follows AWS's documented
[interceptor types](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway-interceptors-types.html).
A trusted host supplies the signed ATG grant, pinned verifier context,
authenticated-caller mapping and Cedar policy. None is inferred from forwarded
headers or request claims. The local fixture does not implement AWS identity
admission or JWT/IAM validation.

The interceptor validates a version-1 MCP `tools/call` request, compares its
compact raw JSON with the parsed body, and checks the actual Cedar decision.
The sample native policy constrains principal, resource, amount, GBP and payee.
If Cedar permits, ATG additionally requires an exact match to the signed action
and verifies the existing GatePass. Only then is the tool call forwarded
unchanged. A rejection short-circuits with the documented
`transformedGatewayResponse`; it never returns a target request alongside it.

The local walkthrough separately invokes the existing custody writer, which
rechecks the signed grant and atomically consumes authority with one fictional
record update. Admission is not execution evidence. Destination enforcement
remains necessary even if the interceptor is bypassed or its memory resets.

The raw request is deliberately restricted to the compact serialization of the
provided parsed body. Other valid JSON whitespace/representations can be
refused. Production support would need a reviewed duplicate-rejecting wire
parser and tests against actual AgentCore payloads.

## Fair native-control comparison

The walkthrough observes the sample Cedar policy permit a changed amount that
is still within its declared limit, while ATG refuses it because it differs
from the signed action. It also demonstrates Cedar's own deny, default-deny
and forbid-wins behaviour. This is **not** evidence that AgentCore cannot
implement exact approvals or spending controls: AWS also documents Dogwood
temporal policies, prior approvals and running thresholds. Those managed
capabilities were not exercised or benchmarked here.

## Reproduce

From the repository root, with Node 24 and the existing ATG build:

```sh
npm ci --ignore-scripts --prefix experiments/aws-agentcore-adapter
npm run build --silent
node --test experiments/aws-agentcore-adapter/adapter.test.mjs
node experiments/aws-agentcore-adapter/demo.mjs
```

Observed: 20 local tests passed. One initial permitted-case test failed because
canonical serialization reordered the parsed body before raw-wire comparison.
The adapter now validates data safety and then preserves the original parsed
key order in its snapshot; the complete focused run subsequently passed.

Unsupported: live AWS, real identity mapping, HTTP-target/response/streaming
interceptors, general MCP discovery, distributed state, independent custody,
live purchasing/payments and cloud operational assurance. Existing successful
common-owner bypass/whole-store restore attacks remain. Production NO-GO.

Primary sources inspected on 13 November 2026:

- [AWS interceptor contracts](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway-interceptors-types.html).
- [AWS policy concepts](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/policy-core-concepts.html).
- Installed official Cedar WASM package README/type definitions, 4.14.0;
  npm integrity is retained in `package-lock.json`.
