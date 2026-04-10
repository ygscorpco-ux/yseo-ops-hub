import { authorizeOpsRequest } from "@/lib/api/ops-auth";
import { approveSuggestion } from "@/lib/yseo/executions";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = authorizeOpsRequest(request);

  if (!auth.ok) {
    return Response.json({ message: auth.message }, { status: auth.status });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { approvedBy?: string };

  const result = await approveSuggestion(id, body.approvedBy ?? "YSEO Operator");
  return Response.json(result);
}
