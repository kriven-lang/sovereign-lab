# Organizational architecture roadmap (NOT live in v0.2)

The personal free tier and organization-facing product must remain separate.

## Roles
- Individual: own assessments, aspirations and private reflections.
- Employee: own released workplace reviews and professional development.
- Manager: assigned direct reports and jointly released reviews.
- HR: bounded organizational people records; salary via extra permission.
- Recruiter: only assigned job requisitions and candidate applications.
- Org admin: memberships and configuration, not automatic salary or journal access.
- Auditor: logged and time-limited approved access.

Roles must be server-assigned and scoped by organization and assignment.
Signing in with a company email does NOT automatically authorize organization access.

## Workflow
Employee and manager draft independently -> submit separately -> both drafts lock
-> both become visible at once -> documented reconciliation and objections ->
acknowledged final version or appeal. Restarting a review requires cause,
a new version and immutable audit history. Server validators handle actor
authority, required evidence, dates, transitions and conflicts of interest.

## Proposed organizational metrics — explicit boundary conditions

**General morality:** a person's innate moral worth cannot be inferred from a
score. Optional ethical-climate indicators can examine observed workplace
conduct, fairness of policies, safety to raise concerns, honest error disclosure
and consistency of responses to misconduct. Use verifiable incidents or voluntary
surveys, never protected beliefs or religious practices. Show methods, coverage,
confidence, and an appeals route.

**Obedience:** operationalize narrowly as **responsible instruction adherence**.
Only clear, lawful, safe, role-appropriate instructions may be considered.
Document whether requirements were understood, completed, queried or escalated.
Principled dissent, whistleblowing, and refusal of unsafe/unlawful instructions
are NOT insubordination evidence. Account for workload, health accommodations,
authority, quality of instructions and conflicting priorities.

Neither indicator is a validated psychological measurement of moral character.
Provide labels, rubric, evidence and visible limitations at each level; do not
use them for automated employment outcomes.

Event participation should report invite denominator, voluntary RSVP rate,
attendance rate, opt-outs and availability constraints rather than assumed loyalty.
Team or department aggregates must suppress small counts to avoid re-identifying
workers.

## Future data model
- organizations/{orgId}/members/{uid} (verified roles, team, assignments)
- organizations/{orgId}/reviews/{cycleId}/cases/{uid} (versioned workflow)
- organizations/{orgId}/people/{uid} (work profile, join date)
- organizations/{orgId}/compensation/{uid} (separate restrictive grants)
- organizations/{orgId}/events/{eventId} (attendance opt-in)
- organizations/{orgId}/jobs/{jobId} and applications/{id}
- organizations/{orgId}/audit/{eventId} (immutable server events)

All organization paths are blocked by the v0.2 Firestore rules. An AI coach
will require a privileged server; user-authorized context only, no provider
keys in frontend, no private journaling data made available to HR.
