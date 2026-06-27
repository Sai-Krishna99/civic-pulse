import { DashboardWorkspace } from "@/app/dashboard-workspace";
import { getDashboardData } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const dashboardData = await getDashboardData();

  return <DashboardWorkspace data={dashboardData} />;
}
