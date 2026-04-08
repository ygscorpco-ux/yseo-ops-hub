import { isAuthorizedSyncRequest } from "@/lib/yseo/naver-sync";
import {
  getMonthlyReportBatchStatus,
  runMonthlyReportBatch,
} from "@/lib/yseo/report-batch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const summary = await getMonthlyReportBatchStatus();

  return Response.json({
    status: "ok",
    ...summary,
    endpoints: {
      get: "/api/reports/monthly",
      post: "/api/reports/monthly",
    },
  });
}

export async function POST(request: Request) {
  const authorization = isAuthorizedSyncRequest(request);

  if (!authorization.ok) {
    return Response.json(
      {
        status: "error",
        message: authorization.message,
      },
      { status: authorization.status },
    );
  }

  const result = await runMonthlyReportBatch();

  return Response.json(
    {
      status: result.ok ? "ok" : "error",
      ...result,
    },
    { status: result.ok ? 200 : 502 },
  );
}
