# Private Sandbox Test Harness

This offline harness verifies the approved preparation plan against allowlisted fake/test agents, denial controls, and a rejected real/external-agent case.

`npm run sandbox:harness -- examples/private-sandbox-test-harness-input.json --pretty`

`harness_passed` means the local fake-agent checks behaved correctly. It does not authorize a live sandbox, external agents, networking, payment, deployment, or action execution. Gareth final approval remains required before any real external test.
