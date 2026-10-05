"use client";
// @refresh reset
// Fast Refresh: remount users of this hook on every edit instead of keeping old hook state.

import { useEffect, useState } from "react";
import { getApiPromoBars } from "@/client";
import type { PromoBarDto } from "@/client/types.gen";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003";
const DEFAULT_DURATION_SECONDS = 6;

/** Shown until the API answers (and if the request fails), matching the bar the site used to hardcode. */
export const FALLBACK_PROMO_BARS: PromoBarDto[] = [
  {
    id: "fallback-promo",
    badgeText: "20% OFF",
    message: "Your First Year License for nanoCAD 26",
    buttonText: "Buy Now",
    buttonUrl: "#products",
    durationSeconds: DEFAULT_DURATION_SECONDS,
  },
];

/**
 * The visible announcement bars, in order, plus the auto-rotating current index and the seconds left on it.
 * Each bar stays for its own durationSeconds. An empty list from the API means every bar is hidden.
 */
export function usePromoBars() {
  const [bars, setBars] = useState<PromoBarDto[]>(FALLBACK_PROMO_BARS);
  // Index and seconds elapsed live together so one 1-second tick can advance both atomically.
  const [position, setPosition] = useState({ index: 0, elapsed: 0 });

  useEffect(() => {
    let cancelled = false;
    getApiPromoBars({ baseUrl, throwOnError: false })
      .then((res) => {
        if (!cancelled && res.data?.isSuccess) {
          setBars(res.data.value ?? []);
          setPosition({ index: 0, elapsed: 0 });
        }
      })
      .catch(() => { /* keep the fallback bar */ });
    return () => { cancelled = true; };
  }, []);

  const durationOf = (bar: PromoBarDto | undefined) => bar?.durationSeconds || DEFAULT_DURATION_SECONDS;

  // Tick once a second; when the current bar's time is up, move to the next bar.
  useEffect(() => {
    if (bars.length < 2) return;
    const timer = setInterval(() => {
      setPosition((p) => {
        const index = Math.min(p.index, bars.length - 1);
        return p.elapsed + 1 >= durationOf(bars[index])
          ? { index: (index + 1) % bars.length, elapsed: 0 }
          : { index, elapsed: p.elapsed + 1 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [bars]);

  const index = bars.length === 0 ? 0 : Math.min(position.index, bars.length - 1);
  const secondsLeft = Math.max(1, durationOf(bars[index]) - position.elapsed);

  return {
    bars,
    current: index,
    secondsLeft,
    setCurrent: (i: number) => setPosition({ index: i, elapsed: 0 }),
  };
}
