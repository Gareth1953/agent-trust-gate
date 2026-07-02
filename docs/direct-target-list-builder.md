# Direct Target List Builder

This local builder scores and ranks manually supplied placeholder agent/system targets for Gareth's private-pilot review.

```text
npm run pilot:targets -- examples/direct-target-list-builder-input.json --pretty
```

Use `--markdown` or `--csv` for local text output. High relevance and governance need carry the largest score weights; evidence, action risk, commercial fit, budget likelihood, and integration complexity adjust the deterministic 0-100 result.

The command does not search, scrape, track, send email or messages, publish, deploy, expose an API, collect payment, or execute actions. Gareth manually reviews every target and separately approves every message before any contact outside this tool.
