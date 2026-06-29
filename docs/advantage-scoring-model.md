# Advantage Scoring Model

This model is a local strategic planning tool only. It does not scan markets, verify competitors, prove demand, approve a feature, authorize spending, or activate commercial systems.

## Scale

- `0`: no strategic advantage
- `5`: useful but ordinary
- `8`: strong differentiator
- `10`: rare, valuable, defensible, simple, and commercially useful

Intermediate scores represent the reviewer’s current evidence-weighted judgment. Unknown dimensions should not receive optimistic values merely because evidence is unavailable.

## Criteria

- `uniqueness_score`: distance from generic governance and common platform features.
- `defensibility_score`: difficulty of responsible replication and strength of durable assets.
- `agent_to_agent_value_score`: usefulness at an agent-to-agent decision point.
- `machine_to_machine_fee_potential_score`: clarity and value of a future machine-paid check.
- `refusalgraph_value_score`: contribution to refusal intelligence quality or utility.
- `private_data_safety_score`: ability to deliver value without raw private data.
- `developer_adoption_score`: integration clarity, compatibility, and time to useful output.
- `commercial_clarity_score`: identifiable buyer, value metric, and commercial boundary.
- `big_company_resistance_score`: resistance to bundling or easy replication by large platforms.
- `simplicity_score`: ability to explain, build, operate, and adopt without unnecessary complexity.

## Calculation

Each score is clamped to `0–10`. The overall score is the unweighted arithmetic average of all ten criteria, rounded to two decimal places:

```text
overall_advantage_score = round(sum(clamped_scores) / 10, 2)
```

Equal weighting keeps assumptions visible. Future weighting changes require explicit documentation, tests, and Gareth approval; weights must not be tuned to justify a preferred mission.

## Bands And Recommendations

| Overall score | Band | Recommendation |
| --- | --- | --- |
| `0–3.99` | `weak` | `reject_or_defer` |
| `4–5.99` | `ordinary` | `improve_before_building` |
| `6–7.49` | `promising` | `build_if_safe` |
| `7.5–8.99` | `strong` | `high_priority` |
| `9–10` | `exceptional` | `strategic_priority` |

`build_if_safe`, `high_priority`, and `strategic_priority` are planning recommendations only. They do not override scope, validation, privacy, security, legal, commercial, or Gareth approval gates.

## Strengths And Weaknesses

The scorer returns all dimensions tied for the highest and lowest clamped values. It returns dimension names only, not reviewer notes, competitor details, customer data, or raw evidence.

## Review Discipline

Record the rationale separately using the mission template. Re-score when architecture, customer evidence, safety requirements, or market conditions materially change. Do not use live scraping, tracking, or automated outreach to update scores in the current local-only phase.
