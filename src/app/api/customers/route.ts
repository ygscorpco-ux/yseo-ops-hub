import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDb } from "@/lib/db/client";
import {
  channelConnectionsTable,
  customersTable,
  taskExecutionsTable,
} from "@/lib/db/schema";
import type { ConnectionStatus } from "@/lib/yseo/types";

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
  naverCustomerId?: string;
  naverDisplayName?: string;
  naverConnectionStatus?: ConnectionStatus;
}

export async function POST(request: Request) {
  const payload = (await request.json()) as CreateCustomerPayload;
  const name = payload.name?.trim();
  const naverCustomerId = payload.naverCustomerId?.trim() ?? "";
  const naverDisplayName = payload.naverDisplayName?.trim() ?? "";
  const naverConnectionStatus = payload.naverConnectionStatus ?? "attention";

  if (!name) {
    return Response.json(
      { message: "상호는 비워둘 수 없습니다." },
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
    segment: "외부 고객 DB 사용",
    primaryManager: "미지정",
    statusTag: naverCustomerId ? "오늘 확인" : "관찰",
    onboardingStatus: naverCustomerId ? "setup" : "paused",
    reportingProfile: "월간",
    memoSummary: null,
    focus: "채널 상태 확인",
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
      syncHeadline: "고객 추가 단계에서 네이버 연결값을 저장했습니다.",
    });
  }

  await db.insert(taskExecutionsTable).values({
    id: makeId("task", customerId, "created", Date.now()),
    customerId,
    suggestionId: null,
    actionType: "customer-created",
    actorType: "operator",
    actorName: "YSEO",
    resultStatus: "done",
    externalRequestRef: naverCustomerId || null,
    beforeJson: null,
    afterJson: {
      naverCustomerId: naverCustomerId || null,
    },
    summary: naverCustomerId
      ? "고객 상태판에 상호와 네이버 연결값을 추가했습니다."
      : "고객 상태판에 상호를 추가했습니다.",
    executedAt: now,
  });

  revalidatePath("/");
  revalidatePath("/customers");

  return Response.json({
    status: "ok",
    message: "고객 상태판에 추가했습니다.",
    customerId,
  });
}
