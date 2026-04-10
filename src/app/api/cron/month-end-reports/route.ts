import { authorizeOpsRequest } from "@/lib/api/ops-auth";
import { runMonthlyReportBatch } from "@/lib/yseo/report-batch";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getKstDateParts(now = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(now);

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  return { year, month, day };
}

function shouldRunMonthEndBatch(now = new Date()) {
  const today = getKstDateParts(now);
  const tomorrowUtcAnchor = new Date(Date.UTC(today.year, today.month - 1, today.day + 1, 0, 0, 0));
  const tomorrow = getKstDateParts(tomorrowUtcAnchor);

  return today.month !== tomorrow.month;
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
