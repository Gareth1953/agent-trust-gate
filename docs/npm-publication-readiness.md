# npm Publication Readiness

## Purpose

This document records npm publication readiness boundaries for Agent Trust Gate. It does not publish a package and does not change the package privacy status.

## Current Package Status

- Package name: `agent-trust-gate`.
- Version: `0.1.0`.
- Current status: private package metadata.
- Publication status: not published.
- Primary use: local deterministic demos, tests, docs, schemas, and examples.

The package must remain private for this mission.

## Pre-Publication Review Requirements

Before any future npm publication, the project would need:

- explicit Gareth approval;
- package-content review;
- private/generated artifact exclusion review;
- package naming and scoped-package review;
- provenance and trusted-publishing review;
- two-factor authentication and owner-access review;
- README and claims-boundary review;
- license and security policy review;
- package dry-run audit;
- rollback and deprecation plan;
- confirmation that no credentials, payment endpoints, live keys, private data, or unsupported production claims are included.

## Publication Boundary

P3-M142 does not:

- change `"private": true`;
- bump the package version;
- log in to npm;
- publish a package;
- create a tag or release;
- create package credentials;
- claim production readiness.

`npm pack --dry-run --json` may be used locally for audit only. It must not be followed by publish.

## Safety Boundary

npm readiness is documentation and local audit only. It adds no live API, MCP server, A2A server, registry publication, payment processing, settlement execution, production signing, network call, deployment, or action execution.
