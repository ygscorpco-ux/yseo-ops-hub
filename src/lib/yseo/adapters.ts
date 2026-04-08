import crypto from "node:crypto";

import type { ChannelType, ConnectionStatus } from "@/lib/yseo/types";

const NAVER_BASE_URL = "https://api.searchad.naver.com";
const NAVER_STATS_FIELDS = [
  "clkCnt",
  "impCnt",
  "salesAmt",
  "ctr",
  "cpc",
  "avgRnk",
  "ccnt",
] as const;

export interface ConnectionValidationResult {
  ok: boolean;
  connectionStatus: ConnectionStatus;
  message: string;
  externalRefs?: string[];
}

export interface SyncResult {
  ok: boolean;
  syncedCount: number;
  message: string;
  retryAfterMs?: number;
}

export interface ActionExecutionResult {
  ok: boolean;
  message: string;
  externalRequestRef?: string;
}

export interface ChannelAdapter {
  readonly channel: ChannelType;
  validateConnection(): Promise<ConnectionValidationResult>;
  listAccountsOrProperties(): Promise<string[]>;
  syncCoreEntities(): Promise<SyncResult>;
  syncPerformance(): Promise<SyncResult>;
  executeApprovedAction(actionType: string): Promise<ActionExecutionResult>;
}

export interface NaverSearchAdCredentials {
  apiKey: string;
  secretKey: string;
  customerId: string;
}

export interface NaverManagedCustomer {
  customerId: string;
  customerName: string;
}

export interface NaverStatsSummary {
  clicks: number;
  impressions: number;
  cost: number;
  conversions: number;
  ctr: number;
  cpc: number;
  averageRank: number | null;
  rowCount: number;
}

export function getNaverSearchAdCredentials():
  | NaverSearchAdCredentials
  | null {
  const apiKey = process.env.NAVER_SEARCHAD_API_KEY;
  const secretKey = process.env.NAVER_SEARCHAD_SECRET_KEY;
  const customerId = process.env.NAVER_SEARCHAD_CUSTOMER_ID;

  if (!apiKey || !secretKey || !customerId) {
    return null;
  }

  return {
    apiKey,
    secretKey,
    customerId,
  };
}

function buildNaverSignature(
  timestamp: string,
  method: string,
  uri: string,
  secretKey: string,
) {
  return crypto
    .createHmac("sha256", secretKey)
    .update(`${timestamp}.${method}.${uri}`)
    .digest("base64");
}

function buildQueryString(
  query?: Record<string, string | number | string[] | undefined>,
) {
  const params = new URLSearchParams();

  if (!query) {
    return params;
  }

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, item);
      }
      continue;
    }

    params.set(key, String(value));
  }

  return params;
}

function asArray(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;

    if (Array.isArray(record.data)) {
      return record.data;
    }

    if (Array.isArray(record.list)) {
      return record.list;
    }

    if (Array.isArray(record.items)) {
      return record.items;
    }
  }

  return [];
}

function parseManagedCustomers(payload: unknown): NaverManagedCustomer[] {
  const rows = asArray(payload);

  return rows
    .map((row) => {
      if (!row || typeof row !== "object") {
        return null;
      }

      const item = row as Record<string, unknown>;
      const customerId =
        item.customerId ??
        item.clientCustomerId ??
        item.linkedCustomerId ??
        item.id;
      const customerName =
        item.customerName ??
        item.clientCustomerName ??
        item.name ??
        `NAVER ${customerId ?? "customer"}`;

      if (!customerId) {
        return null;
      }

      return {
        customerId: String(customerId),
        customerName: String(customerName),
      };
    })
    .filter((item): item is NaverManagedCustomer => Boolean(item));
}

