"use server";

import { randomUUID } from "crypto";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import {
  incomingNeeds,
  providerUpdates,
  providers,
  referrals,
  routingDecisions,
  serviceCapacities
} from "@/db/schema";
import { rankProviders, type NeedForRouting, type ServiceForRouting } from "@/lib/routing";

export async function updateProviderCapacity(formData: FormData) {
  const db = await getDb();

  if (!db) {
    return;
  }

  const providerName = String(formData.get("providerName") ?? "");
  const capacity = Number(formData.get("capacity") ?? 0);
  const currentAvailable = Number(formData.get("available") ?? 0);
  const change = Number(formData.get("change") ?? 0);
  const nextAvailable = Math.max(0, Math.min(capacity, currentAvailable + change));
  const status = getStatus(nextAvailable, capacity);

  const [provider] = await db
    .select({ id: providers.id })
    .from(providers)
    .where(eq(providers.name, providerName))
    .limit(1);

  if (!provider) {
    return;
  }

  await db
    .update(serviceCapacities)
    .set({
      available: nextAvailable,
      status,
      verifiedAt: new Date()
    })
    .where(eq(serviceCapacities.providerId, provider.id));

  const direction = change > 0 ? "added" : "used";
  await db.insert(providerUpdates).values({
    id: `upd-${randomUUID()}`,
    providerId: provider.id,
    message: `${providerName} ${direction} ${Math.abs(change)} units; ${nextAvailable} remain available.`,
    happenedAt: new Date()
  });

  try {
    revalidatePath("/");
  } catch {
    // Allows the action to be exercised from scripts outside a Next request.
  }
}

export async function createReferral(formData: FormData) {
  const db = await getDb();

  if (!db) {
    return;
  }

  const person = String(formData.get("person") ?? "").trim();
  const needCategory = String(formData.get("needCategory") ?? "").trim();
  const need = String(formData.get("need") ?? "").trim();
  const ownerProviderId = String(formData.get("ownerProviderId") ?? "").trim();

  if (!person || !need || !ownerProviderId) {
    return;
  }

  const [provider] = await db
    .select({ id: providers.id, name: providers.name })
    .from(providers)
    .where(eq(providers.id, ownerProviderId))
    .limit(1);

  if (!provider) {
    return;
  }

  await db.insert(referrals).values({
    id: `ref-${randomUUID()}`,
    person,
    need: `${needCategory}: ${need}`,
    status: "Offered",
    ownerProviderId: provider.id,
    createdAt: new Date()
  });

  await db.insert(providerUpdates).values({
    id: `upd-${randomUUID()}`,
    providerId: provider.id,
    message: `Referral opened for ${person} and routed to ${provider.name}.`,
    happenedAt: new Date()
  });

  try {
    revalidatePath("/");
  } catch {
    // Allows the action to be exercised from scripts outside a Next request.
  }
}

export async function createDemoNeed() {
  const db = await getDb();

  if (!db) {
    return;
  }

  const existingNeeds = await db.select({ id: incomingNeeds.id }).from(incomingNeeds);
  const nextNeed = demo_needs[existingNeeds.length % demo_needs.length];

  await db.insert(incomingNeeds).values({
    ...nextNeed,
    id: `need-${randomUUID()}`,
    status: "open",
    createdAt: new Date()
  });

  revalidateHome();
}

export async function routeIncomingNeed(formData: FormData) {
  const db = await getDb();

  if (!db) {
    return;
  }

  const needId = String(formData.get("needId") ?? "");
  const requestedProviderId = String(formData.get("providerId") ?? "");

  const [need] = await db
    .select()
    .from(incomingNeeds)
    .where(eq(incomingNeeds.id, needId))
    .limit(1);

  if (!need || need.status !== "open") {
    return;
  }

  const services = await getServicesForRouting(db);
  const rankedProviders = rankProviders(need, services);
  const selectedCandidate =
    rankedProviders.find((candidate) => candidate.service.id === requestedProviderId) ??
    rankedProviders[0];

  if (!selectedCandidate || selectedCandidate.service.available <= 0) {
    return;
  }

  const nextAvailable = Math.max(0, selectedCandidate.service.available - 1);
  const status = getStatus(nextAvailable, selectedCandidate.service.capacity);

  await db.insert(referrals).values({
    id: `ref-${randomUUID()}`,
    person: need.person,
    need: `${need.needCategory}: ${need.summary}`,
    status: "Offered",
    ownerProviderId: selectedCandidate.service.id,
    createdAt: new Date()
  });

  await db
    .update(incomingNeeds)
    .set({ status: "routed" })
    .where(eq(incomingNeeds.id, need.id));

  await db
    .update(serviceCapacities)
    .set({
      available: nextAvailable,
      status,
      verifiedAt: new Date()
    })
    .where(eq(serviceCapacities.providerId, selectedCandidate.service.id));

  await db.insert(routingDecisions).values({
    id: `route-${randomUUID()}`,
    incomingNeedId: need.id,
    providerId: selectedCandidate.service.id,
    score: selectedCandidate.score,
    reasons: selectedCandidate.reasons.join("; "),
    createdAt: new Date()
  });

  await db.insert(providerUpdates).values({
    id: `upd-${randomUUID()}`,
    providerId: selectedCandidate.service.id,
    message: `Routed ${need.person} for ${need.needCategory.toLowerCase()}; ${nextAvailable} capacity remains. Reasons: ${selectedCandidate.reasons.slice(0, 2).join(", ")}.`,
    happenedAt: new Date()
  });

  revalidateHome();
}

function getStatus(available: number, capacity: number) {
  if (available <= 0) {
    return "full";
  }

  if (available / capacity <= 0.25) {
    return "filling";
  }

  return "open";
}

async function getServicesForRouting(db: Awaited<ReturnType<typeof getDb>>) {
  if (!db) {
    return [];
  }

  return db
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
    .orderBy(desc(serviceCapacities.available))
    .then((services): ServiceForRouting[] =>
      services.map((service) => ({
        ...service,
        verified: `${Math.max(1, Math.round((Date.now() - service.verifiedAt.getTime()) / 60000))}m`
      }))
    );
}

function revalidateHome() {
  try {
    revalidatePath("/");
  } catch {
    // Allows actions to be exercised from scripts outside a Next request.
  }
}

const demo_needs: Array<Omit<NeedForRouting, "constraints"> & {
  person: string;
  summary: string;
  constraints: string;
}> = [
  {
    person: "Alicia Brown",
    needCategory: "Cooling",
    neighborhood: "Govalle",
    urgency: "critical",
    summary: "Older adult reports dizziness and no working AC.",
    constraints: "No vehicle; prefers walkable site"
  },
  {
    person: "N. Patel",
    needCategory: "Food",
    neighborhood: "Chestnut",
    urgency: "high",
    summary: "Parent needs food box before a night shift starts.",
    constraints: "No vehicle; two children"
  },
  {
    person: "Marcus Reed",
    needCategory: "Transit",
    neighborhood: "Mueller",
    urgency: "medium",
    summary: "Needs bus vouchers to reach clinic appointment.",
    constraints: "Same-day appointment; limited phone access"
  },
  {
    person: "J. Carter",
    needCategory: "Legal",
    neighborhood: "North Loop",
    urgency: "high",
    summary: "Eviction notice requires same-day legal triage.",
    constraints: "Phone-only intake needed"
  }
];
