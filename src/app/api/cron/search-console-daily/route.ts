import { authorizeOpsRequest } from "@/lib/api/ops-auth";
import { evaluateAlertRules } from "@/lib/yseo/alerts";
import { generateRecommendations } from "@/lib/yseo/recommendations";
import { runUnifiedSync } from "@/lib/yseo/sync-runner";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = authorizeOpsRequest(request);

  if (!auth.ok) {
    return Response.json({ message: auth.message }, { status: auth.status });
  }

  const syncResult = await runUnifiedSync({ channel: "search-console" });
  const alertResult = await evaluateAlertRules({ mode: "immediate" });
  const recommendationResult = await generateRecommendations({ source: "scheduled" });

  return Response.json({
    status: "ok",
    syncResult,
    alertResult,
    recommendationResult,
  });
}
