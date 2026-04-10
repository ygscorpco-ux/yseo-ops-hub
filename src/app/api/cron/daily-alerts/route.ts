import { authorizeOpsRequest } from "@/lib/api/ops-auth";
import { evaluateAlertRules } from "@/lib/yseo/alerts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = authorizeOpsRequest(request);

  if (!auth.ok) {
    return Response.json({ message: auth.message }, { status: auth.status });
  }

  const alertResult = await evaluateAlertRules({ mode: "daily-summary" });

  return Response.json({
    status: "ok",
    alertResult,
  });
}
