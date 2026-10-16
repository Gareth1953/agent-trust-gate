# Mission 05 buyer-discovery preparation

Local preparation only, 16 October 2026. Branch `prepare/mission-05-buyer-discovery` starts at verified `origin/main` **63d1ff252842adc685cb0af72e7bfccdb1bec3c6**. Original divergent local main and all pre-existing mission branches/worktrees are preserved.

## Buyer-facing changes

- New `discovery-site/payeeshield.html`: supplier-bank-change workflow, exact-action controls and refusals, UNKNOWN/no retry and explicitly same-process reconciliation, Node 20+ source setup from the repository root, local server lifecycle and clear separation from the unchanged local.7 plugin.
- Contextual discovery links on Home, Plugin and Solutions; sitemap, static AI catalogue entry and `llms.txt` route. The new canonical URL uses the corporate domain; historical route expectations remain intact.
- Uses shared corporate assets, navigation, skip link, focus treatment and reduced-motion conventions. Modified entry pages have focusable main landmarks; Solutions now explicitly connects its menu toggle to its named navigation.
- Discovery/public-claims validators include the new route. The Pages artifact guard requires the new file but does not broaden workflow triggers.

Fictional data, public fixture keys, fixed clock, volatile process-local state and same-host/same-user limitations are visible. No live bank verification, payments, ERP writes, real human authentication, durable recovery, independent destination evidence, certification or operational protection is claimed. GitHub Pages is expressly a static guide and cannot run the Node server. Evaluation enquiries use `gareth@agenttrustgate.com`; no checkout, price or service commitment is added.

## Actual verification

Windows Node **24.21.0**:

- Typecheck passed.
- Discovery-site and public-claims validators passed, including local links, metadata, selected-artifact boundaries and unsupported-claim checks.
- **23/23** targeted tests passed, zero failed/skipped: existing browser-publication/public-positioning checks plus three new discovery checks. The new negative test proves that an unsupported payment-execution claim on the new route fails public-claims validation.
- Published-release validator passed: **seven archive checksums**, **54 compiled runtime files** and existing recorded evidence checks. local.7 remains `dcf75970db520fdd10afea63aa1a9d20780dc12a053c8e09f49b0f21ed1dddad`. Git confirms no diff from the verified base for downloads, SHA256SUMS or the existing Challenge/shared-worker/destination recordings. No archive or recording was rebuilt.
- Temporary-profile headless Edge **155.0.4283.45**: all **12 ATG page/viewport combinations** passed (new evaluation page plus changed Home, Plugin and Solutions at 1440/390/320px). Local links returned 200, fragments resolve, native keyboard skip/menu/Escape/focus controls work, one H1 is present, and no page exceptions, external page requests or document/body horizontal overflow were observed.
- The same harness passed all **nine standalone page/viewport combinations** against the exact five-file staged standalone artifact. Those results live in the standalone repair repository.
- Seven distinct existing HTTPS reference targets returned 200. The new unpublished canonical URL is checked against the local artifact, not presented as an already published endpoint. The loopback demo link requires the documented local server and was not started for this static-page review.
- Visually inspected the new ATG page at all three widths, plus representative standalone index desktop, Audit 390px and status 320px captures. Final screenshots and machine-readable browser results are retained under `reports/mission-05-buyer-discovery/`.
- Git whitespace and JavaScript syntax checks passed.

An initial validation run exposed the new route's conflict with a historical GitHub-domain canonical expectation; the validator now checks this route against the corporate domain. Initial browser harness assertions were corrected for exact copy and Chromium's native Enter event text, then all viewport checks passed. Visual review prompted scoped hero spacing. Initial logs are retained separately from final results.

No unrelated full regression, executable-demo browser suite, Node 20 suite, physical-device or screen-reader testing was repeated. No email was sent and no payment flow was invoked. The site changes do not add operational controls beyond the reviewed local source demo.

## Publication instructions — awaiting Gareth's approval

Current Pages configuration is **workflow** deployment to `https://agenttrustgate.com/`. `.github/workflows/deploy-discovery-pages.yml` runs on manual dispatch or an eligible push to **main**. Discovery-site changes in this candidate match that path filter, so merging/pushing these changes to main would automatically publish them. A preparation-branch push/PR alone is not a deployment trigger.

Gareth and Dave should review the committed diff, page captures and both repositories' claim boundaries first. Only after separate approval should the preparation branch be pushed and proposed for main; approval to publish must precede merging or dispatching the deployment workflow. Do not rebuild the sealed local.7 archive or reset held state. This work performed no push, PR creation, merge, tag, release, deployment, publication or authentication change.
