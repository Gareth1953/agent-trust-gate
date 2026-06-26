import assert from "node:assert/strict";
import test from "node:test";

import {
  CONTRACT_VERSION,
  formatContractForConsole,
  getContractDescription,
} from "../src/index.js";

test("contract description exposes atg.v1 metadata", () => {
  const contract = getContractDescription();

  assert.equal(CONTRACT_VERSION, "atg.v1");
  assert.equal(contract.contract_version, "atg.v1");
  assert.deepEqual(contract.required_input_fields, [
    "action_type",
    "actor",
    "target",
    "description",
  ]);
  assert.deepEqual(contract.supported_policy_profiles, [
    "standard",
    "strict",
    "regulated",
  ]);
});

test("readable contract output includes safety statement", () => {
  const output = formatContractForConsole();

  assert.match(output, /Agent Trust Gate contract atg\.v1/);
  assert.match(
    output,
    /Agent Trust Gate returns a local trust decision\. It does not execute actions\./,
  );
});
