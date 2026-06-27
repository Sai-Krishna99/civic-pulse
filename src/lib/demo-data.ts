export type ServiceStatus = "open" | "filling" | "full" | "stale";

export const services: Array<{
  name: string;
  neighborhood: string;
  capacity: number;
  available: number;
  status: ServiceStatus;
  verified: string;
}> = [
  {
    name: "Eastside Cooling Hall",
    neighborhood: "Govalle",
    capacity: 80,
    available: 18,
    status: "filling",
    verified: "6 min ago"
  },
  {
    name: "Hope Food Pantry",
    neighborhood: "Chestnut",
    capacity: 120,
    available: 9,
    status: "filling",
    verified: "11 min ago"
  },
  {
    name: "Riverside Family Clinic",
    neighborhood: "Riverside",
    capacity: 36,
    available: 14,
    status: "open",
    verified: "18 min ago"
  },
  {
    name: "North Loop Legal Aid",
    neighborhood: "North Loop",
    capacity: 20,
    available: 0,
    status: "full",
    verified: "28 min ago"
  },
  {
    name: "St. Mark Transit Vouchers",
    neighborhood: "Mueller",
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

export const providerUpdates = [
  {
    time: "4m",
    provider: "Hope Food Pantry",
    message: "Dropped from 22 to 9 food boxes after school pickup surge."
  },
  {
    time: "7m",
    provider: "Eastside Cooling Hall",
    message: "Added 12 seats after volunteer shift extension."
  },
  {
    time: "14m",
    provider: "North Loop Legal Aid",
    message: "Marked full; referrals are now routed to remote intake."
  },
  {
    time: "21m",
    provider: "Riverside Family Clinic",
    message: "Confirmed walk-in capacity for children and seniors."
  }
];
