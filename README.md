# Sovereign Lab

**A local-first capability, aspiration, and development workspace.**

Sovereign Lab is a prototype of a dynamic human capability and alignment framework. It separates **thought**, **action**, and **integrity** into independently assessed capabilities, then compares evidence-based proficiency with an aspiration's adjustable target profile. It also offers private flourishing reflections and a completely separate professional role-review workspace.

## Run

Open `index.html` in any modern browser. No server, login, build process or third-party dependencies are required. You can also serve it as a static site (for example, through GitHub Pages from the repository root).

## What works in v0.1

- 16 capabilities in three axes, each with descriptions, evidence examples and deliberate-practice prompts.
- Proficiency scale `0–4` **plus a separate “not assessed” state**; no universal person score.
- Independent ratings for demonstrated proficiency, personal importance and motivation.
- Five illustrative aspiration templates, editable individual targets and dated aspiration snapshots.
- Evidence-first gap analysis and prioritized personal practice suggestions.
- Private, unscored journal for inner freedom, meaning, relationships and contentment.
- Separate professional review profile with role requirements, observed evidence, provisional coverage and alternative-role *hypotheses*.
- Browser-local persistence, JSON backup/import, review-only JSON export, and reset.
- Responsive desktop/mobile design; printable professional review page.

## Important boundaries

This is an **unvalidated development aid**, not a psychometric test or human ranking system. The sample target templates are hypotheses, not established job competency standards. Missing observation is not equivalent to an inability. Real performance is affected by role design, opportunities, systems, management, support and resources. Never automatically determine hiring, firing, compensation, promotions or employee placement from these prototype indicators. Require multiple sources of evidence, transparent criteria, employee participation and applicable local employment policy.

The integrity dimension concerns **observable professional conduct** when used in workplace reviews. Private spirituality, religion, politics, personal fulfilment or character judgments should not enter employment evaluation. The flourishing journal is excluded from the review-only export.

## Privacy and security

- The app makes **no network calls** and contains no trackers or analytics.
- Information is saved in the browser's `localStorage`, which is **not encrypted**. Avoid shared computers for identifiable workplace data.
- The GitHub repository is private. However, if the website is made public, visitors can inspect HTML, CSS and JavaScript downloaded into their browser. Never commit personal backups, journals or employee-review JSON files to any repository.
- Export JSON files are unencrypted; store and transmit them responsibly.
- This prototype is single-user and does not have access controls, server-side storage, consent management or audit logs. It is **not enterprise-ready** for sensitive personnel workflows.

## Repository structure

- `index.html` — accessible semantic interface and page shell.
- `styles.css` — responsive visual system.
- `data.js` — capability dictionary, proficiency anchors, aspiration templates, practice prompts.
- `app.js` — local application logic, review workspace and exports.

## Ways to extend

1. Validate the capability definitions and behavioral anchors with subject-matter experts; test inter-rater consistency.
2. Add context-specific technical competencies and role calibration sessions.
3. Introduce evidence quality and observation opportunity tracking instead of one-number ratings.
4. Support explicit opt-in sharing, role-based access, encryption and audit logging before organizational pilots.
5. Model development-plan commitments, follow-up checkpoints and progress without assuming that all aspirations must rise.

## License

Proprietary; all rights reserved. No open-source license is granted for reuse or redistribution.

## Hosting a public website from private source

The GitHub repository `kriven-lang/sovereign-lab` is intentionally **private**. A public site can be hosted using Cloudflare Pages with private GitHub integration. GitHub Pages is another option if the GitHub plan supports Pages from private repositories. Neither hosting option hides client-side code sent to visitors. Do not publish personal assessment datasets, employee reviews, API secrets or private keys.

**Deployment status:** Source committed to GitHub; public hosting is a separate configuration step.
## Quick sanity check

With Node.js installed, run `node tests/smoke.cjs` to validate the main screen renders, evidence saves, aspiration history, review export isolation and basic input escaping.
## v0.2 — Authentication foundation

The site stays hosted by GitHub Pages. Google login and manual cloud backups require Firebase one-time setup; see `docs/GOOGLE_SIGN_IN.md`. Only personal assessment and aspiration data is eligible for backup. Journals and workplace reviews remain local. Organization dashboards, HR data, recruitment workflows and AI coaching are planned but **not implemented**. See `docs/ORG_ARCHITECTURE.md` for roles, assessment workflows, and the carefully bounded morality and instruction-adherence metrics.

## Personal Google Drive

As of v0.3, personal cloud saves and restores use the signed-in user's Google Drive hidden `appDataFolder` with a narrowly scoped OAuth grant. Firestore is reserved for the organizational review records. See `docs/GOOGLE_SIGN_IN.md`. These integrations require Firebase/Google Cloud configuration before they will function on the hosted site.

## v0.3 — Independent organization reviews

The organizational review UI includes independent employee/manager drafts, submission locks, comparison after both submissions, attributed reconciliation and HR finalization. The server-enforced access model is in `firestore.rules`. **This is source code for a pilot, not yet an activated organizational service.** Before using any real employee data, follow `docs/ORG_SETUP.md` and validate the Firestore security rules with an emulator. Personal Drive data is not part of organizational review access.
