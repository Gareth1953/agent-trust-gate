# Foresight Human Approval Workflow

## Workflow

Watch -> Analyse -> Compare -> Recommend -> Gareth approves -> Dave creates build mission -> Codex implements locally

## Roles

- The foresight layer recommends only.
- Gareth approves or rejects a recommendation before any build work.
- Dave turns approved ideas into safe, bounded mission prompts.
- Codex implements locally only after a human-approved mission exists.

## No Bypass

The foresight layer cannot:

- change the roadmap automatically
- change code automatically
- create commits automatically
- publish public changes automatically
- contact developers, agents, buyers, marketplaces, competitors, or systems
- scrape or monitor live sources
- launch outreach
- execute actions

## Approval Record

Every future build mission should state which signal motivated it, what Gareth
approved, what safety boundary applies, and what must remain out of scope.

Public contact: `gpmiddleton71@gmail.com`

