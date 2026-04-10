import { authorizeOpsRequest } from "@/lib/api/ops-auth";
import { runUnifiedSync } from "@/lib/yseo/sync-runner";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = authorizeOpsRequest(request);

  if (!auth.ok) {
    return Response.json({ message: auth.message }, { status: auth.status });
  }

  const body = (await request.json().catch(() => ({}))) as {
    customerId?: string;
    channel?: "naver-searchad" | "search-console" | "all";
  };

  const result = await runUnifiedSync({
    customerId: body.customerId,
    channel: body.channel ?? "all",
  });

  return Response.json(result);
}
