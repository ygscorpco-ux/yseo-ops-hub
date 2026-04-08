import { NextResponse } from "next/server";

import { createSearchConsoleOauthUrl } from "@/lib/yseo/google-search-console";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const customerId = url.searchParams.get("customerId")?.trim();

  if (!customerId) {
    return NextResponse.redirect(
      new URL("/customers?googleOAuthError=missing-customer", request.url),
    );
  }

  try {
    const redirectUrl = await createSearchConsoleOauthUrl(customerId);
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    const nextUrl = new URL(`/customers/${customerId}`, request.url);
    nextUrl.searchParams.set(
      "googleOAuthError",
      error instanceof Error ? error.message : "Search Console OAuth start failed.",
    );

    return NextResponse.redirect(nextUrl);
  }
}
