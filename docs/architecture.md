# Architecture

Civic Pulse is a serverless incident-routing workspace backed by Aurora DSQL. The app keeps the operational core simple: coordinators work in a Next.js UI, server actions apply deterministic routing and state changes, and DSQL stores every handoff.

## System diagram

```mermaid
flowchart TB
  user["Coordinator"] --> ui["Next.js UI\nVercel"]
  ui --> actions["Server actions\ncreateDemoNeed, routeIncomingNeed, updateProviderCapacity"]
  actions --> engine["Routing engine\nTypeScript deterministic scoring"]
  actions --> db["Aurora DSQL"]
  db --> loader["Dashboard data loader"]
  loader --> ui

  db --> providers["providers"]
  db --> capacity["service_capacities"]
  db --> needs["incoming_needs"]
  db --> referrals["referrals"]
  db --> decisions["routing_decisions"]
  db --> audit["provider_updates"]
  db --> signals["neighborhood_signals"]

  engine --> score["Rank providers by need match,\ncapacity, status, neighborhood,\nurgency, and constraints"]
  score --> actions
```

## Request flow

1. A coordinator selects an `incoming_needs` record.
2. The app ranks providers using the deterministic routing engine.
3. The coordinator chooses a recommended provider or backup route.
4. `routeIncomingNeed` writes:
   - a `referrals` row
   - a `routing_decisions` row
   - a `provider_updates` audit row
   - an updated `incoming_needs.status`
   - an updated `service_capacities.available`
5. The page revalidates and reloads the latest DSQL-backed state.

## Why deterministic routing

The recommendation logic is intentionally explainable and low-cost. It does not require an always-on model, vector database, queue, or paid external API. This keeps the system appropriate for nonprofit and civic teams that need transparent decisions and predictable operating cost.

The routing engine can be extended later with optional intake parsing or geocoding, but the core handoff logic remains auditable.

## Deployment

- Frontend and server actions: Vercel
- Database: Aurora DSQL
- ORM: Drizzle
- Local fallback: built-in demo data via `CIVIC_PULSE_FORCE_DEMO=1`

## Data model

```mermaid
erDiagram
  providers ||--o{ service_capacities : has
  providers ||--o{ referrals : owns
  providers ||--o{ routing_decisions : receives
  providers ||--o{ provider_updates : emits
  incoming_needs ||--o{ routing_decisions : produces

  providers {
    varchar id
    varchar name
    varchar neighborhood
    varchar service_type
    text address
  }

  service_capacities {
    varchar id
    varchar provider_id
    int capacity
    int available
    varchar status
    timestamp verified_at
  }

  incoming_needs {
    varchar id
    varchar person
    varchar need_category
    varchar neighborhood
    varchar urgency
    text summary
    text constraints
    varchar status
  }

  referrals {
    varchar id
    varchar person
    text need
    varchar status
    varchar owner_provider_id
  }

  routing_decisions {
    varchar id
    varchar incoming_need_id
    varchar provider_id
    int score
    text reasons
  }

  provider_updates {
    varchar id
    varchar provider_id
    text message
    timestamp happened_at
  }
```
