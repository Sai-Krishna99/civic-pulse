export type NeedForRouting = {
  needCategory: string;
  neighborhood: string;
  urgency: string;
  constraints: string;
};

export type ServiceForRouting = {
  id: string;
  name: string;
  neighborhood: string;
  serviceType: string;
  capacity: number;
  available: number;
  status: string;
  verified: string;
};

export type RoutingCandidate = {
  service: ServiceForRouting;
  score: number;
  reasons: string[];
};

const need_service_terms: Record<string, string[]> = {
  food: ["food", "pantry"],
  cooling: ["cooling", "shelter"],
  clinic: ["clinic", "medical", "health"],
  legal: ["legal", "eviction"],
  transit: ["transit", "voucher", "ride"]
};

export function rankProviders(
  need: NeedForRouting,
  services: ServiceForRouting[]
): RoutingCandidate[] {
  return services
    .map((service) => scoreProvider(need, service))
    .sort((left, right) => right.score - left.score);
}

function scoreProvider(need: NeedForRouting, service: ServiceForRouting) {
  const reasons: string[] = [];
  let score = 0;

  if (matchesNeed(need.needCategory, service.serviceType)) {
    score += 45;
    reasons.push(`matches ${need.needCategory.toLowerCase()} need`);
  }

  if (service.neighborhood === need.neighborhood) {
    score += 22;
    reasons.push(`same neighborhood: ${service.neighborhood}`);
  }

  if (service.available > 0) {
    score += Math.min(24, service.available);
    reasons.push(`${service.available} available`);
  } else {
    score -= 80;
    reasons.push("no current capacity");
  }

  if (service.status === "open") {
    score += 12;
    reasons.push("open now");
  }

  if (service.status === "filling") {
    score += 4;
    reasons.push("filling but still usable");
  }

  if (service.status === "stale") {
    score -= 16;
    reasons.push("needs freshness check");
  }

  if (service.status === "full") {
    score -= 50;
    reasons.push("currently full");
  }

  if (need.urgency === "critical" && service.status === "open") {
    score += 8;
    reasons.push("fits critical handoff");
  }

  if (need.constraints.toLowerCase().includes("no vehicle")) {
    if (service.neighborhood === need.neighborhood || matchesNeed("transit", service.serviceType)) {
      score += 8;
      reasons.push("works with no-vehicle constraint");
    }
  }

  return { service, score, reasons };
}

function matchesNeed(needCategory: string, serviceType: string) {
  const terms = need_service_terms[needCategory.toLowerCase()] ?? [
    needCategory.toLowerCase()
  ];
  const normalizedService = serviceType.toLowerCase();

  return terms.some((term) => normalizedService.includes(term));
}
