import {
  getNaverSyncStatus,
  isAuthorizedSyncRequest,
  runNaverSearchAdSync,
} from "@/lib/yseo/naver-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const syncStatus = await getNaverSyncStatus();

  return Response.json({
    status: "ok",
    ...syncStatus,
    endpoints: {
      get: "/api/sync/naver",
      post: "/api/sync/naver",
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

  const result = await runNaverSearchAdSync();

  return Response.json(
    {
      status: result.ok ? "ok" : "error",
      ...result,
    },
    { status: result.ok ? 200 : 502 },
  );
}
