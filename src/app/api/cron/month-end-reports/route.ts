import { authorizeOpsRequest } from "@/lib/api/ops-auth";
import { runMonthlyReportBatch } from "@/lib/yseo/report-batch";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function shouldRunMonthEndBatch(now = new Date()) {
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  return tomorrow.getMonth() !== now.getMonth();
}

export async function GET(request: Request) {
  const auth = authorizeOpsRequest(request);

  if (!auth.ok) {
    return Response.json({ message: auth.message }, { status: auth.status });
  }

  if (!shouldRunMonthEndBatch()) {
    return Response.json({
      status: "skipped",
      reason: "Month-end batch only runs on the last local day of the month.",
    });
  }

  const batchResult = await runMonthlyReportBatch();

  return Response.json({
    status: "ok",
    batchResult,
  });
}
