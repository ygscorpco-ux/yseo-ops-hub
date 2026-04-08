import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { connectSearchConsoleProperty } from "@/lib/yseo/google-search-console";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ customerId: string }> },
) {
  const { customerId } = await params;
  const formData = await request.formData();
  const oauthState = String(formData.get("oauthState") ?? "").trim();
  const siteUrl = String(formData.get("siteUrl") ?? "").trim();

  if (!oauthState || !siteUrl) {
    return NextResponse.json(
      { message: "OAuth session and property selection are required." },
      { status: 400 },
    );
  }

  try {
    await connectSearchConsoleProperty({
      customerId,
      state: oauthState,
      siteUrl,
    });

    revalidatePath("/");
    revalidatePath("/customers");
    revalidatePath(`/customers/${customerId}`);

    return NextResponse.redirect(
      new URL(`/customers/${customerId}?googleConnected=search-console`, request.url),
      { status: 303 },
    );
  } catch (error) {
    const redirectUrl = new URL("/integrations/search-console/connect", request.url);
    redirectUrl.searchParams.set("state", oauthState);
    redirectUrl.searchParams.set("customerId", customerId);
    redirectUrl.searchParams.set(
      "error",
      error instanceof Error ? error.message : "Failed to connect Search Console property.",
    );

    return NextResponse.redirect(redirectUrl, { status: 303 });
  }
}
