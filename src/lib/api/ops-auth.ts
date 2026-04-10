export function getOpsBearerToken() {
  return (
    process.env.CRON_SECRET ??
    process.env.SYNC_API_TOKEN ??
    process.env.AUTH_SECRET ??
    null
  );
}

function isVercelCronRequest(request: Request) {
  const userAgent = request.headers.get("user-agent");
  return userAgent === "vercel-cron/1.0";
}

export function authorizeOpsRequest(request: Request) {
  const expected = getOpsBearerToken();

  if (isVercelCronRequest(request)) {
    return {
      ok: true as const,
    };
  }

  if (!expected) {
    return {
      ok: false as const,
      status: 503,
      message: "CRON_SECRET, SYNC_API_TOKEN, or AUTH_SECRET must be configured first.",
    };
  }

  const authorization = request.headers.get("authorization");

  if (authorization !== `Bearer ${expected}`) {
    return {
      ok: false as const,
      status: 401,
      message: "Unauthorized operations request.",
    };
  }

  return {
    ok: true as const,
  };
}
