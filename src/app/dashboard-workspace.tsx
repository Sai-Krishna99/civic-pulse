"use client";

import {
  Activity,
  ArrowUpRight,
  Bell,
  Building2,
  CheckCircle2,
  Clock3,
  Filter,
  HeartHandshake,
  MapPin,
  Radio,
  RefreshCcw,
  Search,
  ShieldCheck,
  Siren,
  ThermometerSun,
  UsersRound
} from "lucide-react";
import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { createReferral, updateProviderCapacity } from "@/app/actions";
import type { DashboardData } from "@/lib/dashboard-data";
import styles from "./page.module.css";

const status_labels: Record<string, string> = {
  open: "Open",
  filling: "Filling fast",
  full: "Full",
  stale: "Needs check"
};

const referral_filters = ["All", "Active", "Rerouting", "Completed"] as const;
const provider_filters = ["all", "open", "filling", "full", "stale"] as const;
const need_categories = ["Food", "Cooling", "Clinic", "Legal", "Transit"] as const;

type ProviderFilter = (typeof provider_filters)[number];
type ReferralFilter = (typeof referral_filters)[number];
type NeedCategory = (typeof need_categories)[number];

type DashboardWorkspaceProps = {
  data: DashboardData;
};

export function DashboardWorkspace({ data }: DashboardWorkspaceProps) {
  const { services, neighborhoods, referrals, providerUpdates } = data;
  const [activeSection, setActiveSection] = useState("command");
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>("all");
  const [referralFilter, setReferralFilter] = useState<ReferralFilter>("Active");
  const [riskOnly, setRiskOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [needCategory, setNeedCategory] = useState<NeedCategory>("Food");
  const [selectedProviderId, setSelectedProviderId] = useState("");

  const total_capacity = services.reduce((sum, service) => sum + service.capacity, 0);
  const available_capacity = services.reduce(
    (sum, service) => sum + service.available,
    0
  );
  const active_referrals = referrals.filter(
    (referral) => referral.status !== "Completed"
  ).length;

  const filteredServices = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return services.filter((service) => {
      const matchesStatus = providerFilter === "all" || service.status === providerFilter;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        service.name.toLowerCase().includes(normalizedQuery) ||
        service.neighborhood.toLowerCase().includes(normalizedQuery) ||
        service.serviceType.toLowerCase().includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [providerFilter, query, services]);

  const filteredReferrals = useMemo(() => {
    return referrals.filter((referral) => {
      if (referralFilter === "All") {
        return true;
      }

      if (referralFilter === "Active") {
        return referral.status !== "Completed";
      }

      return referral.status === referralFilter;
    });
  }, [referralFilter, referrals]);

  const visibleNeighborhoods = riskOnly
    ? neighborhoods.filter((neighborhood) => neighborhood.risk === "high")
    : neighborhoods;

  const recommendedService = useMemo(() => {
    const availableServices = services
      .filter((service) => service.available > 0)
      .sort((left, right) => right.available - left.available);

    return (
      availableServices.find((service) => serviceMatchesNeed(service.serviceType, needCategory)) ??
      availableServices[0] ??
      services[0]
    );
  }, [needCategory, services]);

  const selectedProvider = selectedProviderId || recommendedService?.id || services[0]?.id || "";

  function scrollToSection(sectionId: string) {
    setActiveSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  return (
    <main className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Workspace navigation">
        <div className={styles.brand}>
          <span className={styles.logo}>
            <Radio size={20} />
          </span>
          <div>
            <strong>Civic Pulse</strong>
            <span>Live community capacity</span>
          </div>
        </div>

        <nav className={styles.nav}>
          <button
            className={activeSection === "command" ? styles.nav_active : undefined}
            type="button"
            onClick={() => scrollToSection("command")}
          >
            <Activity size={18} /> Overview
          </button>
          <button
            className={activeSection === "finder" ? styles.nav_active : undefined}
            type="button"
            onClick={() => scrollToSection("finder")}
          >
            <Siren size={18} /> Intake
          </button>
          <button
            className={activeSection === "providers" ? styles.nav_active : undefined}
            type="button"
            onClick={() => scrollToSection("providers")}
          >
            <Building2 size={18} /> Provider board
          </button>
          <button
            className={activeSection === "referrals" ? styles.nav_active : undefined}
            type="button"
            onClick={() => scrollToSection("referrals")}
          >
            <HeartHandshake size={18} /> Referral queue
          </button>
        </nav>

        <section className={styles.incident}>
          <div className={styles.incident_icon}>
            <ThermometerSun size={22} />
          </div>
          <p>Heat advisory active</p>
          <strong>Cooling and food demand is rising across east Austin.</strong>
          <span>Updated 4 minutes ago</span>
        </section>
      </aside>

      <section className={styles.content}>
        <header className={styles.topbar}>
          <div>
            <p className={styles.eyebrow}>Austin mutual aid network</p>
            <h1>Route people to help that is actually available.</h1>
          </div>
          <div className={styles.actions}>
            <button type="button" aria-label="Refresh live capacity" onClick={() => window.location.reload()}>
              <RefreshCcw size={18} />
            </button>
            <button
              type="button"
              aria-label="Show strained providers"
              onClick={() => {
                setProviderFilter("filling");
                scrollToSection("providers");
              }}
            >
              <Bell size={18} />
            </button>
            <button className={styles.primary_button} type="button" onClick={() => scrollToSection("finder")}>
              <Siren size={18} /> Open intake
            </button>
          </div>
        </header>

        <section className={styles.metrics} aria-label="Network summary">
          <Metric label="Available seats and kits" value={available_capacity.toString()} trend={`${total_capacity} total capacity`} />
          <Metric label="Active referrals" value={active_referrals.toString()} trend={`${referrals.length} tracked cases`} />
          <Metric label="Verified today" value="84%" trend="18 providers checked in" />
          <Metric label="At-risk neighborhoods" value="3" trend="capacity below demand" />
        </section>

        <section className={styles.command_grid} id="command">
          <div className={styles.map_panel}>
            <div className={styles.panel_header}>
              <div>
                <p className={styles.eyebrow}>Live capacity map</p>
                <h2>Demand is moving faster than provider updates.</h2>
              </div>
              <button
                className={riskOnly ? styles.filter_active : undefined}
                type="button"
                onClick={() => setRiskOnly((current) => !current)}
              >
                <Filter size={16} /> {riskOnly ? "Show all" : "High risk"}
              </button>
            </div>

            <div className={styles.map}>
              {visibleNeighborhoods.map((neighborhood) => (
                <div
                  className={`${styles.zone} ${styles[neighborhood.risk]}`}
                  key={neighborhood.name}
                  style={{
                    left: neighborhood.x,
                    top: neighborhood.y,
                    width: neighborhood.size,
                    height: neighborhood.size
                  }}
                >
                  <span>{neighborhood.name}</span>
                  <strong>{neighborhood.gap}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.finder_panel} id="finder">
            <div className={styles.panel_header}>
              <div>
                <p className={styles.eyebrow}>Guided intake</p>
                <h2>Create a referral and route it to a live provider.</h2>
              </div>
              <ShieldCheck size={22} />
            </div>
            <form action={createReferral} className={styles.referral_form}>
              <label>
                <span>Person</span>
                <input name="person" defaultValue="S. Morgan" required />
              </label>
              <label>
                <span>Need</span>
                <select
                  name="needCategory"
                  value={needCategory}
                  onChange={(event) => {
                    setNeedCategory(event.target.value as NeedCategory);
                    setSelectedProviderId("");
                  }}
                >
                  {need_categories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>
              <label className={styles.full_width}>
                <span>Situation</span>
                <textarea
                  name="need"
                  defaultValue="Needs same-day help near 78702 and cannot drive."
                  required
                />
              </label>
              <label className={styles.full_width}>
                <span>Route to</span>
                <select
                  name="ownerProviderId"
                  value={selectedProvider}
                  onChange={(event) => setSelectedProviderId(event.target.value)}
                >
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} - {service.available} available
                    </option>
                  ))}
                </select>
              </label>
              <div className={styles.match_result}>
                <CheckCircle2 size={18} />
                <span>
                  Recommended: {recommendedService?.name ?? "No available provider"}
                </span>
              </div>
              <SubmitReferralButton />
            </form>
          </div>
        </section>

        <section className={styles.lower_grid}>
          <div className={styles.providers_panel} id="providers">
            <div className={styles.panel_header}>
              <div>
                <p className={styles.eyebrow}>Provider status</p>
                <h2>Capacity board</h2>
              </div>
              <span className={styles.live_badge}>Live</span>
            </div>

            <div className={styles.board_controls}>
              <div className={styles.search_box}>
                <Search size={16} />
                <input
                  aria-label="Search providers"
                  placeholder="Search provider, neighborhood, service"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <div className={styles.segmented_control} aria-label="Provider status filter">
                {provider_filters.map((filter) => (
                  <button
                    className={providerFilter === filter ? styles.segment_active : undefined}
                    key={filter}
                    type="button"
                    onClick={() => setProviderFilter(filter)}
                  >
                    {filter === "all" ? "All" : status_labels[filter]}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.service_list}>
              {filteredServices.map((service) => (
                <article className={styles.service_row} key={service.name}>
                  <div className={styles.service_top}>
                    <div>
                      <strong>{service.name}</strong>
                      <span>
                        <MapPin size={14} /> {service.neighborhood} - {service.serviceType}
                      </span>
                    </div>
                    <span className={`${styles.status} ${styles[service.status]}`}>
                      {status_labels[service.status]}
                    </span>
                  </div>
                  <div className={styles.capacity_track}>
                    <span
                      style={{
                        width: `${Math.max(
                          4,
                          Math.round((service.available / service.capacity) * 100)
                        )}%`
                      }}
                    />
                  </div>
                  <div className={styles.service_meta}>
                    <span>{service.available} available</span>
                    <span>Last verified {service.verified}</span>
                  </div>
                  <form action={updateProviderCapacity} className={styles.capacity_actions}>
                    <input type="hidden" name="providerName" value={service.name} />
                    <input type="hidden" name="capacity" value={service.capacity} />
                    <input type="hidden" name="available" value={service.available} />
                    <button name="change" value="-6" type="submit">
                      -6
                    </button>
                    <button name="change" value="12" type="submit">
                      +12
                    </button>
                  </form>
                </article>
              ))}
              {filteredServices.length === 0 ? (
                <EmptyState message="No providers match the current filter." />
              ) : null}
            </div>
          </div>

          <div className={styles.referrals_panel} id="referrals">
            <div className={styles.panel_header}>
              <div>
                <p className={styles.eyebrow}>Referral operations</p>
                <h2>Caseworker queue</h2>
              </div>
              <UsersRound size={22} />
            </div>
            <div className={styles.segmented_control}>
              {referral_filters.map((filter) => (
                <button
                  className={referralFilter === filter ? styles.segment_active : undefined}
                  key={filter}
                  type="button"
                  onClick={() => setReferralFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
            <div className={styles.timeline}>
              {filteredReferrals.map((referral) => (
                <article className={styles.referral} key={`${referral.person}-${referral.owner}`}>
                  <span className={styles.referral_marker} />
                  <div>
                    <strong>{referral.person}</strong>
                    <p>{referral.need}</p>
                    <span>
                      <Clock3 size={14} /> {referral.status} by {referral.owner}
                    </span>
                  </div>
                </article>
              ))}
              {filteredReferrals.length === 0 ? (
                <EmptyState message="No referrals match this queue filter." />
              ) : null}
            </div>
          </div>

          <div className={styles.updates_panel} id="updates">
            <div className={styles.panel_header}>
              <div>
                <p className={styles.eyebrow}>Audit trail</p>
                <h2>Freshness feed</h2>
              </div>
              <Activity size={22} />
            </div>
            <div className={styles.update_list}>
              {providerUpdates.map((update) => (
                <article className={styles.update} key={update.id}>
                  <span>{update.time}</span>
                  <strong>{update.provider}</strong>
                  <p>{update.message}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function Metric({
  label,
  value,
  trend
}: {
  label: string;
  value: string;
  trend: string;
}) {
  return (
    <article className={styles.metric}>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{trend}</p>
    </article>
  );
}

function SubmitReferralButton() {
  const { pending } = useFormStatus();

  return (
    <button className={styles.primary_button} disabled={pending} type="submit">
      Create referral <ArrowUpRight size={18} />
    </button>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className={styles.empty_state}>{message}</p>;
}

function serviceMatchesNeed(serviceType: string, needCategory: NeedCategory) {
  return serviceType.toLowerCase().includes(needCategory.toLowerCase());
}
