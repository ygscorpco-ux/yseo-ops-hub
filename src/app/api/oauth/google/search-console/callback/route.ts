import { NextResponse } from "next/server";

import { authorizeSearchConsoleOauth } from "@/lib/yseo/google-search-console";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state")?.trim();
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (!state) {
    return NextResponse.redirect(
      new URL("/customers?googleOAuthError=missing-state", request.url),
    );
  }

  try {
    const result = await authorizeSearchConsoleOauth({ state, code, error });
    const redirectUrl = new URL("/integrations/search-console/connect", request.url);
    redirectUrl.searchParams.set("state", state);
    redirectUrl.searchParams.set("customerId", result.customerId);

    return NextResponse.redirect(redirectUrl);
  } catch (caughtError) {
    const redirectUrl = new URL("/customers", request.url);
    redirectUrl.searchParams.set(
      "googleOAuthError",
      caughtError instanceof Error
        ? caughtError.message
        : "Search Console OAuth callback failed.",
    );

    return NextResponse.redirect(redirectUrl);
  }
}
