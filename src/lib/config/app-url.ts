import "server-only";

const DEFAULT_APP_BASE_URL = "https://yseo.vercel.app";

function trimTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function getAppBaseUrl() {
  const envValue =
    process.env.YSEO_APP_BASE_URL ??
    process.env.NEXT_PUBLIC_APP_BASE_URL ??
    DEFAULT_APP_BASE_URL;

  return trimTrailingSlash(envValue);
}

export function buildCustomerDashboardUrl(customerId: string) {
  return `${getAppBaseUrl()}/customers/${customerId}`;
}

export function buildDashboardUrl() {
  return getAppBaseUrl();
}
