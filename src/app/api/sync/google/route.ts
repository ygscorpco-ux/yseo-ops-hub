import { getGoogleIntegrationReadiness } from "@/lib/yseo/google-readiness";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const readiness = await getGoogleIntegrationReadiness();

  return Response.json({
    status: "ok",
    ...readiness,
    endpoints: {
      get: "/api/sync/google",
    },
  });
}
