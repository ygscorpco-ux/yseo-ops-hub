import { CustomerListView } from "@/components/customer-list-view";
import { PageHeader } from "@/components/page-header";
import { listCustomerEntries } from "@/lib/yseo/selectors";

export default async function CustomersPage() {
  const entries = await listCustomerEntries();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Customer ops"
        title="고객 리스트"
        description="정상 고객은 뒤로 보내고, 상태 태그와 열린 이슈, 승인 대기 제안을 기준으로 먼저 볼 고객만 빠르게 추립니다."
      />
      <CustomerListView entries={entries} />
    </div>
  );
}
