"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { PromoBarDto } from "@/client/types.gen";
import { resolveButtonLink } from "@/lib/heroSlides";

type PromoBarViewProps = {
  bar: Pick<PromoBarDto, "badgeText" | "message" | "buttonText" | "buttonUrl" | "backgroundColor" | "textColor"
    | "badgeBackgroundColor" | "badgeTextColor" | "buttonBackgroundColor" | "buttonTextColor">;
  /** Extra content inside the bar, e.g. the dismiss button. */
  children?: ReactNode;
  /** Admin preview: render the button as plain text so clicking it doesn't navigate. */
  preview?: boolean;
  style?: CSSProperties;
};

/**
 * One announcement bar, styled by the global .promo-bar CSS with the bar's own colors on top
 * (a color left empty keeps the site default).
 */
export default function PromoBarView({ bar, children, preview, style }: PromoBarViewProps) {
  const barStyle: CSSProperties = {
    ...(bar.backgroundColor ? { background: bar.backgroundColor } : {}),
    ...(bar.textColor ? { color: bar.textColor } : {}),
    ...style,
  };
  const badgeStyle: CSSProperties = {
    ...(bar.badgeBackgroundColor ? { background: bar.badgeBackgroundColor } : {}),
    ...(bar.badgeTextColor ? { color: bar.badgeTextColor } : {}),
  };
  const buttonStyle: CSSProperties = {
    ...(bar.buttonBackgroundColor ? { background: bar.buttonBackgroundColor, boxShadow: "none" } : {}),
    ...(bar.buttonTextColor ? { color: bar.buttonTextColor } : {}),
  };

  const link = bar.buttonText ? resolveButtonLink(bar.buttonUrl) : null;

  return (
    <div className="promo-bar" style={barStyle}>
      {bar.badgeText && <span className="discount" style={badgeStyle}>{bar.badgeText}</span>}
      <span>{bar.message}</span>
      {bar.buttonText && link && (
        preview ? (
          <span className="buy" style={buttonStyle}>{bar.buttonText}</span>
        ) : link.kind === "route" ? (
          <Link href={link.href} className="buy" style={buttonStyle}>{bar.buttonText}</Link>
        ) : (
          <a href={link.href} className="buy" style={buttonStyle} {...(link.kind === "external" ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
            {bar.buttonText}
          </a>
        )
      )}
      {children}
    </div>
  );
}
