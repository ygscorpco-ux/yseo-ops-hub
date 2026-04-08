import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDb } from "@/lib/db/client";
import {
  channelConnectionsTable,
  customersTable,
  internalMemosTable,
  taskExecutionsTable,
} from "@/lib/db/schema";
import type { ConnectionStatus, CustomerStatusTag } from "@/lib/yseo/types";

function makeId(...parts: Array<string | number>) {
  return parts
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

interface CreateCustomerPayload {
  name?: string;
  primaryManager?: string;
  segment?: string;
  focus?: string;
  reportingProfile?: "주간" | "격주" | "월간";
  statusTag?: CustomerStatusTag;
  memoSummary?: string;
  naverCustomerId?: string;
  naverDisplayName?: string;
  naverConnectionStatus?: ConnectionStatus;
}

export async function POST(request: Request) {
  const payload = (await request.json()) as CreateCustomerPayload;
  const name = payload.name?.trim();
  const primaryManager = payload.primaryManager?.trim();
  const segment = payload.segment?.trim() || "신규 고객";
  const focus =
    payload.focus?.trim() || "첫 연결과 기준 KPI를 확인하고 운영 기준선을 설정합니다.";
  const reportingProfile = payload.reportingProfile ?? "주간";
  const statusTag = payload.statusTag ?? "오늘 확인";
  const memoSummary = payload.memoSummary?.trim() ?? "";
  const naverCustomerId = payload.naverCustomerId?.trim() ?? "";
  const naverDisplayName = payload.naverDisplayName?.trim() ?? "";
  const naverConnectionStatus =
    payload.naverConnectionStatus ?? "attention";

  if (!name) {
    return Response.json(
      { message: "고객명은 비워둘 수 없습니다." },
      { status: 400 },
    );
  }

  if (!primaryManager) {
    return Response.json(
      { message: "담당자는 비워둘 수 없습니다." },
      { status: 400 },
    );
  }

  const db = getDb();
  const now = new Date();
  const existingCustomers = await db
    .select({ id: customersTable.id, name: customersTable.name })
    .from(customersTable)
    .where(eq(customersTable.name, name));

  if (existingCustomers.length > 0) {
    return Response.json(
      { message: "같은 이름의 고객이 이미 있습니다." },
      { status: 409 },
    );
  }

  const orderedCustomers = await db
    .select({ priorityRank: customersTable.priorityRank })
    .from(customersTable)
    .orderBy(asc(customersTable.priorityRank));

  const nextPriority =
    (orderedCustomers[orderedCustomers.length - 1]?.priorityRank ?? 0) + 1;

  const customerId = makeId("cust", Date.now());

  await db.insert(customersTable).values({
    id: customerId,
    name,
    segment,
    primaryManager,
    statusTag,
    onboardingStatus: naverCustomerId ? "setup" : "paused",
    reportingProfile,
    memoSummary: memoSummary || null,
    focus,
    priorityRank: nextPriority,
    nextReviewAt: now,
    lastActionAt: now,
    createdAt: now,
    updatedAt: now,
  });

  if (naverCustomerId) {
    await db.insert(channelConnectionsTable).values({
      id: makeId("naver-connection", customerId),
      customerId,
      channelType: "naver-searchad",
      connectionStatus: naverConnectionStatus,
      authMethod: "api-key",
      externalAccountRef: naverCustomerId,
      externalPropertyRef: naverDisplayName || null,
      tokenStatus: "not-applicable",
      lastSyncAt: now,
      lastErrorCode: null,
      syncStatus: "idle",
      syncHeadline: "신규 고객 등록 단계에서 네이버 연결 기준을 저장했습니다.",
    });
  }

  if (memoSummary) {
    await db.insert(internalMemosTable).values({
      id: makeId("memo", customerId, Date.now()),
      customerId,
      body: memoSummary,
      memoType: "context",
      createdBy: primaryManager,
      createdAt: now,
    });
  }

  await db.insert(taskExecutionsTable).values({
    id: makeId("task", customerId, "created", Date.now()),
    customerId,
    suggestionId: null,
    actionType: "customer-created",
    actorType: "operator",
    actorName: primaryManager,
    resultStatus: "done",
    externalRequestRef: naverCustomerId || null,
    beforeJson: null,
    afterJson: {
      statusTag,
      reportingProfile,
      naverCustomerId: naverCustomerId || null,
    },
    summary: naverCustomerId
      ? "신규 고객 등록과 네이버 연결 기준 저장을 완료했습니다."
      : "신규 고객 등록을 완료했습니다.",
    executedAt: now,
  });

  revalidatePath("/");
  revalidatePath("/customers");
  revalidatePath("/issues");

  return Response.json({
    status: "ok",
    message: "신규 고객을 등록했습니다.",
    customerId,
  });
}
