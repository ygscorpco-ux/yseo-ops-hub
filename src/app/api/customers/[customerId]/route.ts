import { getCustomerDetailView } from "@/lib/yseo/selectors";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ customerId: string }> },
) {
  const { customerId } = await params;
  const detail = await getCustomerDetailView(customerId);

  if (!detail) {
    return Response.json(
      { message: "Customer not found" },
      { status: 404 },
    );
  }

  return Response.json(detail);
}
