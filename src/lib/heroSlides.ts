"use client";

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

/**
 * The home page hero slides (visible ones, in order) plus the auto-advancing current index.
 * Falls back to FALLBACK_HERO_SLIDES while loading or when the API has none.
 */
export function useHeroSlides(intervalMs = 5200) {
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

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(() => setCurrent((prev) => (prev + 1) % slides.length), intervalMs);
    return () => clearInterval(timer);
  }, [slides.length, intervalMs]);

  return { slides, current: Math.min(current, slides.length - 1), setCurrent };
}
