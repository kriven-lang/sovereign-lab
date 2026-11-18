# Sovereign Lab

**A capability, aspiration and development platform with distinct personal and organizational workspaces.**

Version: **0.3 pilot** · Website hosted through GitHub Pages · Source repository public.
The framework is a developmental aid, **not** a validated psychometric test or an
automated employment, hiring, compensation or separation decision engine.

## Public landing page

Start at `#welcome` to read about the product and select:
- **Personal**: Google sign-in; private capabilities, aspirations, development plan,
  reading suggestions, and optional reflection. Personal progress can be
  manually stored in the person's **own hidden Google Drive app-data area**.
- **Organization**: a verified organizational Google account plus **explicit
  membership provisioning** is required. Separate employee/manager drafts,
  submission lock, simultaneous disclosure, documented discussion and HR
  finalization are implemented as a pilot.

A local-only personal preview remains available before Google setup.

## What works in the source

- Thought, Action and Integrity: 16 individually assessed capabilities.
- Personal goals, target proficiencies, gaps and developmental practices.
- Suggested books keyed to selected goals, not opaque personality inference.
- Private flourishing journal remains on the current browser.
- Google OAuth identity, with separate personal and organization entry paths.
- Personal Google Drive appDataFolder save/restore with scoped user permission.
- Organization-only Firestore review workflow with role-scoped security rules.
- HR review creation, separately held employee/manager drafts, paired comparison,
  immutable submitted records and attributed reconciliation discussion.
- Organization member-provisioning script and Firebase security tests.

### Deployment status

**The code is committed, but the Google/Firebase service is not configured.**
`firebase-config.js` intentionally contains `null`. Real Google sign-in,
Google Drive backup, and multi-user organizational reviews will not work until
the product owner completes the external setup and deployment of security rules.

The review pilot has not been tested against a live Firebase project or
Emulator Suite in this environment. **Do not upload real employee data** before
all access-control tests pass and operational privacy controls are implemented.

## One-time setup

1. [Personal sign-in and Drive setup](docs/GOOGLE_SIGN_IN.md)
2. [Organization review activation](docs/ORG_SETUP.md)
3. [Organizational architecture and metric boundaries](docs/ORG_ARCHITECTURE.md)

Google sign-in alone does not grant organization membership. HR/admin grants are
stored on a trusted backend. An organizational work account must be verified
separately from the personal workspace. The current pilot checks non-Gmail
addresses and provisioned membership; Google Workspace tenancy should be
validated server-side before production deployment.

## Access and privacy

- Personal Drive storage uses only `drive.appdata`, not full Google Drive access.
- No Gmail inbox scopes are requested.
- Self-reflections and the personal journal are not accessible to managers or HR.
- Personal Drive files are never read as organization assessments.
- Firestore has explicit role and membership checks for organizational records.
- Submitted assessments are locked and counterpart access is embargoed until
  both participants submit.
- No salary, recruitment or AI chatbot backend is active yet.
- Morality and obedience should be reported only as carefully defined, contested,
  contextual workplace indicators, never objective personal worth or blind loyalty.

## Local and automated checks

Open `index.html` in a browser for the local-only demo.

To run basic code smoke tests:

```bash
npm install
npm test
```

To run Firestore authorization tests, install Java and Firebase CLI dependencies
and use the Firebase Emulator Suite (see `firebase.json`):

```bash
npm run test:rules
```

For privileged membership provisioning, **never** commit private credentials.
See `scripts/provision-member.mjs` and `docs/ORG_SETUP.md`.

## Source and licensing

The repository is publicly readable so it can be deployed via GitHub Pages.
Only authorized collaborators can push commits. No open-source license is
granted for reuse or redistribution by default; client-side code remains
inspectable by anyone visiting the website.