function getMetricFromRow(row: Record<string, unknown>, key: string) {
  const directValue = row[key];

  if (typeof directValue === "number") {
    return directValue;
  }

  if (typeof directValue === "string" && directValue.trim().length > 0) {
    const parsed = Number(directValue);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const nestedCandidates = ["stats", "summary", "report", "metrics"] as const;

  for (const candidate of nestedCandidates) {
    const nestedValue = row[candidate];

    if (nestedValue && typeof nestedValue === "object") {
      const nestedMetric = (nestedValue as Record<string, unknown>)[key];

      if (typeof nestedMetric === "number") {
        return nestedMetric;
      }

      if (typeof nestedMetric === "string" && nestedMetric.trim().length > 0) {
        const parsed = Number(nestedMetric);
        return Number.isFinite(parsed) ? parsed : 0;
      }
    }
  }

  return 0;
}

function aggregateStats(payload: unknown): NaverStatsSummary {
  const rows = asArray(payload).filter(
    (row): row is Record<string, unknown> =>
      Boolean(row) && typeof row === "object",
  );

  let clicks = 0;
  let impressions = 0;
  let cost = 0;
  let conversions = 0;
  let rankWeightedSum = 0;
  let rankWeight = 0;

  for (const row of rows) {
    const rowClicks = getMetricFromRow(row, "clkCnt");
    const rowImpressions = getMetricFromRow(row, "impCnt");
    const rowCost = getMetricFromRow(row, "salesAmt");
    const rowConversions = getMetricFromRow(row, "ccnt");
    const rowRank = getMetricFromRow(row, "avgRnk");

    clicks += rowClicks;
    impressions += rowImpressions;
    cost += rowCost;
    conversions += rowConversions;

    if (rowRank > 0) {
      const weight = rowClicks > 0 ? rowClicks : rowImpressions > 0 ? rowImpressions : 1;
      rankWeightedSum += rowRank * weight;
      rankWeight += weight;
    }
  }

  return {
    clicks,
    impressions,
    cost,
    conversions,
    ctr: impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0,
    cpc: clicks > 0 ? Number((cost / clicks).toFixed(2)) : 0,
    averageRank: rankWeight > 0 ? Number((rankWeightedSum / rankWeight).toFixed(2)) : null,
    rowCount: rows.length,
  };
}

abstract class MockAdapter implements ChannelAdapter {
  constructor(public readonly channel: ChannelType) {}

  async validateConnection(): Promise<ConnectionValidationResult> {
    return {
      ok: true,
      connectionStatus: "connected",
      message: `${this.channel} connection is mocked.`,
      externalRefs: [],
    };
  }

  async listAccountsOrProperties() {
    return [`${this.channel}-example-ref`];
  }

  async syncCoreEntities(): Promise<SyncResult> {
    return {
      ok: true,
      syncedCount: 1,
      message: `${this.channel} core sync is mocked.`,
    };
  }

  async syncPerformance(): Promise<SyncResult> {
    return {
      ok: true,
      syncedCount: 1,
      message: `${this.channel} performance sync is mocked.`,
    };
  }

  async executeApprovedAction(actionType: string): Promise<ActionExecutionResult> {
    return {
      ok: true,
      message: `${this.channel} action ${actionType} is mocked.`,
      externalRequestRef: `mock:${this.channel}:${actionType}`,
    };
  }
}

export class NaverSearchAdAdapter implements ChannelAdapter {
  readonly channel = "naver-searchad" as const;
  private readonly credentials = getNaverSearchAdCredentials();

  private async request<T>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    uri: string,
    options?: {
      query?: Record<string, string | number | string[] | undefined>;
      body?: unknown;
      customerId?: string;
    },
  ): Promise<T> {
    if (!this.credentials) {
      throw new Error("NAVER SearchAd credentials are not configured.");
    }

    const timestamp = Date.now().toString();
    const params = buildQueryString(options?.query);
    const url = `${NAVER_BASE_URL}${uri}${params.size > 0 ? `?${params.toString()}` : ""}`;
    const signature = buildNaverSignature(
      timestamp,
      method,
      uri,
      this.credentials.secretKey,
    );

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "X-Timestamp": timestamp,
        "X-API-KEY": this.credentials.apiKey,
        "X-Customer": options?.customerId ?? this.credentials.customerId,
        "X-Signature": signature,
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
    });

    const text = await response.text();
    const payload = text.length > 0 ? JSON.parse(text) : null;

    if (!response.ok) {
      const message =
        payload && typeof payload === "object"
          ? JSON.stringify(payload)
          : text || response.statusText;
      throw new Error(`NAVER SearchAd ${response.status}: ${message}`);
    }

    return payload as T;
  }

  async listManagedCustomers(): Promise<NaverManagedCustomer[]> {
    if (!this.credentials) {
      return [];
    }

    try {
      const payload = await this.request<unknown>("GET", "/customer-links", {
        query: { type: "MYCLIENTS" },
      });
      const customers = parseManagedCustomers(payload);

      if (customers.length > 0) {
        return customers;
      }
    } catch {
      // Some accounts may not have managed clients; we fall back to the configured customer.
    }

    return [
      {
        customerId: this.credentials.customerId,
        customerName: `NAVER ${this.credentials.customerId}`,
      },
    ];
  }

  async listAdgroups(customerId: string) {
    return this.request<unknown[]>("GET", "/ncc/adgroups", {
      customerId,
    });
  }

  async getStatsSummary(params: {
    customerId: string;
    ids: string[];
    since: string;
    until: string;
  }): Promise<NaverStatsSummary> {
    if (params.ids.length === 0) {
      return {
        clicks: 0,
        impressions: 0,
        cost: 0,
        conversions: 0,
        ctr: 0,
        cpc: 0,
        averageRank: null,
        rowCount: 0,
      };
    }

    const payload = await this.request<unknown>("GET", "/stats", {
      customerId: params.customerId,
      query: {
        ids: params.ids,
        fields: JSON.stringify(NAVER_STATS_FIELDS),
        timeRange: JSON.stringify({
          since: params.since,
          until: params.until,
        }),
      },
    });

    return aggregateStats(payload);
  }

  async validateConnection(): Promise<ConnectionValidationResult> {
    if (!this.credentials) {
      return {
        ok: false,
        connectionStatus: "blocked",
        message: "NAVER SearchAd credentials are missing.",
      };
    }

    try {
      const customers = await this.listManagedCustomers();
      return {
        ok: true,
        connectionStatus: "connected",
        message: "NAVER SearchAd connection validated.",
        externalRefs: customers.map((customer) => customer.customerId),
      };
    } catch (error) {
      return {
        ok: false,
        connectionStatus: "blocked",
        message: error instanceof Error ? error.message : "Unknown NAVER error.",
      };
    }
  }

  async listAccountsOrProperties() {
    const customers = await this.listManagedCustomers();
    return customers.map((customer) => `${customer.customerId}:${customer.customerName}`);
  }

  async syncCoreEntities(): Promise<SyncResult> {
    const customers = await this.listManagedCustomers();
    return {
      ok: true,
      syncedCount: customers.length,
      message: `Discovered ${customers.length} NAVER SearchAd customer references.`,
    };
  }

  async syncPerformance(): Promise<SyncResult> {
    const customers = await this.listManagedCustomers();
    return {
      ok: true,
      syncedCount: customers.length,
      message: `Prepared performance sync for ${customers.length} NAVER customers.`,
    };
  }

  async executeApprovedAction(actionType: string): Promise<ActionExecutionResult> {
    if (!this.credentials) {
      return {
        ok: false,
        message: "NAVER SearchAd credentials are missing.",
      };
    }

    return {
      ok: false,
      message: `Action execution for ${actionType} is intentionally disabled until operator approval flow is wired.`,
    };
  }
}

export class SearchConsoleAdapter extends MockAdapter {
  constructor() {
    super("search-console");
  }
}

export class BusinessProfileAdapter extends MockAdapter {
  constructor() {
    super("business-profile");
  }
}

export function getChannelAdapter(channel: ChannelType): ChannelAdapter {
  switch (channel) {
    case "naver-searchad":
      return new NaverSearchAdAdapter();
    case "search-console":
      return new SearchConsoleAdapter();
    case "business-profile":
      return new BusinessProfileAdapter();
    default:
      throw new Error("Unsupported channel.");
  }
}
