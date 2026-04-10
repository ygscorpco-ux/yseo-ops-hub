import { getAlertRules, getStrategyPack } from "@/lib/yseo/strategy";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ customerId: string }> },
) {
  const { customerId } = await params;
  const strategyPack = await getStrategyPack(customerId);
  const alertRules = await getAlertRules(customerId);

  return Response.json({
    status: "ok",
    strategyPack,
    alertRules,
  });
}
