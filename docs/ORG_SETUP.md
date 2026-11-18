# Sovereign Lab organization review pilot

## Current scope

The website supports a review cycle with independent employee and manager drafts,
locking each submission, releasing comparison **only after both submit**, recording
reconciliation notes and HR finalization. These records use Cloud Firestore and
are **completely separate** from personal Google Drive and private reflections.

**The organizational backend has not been activated on a Firebase project yet.**
Do not use real personnel data before completing the access-control tests below.

## Setup

1. Follow docs/GOOGLE_SIGN_IN.md to configure the Firebase Google provider and
   the public web config in `firebase-config.js`.
2. In the Firebase console, create Cloud Firestore in **production / locked** mode.
3. Paste the exact repository `firestore.rules` into Firestore > Rules and
   publish. Do not use permissive test-mode rules.
4. Confirm the app's Google OAuth consent screen and authorized domain.
5. Sign in with an appropriate company Google account at `#organization`;
   it cannot be a Gmail address. Company email domain **alone is insufficient**.
6. As the system administrator, provision explicit member records with the
   Firebase Admin SDK script at `scripts/provision-member.mjs`.
7. Create at least three members: an HR administrator, a manager, and an employee.
   Members must be confirmed as belonging to the intended organization.
8. HR enters the organization ID, chooses the employee, manager and cycle, then
   assigns a review. Each participant sees only their assigned reviews.
9. Employee and manager save independent drafts and submit. The first submission
   remains inaccessible to the other party until the second submission is locked.
10. Both can then review differences and record attributed notes. HR can finalize.

## Workflow

Draft / editable privately -> Submitted / immutable -> Paired / simultaneously
visible -> Discussion -> Finalized by HR.

The assessment takes each participant through the competencies in order before
they can review and lock their submission. Each competency has its own level
descriptions and evidence guidance. At least three competencies must be rated
and each rating needs evidence of at least 12 characters. The interface displays
levels 1–5. Firestore continues to store equivalent scores 0–4 and validates the
ratings and evidence independently of the interface.

## Safeguards and remaining work

- Role assignments are created by trusted Firebase Admin SDK, not user requests.
- Firestore enforces org membership and review participant scope.
- Direct Firestore reads of a counterpart's unfinished assessment are denied.
- Salary, recruitment and private spiritual/fulfilment data are not in the HR UI.
- The organization email restriction currently blocks Gmail plus requires
  explicitly provisioned membership. It does not independently prove Google
  Workspace tenancy; use administrator verification until that server check exists.
- Firestore rules should be tested with the Firebase Emulator Suite for:
  unauthorized users; other organizations; premature reads; post-submit edits;
  HR-only assignment; finalization before both submissions; malformed evidence.
- For production HR use, add immutable server audit trails, appeal workflow,
  data correction/retention/deletion, organizational onboarding, accessibility,
  privacy notices and legal review. These are NOT complete in the pilot.
- Do not use morality/obedience ratings as inherent character measures.
  Restrict judgments to documented, lawful, job-relevant conduct with context.
