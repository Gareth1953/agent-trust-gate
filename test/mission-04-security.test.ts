import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, readFileSync, statSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { canonicalizeJson, createBaseExactActionInput, createCanonicalActionEnvelope, issueExactActionGatePass, InMemoryNonceStore, createVerifierContext, verifyExactActionAtExecution } from "../src/exact-action-gatepass.js";
import { createCanonicalPayload, createCanonicalPayloadHash, verifyLocalTrustReceiptSignature } from "../src/local-signed-proof.js";
import { LocalDurableLifecycleStore, createOperatorAuthorityEvidence } from "../src/durable-action-lifecycle.js";

for (const [name, serialize] of [["action", canonicalizeJson], ["receipt", createCanonicalPayload]] as const) {
  for (const nested of [false, true]) {
    test(`${name} canonical bytes include own __proto__ data (${nested ? "nested" : "root"})`, () => {
      const malicious = JSON.parse('{"amount":1,"__proto__":{"recipient":"changed"}}');
      const value = nested ? { details: malicious } : malicious;
      const clean = nested ? { details: { amount: 1 } } : { amount: 1 };
      assert.notEqual(serialize(value), serialize(clean));
      assert.deepEqual(JSON.parse(serialize(value)), value);
      assert.equal(Object.getPrototypeOf(malicious), Object.prototype);
    });
  }
}

test("canonical payload hashes distinguish previously omitted fields", () => {
  assert.notEqual(createCanonicalPayloadHash(JSON.parse('{"x":1,"__proto__":7}')), createCanonicalPayloadHash({x:1}));
});

test("a signed legacy receipt rejects an added own __proto__ payload field", () => {
  const receipt = JSON.parse(readFileSync("examples/local-signed-trust-receipt-valid.json", "utf8"));
  assert.equal(verifyLocalTrustReceiptSignature(receipt).verified, true);
  Object.defineProperty(receipt.payload, "__proto__", { value: { injected: true }, enumerable: true });
  const check = verifyLocalTrustReceiptSignature(receipt);
  assert.equal(check.verified, false);
  assert.equal(check.payloadHashMatches, false);
  assert.equal(check.signatureValid, false);
});

test("own __proto__ data changes the exact approved action and prevents execution", () => {
  const input = createBaseExactActionInput({ canonicalArguments: { amount: 1 } });
  const issued = issueExactActionGatePass(input);
  const store = new InMemoryNonceStore(); store.registerUnused(issued.gatePass);
  const changed = { ...input, canonicalArguments: JSON.parse('{"amount":1,"__proto__":{"recipient":"changed"}}') };
  assert.notEqual(createCanonicalActionEnvelope(changed).actionDigest, issued.gatePass.action.actionDigest);
  const checked = verifyExactActionAtExecution(issued.gatePass, changed, createVerifierContext(issued, store));
  assert.equal(checked.verified, false);
});

test("durable state creates owner-only files and directories even under permissive POSIX umask", { skip: process.platform === "win32" }, () => {
  const root = mkdtempSync(join(tmpdir(), "atg-m04-permissions-"));
  const path = join(root, "private", "state.json");
  const prior = process.umask(0);
  try {
    const store = new LocalDurableLifecycleStore({ statePath: path });
    const control = { reason: "synthetic permission regression", recordedAt: "2026-09-02T09:01:00.000Z", authorityEvidence: createOperatorAuthorityEvidence() };
    assert.equal(store.setEmergencyStop({ ...control, active: true }).changed, true);
    assert.equal(statSync(path).mode & 0o777, 0o600);
    assert.equal(statSync(dirname(path)).mode & 0o777, 0o700);
    // Atomic replacement also restricts the new inode; existing directory ACLs
    // are deliberately not rewritten by this library.
    chmodSync(path, 0o644);
    assert.equal(store.setEmergencyStop({ ...control, active: false }).changed, true);
    assert.equal(statSync(path).mode & 0o777, 0o600);
  } finally { process.umask(prior); }
});
