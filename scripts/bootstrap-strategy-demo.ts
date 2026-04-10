import { evaluateAlertRules } from "../src/lib/yseo/alerts";
import {
  evaluateRecommendationPerformance,
  generateRecommendations,
} from "../src/lib/yseo/recommendations";
import { bootstrapStrategyPack } from "../src/lib/yseo/strategy";
import { getDb } from "../src/lib/db/client";
import { customersTable } from "../src/lib/db/schema";

type DemoSeed = {
  customerId: string;
  masterCustomerId: string;
  goalProfile: {
    conversionGoal: string;
    monthlyBudget: number;
    weeklyPrimaryKpi: string;
    targetCpa?: number;
    targetCpc?: number;
    targetCtr?: number;
  };
  strategyProfile: {
    industry: string;
    region: string;
    primaryService: string;
    competitors: string[];
    landingUrl?: string;
    brandTone?: string;
  };
  researchSummary: {
    businessSummary: string;
    keywordClusters: string[];
    negativeKeywords: string[];
    copyAngles: string[];
    landingRisks: string[];
    searchConsoleWatchpoints: string[];
    alertRules: Array<{
      severity: "critical" | "warning" | "watch";
      condition: string;
      recommendedAction: string;
    }>;
    twoWeekPlan: string[];
    fourWeekPlan: string[];
    rawNotes?: string;
  };
};

