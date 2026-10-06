"use client";

import { useEffect, useState } from "react";
import { getApiPartners } from "@/client";
import type { PartnerDto } from "@/client/types.gen";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003";

/** The visible partners with a logo, in display order. Empty until loaded, and when there are none. */
export function usePartners() {
  const [partners, setPartners] = useState<PartnerDto[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getApiPartners({ baseUrl, throwOnError: false })
      .then((res) => { if (!cancelled && res.data?.isSuccess) setPartners(res.data.value ?? []); })
      .catch(() => { /* no partners shown */ })
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  return { partners, loaded };
}
