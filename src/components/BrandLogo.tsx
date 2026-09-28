import type React from "react";

type BrandLogoProps = {
  /** "mark" drops the tagline, which is unreadable at navbar sizes */
  variant?: "full" | "mark";
  /** "auto" follows data-theme; "light"/"dark" force the version for that background */
  tone?: "auto" | "light" | "dark";
  /** px; omit to size from CSS via --brand-logo-h (default 36px) */
  height?: number;
  alt?: string;
  className?: string;
};

export default function BrandLogo({
  variant = "mark",
  tone = "auto",
  height,
  alt = "AGECS Engineering and Technological Consultancy & Services",
  className = "",
}: BrandLogoProps) {
  const base = variant === "full" ? "/agecs-logo" : "/agecs-mark";
  const style = height ? ({ "--brand-logo-h": `${height}px` } as React.CSSProperties) : undefined;

  if (tone !== "auto") {
    const src = tone === "dark" ? `${base}-dark.png` : `${base}.png`;
    return (
      <span className={`brand-logo ${className}`} style={style}>
        <img src={src} alt={alt} />
      </span>
    );
  }

  return (
    <span className={`brand-logo ${className}`} style={style}>
      <img src={`${base}.png`} alt={alt} className="brand-logo-on-light" />
      <img src={`${base}-dark.png`} alt="" aria-hidden="true" className="brand-logo-on-dark" />
    </span>
  );
}
