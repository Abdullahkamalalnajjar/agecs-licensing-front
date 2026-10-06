"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PartnerDto } from "@/client/types.gen";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { resolveButtonLink } from "@/lib/heroSlides";
import "./partners-carousel.css";

type PartnersCarouselProps = {
  partners: PartnerDto[];
  /** Auto-advance interval; paused while hovered/focused and when the user prefers reduced motion. */
  autoPlayMs?: number;
};

/**
 * Horizontally scrolling partner logos with ‹ › arrows. Arrows only appear when the logos overflow;
 * logos with a website link open it in a new tab.
 */
export default function PartnersCarousel({ partners, autoPlayMs = 3500 }: PartnersCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState({ prev: false, next: false });
  const [paused, setPaused] = useState(false);

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScroll({ prev: el.scrollLeft > 4, next: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    updateArrows();
    const el = trackRef.current;
    if (!el) return;
    const observer = new ResizeObserver(updateArrows);
    observer.observe(el);
    return () => observer.disconnect();
  }, [partners, updateArrows]);

  // Scroll by one logo (or wrap back to the start at the end).
  const step = useCallback((direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const item = el.querySelector<HTMLElement>(".pc-item");
    const amount = item ? item.offsetWidth + 16 : el.clientWidth / 2;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    if (direction === 1 && atEnd) el.scrollTo({ left: 0, behavior: "smooth" });
    else el.scrollBy({ left: direction * amount, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (paused || !autoPlayMs) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => {
      const el = trackRef.current;
      if (el && el.scrollWidth > el.clientWidth + 4) step(1);
    }, autoPlayMs);
    return () => clearInterval(timer);
  }, [paused, autoPlayMs, step]);

  if (partners.length === 0) return null;

  return (
    <div
      className="pc"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <button type="button" className="pc-arrow pc-prev" onClick={() => step(-1)} disabled={!canScroll.prev} aria-label="Previous partners">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
      </button>

      <div className="pc-track" ref={trackRef} onScroll={updateArrows} role="list" aria-label="Trusted partners">
        {partners.map((partner) => {
          // eslint-disable-next-line @next/next/no-img-element
          const logo = <img src={resolveMediaUrl(partner.logoUrl)} alt={partner.name || "Partner"} loading="lazy" draggable={false} />;
          const link = partner.websiteUrl ? resolveButtonLink(partner.websiteUrl) : null;
          return (
            <div key={partner.id} className="pc-item" role="listitem">
              {link
                ? <a href={link.href} target={link.kind === "external" ? "_blank" : undefined} rel="noopener noreferrer" title={partner.name ?? undefined}>{logo}</a>
                : <span title={partner.name ?? undefined}>{logo}</span>}
            </div>
          );
        })}
      </div>

      <button type="button" className="pc-arrow pc-next" onClick={() => step(1)} disabled={!canScroll.next && !canScroll.prev} aria-label="Next partners">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
      </button>
    </div>
  );
}
