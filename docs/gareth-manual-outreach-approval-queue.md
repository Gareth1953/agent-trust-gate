# Gareth Manual Outreach Approval Queue

This local queue scores placeholder targets and records Gareth's effective target, educational-message, technical-invitation, and interest-gated pilot-follow-up decisions.

```text
npm run outreach:queue -- examples/gareth-manual-outreach-approval-queue-input.json --pretty
```

Use `--markdown` or `--csv` for local text output. A target must be approved before a message can be approved. Pilot follow-up additionally requires recorded possible or explicit interest. Rejection and `do_not_contact` block every later step. Manual contact status records activity performed outside the tool; it does not cause contact.

The queue does not search, scrape, send, contact, track, publish, deploy, bill, network, or execute. Contact rules vary by jurisdiction and may require legal review. Gareth approves every target and every message; all actual contact remains outside this tool.
