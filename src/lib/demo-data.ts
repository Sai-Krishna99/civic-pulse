export type ServiceStatus = "open" | "filling" | "full" | "stale";

export const services: Array<{
  id: string;
  name: string;
  neighborhood: string;
  serviceType: string;
  capacity: number;
  available: number;
  status: ServiceStatus;
  verified: string;
}> = [
  {
    id: "eastside-cooling-hall",
    name: "Eastside Cooling Hall",
    neighborhood: "Govalle",
    serviceType: "Cooling center",
    capacity: 80,
    available: 18,
    status: "filling",
    verified: "6 min ago"
  },
  {
    id: "hope-food-pantry",
    name: "Hope Food Pantry",
    neighborhood: "Chestnut",
    serviceType: "Food pantry",
    capacity: 120,
    available: 9,
    status: "filling",
    verified: "11 min ago"
  },
  {
    id: "riverside-family-clinic",
    name: "Riverside Family Clinic",
    neighborhood: "Riverside",
    serviceType: "Walk-in clinic",
    capacity: 36,
    available: 14,
    status: "open",
    verified: "18 min ago"
  },
  {
    id: "north-loop-legal-aid",
    name: "North Loop Legal Aid",
    neighborhood: "North Loop",
    serviceType: "Legal aid",
    capacity: 20,
    available: 0,
    status: "full",
    verified: "28 min ago"
  },
  {
    id: "st-mark-transit-vouchers",
    name: "St. Mark Transit Vouchers",
    neighborhood: "Mueller",
    serviceType: "Transit vouchers",
    capacity: 60,
    available: 42,
    status: "open",
    verified: "35 min ago"
  }
];

export const neighborhoods = [
  { name: "Govalle", gap: "-42 cooling", risk: "high", x: "58%", y: "34%", size: "132px" },
  { name: "Chestnut", gap: "-31 food", risk: "high", x: "44%", y: "46%", size: "118px" },
  { name: "Riverside", gap: "-12 clinic", risk: "medium", x: "63%", y: "64%", size: "104px" },
  { name: "Mueller", gap: "+29 transit", risk: "low", x: "31%", y: "24%", size: "94px" },
  { name: "North Loop", gap: "stale legal", risk: "stale_zone", x: "28%", y: "55%", size: "102px" }
] as const;

export const referrals = [
  {
    person: "M. Alvarez",
    need: "Food box and cooling center within walking distance",
    status: "Offered",
    owner: "Hope Food Pantry"
  },
  {
    person: "D. Nguyen",
    need: "AC relief and transit voucher for clinic visit",
    status: "Accepted",
    owner: "Eastside Cooling Hall"
  },
  {
    person: "J. Carter",
    need: "Legal aid intake for eviction notice",
    status: "Rerouting",
    owner: "North Loop Legal Aid"
  },
  {
    person: "R. Thomas",
    need: "Walk-in clinic availability after 5 PM",
    status: "Completed",
    owner: "Riverside Family Clinic"
  }
];

export const incomingNeeds = [
  {
    id: "need-maria-santos",
    person: "Maria Santos",
    needCategory: "Cooling",
    neighborhood: "Govalle",
    urgency: "critical",
    summary: "Grandmother reports no AC and dizziness during heat advisory.",
    constraints: "No vehicle; can walk short distance; Spanish preferred",
    status: "open",
    time: "2m"
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
    time: "6m"
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
    time: "11m"
  }
];

export const routingDecisions = [
  {
    id: "route-seed-kim-family",
    incomingNeedId: "need-kim-family",
    provider: "Hope Food Pantry",
    score: 82,
    reasons: "matches food need; same neighborhood: Chestnut; 9 available"
  }
];

export const providerUpdates = [
  {
    id: "upd-hope-food-pantry",
    time: "4m",
    provider: "Hope Food Pantry",
    message: "Dropped from 22 to 9 food boxes after school pickup surge."
  },
  {
    id: "upd-eastside-cooling-hall",
    time: "7m",
    provider: "Eastside Cooling Hall",
    message: "Added 12 seats after volunteer shift extension."
  },
  {
    id: "upd-north-loop-legal-aid",
    time: "14m",
    provider: "North Loop Legal Aid",
    message: "Marked full; referrals are now routed to remote intake."
  },
  {
    id: "upd-riverside-family-clinic",
    time: "21m",
    provider: "Riverside Family Clinic",
    message: "Confirmed walk-in capacity for children and seniors."
  }
];
