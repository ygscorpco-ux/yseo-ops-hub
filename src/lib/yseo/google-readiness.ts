import "server-only";

import type { ConnectionStatus } from "@/lib/yseo/types";
import { BusinessProfileAdapter, getBusinessProfileCredentials } from "@/lib/yseo/adapters";
import {
  getSearchConsoleConnectionSummary,
  isGoogleOAuthConfigured,
} from "@/lib/yseo/google-search-console";

export interface GoogleChannelReadiness {
  channel: "search-console" | "business-profile";
  label: string;
  roadmapStage: string;
  currentStatus: ConnectionStatus;
  currentLabel: string;
  summary: string;
  nextStep: string;
  readyForLiveSync: boolean;
  implementedNow: string;
  selectedRef?: string;
  docsUrl: string;
}

export interface GoogleIntegrationReadiness {
  oauthAppConfigured: boolean;
  oauthSummary: string;
  searchConsole: GoogleChannelReadiness;
  businessProfile: GoogleChannelReadiness;
}

function getOAuthSummary(oauthAppConfigured: boolean) {
  return oauthAppConfigured
    ? "Google OAuth 앱이 준비됐습니다. 이제 고객별 Search Console 연결을 시작할 수 있습니다."
    : "Google OAuth 앱이 아직 설정되지 않았습니다. Search Console과 Business Profile 모두 여기서 시작합니다.";
}

function getStatusLabel(
  status: ConnectionStatus,
  options?: {
    blocked?: string;
    attention?: string;
    connected?: string;
  },
) {
  if (status === "blocked") {
    return options?.blocked ?? "설정 필요";
  }

  if (status === "attention") {
    return options?.attention ?? "다음 단계 필요";
  }

  return options?.connected ?? "준비 완료";
}

export async function getGoogleIntegrationReadiness(): Promise<GoogleIntegrationReadiness> {
  const businessProfileAdapter = new BusinessProfileAdapter();
  const businessProfileCredentials = getBusinessProfileCredentials();
  const [searchConsoleSummary, businessProfileValidation] = await Promise.all([
    getSearchConsoleConnectionSummary(),
    businessProfileAdapter.validateConnection(),
  ]);

  const oauthAppConfigured = isGoogleOAuthConfigured();
  const searchConsoleStatus: ConnectionStatus = !oauthAppConfigured
    ? "blocked"
    : searchConsoleSummary.connectedCustomers > 0
      ? "connected"
      : "attention";

  return {
    oauthAppConfigured,
    oauthSummary: getOAuthSummary(oauthAppConfigured),
    searchConsole: {
      channel: "search-console",
      label: "Google Search Console",
      roadmapStage: "2단계 결합",
      currentStatus: searchConsoleStatus,
      currentLabel: getStatusLabel(searchConsoleStatus, {
        blocked: "OAuth 앱 필요",
        attention: "고객 연결 대기",
        connected: "고객 연결됨",
      }),
      summary: !oauthAppConfigured
        ? "Google OAuth 앱이 아직 설정되지 않았습니다."
        : searchConsoleSummary.connectedCustomers > 0
          ? `Search Console에 ${searchConsoleSummary.connectedCustomers}개 고객이 연결되어 있습니다.`
          : "OAuth 앱은 준비됐지만 아직 연결된 Search Console property가 없습니다.",
      nextStep: !oauthAppConfigured
        ? "Google Cloud에서 OAuth 앱을 만들고 redirect URI를 등록합니다."
        : searchConsoleSummary.connectedCustomers === 0
          ? "고객 상세에서 Search Console 연결을 시작하고 property를 선택합니다."
          : "다음 단계에서 Search Analytics 정기 수집과 URL Inspection을 붙입니다.",
      readyForLiveSync:
        oauthAppConfigured && searchConsoleSummary.connectedCustomers > 0,
      implementedNow:
        "고객별 OAuth 로그인, property 선택, 7일 Search Analytics 검증 수집까지 가능합니다.",
      selectedRef: searchConsoleSummary.latestProperty,
      docsUrl: "https://developers.google.com/webmaster-tools/v1/searchanalytics/query",
    },
    businessProfile: {
      channel: "business-profile",
      label: "Google Business Profile",
      roadmapStage: "3단계 결합",
      currentStatus: businessProfileValidation.connectionStatus,
      currentLabel: getStatusLabel(businessProfileValidation.connectionStatus, {
        blocked: businessProfileCredentials.approved ? "OAuth 설정 필요" : "승인 필요",
        attention: "계정 연결 대기",
        connected: "연결 준비 완료",
      }),
      summary: businessProfileValidation.message,
      nextStep: !oauthAppConfigured
        ? "Google OAuth 앱을 먼저 준비합니다."
        : !businessProfileCredentials.approved
          ? "Google Business Profile API 프로젝트 승인을 먼저 받아야 합니다."
          : !businessProfileCredentials.refreshToken
            ? "운영용 Google 계정으로 OAuth 동의를 완료합니다."
            : !businessProfileCredentials.accountId || !businessProfileCredentials.locationId
              ? "사용할 account/location을 선택하고 저장합니다."
              : "3단계 구현에서 리뷰와 성과 수집을 붙입니다."
      ,
      readyForLiveSync: Boolean(
        oauthAppConfigured &&
          businessProfileCredentials.approved &&
          businessProfileCredentials.refreshToken &&
          businessProfileCredentials.accountId &&
          businessProfileCredentials.locationId,
      ),
      implementedNow:
        "승인 필요 여부와 Google 계정/위치 연결 준비 상태까지 확인할 수 있습니다.",
      selectedRef:
        businessProfileCredentials.accountId && businessProfileCredentials.locationId
          ? `${businessProfileCredentials.accountId} / ${businessProfileCredentials.locationId}`
          : undefined,
      docsUrl: "https://developers.google.com/my-business/reference/performance/rest",
    },
  };
}
