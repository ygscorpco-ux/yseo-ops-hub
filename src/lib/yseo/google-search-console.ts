import "server-only";

import crypto from "node:crypto";

import { and, desc, eq } from "drizzle-orm";

import { getDb, hasDatabaseUrl } from "@/lib/db/client";
import {
  channelConnectionsTable,
  channelCredentialsTable,
  channelInsightsTable,
  customersTable,
  externalReferencesTable,
  oauthSessionsTable,
  performanceSnapshotsTable,
  taskExecutionsTable,
} from "@/lib/db/schema";
import { decryptJson, encryptJson } from "@/lib/security/encrypted-json";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const SEARCH_CONSOLE_SITES_URL = "https://www.googleapis.com/webmasters/v3/sites";
const SEARCH_CONSOLE_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const SEARCH_CONSOLE_PROVIDER = "google-search-console";

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  token_type: string;
}

interface SearchConsoleSitesResponse {
  siteEntry?: Array<{
    siteUrl: string;
    permissionLevel: string;
  }>;
}

interface SearchConsoleAnalyticsResponse {
  rows?: Array<{
    clicks?: number;
    impressions?: number;
    ctr?: number;
    position?: number;
  }>;
}

interface SearchConsoleSessionPayload {
  refreshToken: string;
  scope?: string;
  siteEntries: Array<{
    siteUrl: string;
    permissionLevel: string;
  }>;
}

interface StoredSearchConsoleCredential {
  refreshToken: string;
  siteUrl: string;
  permissionLevel?: string;
  scope?: string;
  connectedAt: string;
  lastValidatedAt: string;
}

export interface SearchConsoleSelectionSession {
  id: string;
  customerId: string;
  customerName: string;
  siteEntries: Array<{
    siteUrl: string;
    permissionLevel: string;
  }>;
}

export interface SearchConsoleConnectionSummary {
  oauthConfigured: boolean;
  connectedCustomers: number;
  attentionCustomers: number;
  latestProperty?: string;
}

function makeId(...parts: Array<string | number>) {
  return parts
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function subtractDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() - days);
  return next;
}

function getOAuthConfig() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI,
  };
}

export function isGoogleOAuthConfigured() {
  const config = getOAuthConfig();

  return Boolean(config.clientId && config.clientSecret && config.redirectUri);
}

function requireGoogleOAuthConfig() {
  const config = getOAuthConfig();

  if (!config.clientId || !config.clientSecret || !config.redirectUri) {
    throw new Error(
      "GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_OAUTH_REDIRECT_URI must be configured.",
    );
  }

  return {
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    redirectUri: config.redirectUri,
  };
}

async function ensureCustomer(customerId: string) {
  const db = getDb();
  const [customer] = await db
    .select({ id: customersTable.id, name: customersTable.name })
    .from(customersTable)
    .where(eq(customersTable.id, customerId))
    .limit(1);

  if (!customer) {
    throw new Error("Customer not found.");
  }

  return customer;
}

async function googleTokenRequest(body: URLSearchParams) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  const payload = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    const detail =
      typeof payload.error_description === "string"
        ? payload.error_description
        : typeof payload.error === "string"
          ? payload.error
          : "Google token exchange failed.";
    throw new Error(detail);
  }

  return payload as unknown as GoogleTokenResponse;
}

async function fetchSearchConsoleSites(accessToken: string) {
  const response = await fetch(SEARCH_CONSOLE_SITES_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });
  const payload = (await response.json()) as SearchConsoleSitesResponse & {
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message ?? "Failed to load Search Console properties.");
  }

  return payload.siteEntry ?? [];
}

async function fetchSearchConsole7dSummary(accessToken: string, siteUrl: string) {
  const endDate = subtractDays(new Date(), 1);
  const startDate = subtractDays(endDate, 6);
  const response = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        rowLimit: 25,
      }),
      cache: "no-store",
    },
  );

  const payload = (await response.json()) as SearchConsoleAnalyticsResponse & {
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message ?? "Failed to validate Search Analytics query.");
  }

  const summary = payload.rows?.[0];

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    clicks: summary?.clicks ?? 0,
    impressions: summary?.impressions ?? 0,
    ctr: summary?.ctr ?? 0,
    position: summary?.position ?? 0,
  };
}

