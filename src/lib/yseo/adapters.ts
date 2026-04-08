import type { ChannelType, ConnectionStatus } from "@/lib/yseo/types";

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

abstract class MockAdapter implements ChannelAdapter {
  constructor(public readonly channel: ChannelType) {}

  async validateConnection(): Promise<ConnectionValidationResult> {
    return {
      ok: true,
      connectionStatus: "connected",
      message: `${this.channel} 연결 상태를 점검했습니다.`,
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
      message: `${this.channel} 핵심 엔티티 동기화 시뮬레이션`,
    };
  }

  async syncPerformance(): Promise<SyncResult> {
    return {
      ok: true,
      syncedCount: 1,
      message: `${this.channel} 성과 스냅샷 동기화 시뮬레이션`,
    };
  }

  async executeApprovedAction(actionType: string): Promise<ActionExecutionResult> {
    return {
      ok: true,
      message: `${this.channel}에서 ${actionType} 실행을 시뮬레이션했습니다.`,
      externalRequestRef: `mock:${this.channel}:${actionType}`,
    };
  }
}

export class NaverSearchAdAdapter extends MockAdapter {
  constructor() {
    super("naver-searchad");
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
      throw new Error("지원하지 않는 채널입니다.");
  }
}
