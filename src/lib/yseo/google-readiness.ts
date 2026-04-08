import "server-only";

import type { ConnectionStatus } from "@/lib/yseo/types";
import {
  BusinessProfileAdapter,
  getBusinessProfileCredentials,
  getSearchConsoleCredentials,
  SearchConsoleAdapter,
} from "@/lib/yseo/adapters";

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
    ? "Google OAuth 앱은 준비됐습니다. 이제 채널별 연결만 마치면 됩니다."
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
  const searchConsoleAdapter = new SearchConsoleAdapter();
  const businessProfileAdapter = new BusinessProfileAdapter();
  const searchConsoleCredentials = getSearchConsoleCredentials();
  const businessProfileCredentials = getBusinessProfileCredentials();
  const [searchConsoleValidation, businessProfileValidation] =
    await Promise.all([
      searchConsoleAdapter.validateConnection(),
      businessProfileAdapter.validateConnection(),
    ]);

  const oauthAppConfigured = Boolean(
    searchConsoleCredentials.clientId &&
      searchConsoleCredentials.clientSecret &&
      searchConsoleCredentials.redirectUri,
  );

  return {
    oauthAppConfigured,
    oauthSummary: getOAuthSummary(oauthAppConfigured),
    searchConsole: {
      channel: "search-console",
      label: "Google Search Console",
      roadmapStage: "2단계 결합",
      currentStatus: searchConsoleValidation.connectionStatus,
      currentLabel: getStatusLabel(searchConsoleValidation.connectionStatus, {
        blocked: "OAuth 앱 필요",
        attention: "연결 대기",
        connected: "실연동 준비 완료",
      }),
      summary: searchConsoleValidation.message,
      nextStep: !oauthAppConfigured
        ? "Google Cloud에서 OAuth 웹 앱을 만들고 redirect URI를 등록합니다."
        : !searchConsoleCredentials.refreshToken
          ? "운영자 Google 계정으로 OAuth 동의를 완료하고 refresh token을 저장합니다."
          : !searchConsoleCredentials.siteUrl
            ? "대표 property를 선택해 site URL을 저장합니다."
            : "다음 구현에서 Search Analytics와 URL Inspection 수집을 활성화합니다."
        ,
      readyForLiveSync: Boolean(
        oauthAppConfigured &&
          searchConsoleCredentials.refreshToken &&
          searchConsoleCredentials.siteUrl,
      ),
      implementedNow:
        "이번 배포에서는 OAuth 준비 상태와 property 선택 필요 여부까지 점검합니다.",
      selectedRef: searchConsoleCredentials.siteUrl,
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
        connected: "실연동 준비 완료",
      }),
      summary: businessProfileValidation.message,
      nextStep: !oauthAppConfigured
        ? "Google OAuth 앱부터 준비합니다."
        : !businessProfileCredentials.approved
          ? "Google Business Profile API 프로젝트 승인을 먼저 받아야 합니다."
          : !businessProfileCredentials.refreshToken
            ? "운영자 Google 계정으로 OAuth 동의를 완료합니다."
            : !businessProfileCredentials.accountId ||
                !businessProfileCredentials.locationId
              ? "사용할 account/location을 선택해 저장합니다."
              : "3단계 구현에서 리뷰와 성과 수집을 활성화합니다."
        ,
      readyForLiveSync: Boolean(
        oauthAppConfigured &&
          businessProfileCredentials.approved &&
          businessProfileCredentials.refreshToken &&
          businessProfileCredentials.accountId &&
          businessProfileCredentials.locationId,
      ),
      implementedNow:
        "이번 배포에서는 승인 필요 여부와 계정 연결 준비 상태를 점검합니다.",
      selectedRef:
        businessProfileCredentials.accountId &&
        businessProfileCredentials.locationId
          ? `${businessProfileCredentials.accountId} / ${businessProfileCredentials.locationId}`
          : undefined,
      docsUrl:
        "https://developers.google.com/my-business/reference/performance/rest",
    },
  };
}
