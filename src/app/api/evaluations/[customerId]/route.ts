import { evaluateRecommendationPerformance } from "@/lib/yseo/recommendations";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ customerId: string }> },
) {
  const { customerId } = await params;
  const evaluations = await evaluateRecommendationPerformance(customerId);

  return Response.json({
    status: "ok",
    evaluations,
  });
}
