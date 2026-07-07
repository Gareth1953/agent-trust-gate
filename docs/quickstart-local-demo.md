# Quickstart: Local Gate Demo

1. Install the existing development dependencies:

   ```text
   npm install
   ```

2. Run the test suite:

   ```text
   npm test
   ```

3. Run the allow demo:

   ```text
   npm run demo:gate:allow
   ```

4. Run a refusal demo:

   ```text
   npm run demo:gate -- --input examples/local-demo-no-mandate-refuse.json
   ```

5. Save a receipt locally:

   ```text
   npm run demo:gate -- --input examples/local-demo-money-review.json --save local-receipt.json
   ```

6. Read the console summary or rerun with `--full` to inspect every check.

7. Confirm the receipt says `settlement_executed: false` and `action_executed: false`.

**No mandate. No evidence. No verified intent. No signed gate pass. No settlement.**

This quickstart performs no action, payment, settlement, network call, or external agent contact.
