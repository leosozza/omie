import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

interface TenantInfo {
  memberId: string | null;
  domain: string | null;
  isLoading: boolean;
}

export function useTenant(): TenantInfo {
  const [searchParams] = useSearchParams();
  const [tenantInfo, setTenantInfo] = useState<TenantInfo>({
    memberId: null,
    domain: null,
    isLoading: true,
  });

  useEffect(() => {
    const memberId = searchParams.get("member_id");
    const domain = searchParams.get("domain");

    // Also check localStorage for persistence
    const storedMemberId = localStorage.getItem("bitrix_member_id");
    const storedDomain = localStorage.getItem("bitrix_domain");

    const finalMemberId = memberId || storedMemberId;
    const finalDomain = domain || storedDomain;

    // Store for future sessions
    if (finalMemberId) {
      localStorage.setItem("bitrix_member_id", finalMemberId);
    }
    if (finalDomain) {
      localStorage.setItem("bitrix_domain", finalDomain);
    }

    setTenantInfo({
      memberId: finalMemberId,
      domain: finalDomain,
      isLoading: false,
    });
  }, [searchParams]);

  return tenantInfo;
}
