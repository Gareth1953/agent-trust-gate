# Release Candidate Tag Guidance

This document records safe local tag guidance for a possible future, human-approved release-candidate step. P3-M104 does not create or push a tag.

Suggested local tag format: `v0.1.0-rc.1`

## Future manual examples — do not run automatically

The following commands are documentation for later Gareth-approved use only. Do not run them automatically.

    git tag v0.1.0-rc.1
    git tag -n
    git push origin v0.1.0-rc.1

Do not create a git tag unless Gareth explicitly requests it in a later step. Do not push any tag. Do not push to a remote. Do not publish a package.

Tagging does not activate a deployment, payment, settlement, external agent contact, or production signing. AUC is not integrated. Agent Contact System is not integrated. The current project remains local-first and `local_demo_only`.
