"use server";

import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { providerUpdates, providers, serviceCapacities } from "@/db/schema";

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

function getStatus(available: number, capacity: number) {
  if (available <= 0) {
    return "full";
  }

  if (available / capacity <= 0.25) {
    return "filling";
  }

  return "open";
}
