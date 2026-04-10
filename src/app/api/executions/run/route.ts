import { authorizeOpsRequest } from "@/lib/api/ops-auth";
import { runExecutionRequest } from "@/lib/yseo/executions";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = authorizeOpsRequest(request);

  if (!auth.ok) {
    return Response.json({ message: auth.message }, { status: auth.status });
  }

  const body = (await request.json().catch(() => ({}))) as {
    executionRequestId?: string;
    actorName?: string;
  };

  if (!body.executionRequestId) {
    return Response.json({ message: "executionRequestId is required." }, { status: 400 });
  }

  try {
    const result = await runExecutionRequest({
      executionRequestId: body.executionRequestId,
      actorName: body.actorName ?? "YSEO Operator",
    });

    return Response.json(result);
  } catch (error) {
    return Response.json(
      {
        message: error instanceof Error ? error.message : "Failed to run execution request.",
      },
      { status: 500 },
    );
  }
}
