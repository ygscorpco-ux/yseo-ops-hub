import type { ChannelType, Issue } from "@/lib/yseo/types";

export interface OperatorPlaybook {
  title: string;
  summary: string;
  primarySurface: "yseo" | "naver-ads" | "google";
  canResolveInsideYseo: boolean;
  firstChecks: string[];
  consoleChecks: string[];
  yseoFollowUps: string[];
  escalationRule: string;
}

function makePlaybook(input: OperatorPlaybook) {
  return input;
}

function getNaverPlaybook(issueType: string, issue: Issue): OperatorPlaybook {
  switch (issueType) {
    case "sync-blocked":
      return makePlaybook({
        title: "연결 복구 체크리스트",
        summary:
          "연결 실패는 데이터가 멈췄다는 뜻이라 성과 판단보다 먼저 복구해야 합니다.",
        primarySurface: "yseo",
        canResolveInsideYseo: false,
        firstChecks: [
          "해당 고객의 마지막 sync 시각과 마지막 성공 시각을 확인합니다.",
          "같은 시각에 여러 고객이 함께 실패했는지 먼저 봅니다.",
          "오류 코드가 키 재발급, 권한 변경, 호출 제한 중 어디에 가까운지 분류합니다.",
        ],
        consoleChecks: [
          "네이버 광고센터에서 API 키와 Customer ID가 그대로 유효한지 확인합니다.",
          "관리 계정 아래 실제 광고계정 연결이 유지되는지 확인합니다.",
          "광고주 또는 내부 담당자가 권한을 바꾸지 않았는지 확인합니다.",
        ],
        yseoFollowUps: [
          "원인과 조치 예정 시각을 내부 메모에 남깁니다.",
          "복구 전까지 이 고객을 '긴급 조치' 또는 '오늘 확인' 상태로 올립니다.",
          "복구 후 수동 sync를 다시 실행해 데이터가 들어오는지 확인합니다.",
        ],
        escalationRule:
          "같은 오류가 여러 고객에서 동시에 보이면 개별 고객 문제가 아니라 공통 인증 또는 한도 문제로 보고 바로 묶어서 처리합니다.",
      });
    case "conversion-drop":
      return makePlaybook({
        title: "전환 급락 점검표",
        summary:
          "전환 급락은 입찰보다 추적, 예산, 중단 상태를 먼저 확인해야 합니다.",
        primarySurface: "naver-ads",
        canResolveInsideYseo: false,
        firstChecks: [
          "최근 7일 대비 직전 7일 전환 차이를 확인합니다.",
          "클릭도 같이 줄었는지, 클릭은 유지되는데 전환만 떨어졌는지 먼저 나눕니다.",
          "같은 고객의 다른 채널도 함께 꺾였는지 확인합니다.",
        ],
        consoleChecks: [
          "네이버 광고센터에서 캠페인/광고그룹 중단 여부와 예산 제한 여부를 봅니다.",
          "전환 추적 관리에서 전환 수집 이상이나 태그 누락이 없는지 봅니다.",
          "랜딩 페이지 변경, 폼 오류, 콜 추적 이상 같은 외부 원인이 있는지 확인합니다.",
        ],
        yseoFollowUps: [
          "원인을 '트래킹', '운영', '랜딩', '미확정' 중 하나로 태그합니다.",
          "보류하지 말고 다음 확인 시각과 담당 메모를 남깁니다.",
          "월말 리포트 초안에 전환 급락 원인 후보와 조치 내역을 자동 포함합니다.",
        ],
        escalationRule:
          "클릭은 유지되는데 전환만 급락하면 입찰보다 전환 추적이나 랜딩 이슈를 먼저 의심합니다.",
      });
    case "click-drop":
      return makePlaybook({
        title: "클릭 급락 점검표",
        summary:
          "클릭 급락은 노출 하락인지, 클릭률 하락인지 먼저 갈라야 조치가 빨라집니다.",
        primarySurface: "naver-ads",
        canResolveInsideYseo: false,
        firstChecks: [
          "노출도 같이 줄었는지 먼저 확인합니다.",
          "전환은 유지되는지 확인해 과민 반응을 줄입니다.",
          "급락 시점이 특정 날짜인지 최근 2~3일 누적 추세인지 구분합니다.",
        ],
        consoleChecks: [
          "네이버 광고센터에서 예산 소진, 캠페인 일시중단, 심사 상태를 확인합니다.",
          "키워드 입찰가와 평균 노출 위치 변동을 확인합니다.",
          "소재 교체 직후라면 CTR 하락이 있었는지 확인합니다.",
        ],
        yseoFollowUps: [
          "노출 감소형인지 CTR 감소형인지 이슈 메모에 남깁니다.",
          "즉시 조정이 필요하면 제안 승인 전에 고객 우선순위를 올립니다.",
          "같은 업종 고객과 비교해 계정 특이점인지 공통 현상인지 구분합니다.",
        ],
        escalationRule:
          "노출과 클릭이 함께 줄면 예산/입찰/중단을 먼저, 노출은 유지되고 클릭만 줄면 소재와 CTR을 먼저 봅니다.",
      });
    case "no-conversion":
      return makePlaybook({
        title: "무전환 비용 점검표",
        summary:
          "비용은 쓰이는데 전환이 없으면 즉시 중단보다 무전환 구간을 분리해서 보는 게 안전합니다.",
        primarySurface: "naver-ads",
        canResolveInsideYseo: false,
        firstChecks: [
          "최근 7일 비용과 클릭 규모가 충분히 의미 있는지 확인합니다.",
          "새 캠페인 학습 구간인지 아닌지 먼저 구분합니다.",
          "전환 목표와 실제 유입 의도가 맞는지 점검합니다.",
        ],
        consoleChecks: [
          "무전환 키워드 또는 광고그룹이 특정 구간에 몰려 있는지 확인합니다.",
          "랜딩과 전환 액션이 실제 고객 목표와 맞는지 다시 봅니다.",
          "검색어/키워드 정합성이 떨어지는지 확인합니다.",
        ],
        yseoFollowUps: [
          "즉시 중단 대신 보류 후보 목록을 만들고 내부 승인 대기로 둡니다.",
          "고객 메모에 '무전환 검토 중' 상태를 남깁니다.",
          "월말 리포트에는 '비용 대비 무전환 구간 정리' 액션으로 묶어 넣습니다.",
        ],
        escalationRule:
          "비용 규모가 아직 작으면 성급히 끄지 말고, 비용이 누적됐는데 전환이 0이면 보류 후보를 먼저 만들고 검토합니다.",
      });
    default:
      return makePlaybook({
        title: issue.title,
        summary: issue.summary,
        primarySurface: "yseo",
        canResolveInsideYseo: false,
        firstChecks: [
          "이슈의 발생 시각과 함께 발생한 다른 이슈가 있는지 확인합니다.",
          "같은 고객의 최근 메모와 마지막 작업 이력을 먼저 확인합니다.",
        ],
        consoleChecks: [
          "채널 원본 화면에서 실제 설정과 상태를 다시 확인합니다.",
        ],
        yseoFollowUps: [
          "원인과 다음 확인 시각을 내부 메모에 남깁니다.",
          "보류 사유 또는 조치 예정 항목을 리포트 초안에 반영합니다.",
        ],
        escalationRule:
          "원인이 즉시 보이지 않으면 상태만 닫지 말고 다음 확인 시각을 남긴 뒤 재확인합니다.",
      });
  }
}

