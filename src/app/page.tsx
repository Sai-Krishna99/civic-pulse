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
import { updateProviderCapacity } from "@/app/actions";
import { getDashboardData } from "@/lib/dashboard-data";
import styles from "./page.module.css";

const status_labels: Record<string, string> = {
  open: "Open",
  filling: "Filling fast",
  full: "Full",
  stale: "Needs check"
};

const status_class: Record<string, string> = {
  open: styles.open,
  filling: styles.filling,
  full: styles.full,
  stale: styles.stale
};

export const dynamic = "force-dynamic";

export default async function Home() {
  const { services, neighborhoods, referrals, providerUpdates } =
    await getDashboardData();
  const total_capacity = services.reduce((sum, service) => sum + service.capacity, 0);
  const available_capacity = services.reduce(
    (sum, service) => sum + service.available,
    0
  );
  const active_referrals = referrals.filter(
    (referral) => referral.status !== "Completed"
  ).length;

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
          <a className={styles.nav_active} href="#command">
            <Activity size={18} /> Command
          </a>
          <a href="#finder">
            <Search size={18} /> Finder
          </a>
          <a href="#providers">
            <Building2 size={18} /> Providers
          </a>
          <a href="#referrals">
            <HeartHandshake size={18} /> Referrals
          </a>
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
            <button type="button" aria-label="Refresh live capacity">
              <RefreshCcw size={18} />
            </button>
            <button type="button" aria-label="Open alerts">
              <Bell size={18} />
            </button>
            <button className={styles.primary_button} type="button">
              <Siren size={18} /> Open intake
            </button>
          </div>
        </header>

        <section className={styles.metrics} aria-label="Network summary">
          <Metric label="Available seats and kits" value={available_capacity.toString()} trend={`${total_capacity} total capacity`} />
          <Metric label="Active referrals" value={active_referrals.toString()} trend="7 need provider action" />
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
              <button type="button">
                <Filter size={16} /> Filter
              </button>
            </div>

            <div className={styles.map}>
              {neighborhoods.map((neighborhood) => (
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
                <p className={styles.eyebrow}>Guided match</p>
                <h2>Single parent, no car, needs food tonight.</h2>
              </div>
              <ShieldCheck size={22} />
            </div>
            <div className={styles.match_box}>
              <div className={styles.input_like}>
                <Search size={18} />
                Food tonight near 78702, no vehicle, two children
              </div>
              <div className={styles.match_result}>
                <CheckCircle2 size={18} />
                <span>3 verified options within 2.4 miles</span>
              </div>
              <button className={styles.primary_button} type="button">
                Create referral <ArrowUpRight size={18} />
              </button>
            </div>
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

            <div className={styles.service_list}>
              {services.map((service) => (
                <article className={styles.service_row} key={service.name}>
                  <div className={styles.service_top}>
                    <div>
                      <strong>{service.name}</strong>
                      <span>
                        <MapPin size={14} /> {service.neighborhood}
                      </span>
                    </div>
                    <span className={`${styles.status} ${status_class[service.status]}`}>
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
            <div className={styles.timeline}>
              {referrals.map((referral) => (
                <article className={styles.referral} key={referral.person}>
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
            </div>
          </div>

          <div className={styles.updates_panel}>
            <div className={styles.panel_header}>
              <div>
                <p className={styles.eyebrow}>Audit trail</p>
                <h2>Freshness feed</h2>
              </div>
              <Activity size={22} />
            </div>
            <div className={styles.update_list}>
              {providerUpdates.map((update) => (
                <article className={styles.update} key={`${update.provider}-${update.time}`}>
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
