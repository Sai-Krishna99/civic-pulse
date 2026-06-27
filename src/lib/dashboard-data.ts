import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  incomingNeeds,
  neighborhoodSignals,
  providerUpdates as providerUpdatesTable,
  providers,
  referrals as referralsTable,
  routingDecisions,
  serviceCapacities
} from "@/db/schema";
import {
  incomingNeeds as fallbackIncomingNeeds,
  neighborhoods as fallbackNeighborhoods,
  providerUpdates as fallbackProviderUpdates,
  referrals as fallbackReferrals,
  routingDecisions as fallbackRoutingDecisions,
  services as fallbackServices
} from "@/lib/demo-data";

export async function getDashboardData() {
  const db = await getDb();

  if (!db) {
    return {
      services: fallbackServices,
      neighborhoods: fallbackNeighborhoods,
      incomingNeeds: fallbackIncomingNeeds,
      referrals: fallbackReferrals,
      routingDecisions: fallbackRoutingDecisions,
      providerUpdates: fallbackProviderUpdates,
      source: "seed-file" as const
    };
  }

  const serviceRows = await db
    .select({
      id: providers.id,
      name: providers.name,
      neighborhood: providers.neighborhood,
      serviceType: providers.serviceType,
      capacity: serviceCapacities.capacity,
      available: serviceCapacities.available,
      status: serviceCapacities.status,
      verifiedAt: serviceCapacities.verifiedAt
    })
    .from(serviceCapacities)
    .innerJoin(providers, eq(serviceCapacities.providerId, providers.id))
    .orderBy(providers.name);

  const referralRows = await db
    .select({
      person: referralsTable.person,
      need: referralsTable.need,
      status: referralsTable.status,
      owner: providers.name
    })
    .from(referralsTable)
    .innerJoin(providers, eq(referralsTable.ownerProviderId, providers.id))
    .orderBy(referralsTable.id);

  const updateRows = await db
    .select({
      id: providerUpdatesTable.id,
      provider: providers.name,
      message: providerUpdatesTable.message,
      happenedAt: providerUpdatesTable.happenedAt
    })
    .from(providerUpdatesTable)
    .innerJoin(providers, eq(providerUpdatesTable.providerId, providers.id))
    .orderBy(desc(providerUpdatesTable.happenedAt));

  const signalRows = await db.select().from(neighborhoodSignals);

  const needRows = await db
    .select()
    .from(incomingNeeds)
    .orderBy(desc(incomingNeeds.createdAt));

  const decisionRows = await db
    .select({
      id: routingDecisions.id,
      incomingNeedId: routingDecisions.incomingNeedId,
      provider: providers.name,
      score: routingDecisions.score,
      reasons: routingDecisions.reasons,
      createdAt: routingDecisions.createdAt
    })
    .from(routingDecisions)
    .innerJoin(providers, eq(routingDecisions.providerId, providers.id))
    .orderBy(desc(routingDecisions.createdAt));

  return {
    services: serviceRows.map((service) => ({
      ...service,
      verified: formatRelativeMinutes(service.verifiedAt)
    })),
    neighborhoods: signalRows,
    incomingNeeds: needRows.map((need) => ({
      ...need,
      time: formatRelativeMinutes(need.createdAt)
    })),
    referrals: referralRows,
    routingDecisions: decisionRows.map((decision) => ({
      ...decision,
      time: formatRelativeMinutes(decision.createdAt)
    })),
    providerUpdates: updateRows.map((update) => ({
      ...update,
      time: formatRelativeMinutes(update.happenedAt)
    })),
    source: "database" as const
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

function formatRelativeMinutes(date: Date) {
  const minutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
  return `${minutes}m`;
}
