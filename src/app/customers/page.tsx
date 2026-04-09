import { CustomerListView } from "@/components/customer-list-view";
import { CustomerOnboardingDialog } from "@/components/customer-onboarding-dialog";
import { PageHeader } from "@/components/page-header";
import { listCustomerEntries } from "@/lib/yseo/selectors";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const entries = await listCustomerEntries();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="고객 상태"
        title="고객별 네이버·구글 상태"
        description="고객별 채널 연결과 최근 상태만 빠르게 확인합니다."
        actions={<CustomerOnboardingDialog />}
      />
      <CustomerListView entries={entries} />
    </div>
  );
}
