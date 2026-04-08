import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDb } from "@/lib/db/client";
import { channelConnectionsTable, customersTable } from "@/lib/db/schema";

function makeId(...parts: Array<string | number>) {
  return parts
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

interface NaverConnectionPayload {
  externalAccountRef?: string;
  externalPropertyRef?: string;
  connectionStatus?: "connected" | "attention" | "blocked";
  syncHeadline?: string;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ customerId: string }> },
) {
  const { customerId } = await params;
  const payload = (await request.json()) as NaverConnectionPayload;
  const externalAccountRef = payload.externalAccountRef?.trim();
  const externalPropertyRef = payload.externalPropertyRef?.trim() ?? "";
  const syncHeadline = payload.syncHeadline?.trim() ?? "";
  const connectionStatus = payload.connectionStatus ?? "attention";

  if (!externalAccountRef) {
    return Response.json(
      { message: "네이버 고객 ID는 비워둘 수 없습니다." },
      { status: 400 },
    );
  }

  const db = getDb();

  const [customer] = await db
    .select({ id: customersTable.id })
    .from(customersTable)
    .where(eq(customersTable.id, customerId))
    .limit(1);

  if (!customer) {
    return Response.json({ message: "고객을 찾을 수 없습니다." }, { status: 404 });
  }

  const [existingConnection] = await db
    .select()
    .from(channelConnectionsTable)
    .where(
      and(
        eq(channelConnectionsTable.customerId, customerId),
        eq(channelConnectionsTable.channelType, "naver-searchad"),
      ),
    )
    .limit(1);

  const now = new Date();

  if (existingConnection) {
    await db
      .update(channelConnectionsTable)
      .set({
        connectionStatus,
        externalAccountRef,
        externalPropertyRef: externalPropertyRef || null,
        lastSyncAt: existingConnection.lastSyncAt ?? now,
        syncHeadline:
          syncHeadline || "운영자가 네이버 연결 기준을 직접 수정했습니다.",
      })
      .where(eq(channelConnectionsTable.id, existingConnection.id));
  } else {
    await db.insert(channelConnectionsTable).values({
      id: makeId("naver-connection", customerId),
      customerId,
      channelType: "naver-searchad",
      connectionStatus,
      authMethod: "api-key",
      externalAccountRef,
      externalPropertyRef: externalPropertyRef || null,
      tokenStatus: "not-applicable",
      lastSyncAt: now,
      lastErrorCode: null,
      syncStatus: "idle",
      syncHeadline:
        syncHeadline || "운영자가 네이버 연결 기준을 등록했습니다.",
    });
  }

  await db
    .update(customersTable)
    .set({
      lastActionAt: now,
      updatedAt: now,
    })
    .where(eq(customersTable.id, customerId));

  revalidatePath("/");
  revalidatePath("/customers");
  revalidatePath("/issues");
  revalidatePath(`/customers/${customerId}`);

  return Response.json({
    status: "ok",
    message: "네이버 연결 정보를 저장했습니다.",
  });
}
