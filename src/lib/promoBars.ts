"use client";
// @refresh reset
// Fast Refresh: remount users of this hook on every edit instead of keeping old hook state.

import { useEffect, useMemo, useState } from "react";
import { getApiPromoBars } from "@/client";
import type { PromoBarDto } from "@/client/types.gen";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003";
/** Every bar shows for the same time before the next one. */
const ROTATION_SECONDS = 6;

/** Shown until the API answers (and if the request fails), matching the bar the site used to hardcode. */
export const FALLBACK_PROMO_BARS: PromoBarDto[] = [
  {
    id: "fallback-promo",
    badgeText: "20% OFF",
    message: "Your First Year License for nanoCAD 26",
    buttonText: "Buy Now",
    buttonUrl: "#products",
  },
];

const hasEnded = (bar: PromoBarDto, now: number) => !!bar.endDate && new Date(bar.endDate).getTime() <= now;

/**
 * The visible announcement bars, in order, plus the auto-rotating current index and the seconds left on it.
 * Each bar stays for ROTATION_SECONDS. An empty list from the API means every bar is hidden.
 * A bar with an end date drops out the moment it passes, even on a page that's already open.
 */
export function usePromoBars() {
  const [allBars, setBars] = useState<PromoBarDto[]>(FALLBACK_PROMO_BARS);
  const [now, setNow] = useState(() => Date.now());
  // Keyed on which bars are still on, not on the clock, so the list (and the rotation timer below) only changes
  // when a bar actually ends, not on every tick.
  const visibleKey = allBars.filter((b) => !hasEnded(b, now)).map((b) => b.id).join("|");
  const bars = useMemo(() => {
    const visible = new Set(visibleKey.split("|"));
    return allBars.filter((b) => visible.has(b.id ?? ""));
  }, [allBars, visibleKey]);

  // Re-check end dates once a second, but only while some bar still has one ahead of it.
  const hasUpcomingEnd = allBars.some((b) => b.endDate && !hasEnded(b, now));
  useEffect(() => {
    if (!hasUpcomingEnd) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [hasUpcomingEnd]);
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

  // Tick once a second; when the current bar's time is up, move to the next bar.
  useEffect(() => {
    if (bars.length < 2) return;
    const timer = setInterval(() => {
      setPosition((p) => {
        const index = Math.min(p.index, bars.length - 1);
        return p.elapsed + 1 >= ROTATION_SECONDS
          ? { index: (index + 1) % bars.length, elapsed: 0 }
          : { index, elapsed: p.elapsed + 1 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [bars]);

  const index = bars.length === 0 ? 0 : Math.min(position.index, bars.length - 1);
  const secondsLeft = Math.max(1, ROTATION_SECONDS - position.elapsed);

  return {
    bars,
    current: index,
    secondsLeft,
    setCurrent: (i: number) => setPosition({ index: i, elapsed: 0 }),
  };
}
