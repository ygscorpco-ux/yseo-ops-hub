import { getDashboardView } from "@/lib/yseo/selectors";

export async function GET() {
  return Response.json(getDashboardView());
}