function getSearchConsolePlaybook(): OperatorPlaybook {
  return makePlaybook({
    title: "Search Console 점검표",
    summary:
      "Search Console 이슈는 수정이 아니라 원인 확인과 우선순위 정리가 핵심입니다.",
    primarySurface: "google",
    canResolveInsideYseo: false,
    firstChecks: [
      "클릭 감소가 특정 페이지인지, 전체 사이트인지 구분합니다.",
      "최근 데이터가 incomplete 구간인지 먼저 봅니다.",
    ],
    consoleChecks: [
      "Search Console에서 페이지/쿼리별 변동을 확인합니다.",
      "URL Inspection에서 색인 상태와 마지막 크롤링 상태를 확인합니다.",
    ],
    yseoFollowUps: [
      "개발 수정이 필요한지, 콘텐츠 수정이 필요한지 태그합니다.",
      "월말 리포트 초안에 검색 노출 변화와 원인 후보를 남깁니다.",
    ],
    escalationRule:
      "Search Console 이슈는 바로 수정되는 항목이 적으므로, 우선순위와 담당자 전달이 더 중요합니다.",
  });
}

function getBusinessProfilePlaybook(): OperatorPlaybook {
  return makePlaybook({
    title: "Business Profile 점검표",
    summary:
      "로컬 리뷰와 프로필 이슈는 승인과 응답 톤이 중요해 반자동 검토 흐름이 필요합니다.",
    primarySurface: "google",
    canResolveInsideYseo: false,
    firstChecks: [
      "리뷰인지, 위치 정보 변경인지, 성과 이슈인지 먼저 나눕니다.",
      "승인된 위치와 권한 상태가 정상인지 확인합니다.",
    ],
    consoleChecks: [
      "Google Business Profile에서 리뷰/위치 정보 원본을 확인합니다.",
      "답글 또는 위치 정보 수정이 실제 반영 가능한 상태인지 확인합니다.",
    ],
    yseoFollowUps: [
      "답글 초안 또는 변경 후보를 남기고 승인 대기로 둡니다.",
      "고객 전달용 메모에 브랜드 톤/주의 문구를 남깁니다.",
    ],
    escalationRule:
      "로컬 채널은 공개 노출이 직접 걸려 있으므로 자동 발행보다 승인 흐름을 유지합니다.",
  });
}

export function getOperatorPlaybook(issue: Issue): OperatorPlaybook {
  if (issue.channelType === "naver-searchad") {
    return getNaverPlaybook(issue.issueType, issue);
  }

  if (issue.channelType === "search-console") {
    return getSearchConsolePlaybook();
  }

  return getBusinessProfilePlaybook();
}

export function getPrimarySurfaceLabel(
  surface: OperatorPlaybook["primarySurface"],
  channelType: ChannelType,
) {
  if (surface === "yseo") {
    return "YSEO에서 먼저 확인";
  }

  if (surface === "naver-ads") {
    return channelType === "naver-searchad"
      ? "네이버 광고센터에서 원인 확인"
      : "원본 채널 화면에서 확인";
  }

  return "Google 원본 화면에서 확인";
}
