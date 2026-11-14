# Automatic integration evidence and review loop

This adds a repeatable **test → evidence → review** loop. It does not add
machine learning, autonomous source editing, automatic policy updates, agent
contact, cloud deployment or proof of community acceptance.

On the repository's existing pull-request/main-push regression workflow:

1. Fixed ACS, AP2 and AWS-contract test suites run against their pinned
   dependencies. Arbitrary feedback cannot supply executable commands.
2. The collector checks structured test counts and process exit codes. Missing
   runtimes, zero tests, skipped/incomplete suites and malformed summaries do
   not become a pass. A failure cannot be promoted by a textual success claim.
3. A unique JSON evidence file records the actual source hashes, Git revision,
   dirty-tree flag, source stability and per-suite results. Earlier runs are
   not overwritten. A source change during the run blocks the results.
4. Fixed review topics flag failed or blocked work and the continued need for
   external validation. They grant no execution authority and apply no patch.
5. Sanitised JSON reports are retained as GitHub Actions artifacts for 30 days,
   including on failure when the collector can run. Raw test logs stay in a
   private directory on that runner; they are not included in those artifacts.

Human/community feedback can lead to a new regression case after review. Then
future CI runs automatically check that case. ATG does not automatically ingest
emails, forum posts, other agents' claims or arbitrary documents as trusted
policy. Passing tests do not establish independent review or remove the known
successful common-owner attacks.

## Run locally

Prepare the ATG build and pinned ACS/AP2/Cedar dependencies described in their
experiment directories, then:

```sh
python3 -m unittest discover -s experiments/improvement-loop -p 'test_*.py'
python3 experiments/improvement-loop/collect.py --out /tmp/atg-evidence --ap2-python /tmp/atg-ap2-env/bin/python
```

The `--ap2-python` argument selects a trusted local Python interpreter, not a
URL or executable supplied by an agent. Omitting it records AP2 as BLOCKED
and exits nonzero. The reports are observations from local trusted code,
not signed independent attestations or tamper-proof records against the host
administrator. A local caller could modify code or files; independent custody
and independent assessment are separate requirements.

An observed complete run recorded ACS 37, AWS-contract 20 and AP2 26 passing
checks. Eight collector guard tests passed. A separate missing-runtime run
recorded AP2 BLOCKED with zero tests and returned nonzero.

This automation becomes a continuing main-branch workflow after the reviewed
change is merged. Pull-request workflow executions can exercise it before that.
It does not run continuously between GitHub events or independently of an
available runner. Existing workflow/hosting usage limits still apply.
