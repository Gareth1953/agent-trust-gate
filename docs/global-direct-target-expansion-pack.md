# Global Direct Target Expansion Pack

This extension adds worldwide region fields, a deterministic global fit score, global priority ranking, region summaries, and jurisdiction contact cautions to the local Direct Target List Builder.

```text
npm run pilot:targets -- examples/global-direct-target-list-builder-input.json --pretty
```

The global score uses up to 70 points from local pilot fit plus bounded market scope, international relevance, category, jurisdiction-caution, and region adjustments. Region summaries group accepted placeholder targets and order regions by average global score. Contact caution is a manual planning prompt, not legal advice.

The tool performs no internet search, scraping, lookup, lead harvesting, contact, email, messages, tracking, publishing, deployment, payment, or action execution. Targets may be worldwide, but Gareth must manually approve every target and every message before any separately approved contact outside this tool.
