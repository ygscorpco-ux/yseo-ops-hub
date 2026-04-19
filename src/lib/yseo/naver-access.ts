import "server-only";

import { cache } from "react";

import {
  NaverSearchAdAdapter,
  getNaverSearchAdCredentials,
  type NaverManagedCustomer,
} from "@/lib/yseo/adapters";

function normalizeNaverCustomerRef(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const digitsOnly = value.replace(/\D+/g, "");
  return digitsOnly || value.trim().toLowerCase();
}

const getManagedNaverCustomers = cache(async () => {
  if (!getNaverSearchAdCredentials()) {
    return {
      ok: false as const,
      reason: "credentials-missing" as const,
      managedCustomers: [] as NaverManagedCustomer[],
      normalizedRefs: new Set<string>(),
      message: "NAVER SearchAd credentials are missing.",
    };
  }

  const adapter = new NaverSearchAdAdapter();
  const validation = await adapter.validateConnection();

  if (!validation.ok) {
    return {
      ok: false as const,
      reason: "validation-failed" as const,
      managedCustomers: [] as NaverManagedCustomer[],
      normalizedRefs: new Set<string>(),
      message: validation.message,
    };
  }

  const managedCustomers = await adapter.listManagedCustomers();

  return {
    ok: true as const,
    reason: "connected" as const,
    managedCustomers,
    normalizedRefs: new Set(
      managedCustomers.map((customer) => normalizeNaverCustomerRef(customer.customerId)),
    ),
    message: validation.message,
  };
});

export async function auditNaverCustomerAccess(
  externalAccountRef: string | null | undefined,
) {
  const audit = await getManagedNaverCustomers();
  const normalizedExternalAccountRef = normalizeNaverCustomerRef(externalAccountRef);

  return {
    ...audit,
    externalAccountRef: externalAccountRef ?? "",
    normalizedExternalAccountRef,
    isAccessible:
      audit.ok &&
      Boolean(normalizedExternalAccountRef) &&
      audit.normalizedRefs.has(normalizedExternalAccountRef),
  };
}
