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
        eyebrow="고객 운영"
        title="고객 리스트"
        description="상태와 최근 변화 기준으로 우선 고객만 빠르게 봅니다."
        actions={<CustomerOnboardingDialog />}
      />
      <CustomerListView entries={entries} />
    </div>
  );
}
