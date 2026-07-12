# Foresight Recommendation Scoring Guide

## Purpose

The Strategic Foresight Layer uses local illustrative advisory scores to decide
whether a manually supplied signal should become a future mission candidate.

## Scoring Fields

- `relevanceToGatePass`: how directly the signal affects GatePass as the core proof primitive.
- `urgency`: whether the signal should be reviewed soon or can wait.
- `commercialImpact`: whether the signal may improve paid technical review or pilot relevance.
- `technicalFeasibility`: whether a local proof-of-concept mission is realistic.
- `reviewerCredibilityImpact`: whether it makes the repo easier to inspect or trust.
- `safetyRisk`: whether the topic could create overclaiming, live-action, or autonomy risk.
- `implementationComplexity`: how difficult a safe local mission would be.
- `dependencyRisk`: whether it depends on external services, standards, packages, or live systems.
- `humanApprovalRequired`: always true.

Scores are local illustrative advisory scores only. They are not market
forecasts, business predictions, investment advice, security assessment, or
production readiness evidence.

## Reading Scores

A high score means "consider a future mission." It does not mean "build
automatically." High safety risk means the mission should be scoped more
carefully or deferred until a safer local-only framing exists.

## Approval

No recommendation becomes a build without Gareth approval. Dave creates the
mission prompt after approval. Codex implements locally only after that.

