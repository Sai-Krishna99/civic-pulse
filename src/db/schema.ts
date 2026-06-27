import {
  integer,
  pgTable,
  text,
  timestamp,
  varchar
} from "drizzle-orm/pg-core";

export const providers = pgTable("providers", {
  id: varchar("id", { length: 80 }).primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  neighborhood: varchar("neighborhood", { length: 80 }).notNull(),
  serviceType: varchar("service_type", { length: 80 }).notNull(),
  address: text("address").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const serviceCapacities = pgTable("service_capacities", {
  id: varchar("id", { length: 80 }).primaryKey(),
  providerId: varchar("provider_id", { length: 80 }).notNull(),
  capacity: integer("capacity").notNull(),
  available: integer("available").notNull(),
  status: varchar("status", { length: 24 }).notNull(),
  verifiedAt: timestamp("verified_at", { withTimezone: true }).notNull()
});

export const neighborhoodSignals = pgTable("neighborhood_signals", {
  id: varchar("id", { length: 80 }).primaryKey(),
  name: varchar("name", { length: 80 }).notNull(),
  gap: varchar("gap", { length: 80 }).notNull(),
  risk: varchar("risk", { length: 24 }).notNull(),
  x: varchar("x", { length: 12 }).notNull(),
  y: varchar("y", { length: 12 }).notNull(),
  size: varchar("size", { length: 12 }).notNull()
});

export const referrals = pgTable("referrals", {
  id: varchar("id", { length: 80 }).primaryKey(),
  person: varchar("person", { length: 120 }).notNull(),
  need: text("need").notNull(),
  status: varchar("status", { length: 24 }).notNull(),
  ownerProviderId: varchar("owner_provider_id", { length: 80 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const incomingNeeds = pgTable("incoming_needs", {
  id: varchar("id", { length: 80 }).primaryKey(),
  person: varchar("person", { length: 120 }).notNull(),
  needCategory: varchar("need_category", { length: 40 }).notNull(),
  neighborhood: varchar("neighborhood", { length: 80 }).notNull(),
  urgency: varchar("urgency", { length: 24 }).notNull(),
  summary: text("summary").notNull(),
  constraints: text("constraints").notNull(),
  status: varchar("status", { length: 24 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const routingDecisions = pgTable("routing_decisions", {
  id: varchar("id", { length: 80 }).primaryKey(),
  incomingNeedId: varchar("incoming_need_id", { length: 80 }).notNull(),
  providerId: varchar("provider_id", { length: 80 }).notNull(),
  score: integer("score").notNull(),
  reasons: text("reasons").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const providerUpdates = pgTable("provider_updates", {
  id: varchar("id", { length: 80 }).primaryKey(),
  providerId: varchar("provider_id", { length: 80 }).notNull(),
  message: text("message").notNull(),
  happenedAt: timestamp("happened_at", { withTimezone: true }).notNull()
});
