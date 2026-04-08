import { PageHeader } from "@/components/page-header";
import { CustomerListView } from "@/components/customer-list-view";
import { listCustomerEntries } from "@/lib/yseo/selectors";

export default function CustomersPage() {
  const entries = listCustomerEntries();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Customer Ops"
        title="고객 리스트"
        description="정상 고객은 길게 늘어놓지 않고, 상태 태그와 열린 이슈, 승인 대기 제안 수를 기준으로 우선순위 고객만 빠르게 훑을 수 있게 정리했습니다."
      />
      <CustomerListView entries={entries} />
    </div>
  );
}
