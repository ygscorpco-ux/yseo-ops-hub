import "server-only";

import { and, eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import {
  executionRequestsTable,
  suggestionsTable,
  taskExecutionsTable,
} from "@/lib/db/schema";
import { makeStableId } from "@/lib/yseo/core";
import { runNaverSearchAdSync } from "@/lib/yseo/naver-sync";
import { runSearchConsoleAutoSync } from "@/lib/yseo/search-console-sync";

export async function approveSuggestion(suggestionId: string, approvedBy: string) {
  const db = getDb();
  const now = new Date();
  const [suggestion] = await db
    .select()
    .from(suggestionsTable)
    .where(eq(suggestionsTable.id, suggestionId))
    .limit(1);

  if (!suggestion) {
    throw new Error("Suggestion not found.");
  }

  await db
    .update(suggestionsTable)
    .set({
      approvalStatus: "approved",
      approvedBy,
    })
    .where(eq(suggestionsTable.id, suggestionId));

  await db
    .update(executionRequestsTable)
    .set({
      approvalStatus: "approved",
      approvedBy,
      updatedAt: now,
    })
    .where(eq(executionRequestsTable.suggestionId, suggestionId));

  await db.insert(taskExecutionsTable).values({
    id: makeStableId("suggestion-approve", suggestion.customerId, suggestionId, now.getTime()),
    customerId: suggestion.customerId,
    suggestionId,
    actionType: "suggestion-approve",
    actorType: "operator",
    actorName: approvedBy,
    resultStatus: "done",
    externalRequestRef: suggestion.suggestionType,
    beforeJson: { approvalStatus: suggestion.approvalStatus },
    afterJson: { approvalStatus: "approved" },
    summary: `Suggestion ${suggestion.title} approved.`,
    executedAt: now,
  });

  return {
    ok: true,
    suggestionId,
  };
}

export async function runExecutionRequest(input: { executionRequestId: string; actorName: string }) {
  const db = getDb();
  const now = new Date();
  const [request] = await db
    .select()
    .from(executionRequestsTable)
    .where(eq(executionRequestsTable.id, input.executionRequestId))
    .limit(1);

  if (!request) {
    throw new Error("Execution request not found.");
  }

  if (request.approvalStatus !== "approved" && request.approvalStatus !== "pending") {
    throw new Error("Execution request is not ready to run.");
  }

  let result:
    | { ok: boolean; externalRequestRef?: string | null; message: string }
    | null = null;

  if (request.actionType === "naver-rerun-sync") {
    const syncResult = await runNaverSearchAdSync();
    result = {
      ok: syncResult.ok,
      externalRequestRef: request.customerId,
      message: syncResult.message,
    };
  } else if (request.actionType === "search-console-rerun-sync") {
    const syncResult = await runSearchConsoleAutoSync({ customerId: request.customerId });
    result = {
      ok: syncResult.ok,
      externalRequestRef: request.customerId,
      message: syncResult.message,
    };
  } else {
    result = {
      ok: false,
      message: `Action ${request.actionType} is not in the current execution allowlist.`,
    };
  }

  await db
    .update(executionRequestsTable)
    .set({
      approvalStatus: result.ok ? "executed" : "failed",
      approvedBy: request.approvedBy ?? input.actorName,
      executedAt: now,
      failureReason: result.ok ? null : result.message,
      externalRequestRef: result.externalRequestRef ?? null,
      updatedAt: now,
    })
    .where(eq(executionRequestsTable.id, request.id));

  if (request.suggestionId) {
    await db
      .update(suggestionsTable)
      .set({
        approvalStatus: result.ok ? "executed" : "paused",
        executedAt: result.ok ? now : null,
      })
      .where(eq(suggestionsTable.id, request.suggestionId));
  }

  await db.insert(taskExecutionsTable).values({
    id: makeStableId("execution-run", request.customerId, request.id, now.getTime()),
    customerId: request.customerId,
    suggestionId: request.suggestionId ?? null,
    actionType: request.actionType,
    actorType: "operator",
    actorName: input.actorName,
    resultStatus: result.ok ? "done" : "failed",
    externalRequestRef: result.externalRequestRef ?? null,
    beforeJson: request.payloadJson,
    afterJson: {
      approvalStatus: result.ok ? "executed" : "failed",
      message: result.message,
    },
    summary: result.message,
    executedAt: now,
  });

  return {
    ok: result.ok,
    message: result.message,
    executionRequestId: request.id,
  };
}

export async function getPendingExecutionRequests(customerId: string) {
  const db = getDb();
  return db
    .select()
    .from(executionRequestsTable)
    .where(
      and(
        eq(executionRequestsTable.customerId, customerId),
        eq(executionRequestsTable.approvalStatus, "pending"),
      ),
    );
}
