import { authorizeOpsRequest } from "@/lib/api/ops-auth";
import { evaluateAlertRules } from "@/lib/yseo/alerts";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = authorizeOpsRequest(request);

  if (!auth.ok) {
    return Response.json({ message: auth.message }, { status: auth.status });
  }

  const body = (await request.json().catch(() => ({}))) as {
    customerId?: string;
    mode?: "immediate" | "daily-summary";
  };

  const result = await evaluateAlertRules({
    customerId: body.customerId,
    mode: body.mode ?? "immediate",
  });

  return Response.json(result);
}
