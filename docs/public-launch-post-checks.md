# Public Launch Post-Checks

Use these checks manually only after a future Gareth-approved public repository launch. P3-M107 does not perform the launch or any network check.

## Repository files

- [ ] Open the public repository page manually.
- [ ] Verify the README renders correctly.
- [ ] Verify `LICENSE` is visible.
- [ ] Verify `SECURITY.md` is visible.
- [ ] Verify `RELEASE_NOTES.md` is visible.
- [ ] Verify `agent-trust-gate.manifest.json` is visible and still reports `local_demo_only`.
- [ ] Verify the schema files are visible.
- [ ] Verify the synthetic examples are visible.
- [ ] Verify `public/index.html` is visible as a static repository file.

## Safety review

- [ ] Confirm no real secrets, tokens, keys, credentials, or private data are visible.
- [ ] Confirm no live payment language or payment activation instruction is present.
- [ ] Confirm no settlement execution is active or claimed.
- [ ] Confirm no external agent contact is active or claimed.
- [ ] Confirm AUC is not integrated.
- [ ] Confirm Agent Contact System is not integrated.
- [ ] Confirm no live API, hosted sandbox, banking or wallet logic, production signing, outreach automation, or action execution is active.

If any check fails, stop public launch work and correct the repository locally before any further human-approved push.

**No mandate. No evidence. No verified intent. No signed gate pass. No settlement.**
