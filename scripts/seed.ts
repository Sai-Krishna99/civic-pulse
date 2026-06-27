import { loadEnvConfig } from "@next/env";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import {
  incomingNeeds,
  neighborhoodSignals,
  providerUpdates,
  providers,
  referrals,
  routingDecisions,
  serviceCapacities
} from "../src/db/schema";

loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const client = postgres(databaseUrl, { max: 1, prepare: false });
const db = drizzle(client);

const now = new Date();
const minutesAgo = (minutes: number) => new Date(now.getTime() - minutes * 60000);

async function main() {
  await db.delete(routingDecisions);
  await db.delete(providerUpdates);
  await db.delete(referrals);
  await db.delete(incomingNeeds);
  await db.delete(serviceCapacities);
  await db.delete(neighborhoodSignals);
  await db.delete(providers);

  const insertedProviders = await db
    .insert(providers)
    .values([
      {
        id: "eastside-cooling-hall",
        name: "Eastside Cooling Hall",
        neighborhood: "Govalle",
        serviceType: "Cooling center",
        address: "Simulated site near Govalle"
      },
      {
        id: "hope-food-pantry",
        name: "Hope Food Pantry",
        neighborhood: "Chestnut",
        serviceType: "Food pantry",
        address: "Simulated site near Chestnut"
      },
      {
        id: "riverside-family-clinic",
        name: "Riverside Family Clinic",
        neighborhood: "Riverside",
        serviceType: "Walk-in clinic",
        address: "Simulated site near Riverside"
      },
      {
        id: "north-loop-legal-aid",
        name: "North Loop Legal Aid",
        neighborhood: "North Loop",
        serviceType: "Legal aid",
        address: "Simulated site near North Loop"
      },
      {
        id: "st-mark-transit-vouchers",
        name: "St. Mark Transit Vouchers",
        neighborhood: "Mueller",
        serviceType: "Transit vouchers",
        address: "Simulated site near Mueller"
      }
    ])
    .returning();

  const providerByName = new Map(insertedProviders.map((provider) => [provider.name, provider.id]));

  await db.insert(serviceCapacities).values([
    {
      id: "cap-eastside-cooling-hall",
      providerId: getProviderId(providerByName, "Eastside Cooling Hall"),
      capacity: 80,
      available: 18,
      status: "filling",
      verifiedAt: minutesAgo(6)
    },
    {
      id: "cap-hope-food-pantry",
      providerId: getProviderId(providerByName, "Hope Food Pantry"),
      capacity: 120,
      available: 9,
      status: "filling",
      verifiedAt: minutesAgo(11)
    },
    {
      id: "cap-riverside-family-clinic",
      providerId: getProviderId(providerByName, "Riverside Family Clinic"),
      capacity: 36,
      available: 14,
      status: "open",
      verifiedAt: minutesAgo(18)
    },
    {
      id: "cap-north-loop-legal-aid",
      providerId: getProviderId(providerByName, "North Loop Legal Aid"),
      capacity: 20,
      available: 0,
      status: "full",
      verifiedAt: minutesAgo(28)
    },
    {
      id: "cap-st-mark-transit-vouchers",
      providerId: getProviderId(providerByName, "St. Mark Transit Vouchers"),
      capacity: 60,
      available: 42,
      status: "open",
      verifiedAt: minutesAgo(35)
    }
  ]);

  await db.insert(neighborhoodSignals).values([
    { id: "sig-govalle", name: "Govalle", gap: "-42 cooling", risk: "high", x: "58%", y: "34%", size: "132px" },
    { id: "sig-chestnut", name: "Chestnut", gap: "-31 food", risk: "high", x: "44%", y: "46%", size: "118px" },
    { id: "sig-riverside", name: "Riverside", gap: "-12 clinic", risk: "medium", x: "63%", y: "64%", size: "104px" },
    { id: "sig-mueller", name: "Mueller", gap: "+29 transit", risk: "low", x: "31%", y: "24%", size: "94px" },
    {
      id: "sig-north-loop",
      name: "North Loop",
      gap: "stale legal",
      risk: "stale_zone",
      x: "28%",
      y: "55%",
      size: "102px"
    }
  ]);

  await db.insert(referrals).values([
    {
      id: "ref-m-alvarez",
      person: "M. Alvarez",
      need: "Food box and cooling center within walking distance",
      status: "Offered",
      ownerProviderId: getProviderId(providerByName, "Hope Food Pantry")
    },
    {
      id: "ref-d-nguyen",
      person: "D. Nguyen",
      need: "AC relief and transit voucher for clinic visit",
      status: "Accepted",
      ownerProviderId: getProviderId(providerByName, "Eastside Cooling Hall")
    },
    {
      id: "ref-j-carter",
      person: "J. Carter",
      need: "Legal aid intake for eviction notice",
      status: "Rerouting",
      ownerProviderId: getProviderId(providerByName, "North Loop Legal Aid")
    },
    {
      id: "ref-r-thomas",
      person: "R. Thomas",
      need: "Walk-in clinic availability after 5 PM",
      status: "Completed",
      ownerProviderId: getProviderId(providerByName, "Riverside Family Clinic")
    }
  ]);

  await db.insert(incomingNeeds).values([
    {
      id: "need-maria-santos",
      person: "Maria Santos",
      needCategory: "Cooling",
      neighborhood: "Govalle",
      urgency: "critical",
      summary: "Grandmother reports no AC and dizziness during heat advisory.",
      constraints: "No vehicle; can walk short distance; Spanish preferred",
      status: "open",
      createdAt: minutesAgo(2)
    },
    {
      id: "need-kim-family",
      person: "Kim family",
      needCategory: "Food",
      neighborhood: "Chestnut",
      urgency: "high",
      summary: "Parent with two children needs food pickup before evening shift.",
      constraints: "No vehicle; needs child-friendly pickup window",
      status: "open",
      createdAt: minutesAgo(6)
    },
    {
      id: "need-jordan-lee",
      person: "Jordan Lee",
      needCategory: "Legal",
      neighborhood: "North Loop",
      urgency: "high",
      summary: "Tenant received eviction notice and needs same-day intake.",
      constraints: "Phone only; cannot travel before 5 PM",
      status: "open",
      createdAt: minutesAgo(11)
    }
  ]);

  await db.insert(routingDecisions).values([
    {
      id: "route-seed-kim-family",
      incomingNeedId: "need-kim-family",
      providerId: getProviderId(providerByName, "Hope Food Pantry"),
      score: 82,
      reasons: "matches food need; same neighborhood: Chestnut; 9 available",
      createdAt: minutesAgo(5)
    }
  ]);

  await db.insert(providerUpdates).values([
    {
      id: "upd-hope-food-pantry",
      providerId: getProviderId(providerByName, "Hope Food Pantry"),
      message: "Dropped from 22 to 9 food boxes after school pickup surge.",
      happenedAt: minutesAgo(4)
    },
    {
      id: "upd-eastside-cooling-hall",
      providerId: getProviderId(providerByName, "Eastside Cooling Hall"),
      message: "Added 12 seats after volunteer shift extension.",
      happenedAt: minutesAgo(7)
    },
    {
      id: "upd-north-loop-legal-aid",
      providerId: getProviderId(providerByName, "North Loop Legal Aid"),
      message: "Marked full; referrals are now routed to remote intake.",
      happenedAt: minutesAgo(14)
    },
    {
      id: "upd-riverside-family-clinic",
      providerId: getProviderId(providerByName, "Riverside Family Clinic"),
      message: "Confirmed walk-in capacity for children and seniors.",
      happenedAt: minutesAgo(21)
    }
  ]);
}

function getProviderId(providersByName: Map<string, string>, name: string) {
  const providerId = providersByName.get(name);

  if (!providerId) {
    throw new Error(`Missing seeded provider: ${name}`);
  }

  return providerId;
}

main()
  .then(async () => {
    await client.end();
    console.log("Seeded Civic Pulse demo data.");
  })
  .catch(async (error: unknown) => {
    await client.end();
    console.error(error);
    process.exit(1);
  });
