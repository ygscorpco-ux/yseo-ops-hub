import { authorizeOpsRequest } from "@/lib/api/ops-auth";
import { generateRecommendations } from "@/lib/yseo/recommendations";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = authorizeOpsRequest(request);

  if (!auth.ok) {
    return Response.json({ message: auth.message }, { status: auth.status });
  }

  const body = (await request.json().catch(() => ({}))) as {
    customerId?: string;
    source?: "manual" | "scheduled" | "post-alert";
  };

  const result = await generateRecommendations({
    customerId: body.customerId,
    source: body.source ?? "manual",
  });

  return Response.json(result);
}
