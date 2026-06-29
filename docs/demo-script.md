# Civic Pulse — demo video script (target 2:45, hard limit 3:00)

**Record against a DSQL-connected instance.** Local `npm run dev` with your SSO profile is already DSQL-backed and works today — you don't need to wait for the production env vars to record. For the "proof of DSQL" shot, have the AWS DSQL console and `npm run db:check` ready.

Tip: ~380 words of narration. Speak at a steady pace; let the screen actions breathe.

---

### [0:00–0:18] Hook + problem
**Screen:** Title card "Civic Pulse", then the routing desk dashboard.
**Narration:** "During a heat wave or a flood, the help people need usually exists — a cooling center with open seats, a pantry with boxes. The hard part is matching the person in front of you to the right *open* resource, right now. Today coordinators do that from spreadsheets and group chats — so people get sent to a site that filled up an hour ago, or one they can't reach without a car."

### [0:18–0:35] What it is
**Screen:** Full routing desk — incoming-needs queue, provider capacity, map.
**Narration:** "Civic Pulse is an explainable emergency routing desk for mutual-aid teams and nonprofits. It turns incoming needs and live provider capacity into ranked, auditable referrals — built entirely on Vercel and Amazon Aurora DSQL."

### [0:35–1:05] Pick a need → see the recommendation
**Screen:** Click an incoming need — Maria Santos, Cooling, Govalle, critical, no vehicle. Recommendation panel appears.
**Narration:** "Here's a real need: an older adult in Govalle, no AC, critical, and no vehicle. Civic Pulse scores every provider — service match, neighborhood, live capacity, freshness, urgency, and constraints — and recommends Eastside Cooling Hall. And it shows its work: matches the cooling need, same neighborhood, eighteen seats open, works with the no-vehicle constraint. Every recommendation is explained, so a coordinator can trust it before routing."

### [1:05–1:35] Route it → watch DSQL update
**Screen:** Click **Route**. Show the need leave the queue, capacity drop 18 → 17, audit trail gain a row.
**Narration:** "When I route the referral, three things happen in Aurora DSQL at once: a referral and a routing decision are written, the provider's capacity drops, and an audit event is recorded. The need moves out of the queue, capacity updates, and the audit trail grows — so the next decision sees the new reality. A full site stops being recommended the moment it fills."

### [1:35–1:55] Simulate
**Screen:** Click **Simulate request** — a new need appears in the queue.
**Narration:** "Simulate request injects a new incoming need through the exact same database-backed workflow. The demo data is synthetic, but the pipeline is real — and real intake like 211 or SMS feeds the same table."

### [1:55–2:30] Aurora DSQL — the backend (PROOF SHOT)
**Screen:** Architecture diagram (from the README) → AWS console showing the DSQL cluster → terminal running `npm run db:check`.
**Narration:** "Everything runs on Amazon Aurora DSQL — serverless, active-active Postgres. We picked it because it scales to zero between incidents and out under a surge, and because IAM authentication means no database passwords anywhere: the app mints short-lived tokens through the DSQL Signer, using a least-privilege role on Vercel. Here's the live cluster — and here are the seven tables with real rows."

### [2:30–2:45] Close
**Screen:** Back to the routing desk / the live URL.
**Narration:** "Civic Pulse: explainable, auditable routing that sends people to help that can actually take them. Front end on Vercel, data on Aurora DSQL — ready to ship."

---

**Checklist before you record**
- [ ] App running in DSQL mode (data source shows "database", not the demo seed-file)
- [ ] AWS DSQL console tab open (proves the cluster) + `npm run db:check` output ready
- [ ] Under 3:00, 16:9, captions optional but nice
- [ ] Upload to YouTube (public, not unlisted if you want the bonus content rules to apply)
