"use client";
// @refresh reset
// Fast Refresh: remount users of this hook on every edit instead of keeping old hook state
// (changing the timer's dependencies during a hot reload otherwise trips React's dependency check).

import { useEffect, useState } from "react";
import { getApiHeroSlides } from "@/client";
import type { HeroSlideDto } from "@/client/types.gen";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003";

/** Shown until the API answers (and if it fails or has no slides), so the hero is never empty. */
export const FALLBACK_HERO_SLIDES: HeroSlideDto[] = [
  {
    id: "fallback-1",
    badge: "AGECS Solutions",
    title: "Engineering Software Built for Real Structural Workflows",
    description: "AGECS Solutions develops practical engineering software that helps structural engineers reduce repetitive drafting, improve detailing accuracy, and maintain full control over their workflow.",
    buttons: [
      { text: "Explore Our Solutions", url: "#products", variant: "primary" },
      { text: "Free 30-Day Trial", url: "#contact", variant: "secondary" },
    ],
  },
  {
    id: "fallback-2",
    badge: "Official nanoCAD Provider",
    title: "nanoCAD. More for Less.",
    description: "Your official and sole provider of nanoCAD in Egypt and the Middle East. Work seamlessly with powerful DWG-compatible CAD, 2D and 3D drafting tools, and tailored modules to fit your needs.",
    buttons: [
      { text: "Explore nanoCAD", url: "#nanocad", variant: "primary" },
      { text: "Request Support", url: "#contact", variant: "secondary" },
    ],
  },
  {
    id: "fallback-3",
    badge: "AGECS Ecosystem",
    title: "One Ecosystem for Smarter Engineering Workflows",
    description: "AGECS Solutions brings together specialized tools for drafting, detailing, documentation, and workflow automation — built to support real structural project delivery.",
    buttons: [
      { text: "Explore Products", url: "#products", variant: "primary" },
      { text: "Start Free Trial", url: "#contact", variant: "secondary" },
    ],
  },
];

const DEFAULT_DURATION_SECONDS = 5;

/**
 * The home page hero slides (visible ones, in order) plus the auto-advancing current index.
 * Each slide stays on screen for its own durationSeconds (set per slide in the admin).
 * Falls back to FALLBACK_HERO_SLIDES while loading or when the API has none.
 */
export function useHeroSlides() {
  const [slides, setSlides] = useState<HeroSlideDto[]>(FALLBACK_HERO_SLIDES);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getApiHeroSlides({ baseUrl, throwOnError: false })
      .then((res) => {
        const loaded = res.data?.value;
        if (!cancelled && loaded && loaded.length > 0) {
          setSlides(loaded);
          setCurrent(0);
        }
      })
      .catch(() => { /* keep the fallback slides */ });
    return () => { cancelled = true; };
  }, []);

  const index = Math.min(current, slides.length - 1);
  const durationMs = (slides[index]?.durationSeconds || DEFAULT_DURATION_SECONDS) * 1000;

  // A timeout per slide (instead of one interval) so each slide gets its own duration;
  // it restarts whenever the slide changes, including when a visitor clicks a dot.
  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setTimeout(() => setCurrent((prev) => (prev + 1) % slides.length), durationMs);
    return () => clearTimeout(timer);
  }, [index, slides.length, durationMs]);

  return { slides, current: index, setCurrent };
}

export type ButtonLink =
  | { kind: "route"; href: string }      // an app page, e.g. "/products" (client-side navigation)
  | { kind: "anchor"; href: string }     // same tab, plain link: "#contact", "mailto:…", "tel:…"
  | { kind: "external"; href: string };  // another site; opens in a new tab

/**
 * Works out where a slide button goes. Admins often type a bare domain ("www.google.com"), which a browser would
 * treat as a path on this site, so anything that isn't a route, an anchor or a full URL gets "https://" added.
 */
export function resolveButtonLink(raw: string | null | undefined): ButtonLink {
  const url = (raw ?? "").trim();
  if (!url) return { kind: "anchor", href: "#" };
  if (url.startsWith("#")) return { kind: "anchor", href: url };
  if (url.startsWith("//")) return { kind: "external", href: `https:${url}` };
  if (url.startsWith("/")) return { kind: "route", href: url };
  if (/^(mailto:|tel:)/i.test(url)) return { kind: "anchor", href: url };
  if (/^https?:/i.test(url)) return { kind: "external", href: url };
  return { kind: "external", href: `https://${url}` };
}
