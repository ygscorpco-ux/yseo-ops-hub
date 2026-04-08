import { getDashboardView } from "@/lib/yseo/selectors";

export async function GET() {
  const dashboard = getDashboardView();

  return Response.json({
    status: "ok",
    product: "YSEO",
    generatedAt: new Date().toISOString(),
    actionableCustomers: dashboard.metrics[0]?.value,
    pendingSuggestions: dashboard.metrics[3]?.value,
    blockedConnections: dashboard.connectionWatchlist.filter(
      (connection) => connection.connectionStatus === "blocked",
    ).length,
  });
}
