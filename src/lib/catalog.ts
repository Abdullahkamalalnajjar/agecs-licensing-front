"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getApiCompanies, getApiFamilies, postApiCompanies, postApiFamilies } from "@/client";
import type { CompanyDto, FamilyDto } from "@/client/types.gen";

/**
 * Shared, in-memory store for product families and companies. Every component using `useCatalog()` reads the
 * same lists, so adding a family in one place (e.g. the product form) shows up everywhere without a refetch.
 */
type CatalogState = {
  families: FamilyDto[];
  companies: CompanyDto[];
  loaded: boolean;
  error: string;
};

// Passed on every call: the navbar can load the catalog before any page has configured the shared client.
const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003";

let state: CatalogState = { families: [], companies: [], loaded: false, error: "" };
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

const emit = (patch: Partial<CatalogState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const errorText = (data: unknown, fallback: string) =>
  (data as { errors?: { description?: string | null }[] | null } | undefined)?.errors
    ?.map((e) => e.description)
    .filter(Boolean)
    .join(", ") || fallback;

/** Loads (or reloads, with `force`) both lists. Concurrent callers share one request. */
export function loadCatalog(force = false): Promise<void> {
  if (inflight) return inflight;
  if (state.loaded && !force) return Promise.resolve();

  inflight = Promise.all([getApiFamilies({ baseUrl, throwOnError: false }), getApiCompanies({ baseUrl, throwOnError: false })])
    .then(([familiesRes, companiesRes]) => {
      emit({
        families: familiesRes.data?.value ?? state.families,
        companies: companiesRes.data?.value ?? state.companies,
        loaded: true,
        error: familiesRes.data?.isSuccess && companiesRes.data?.isSuccess ? "" : "Failed to load families and companies.",
      });
    })
    .catch((err: unknown) => emit({ loaded: true, error: (err instanceof Error && err.message) || "Failed to load families and companies." }))
    .finally(() => { inflight = null; });

  return inflight;
}

/** Creates a family and adds it to the shared list. Throws with the API's message on failure. */
export async function createFamily(name: string): Promise<FamilyDto> {
  const res = await postApiFamilies({ baseUrl, body: { name }, throwOnError: false });
  const family = res.data?.value;
  if (!family || res.data?.isError) throw new Error(errorText(res.data ?? res.error, "Failed to add family."));
  emit({ families: [...state.families, family] });
  return family;
}

/** Creates a company and adds it to the shared list. Throws with the API's message on failure. */
export async function createCompany(name: string): Promise<CompanyDto> {
  const res = await postApiCompanies({ baseUrl, body: { name }, throwOnError: false });
  const company = res.data?.value;
  if (!company || res.data?.isError) throw new Error(errorText(res.data ?? res.error, "Failed to add company."));
  emit({ companies: [...state.companies, company] });
  return company;
}

/** Replaces a list after the management page edits, deletes or reorders entries. */
export function setCatalogLists(patch: Partial<Pick<CatalogState, "families" | "companies">>) {
  emit(patch);
}

const serverSnapshot: CatalogState = { families: [], companies: [], loaded: false, error: "" };

/** Families and companies, loaded on first use and shared across the app. */
export function useCatalog() {
  const snapshot = useSyncExternalStore(subscribe, () => state, () => serverSnapshot);
  useEffect(() => { loadCatalog(); }, []);
  return { ...snapshot, reload: () => loadCatalog(true) };
}