const demoSeeds: DemoSeed[] = [
  {
    customerId: "owol-ent",
    masterCustomerId: "hub-owol-ent",
    goalProfile: {
      conversionGoal: "전화 및 예약 문의",
      monthlyBudget: 1800000,
      weeklyPrimaryKpi: "전환수",
      targetCpa: 32000,
      targetCpc: 1350,
      targetCtr: 4.8,
    },
    strategyProfile: {
      industry: "이비인후과",
      region: "성남/분당",
      primaryService: "비염·감기·수면코골이 진료",
      competitors: ["분당 이비인후과", "판교 이비인후과", "야탑 비염 치료"],
      landingUrl: "https://owolent.co.kr",
      brandTone: "가까운 동네 병원, 증상 중심의 명확한 안내",
    },
    researchSummary: {
      businessSummary:
        "브랜디드 검색보다 증상형 검색에서 유입이 크므로, 비염·감기·코막힘 같은 문제 해결형 키워드를 분리 운영해야 합니다.",
      keywordClusters: ["비염 치료", "감기/코막힘", "수면코골이", "주말 진료"],
      negativeKeywords: ["무료", "후기 모음", "학회", "의학 논문"],
      copyAngles: [
        "주말 진료 가능 여부를 전면에 배치",
        "증상별 빠른 진료 안내",
        "초진 예약 장벽을 낮추는 문안",
      ],
      landingRisks: ["진료과목 대비 CTA 노출 약함", "모바일 첫 화면에서 예약 버튼이 늦게 노출될 수 있음"],
      searchConsoleWatchpoints: ["비브랜디드 증상 쿼리 클릭 하락", "진료 페이지 CTR 하락"],
      alertRules: [
        {
          severity: "critical",
          condition: "최근 7일 광고비 30,000원 이상 / 전환 0건",
          recommendedAction: "키워드 의도와 랜딩 CTA를 동시에 점검",
        },
      ],
      twoWeekPlan: ["증상형 키워드 세분화", "브랜디드/비브랜디드 문안 분리", "예약 CTA 강조 테스트"],
      fourWeekPlan: ["효율 키워드군 예산 재배분", "랜딩 상단 CTA 개선", "전환 추적 누락 여부 점검"],
      rawNotes: "GPT Pro 딥리서치 기반 전략팩 초안",
    },
  },
  {
    customerId: "damyeon-clinic",
    masterCustomerId: "hub-damyeon-clinic",
    goalProfile: {
      conversionGoal: "상담 문의",
      monthlyBudget: 1400000,
      weeklyPrimaryKpi: "CPA",
      targetCpa: 42000,
      targetCpc: 1600,
      targetCtr: 4.2,
    },
    strategyProfile: {
      industry: "한의원",
      region: "수원",
      primaryService: "교통사고 후유증·통증 치료",
      competitors: ["수원 교통사고 한의원", "영통 통증 한의원"],
      landingUrl: "https://damyeonclinic.kr",
      brandTone: "증상 회복 과정과 예약 편의성을 함께 강조",
    },
    researchSummary: {
      businessSummary:
        "경쟁이 높은 교통사고/통증 키워드는 의도 강도가 높아 CPA 방어가 중요하고, 브랜디드와 지역 조합 키워드 분리가 필요합니다.",
      keywordClusters: ["교통사고 한의원", "허리/목 통증", "야간 진료", "지역명 조합"],
      negativeKeywords: ["자격증", "채용", "무료 강의", "보험 약관"],
      copyAngles: ["빠른 상담 연결", "야간/주말 대응", "교통사고 후유증 특화 강조"],
      landingRisks: ["증상군별 섹션이 길어 모바일 이탈 가능", "상담 버튼 대비 신뢰 요소 상단 밀도 낮음"],
      searchConsoleWatchpoints: ["브랜드 쿼리 CTR 하락", "교통사고 페이지 노출 감소"],
      alertRules: [],
      twoWeekPlan: ["지역 키워드와 증상 키워드 분리", "보험/후유증 문안 A/B 테스트"],
      fourWeekPlan: ["전환 높은 조합 예산 확대", "콘텐츠성 키워드 제외 강화"],
    },
  },
  {
    customerId: "lindoor-studio",
    masterCustomerId: "hub-lindoor-studio",
    goalProfile: {
      conversionGoal: "상담 신청",
      monthlyBudget: 900000,
      weeklyPrimaryKpi: "CTR",
      targetCpa: 55000,
      targetCpc: 1200,
      targetCtr: 3.8,
    },
    strategyProfile: {
      industry: "스튜디오",
      region: "서울",
      primaryService: "브랜드 촬영·공간 대여",
      competitors: ["서울 촬영 스튜디오", "브랜드 룩북 스튜디오"],
      landingUrl: "https://lindoor.kr",
      brandTone: "프리미엄 이미지와 예약 편의성 균형",
    },
    researchSummary: {
      businessSummary:
        "상업 촬영과 공간 대여 검색 의도가 섞이므로, 촬영 니즈와 대관 니즈를 분리하고 랜딩에서도 바로 구분해야 합니다.",
      keywordClusters: ["브랜드 촬영", "룩북 촬영", "스튜디오 대관", "호리존/장비"],
      negativeKeywords: ["무료 이미지", "취미 클래스", "채용"],
      copyAngles: ["대관/촬영 분리 문안", "장비·공간 USP 강조", "예약 가능 시간 명시"],
      landingRisks: ["대관/촬영 구분이 모호", "모바일에서 포트폴리오가 CTA를 밀어낼 수 있음"],
      searchConsoleWatchpoints: ["촬영 서비스 페이지 recent incomplete", "브랜드 외 유입 감소"],
      alertRules: [],
      twoWeekPlan: ["대관/촬영 광고그룹 분리", "포트폴리오와 문의 CTA 배치 점검"],
      fourWeekPlan: ["고효율 서비스 페이지로 예산 집중", "브랜드 룩북 문구 테스트"],
    },
  },
  {
    customerId: "osol-dental",
    masterCustomerId: "hub-osol-dental",
    goalProfile: {
      conversionGoal: "임플란트 상담",
      monthlyBudget: 2200000,
      weeklyPrimaryKpi: "CPA",
      targetCpa: 65000,
      targetCpc: 2100,
      targetCtr: 5.2,
    },
    strategyProfile: {
      industry: "치과",
      region: "분당",
      primaryService: "임플란트·충치·사랑니",
      competitors: ["분당 임플란트", "야탑 치과", "분당 사랑니"],
      landingUrl: "https://osoldental.kr",
      brandTone: "과잉 표현 없이 신뢰성과 전문성 강조",
    },
    researchSummary: {
      businessSummary:
        "고가 상담형 업종이라 무리한 클릭 확대보다 상담 질과 브랜디드 전환율 관리가 중요합니다.",
      keywordClusters: ["임플란트 상담", "사랑니 발치", "충치 치료", "야간 진료"],
      negativeKeywords: ["가격 비교만", "커뮤니티", "후기 모음"],
      copyAngles: ["대표 원장 신뢰 메시지", "상담 예약 절차 간결화", "통증/회복 걱정 해소"],
      landingRisks: ["브랜디드 랜딩 속도", "상담 버튼 노출량 부족"],
      searchConsoleWatchpoints: ["브랜드 쿼리 CTR", "치료별 서비스 페이지 노출 하락"],
      alertRules: [],
      twoWeekPlan: ["임플란트와 일반 진료 분리", "상담 CTA 재배치"],
      fourWeekPlan: ["브랜디드 문안 개선", "고CPA 키워드군 재정리"],
    },
  },
];

async function main() {
  const db = getDb();
  const existingCustomers = await db.select().from(customersTable);
  const existingIds = new Set(existingCustomers.map((customer) => customer.id));

  const targets = demoSeeds.filter((seed) => existingIds.has(seed.customerId));
  if (!targets.length) {
    console.log("No matching customers found for strategy seeding.");
    return;
  }

  for (const seed of targets) {
    const { strategyPack, alertRules } = await bootstrapStrategyPack({
      customerId: seed.customerId,
      masterCustomerId: seed.masterCustomerId,
      sourceType: "gpt-pro",
      goalProfile: seed.goalProfile,
      strategyProfile: seed.strategyProfile,
      researchSummary: seed.researchSummary,
    });

    await evaluateAlertRules({ customerId: seed.customerId, mode: "immediate" });
    await generateRecommendations({ customerId: seed.customerId, source: "manual" });
    await evaluateRecommendationPerformance(seed.customerId);

    console.log(
      [
        `Seeded strategy pack for ${seed.customerId}`,
        `pack=${strategyPack?.id ?? "none"}`,
        `alertRules=${alertRules.length}`,
      ].join(" | "),
    );
  }

  console.log(`Strategy demo seed complete for ${targets.length} customers.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
