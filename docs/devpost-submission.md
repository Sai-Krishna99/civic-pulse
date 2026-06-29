# Civic Pulse — Devpost submission copy

## Quick-reference fields
- **AWS Database used:** Amazon Aurora DSQL
- **Vercel project link:** https://h01-hackathon.vercel.app/
- **Vercel Team ID:** team_7mXZryULQMxLdYKpUhqqglWz
- **Repo:** https://github.com/Sai-Krishna99/civic-pulse
- **Track:** Open Innovation (confirm before submitting)

---

## Project details (paste into Devpost)

### Inspiration
During heat waves, floods, and other local emergencies, the help people need usually *exists* — a cooling center with open seats, a pantry with boxes, a clinic with a walk-in slot. What's missing is a way to match a specific person to the right **open** resource **right now**. Mutual-aid coordinators and nonprofit caseworkers do this from spreadsheets, printouts, and group chats — so people get sent to a site that filled up an hour ago, or one across town they can't reach without a car. We wanted to give those coordinators a routing desk that's live, explainable, and auditable — without the cost or complexity of an always-on AI stack.

### What it does
Civic Pulse is an emergency routing desk for mutual-aid teams, nonprofits, and city partners. During an active incident it turns a stream of incoming community needs and **live provider capacity** into ranked, explainable referrals:

- For each incoming need, a **deterministic engine scores every provider** on six signals — service-type match, neighborhood, available capacity, freshness, urgency fit, and hard constraints like "no vehicle."
- It surfaces the **recommended provider and backup routes, each with the plain-language reasons** behind the score, so a coordinator can audit the decision before routing a person.
- **Routing a referral writes the handoff to the database**, decrements the provider's capacity, and records an audit event — so the next decision sees the updated reality, and a full site stops being recommended the moment it fills.
- A **"Simulate request"** button injects realistic new needs through the same database-backed workflow.

The data in the demo is synthetic, but the workflow runs on ordinary database records — real intake (211 exports, shelter check-ins, SMS, forms, provider portals) feeds the same `incoming_needs` table.

### Which AWS Database we used — Amazon Aurora DSQL
Civic Pulse uses **Amazon Aurora DSQL** as its single system of record. Every provider, capacity level, incoming need, referral, routing decision, and audit event is a row in DSQL — the live operational state and the audit trail are the *same data*. We chose DSQL because:

- **Serverless + active-active** matches the operating profile of disaster response — it scales to zero between incidents and scales out under a surge, with no servers to manage.
- **Postgres compatibility** let us use Drizzle ORM + postgres.js and standard SQL, with no proprietary client and no lock-in.
- **IAM authentication** means no static database password anywhere: the app mints short-lived IAM auth tokens through the AWS DSQL Signer on each connection (cached ~50 minutes). Locally it uses an AWS SSO profile; on Vercel it uses a least-privilege IAM identity scoped to `dsql:DbConnectAdmin` on the single cluster.

Seven tables back the workflow: `providers`, `service_capacities`, `incoming_needs`, `referrals`, `routing_decisions`, `provider_updates`, `neighborhood_signals`.

### How we built it
- **Frontend + API:** Next.js 15 (App Router, server actions) and React 19, deployed on **Vercel** — the routing desk UI and all mutations live in one framework, fully serverless.
- **Database:** Amazon Aurora DSQL, accessed through Drizzle ORM and postgres.js, with IAM-token auth via `@aws-sdk/dsql-signer`.
- **Routing engine:** a dependency-light, deterministic TypeScript scorer — **no LLM in the decision path**, so every recommendation is reproducible and explainable.
- **Server actions** (`routeIncomingNeed`, `createDemoNeed`, `updateProviderCapacity`) apply state changes against DSQL and revalidate the page.
- A built-in **demo mode** (`CIVIC_PULSE_FORCE_DEMO=1`) serves seed-file data so the UI is reviewable offline; pointing it at DSQL makes the exact same screens read live rows.

### Challenges we ran into
- **Serverless ↔ DSQL auth.** DSQL uses IAM auth tokens rather than static passwords, and a serverless deployment can't use a developer's SSO session. We wired the app to mint tokens via the DSQL Signer using the default AWS credential chain — an SSO profile locally and a scoped IAM identity on Vercel — so the *same code path* works in both environments.
- **Token-based tooling.** drizzle-kit and our seed script expected a connection string; we made them mint a DSQL token so schema push and seeding work against DSQL with no static credential.
- **Explainability over cleverness.** We deliberately kept routing deterministic so coordinators can trust and audit it, rather than reaching for a model.

### Accomplishments that we're proud of
- A real, **database-backed workflow** — not a mockup. Routing, capacity, and the audit trail are all live DSQL rows.
- **Passwordless, least-privilege** database access end to end.
- Decisions a human can **audit in plain language** before anyone is routed.

### What we learned
- Aurora DSQL's IAM auth + Postgres compatibility made a genuinely serverless, credential-free data layer straightforward.
- "Nearest" is the wrong default; **"reachable and open"** is what matters, and a small deterministic model captures it well.

### What's next for Civic Pulse
- Real intake adapters (211 / SMS / forms) writing into `incoming_needs`.
- Optional geocoding and multilingual intake.
- Provider-facing capacity updates and SMS notifications to the people being routed.