export async function createSearchConsoleOauthUrl(customerId: string) {
  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_URL or NEON_DATABASE_URL must be configured first.");
  }

  await ensureCustomer(customerId);
  const { clientId, redirectUri } = requireGoogleOAuthConfig();
  const db = getDb();
  const state = crypto.randomBytes(24).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

  await db.insert(oauthSessionsTable).values({
    id: state,
    provider: SEARCH_CONSOLE_PROVIDER,
    customerId,
    status: "pending",
    encryptedPayload: null,
    expiresAt,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SEARCH_CONSOLE_SCOPE,
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
    state,
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function authorizeSearchConsoleOauth(input: {
  state: string;
  code?: string | null;
  error?: string | null;
}) {
  if (input.error) {
    throw new Error(`Google OAuth error: ${input.error}`);
  }

  if (!input.code) {
    throw new Error("Google OAuth code is missing.");
  }

  const { clientId, clientSecret, redirectUri } = requireGoogleOAuthConfig();
  const db = getDb();
  const [session] = await db
    .select()
    .from(oauthSessionsTable)
    .where(eq(oauthSessionsTable.id, input.state))
    .limit(1);

  if (!session || session.provider !== SEARCH_CONSOLE_PROVIDER) {
    throw new Error("OAuth session not found.");
  }

  if (session.expiresAt.getTime() < Date.now()) {
    throw new Error("OAuth session expired. Start again.");
  }

  const tokenPayload = await googleTokenRequest(
    new URLSearchParams({
      code: input.code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  );

  if (!tokenPayload.refresh_token) {
    throw new Error("Google did not return a refresh token. Re-run consent and try again.");
  }

  const siteEntries = await fetchSearchConsoleSites(tokenPayload.access_token);
  const now = new Date();

  await db
    .update(oauthSessionsTable)
    .set({
      status: "authorized",
      encryptedPayload: encryptJson({
        refreshToken: tokenPayload.refresh_token,
        scope: tokenPayload.scope,
        siteEntries,
      }),
      expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
      updatedAt: now,
    })
    .where(eq(oauthSessionsTable.id, input.state));

  return {
    customerId: session.customerId,
  };
}

export async function getSearchConsoleSelectionSession(
  state: string,
): Promise<SearchConsoleSelectionSession | null> {
  const db = getDb();
  const [session] = await db
    .select({
      id: oauthSessionsTable.id,
      customerId: oauthSessionsTable.customerId,
      status: oauthSessionsTable.status,
      encryptedPayload: oauthSessionsTable.encryptedPayload,
      expiresAt: oauthSessionsTable.expiresAt,
      customerName: customersTable.name,
    })
    .from(oauthSessionsTable)
    .innerJoin(customersTable, eq(customersTable.id, oauthSessionsTable.customerId))
    .where(eq(oauthSessionsTable.id, state))
    .limit(1);

  if (!session || session.status !== "authorized" || !session.encryptedPayload) {
    return null;
  }

  if (session.expiresAt.getTime() < Date.now()) {
    return null;
  }

  const payload = decryptJson<SearchConsoleSessionPayload>(session.encryptedPayload);

  return {
    id: session.id,
    customerId: session.customerId,
    customerName: session.customerName,
    siteEntries: payload.siteEntries,
  };
}

async function refreshSearchConsoleAccessToken(refreshToken: string) {
  const { clientId, clientSecret, redirectUri } = requireGoogleOAuthConfig();

  const tokenPayload = await googleTokenRequest(
    new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  );

  return tokenPayload.access_token;
}

export async function connectSearchConsoleProperty(input: {
  customerId: string;
  state: string;
  siteUrl: string;
}) {
  const db = getDb();
  const [session] = await db
    .select()
    .from(oauthSessionsTable)
    .where(eq(oauthSessionsTable.id, input.state))
    .limit(1);

  if (!session || session.customerId !== input.customerId) {
    throw new Error("OAuth session does not match the selected customer.");
  }

  if (!session.encryptedPayload || session.status !== "authorized") {
    throw new Error("Search Console OAuth session is not ready.");
  }

  const payload = decryptJson<SearchConsoleSessionPayload>(session.encryptedPayload);
  const selectedProperty = payload.siteEntries.find((entry) => entry.siteUrl === input.siteUrl);

  if (!selectedProperty) {
    throw new Error("Selected property was not returned by Google Search Console.");
  }

  const accessToken = await refreshSearchConsoleAccessToken(payload.refreshToken);
  const summary = await fetchSearchConsole7dSummary(accessToken, input.siteUrl);
  const now = new Date();
  const [existingConnection] = await db
    .select()
    .from(channelConnectionsTable)
    .where(
      and(
        eq(channelConnectionsTable.customerId, input.customerId),
        eq(channelConnectionsTable.channelType, "search-console"),
      ),
    )
    .limit(1);

  const connectionId =
    existingConnection?.id ?? makeId("search-console-connection", input.customerId);

  if (existingConnection) {
    await db
      .update(channelConnectionsTable)
      .set({
        connectionStatus: "connected",
        authMethod: "oauth",
        externalAccountRef: "google-search-console",
        externalPropertyRef: input.siteUrl,
        tokenStatus: "valid",
        lastSyncAt: now,
        lastErrorCode: null,
        syncStatus: "succeeded",
        syncHeadline: "Search Console property connected and validated.",
      })
      .where(eq(channelConnectionsTable.id, connectionId));
  } else {
    await db.insert(channelConnectionsTable).values({
      id: connectionId,
      customerId: input.customerId,
      channelType: "search-console",
      connectionStatus: "connected",
      authMethod: "oauth",
      externalAccountRef: "google-search-console",
      externalPropertyRef: input.siteUrl,
      tokenStatus: "valid",
      lastSyncAt: now,
      lastErrorCode: null,
      syncStatus: "succeeded",
      syncHeadline: "Search Console property connected and validated.",
    });
  }

  const encryptedCredential = encryptJson({
    refreshToken: payload.refreshToken,
    siteUrl: input.siteUrl,
    permissionLevel: selectedProperty.permissionLevel,
    scope: payload.scope,
    connectedAt: now.toISOString(),
    lastValidatedAt: now.toISOString(),
  });

  await db
    .insert(channelCredentialsTable)
    .values({
      id: makeId("search-console-credential", input.customerId),
      channelConnectionId: connectionId,
      credentialType: "oauth-refresh",
      encryptedPayload: encryptedCredential,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: channelCredentialsTable.id,
      set: {
        channelConnectionId: connectionId,
        credentialType: "oauth-refresh",
        encryptedPayload: encryptedCredential,
        updatedAt: now,
      },
    });

  await db
    .insert(externalReferencesTable)
    .values({
      id: makeId("search-console-property", input.customerId),
      channelConnectionId: connectionId,
      externalType: "property",
      externalId: input.siteUrl,
      externalName: input.siteUrl,
      parentExternalId: "google-search-console",
    })
    .onConflictDoUpdate({
      target: externalReferencesTable.id,
      set: {
        channelConnectionId: connectionId,
        externalId: input.siteUrl,
        externalName: input.siteUrl,
        parentExternalId: "google-search-console",
      },
    });

  await db
    .insert(performanceSnapshotsTable)
    .values({
      id: makeId("search-console-snapshot", input.customerId, summary.endDate),
      customerId: input.customerId,
      channelType: "search-console",
      entityType: "customer",
      entityId: connectionId,
      dateBucket: "7d",
      metricSetJson: {
        clicks: summary.clicks,
        impressions: summary.impressions,
        ctr: Number((summary.ctr * 100).toFixed(2)),
        avgPosition: Number(summary.position.toFixed(2)),
        summary: `Search Console property ${input.siteUrl}`,
      },
      completenessState: "complete",
      capturedAt: now,
    })
    .onConflictDoUpdate({
      target: performanceSnapshotsTable.id,
      set: {
        metricSetJson: {
          clicks: summary.clicks,
          impressions: summary.impressions,
          ctr: Number((summary.ctr * 100).toFixed(2)),
          avgPosition: Number(summary.position.toFixed(2)),
          summary: `Search Console property ${input.siteUrl}`,
        },
        capturedAt: now,
      },
    });

  await db
    .insert(channelInsightsTable)
    .values({
      id: makeId("search-console-insight", input.customerId),
      customerId: input.customerId,
      channelType: "search-console",
      freshnessLabel: `${summary.endDate} sync`,
      headline: "Search Console property connected",
      note: `${input.siteUrl} property validated and 7-day totals were collected.`,
      metrics: [
        {
          label: "7d Clicks",
          value: summary.clicks.toLocaleString("en-US"),
        },
        {
          label: "7d Impressions",
          value: summary.impressions.toLocaleString("en-US"),
        },
        {
          label: "CTR",
          value: `${(summary.ctr * 100).toFixed(2)}%`,
        },
      ],
    })
    .onConflictDoUpdate({
      target: channelInsightsTable.id,
      set: {
        freshnessLabel: `${summary.endDate} sync`,
        headline: "Search Console property connected",
        note: `${input.siteUrl} property validated and 7-day totals were collected.`,
        metrics: [
          {
            label: "7d Clicks",
            value: summary.clicks.toLocaleString("en-US"),
          },
          {
            label: "7d Impressions",
            value: summary.impressions.toLocaleString("en-US"),
          },
          {
            label: "CTR",
            value: `${(summary.ctr * 100).toFixed(2)}%`,
          },
        ],
      },
    });

  await db.insert(taskExecutionsTable).values({
    id: makeId("search-console-connect", input.customerId, Date.now()),
    customerId: input.customerId,
    suggestionId: null,
    actionType: "search-console-connected",
    actorType: "operator",
    actorName: "YSEO OAuth",
    resultStatus: "done",
    externalRequestRef: input.siteUrl,
    beforeJson: null,
    afterJson: {
      siteUrl: input.siteUrl,
      permissionLevel: selectedProperty.permissionLevel,
      clicks: summary.clicks,
      impressions: summary.impressions,
    },
    summary: "Search Console property connected and validated.",
    executedAt: now,
  });

  await db
    .update(customersTable)
    .set({
      lastActionAt: now,
      updatedAt: now,
    })
    .where(eq(customersTable.id, input.customerId));

  await db
    .update(oauthSessionsTable)
    .set({
      status: "completed",
      completedAt: now,
      updatedAt: now,
    })
    .where(eq(oauthSessionsTable.id, input.state));

  return {
    property: input.siteUrl,
  };
}

export async function getSearchConsoleConnectionSummary(): Promise<SearchConsoleConnectionSummary> {
  if (!hasDatabaseUrl()) {
    return {
      oauthConfigured: isGoogleOAuthConfigured(),
      connectedCustomers: 0,
      attentionCustomers: 0,
    };
  }

  try {
    const db = getDb();
    const rows = await db
      .select({
        externalPropertyRef: channelConnectionsTable.externalPropertyRef,
        connectionStatus: channelConnectionsTable.connectionStatus,
      })
      .from(channelConnectionsTable)
      .where(eq(channelConnectionsTable.channelType, "search-console"))
      .orderBy(desc(channelConnectionsTable.lastSyncAt));

    return {
      oauthConfigured: isGoogleOAuthConfigured(),
      connectedCustomers: rows.filter((row) => row.connectionStatus === "connected").length,
      attentionCustomers: rows.filter((row) => row.connectionStatus !== "connected").length,
      latestProperty: rows[0]?.externalPropertyRef ?? undefined,
    };
  } catch {
    return {
      oauthConfigured: isGoogleOAuthConfigured(),
      connectedCustomers: 0,
      attentionCustomers: 0,
    };
  }
}

export async function getStoredSearchConsoleCredential(customerId: string) {
  const db = getDb();
  const [row] = await db
    .select({
      encryptedPayload: channelCredentialsTable.encryptedPayload,
    })
    .from(channelCredentialsTable)
    .innerJoin(
      channelConnectionsTable,
      eq(channelConnectionsTable.id, channelCredentialsTable.channelConnectionId),
    )
    .where(
      and(
        eq(channelConnectionsTable.customerId, customerId),
        eq(channelConnectionsTable.channelType, "search-console"),
        eq(channelCredentialsTable.credentialType, "oauth-refresh"),
      ),
    )
    .limit(1);

  if (!row) {
    return null;
  }

  return decryptJson<StoredSearchConsoleCredential>(row.encryptedPayload);
}

export async function getStoredSearchConsoleSites(customerId: string) {
  const credential = await getStoredSearchConsoleCredential(customerId);

  if (!credential) {
    return [];
  }

  const accessToken = await refreshSearchConsoleAccessToken(credential.refreshToken);
  return fetchSearchConsoleSites(accessToken);
}

export async function runSearchConsoleValidationSync(customerId: string) {
  const credential = await getStoredSearchConsoleCredential(customerId);

  if (!credential) {
    throw new Error("Search Console credential not found.");
  }

  const accessToken = await refreshSearchConsoleAccessToken(credential.refreshToken);
  return fetchSearchConsole7dSummary(accessToken, credential.siteUrl);
}
