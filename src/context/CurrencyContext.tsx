"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type SupportedCurrency = "EG" | "US" | "SA" | "II";

export const CURRENCIES: { code: SupportedCurrency; label: string; symbol: string; flag: string }[] = [
  { code: "EG", label: "EGP", symbol: "ج.م", flag: "🇪🇬" },
  { code: "US", label: "USD", symbol: "$",   flag: "🇺🇸" },
  { code: "SA", label: "SAR", symbol: "ر.س", flag: "🇸🇦" },
  { code: "II", label: "Intl", symbol: "$",  flag: "🌐" },
];

type CurrencyContextType = {
  currency: SupportedCurrency;
  setCurrency: (currency: SupportedCurrency) => void;
  currentCurrencyMeta: typeof CURRENCIES[number];
};

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "EG",
  setCurrency: () => {},
  currentCurrencyMeta: CURRENCIES[0],
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<SupportedCurrency>("EG");

  useEffect(() => {
    const saved = localStorage.getItem("agecs_currency") as SupportedCurrency | null;
    if (saved && CURRENCIES.find((c) => c.code === saved)) {
      setCurrencyState(saved);
    }
  }, []);

  const setCurrency = (newCurrency: SupportedCurrency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem("agecs_currency", newCurrency);
  };

  const currentCurrencyMeta = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, currentCurrencyMeta }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);

/**
 * Helper: Given a product's prices array, return the price for the current currency.
 * Falls back to 'II' (international default) if the selected currency isn't found.
 */
export function getPriceForCurrency(
  prices: { country: string; price: number; originalPrice?: number; period?: number; periodType?: string }[],
  currency: SupportedCurrency
) {
  return (
    prices.find((p) => p.country === currency) ??
    prices.find((p) => p.country === "II") ??
    prices[0] ??
    null
  );
}
