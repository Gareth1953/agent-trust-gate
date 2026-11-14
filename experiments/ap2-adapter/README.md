# AP2 delegated-checkout / ATG synthetic destination experiment

Independent, non-production ATG integration with the actual AP2 Python SDK,
pinned at `e1ea56db72a6385bce3e5c1112b3a56ce60acb43`. No Google partnership,
endorsement, certification, live checkout or payment protection is claimed.

## Implemented flow

1. A disposable fixture user key signs an AP2 open checkout mandate delegating
   to a disposable agent key. Constraints specify one merchant and item set.
2. The merchant signs a checkout JWT. The agent presents the closed checkout
   mandate, bound to the merchant audience and a challenge nonce.
3. The unchanged AP2 SDK verifies the SD-JWT delegation chain with an explicitly
   pinned root public key, audience, nonce, host clock and zero clock skew.
4. ATG's Python adapter verifies the merchant JWT with a separately pinned
   merchant public key, recomputes the checkout hash, checks SDK constraints,
   lifetimes, merchant, SKU/quantity, GBP minor-unit totals and a host cap.
5. Only after success does the trusted Python host pass the narrow binding
   through a private local pipe to the Node fixture destination. It issues an
   ordinary signed ATG grant for one fictional record. The grant's value binds
   the checkout JWT digest, amount maps in integer minor units, and expiry is
   bounded by the verified mandate/checkout expiry.
6. The existing ATG custody writer independently rechecks its signed grant
   using a live clock at commit, including after lock acquisition. Grant
   consumption, idempotency and the synthetic record update commit together.

The idempotency key binds tenant, merchant and checkout ID, so presenting the
same checkout with another token or fresh ATG nonce does not create another
effect within the retained writer. Unknown destination outcomes grant no
automatic retry. The retained walkthrough records one actual run without
tokens or private keys.

## Scope and trust assumptions

- ES256 / SHA-256, exactly two delegation hops, mandatory short lifetimes,
  one pinned fixture merchant, explicit merchant/item constraints, GBP and
  a maximum fictional £5,000. General AP2 flows are deliberately unsupported.
- The host cap supplements the open mandate's constraints; it is not a claim
  that the human separately approved the closed checkout's exact price.
- The Python verifier, its trust configuration and its private pipe are in the
  trusted host boundary. The Node pipe is NOT an agent endpoint: an attacker
  allowed to write arbitrary mappings to it could bypass AP2 verification.
  No untrusted `verified:true` flag or request-supplied key is accepted by
  the Python verification entry point.
- The destination provisions a disposable synthetic store once per process.
  Store retention covers repeat requests in that process. Restart provisions
  a new fixture and is NOT a durable AP2 merchant service. Production would
  require a separately provisioned, retained destination store and issuance
  policy under independent administration.
- No real identity, trusted user interface, provider credential issuance,
  revocation service, merchant enrollment, payment instrument, payment rail,
  AP2 payment mandate or receipt conformance is established.
- Successful existing common-owner SQL/whole-store-clone attacks are unchanged.
  Production NO-GO remains. A valid AP2 signature does not prove commercial
  wisdom, price fairness or beneficial intent.

## Reproduce from the repository root

Use Node 24 and Python 3.11+ in an isolated environment:

```sh
npm ci --ignore-scripts
npm run build --silent
python3 -m venv /tmp/atg-ap2-env
/tmp/atg-ap2-env/bin/pip install -r experiments/ap2-adapter/requirements.txt
/tmp/atg-ap2-env/bin/python experiments/ap2-adapter/verify_sdk.py
/tmp/atg-ap2-env/bin/python -m pytest -q experiments/ap2-adapter/test_adapter.py
/tmp/atg-ap2-env/bin/python experiments/ap2-adapter/demo.py
```

`verify_sdk.py` compares all 44 retained non-test SDK Python source files with
the installed SDK. This establishes file identity with the pinned source,
not an independent security assessment. The SDK's declared dependencies are
installed in the isolated environment. The SDK remains unmodified and is
Apache-2.0 licensed by its upstream project. No SDK code is vendored here.

## Validation and remaining work

Initial local run: 26 AP2 adapter/integration tests passed, including actual
signature verification, wrong issuer/merchant keys, wrong audience/nonce,
tampering, expired authority, merchant/SKU/quantity substitution, integer and
total checks, invalid-token no-call, one synthetic commit and replay refusal.
An injected missing destination response yielded UNKNOWN with one attempt.

This is checkout-authorisation interoperability, not a full AP2 implementation
or production deployment. A buyer-controlled merchant, real principal/custody
boundaries, retained cross-restart state, external review and a measured native
baseline comparison remain necessary.
