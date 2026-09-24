"use client";
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ProductDto } from "@/client/types.gen";
import { resolveMediaUrl } from "@/lib/mediaUrl";

interface HomeLandingViewProps {
  products: ProductDto[];
}

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let start = 0;
          const step = Math.max(1, Math.floor(target / 60));
          const timer = setInterval(() => {
            start += step;
            if (start >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(start);
            }
          }, 25);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

export default function HomeLandingView({ products }: HomeLandingViewProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 3;

  useEffect(() => {
    // Slider interval
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5200);

    // Scroll reveal observer
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
        }
      });
    }, { threshold: 0.12 });

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach((el) => obs.observe(el));

    return () => {
      clearInterval(interval);
      revealElements.forEach((el) => obs.unobserve(el));
      obs.disconnect();
    };
  }, []);

  return (
    <div className="home-landing-container">
      <style dangerouslySetInnerHTML={{ __html: `
        .home-landing-container {
            --navy: var(--ink);
            --navy-2: var(--body-strong);
            --blue: var(--accent);
            --blue-2: var(--accent-light);
            --green: var(--accent);
            --yellow: var(--accent);
            --red: var(--danger);
            --white: var(--surface-card);
            --soft: transparent;
            --text: var(--body);
            --muted: var(--muted);
            --line: var(--hairline);
            --shadow: var(--shadow-lg);
            --container: 1180px;
            font-family: 'Inter', sans-serif;
            color: var(--text);
            background: var(--bg-body);
            line-height: 1.55;
            width: 100%;
            margin: 0;
            padding: 0;
        }

        [data-theme="dark"] .home-landing-container {
            --canvas: #ffffff;
            --surface-card: #f8fafc;
            --surface-elevated: #ffffff;
            --surface-soft: rgba(15, 23, 42, 0.04);
            --ink: #0f172a;
            --body: #334155;
            --body-strong: #0f172a;
            --muted: #64748b;
            --hairline: #e2e8f0;
            --hairline-strong: #cbd5e1;
            --accent: #1949a1;
            --accent-light: rgba(25, 73, 161, 0.1);
            --success-dim: rgba(254, 192, 16, 0.15);
            --info-dim: rgba(59, 130, 246, 0.1);
            --warning-dim: rgba(254, 192, 16, 0.1);
            --shadow-card: 0 4px 12px rgba(0, 0, 0, 0.05);
            --shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.08);
            --navy: #0f172a;
            --navy-2: #334155;
            --blue: #1949a1;
            --blue-2: rgba(25, 73, 161, 0.1);
            --green: #fec010;
            --yellow: #fec010;
            --white: #ffffff;
            --text: #334155;
            --line: #e2e8f0;
        }

        /* ─── Global Override for Home Page Dark Mode ─── */
        html[data-theme="dark"] body {
            --bg-base: #ffffff !important;
            --bg-surface: #ffffff !important;
            --bg-elevated: #ffffff !important;
            --bg-card: #ffffff !important;
            --bg-surface-hover: #f8fafc !important;
            --text-base: #0f172a !important;
            --text-muted: #64748b !important;
            --text-primary: #0f172a !important;
            --accent-border: #e2e8f0 !important;
            background-color: #ffffff !important;
        }
        
        /* Fix the top navbar specifically */
        html[data-theme="dark"] .top-navbar {
            background-color: #ffffff !important;
            border-bottom: 1px solid #e2e8f0 !important;
        }
        html[data-theme="dark"] .dashboard-layout {
            background-color: #ffffff !important;
        }

        /* ─── Dark theme hero override ─── */
        [data-theme="dark"] .hero {
            background: linear-gradient(135deg, #0a1628 0%, #1949a1 50%, #0d2e6b 100%);
            color: #ffffff;
        }
        [data-theme="dark"] .hero h1 { color: #ffffff; }
        [data-theme="dark"] .hero p { color: rgba(255, 255, 255, 0.85); }
        [data-theme="dark"] .hero .kicker { color: #fec010; }
        [data-theme="dark"] .hero:before { background-image: linear-gradient(rgba(255, 255, 255, .04) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, .04) 1px, transparent 1px); }
        [data-theme="dark"] .hero .btn-outline { border-color: rgba(255,255,255,0.3); color: #fff; }
        [data-theme="dark"] .hero .btn-outline:hover { border-color: #fec010; color: #fec010; }
        [data-theme="dark"] .visual-title { color: #ffffff; background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }
        [data-theme="dark"] .workflow-card { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.15); color: #ffffff; }
        [data-theme="dark"] .workflow-card strong { color: #ffffff; }
        [data-theme="dark"] .workflow-card span { color: rgba(255,255,255,0.7); }
        [data-theme="dark"] .workflow-card:hover { background: rgba(255,255,255,0.18); border-color: rgba(254,192,16,0.5); }
        [data-theme="dark"] .hero-visual { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); box-shadow: 0 25px 60px rgba(0,0,0,0.3); }
        [data-theme="dark"] .hero-visual::before { background: linear-gradient(135deg, rgba(254,192,16,0.15) 0%, transparent 40%, transparent 60%, rgba(59,130,246,0.15) 100%); }
        [data-theme="dark"] .hero:after { border-color: rgba(255,255,255,0.08); box-shadow: inset 0 0 0 30px rgba(255,255,255,0.03), inset 0 0 0 90px rgba(255,255,255,0.02); }
        [data-theme="dark"] .stats-bar { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.12); backdrop-filter: blur(20px); }
        [data-theme="dark"] .stat-item .stat-value { color: #fec010; }
        [data-theme="dark"] .stat-item .stat-label { color: rgba(255,255,255,0.65); }
        [data-theme="dark"] .stat-divider { background: rgba(255,255,255,0.15); }
        [data-theme="dark"] .dots .dot { background: rgba(255,255,255,0.25); }
        [data-theme="dark"] .dots .dot.active { background: #fec010; }
        [data-theme="dark"] .hero .floating-particle { background: rgba(254,192,16,0.25); }

        .home-landing-container {
            font-family: 'Inter', sans-serif; color: var(--text);
            background: var(--bg-body); line-height: 1.55;
            width: 100%;
        }
        .home-landing-container * { box-sizing: border-box; }
        .home-landing-container a { text-decoration: none; color: inherit; }
        .hl-container { max-width: var(--container); margin: auto; padding: 0 24px; }

        /* ─── Buttons ─── */
        .hl-btn {
            display: inline-flex; align-items: center; justify-content: center;
            min-height: 48px; padding: 0 28px; border-radius: 12px;
            font-size: 14px; font-weight: 800; text-transform: uppercase;
            transition: all .3s cubic-bezier(.4,0,.2,1); cursor: pointer;
            border: 1px solid transparent; letter-spacing: 0.03em;
            position: relative; overflow: hidden;
        }
        .hl-btn::after {
            content: ''; position: absolute; inset: 0;
            background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%);
            opacity: 0; transition: opacity .3s ease;
        }
        .hl-btn:hover::after { opacity: 1; }
        .hl-btn:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(0,0,0,0.15); }

        .btn-yellow { background: linear-gradient(135deg, #fec010, #f59e0b); color: #000; box-shadow: 0 4px 15px rgba(254,192,16,0.3); }
        .btn-yellow:hover { box-shadow: 0 8px 30px rgba(254,192,16,0.45); }
        .btn-blue { background: var(--surface-elevated); color: var(--ink); border: 1px solid var(--hairline-strong); }
        .btn-outline { border-color: var(--hairline-strong); color: var(--ink); background: transparent; }
        .btn-light-outline { border-color: var(--hairline-strong); color: var(--ink); background: transparent; }
        .btn-light-outline:hover { border-color: var(--green); color: var(--green); }
        .cta { display: flex; gap: 14px; flex-wrap: wrap; align-items: center; }

        /* ─── Hero ─── */
        .hero {
            position: relative; min-height: 700px; overflow: hidden;
            background: radial-gradient(circle at 82% 18%, var(--success-dim), transparent 22%),
                linear-gradient(115deg, var(--canvas) 0%, var(--surface-card) 52%, var(--canvas) 100%);
            color: var(--ink);
        }
        .hero:before {
            content: ""; position: absolute; inset: 0;
            background-image: linear-gradient(rgba(255, 255, 255, .02) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, .02) 1px, transparent 1px);
            background-size: 48px 48px; opacity: .8;
        }
        .hero:after {
            content: ""; position: absolute; right: -160px; top: 80px;
            width: 560px; height: 560px; border-radius: 50%;
            border: 1px solid var(--hairline);
            box-shadow: inset 0 0 0 30px var(--surface-soft), inset 0 0 0 90px var(--surface-card);
            animation: heroRingRotate 30s linear infinite;
        }
        @keyframes heroRingRotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        /* ─── Floating Particles ─── */
        .floating-particle {
            position: absolute; border-radius: 50%; pointer-events: none;
            background: rgba(254,192,16,0.12);
            animation: particleFloat 8s ease-in-out infinite;
        }
        .floating-particle:nth-child(1) { width: 6px; height: 6px; top: 15%; left: 10%; animation-delay: 0s; animation-duration: 7s; }
        .floating-particle:nth-child(2) { width: 4px; height: 4px; top: 25%; left: 80%; animation-delay: 1s; animation-duration: 9s; }
        .floating-particle:nth-child(3) { width: 8px; height: 8px; top: 70%; left: 20%; animation-delay: 2s; animation-duration: 6s; }
        .floating-particle:nth-child(4) { width: 5px; height: 5px; top: 60%; left: 65%; animation-delay: 3s; animation-duration: 10s; }
        .floating-particle:nth-child(5) { width: 3px; height: 3px; top: 40%; left: 45%; animation-delay: 4s; animation-duration: 8s; }
        .floating-particle:nth-child(6) { width: 7px; height: 7px; top: 80%; left: 85%; animation-delay: 1.5s; animation-duration: 11s; }

        @keyframes particleFloat {
            0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
            25% { transform: translate(15px, -20px) scale(1.3); opacity: 0.7; }
            50% { transform: translate(-10px, -35px) scale(0.8); opacity: 0.5; }
            75% { transform: translate(20px, -15px) scale(1.1); opacity: 0.8; }
        }

        .hero-inner {
            position: relative; z-index: 1; min-height: 620px;
            display: grid; grid-template-columns: 1.1fr .9fr; align-items: center; gap: 60px;
        }

        .slide { display: none; animation: fadeSlide .7s cubic-bezier(.4,0,.2,1) both; }
        .slide.active { display: block; }

        @keyframes fadeSlide {
            from { opacity: 0; transform: translateY(20px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .kicker {
            color: var(--green); text-transform: uppercase; letter-spacing: .14em;
            font-weight: 900; font-size: 13px; margin-bottom: 16px;
            display: inline-flex; align-items: center; gap: 8px;
        }
        .kicker::before {
            content: ''; width: 32px; height: 2px; background: var(--green);
            display: inline-block; border-radius: 2px;
        }

        .hero h1 {
            font-size: 54px; line-height: 1.08; margin: 0 0 22px; max-width: 780px;
            letter-spacing: -.04em; color: var(--ink); font-weight: 900;
        }
        .hero p { max-width: 690px; font-size: 18px; line-height: 1.7; color: var(--muted); margin: 0 0 32px; }

        /* ─── Stats Bar ─── */
        .stats-bar {
            display: flex; align-items: center; justify-content: center; gap: 0;
            background: var(--surface-card); border: 1px solid var(--hairline);
            border-radius: 16px; padding: 18px 32px; margin-top: 36px;
            backdrop-filter: blur(12px); position: relative; z-index: 2;
        }
        .stat-item { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 0 28px; }
        .stat-value { font-size: 28px; font-weight: 900; color: var(--green); letter-spacing: -0.02em; font-family: var(--font-mono, monospace); }
        .stat-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); }
        .stat-divider { width: 1px; height: 36px; background: var(--hairline-strong); flex-shrink: 0; }

        /* ─── Hero Visual ─── */
        .hero-visual {
            min-height: 460px; border-radius: 24px; background: var(--surface-card);
            box-shadow: 0 25px 60px rgba(0,0,0,0.08); padding: 28px;
            position: relative; overflow: hidden; border: 1px solid var(--hairline);
            transition: transform .4s ease, box-shadow .4s ease;
        }
        .hero-visual:hover { transform: translateY(-4px); box-shadow: 0 30px 70px rgba(0,0,0,0.12); }

        .hero-visual::before {
            content: ""; position: absolute; top: -1px; left: -1px; right: -1px; bottom: -1px;
            border-radius: 24px;
            background: linear-gradient(135deg, var(--success-dim) 0%, transparent 40%, transparent 60%, var(--info-dim) 100%);
            pointer-events: none; opacity: .6; z-index: 0;
        }
        .hero-visual:after {
            content: ""; position: absolute; right: -70px; bottom: -70px;
            width: 300px; height: 300px; border-radius: 50%;
            background: radial-gradient(circle, var(--success-dim), transparent 65%);
            pointer-events: none;
        }
        .hero-visual > * { position: relative; z-index: 1; }

        @keyframes hv-pulse {
            0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 10px var(--green); }
            50% { opacity: .5; transform: scale(.85); box-shadow: 0 0 20px var(--green); }
        }

        .visual-title {
            display: inline-flex; align-items: center; gap: 8px; color: var(--ink);
            font-weight: 700; font-size: 11px; margin-bottom: 20px;
            letter-spacing: .1em; text-transform: uppercase;
            background: var(--surface-elevated); border: 1px solid var(--hairline-strong);
            padding: 6px 14px 6px 10px; border-radius: 100px;
        }
        .visual-title-dot {
            width: 7px; height: 7px; border-radius: 50%; background: var(--green);
            box-shadow: 0 0 10px var(--green); animation: hv-pulse 2s ease-in-out infinite; flex-shrink: 0;
        }

        .workflow-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; position: relative; z-index: 1; }
        .workflow-card {
            background: var(--surface-elevated); color: var(--ink); border-radius: 14px;
            padding: 16px; min-height: 110px;
            border: 1px solid var(--hairline-strong); backdrop-filter: blur(6px);
            transition: all .3s cubic-bezier(.4,0,.2,1);
        }
        .workflow-card:hover { background: var(--surface-soft); border-color: var(--accent); transform: translateY(-3px) scale(1.01); box-shadow: 0 8px 20px rgba(0,0,0,0.08); }
        .workflow-card strong { display: block; font-size: 15px; margin-bottom: 6px; color: var(--ink); }
        .workflow-card span { display: block; color: var(--muted); font-size: 12px; line-height: 1.5; }
        .workflow-card.full { grid-column: 1/-1; background: var(--surface-elevated); border-color: var(--hairline-strong); }
        .workflow-card.full strong { background: linear-gradient(90deg, var(--green), #60d4ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

        .workflow-cards.compact .workflow-card { min-height: auto; padding: 14px 16px; display: flex; align-items: flex-start; gap: 10px; }
        .workflow-card-icon { font-size: 20px; flex-shrink: 0; margin-top: 1px; line-height: 1; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: rgba(254,192,16,0.1); border-radius: 10px; }
        .workflow-card-body { flex: 1; }

        .dots { position: absolute; bottom: 28px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; z-index: 2; }
        .dot { width: 34px; height: 5px; border-radius: 20px; background: var(--hairline-strong); cursor: pointer; transition: all .3s ease; }
        .dot:hover { background: var(--muted); }
        .dot.active { width: 56px; background: var(--green); box-shadow: 0 0 12px rgba(254,192,16,0.4); }

        /* ─── Shared Sections ─── */
        .section { padding: 96px 0; }
        .center { text-align: center; }
        .eyebrow {
            color: var(--green); font-size: 12px; font-weight: 900;
            letter-spacing: .14em; text-transform: uppercase; margin-bottom: 14px;
            display: inline-flex; align-items: center; gap: 8px;
        }
        .center .eyebrow::before, .center .eyebrow::after {
            content: ''; width: 24px; height: 2px; background: var(--green); border-radius: 2px; display: inline-block;
        }
        .section-title {
            font-size: 40px; line-height: 1.15; color: var(--ink); margin: 0 0 14px;
            font-weight: 900; letter-spacing: -0.02em;
        }
        .lead { font-size: 17px; color: var(--muted); max-width: 800px; margin: 0 auto 48px; line-height: 1.7; }

        /* ─── Overview ─── */
        .overview-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .overview-card {
            background: var(--surface-card); border: 1px solid var(--hairline);
            border-radius: 20px; padding: 28px; box-shadow: var(--shadow-card);
            min-height: 240px; position: relative; overflow: hidden;
            transition: all .35s cubic-bezier(.4,0,.2,1);
        }
        .overview-card:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(0,0,0,0.1); border-color: var(--accent); }
        .overview-card:before {
            content: ""; position: absolute; left: 0; top: 0; width: 100%; height: 4px;
            background: linear-gradient(90deg, var(--green), #3b82f6); border-radius: 20px 20px 0 0;
            transition: height .3s ease;
        }
        .overview-card:hover:before { height: 6px; }
        .overview-card .icon {
            width: 52px; height: 52px; border-radius: 14px;
            background: linear-gradient(135deg, rgba(254,192,16,0.12), rgba(59,130,246,0.08));
            color: var(--green); display: grid; place-items: center;
            font-weight: 900; margin-bottom: 18px; font-size: 16px;
            border: 1px solid var(--hairline-strong);
            transition: transform .3s ease;
        }
        .overview-card:hover .icon { transform: scale(1.1); }
        .overview-card h3 { margin: 0 0 10px; color: var(--ink); font-size: 18px; font-weight: 800; }
        .overview-card p { margin: 0; color: var(--muted); font-size: 14px; line-height: 1.65; }

        /* ─── nanoCAD Section ─── */
        .blue-section {
            background: linear-gradient(135deg, #061b41, #0d3a84); color: #fff;
            position: relative; overflow: hidden;
        }
        .blue-section:before {
            content: ""; position: absolute; right: -180px; top: -180px;
            width: 520px; height: 520px; border-radius: 50%;
            background: radial-gradient(circle, rgba(255, 196, 0, .16), transparent 62%);
        }
        .blue-section .hl-container { position: relative; z-index: 1; }
        .blue-section .section-title { color: #fff; }
        .blue-section .lead { color: rgba(255, 255, 255, .78); }
        .blue-section .eyebrow { color: var(--green); }
        .split { display: grid; grid-template-columns: 1fr 1fr; gap: 46px; align-items: center; }
        .feature-list { display: grid; gap: 14px; }
        .feature {
            border: 1px solid rgba(255, 255, 255, .16); background: rgba(255, 255, 255, .08);
            border-radius: 14px; padding: 18px; display: flex; gap: 14px;
            align-items: flex-start; transition: all .3s ease;
        }
        .feature:hover { border-color: rgba(255,255,255,.3); transform: translateX(6px); box-shadow: 0 8px 20px rgba(0,0,0,0.1); }
        .feature .icon {
            width: 48px; height: 48px; border-radius: 12px; display: grid; place-items: center;
            font-weight: 900; font-size: 13px; flex-shrink: 0;
            background: rgba(255, 255, 255, 0.15);
            color: var(--green); border: 1px solid rgba(255, 255, 255, 0.15);
        }
        .feature b { display: block; margin-bottom: 3px; color: #fff; font-size: 15px; }
        .feature span { font-size: 14px; color: rgba(255, 255, 255, .75); line-height: 1.55; }

        /* ─── Products ─── */
        .products-bg { background: transparent; }
        .product-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .product-showcase { align-items: stretch; gap: 24px; }

        .hl-product {
            background: var(--surface-card); border: 1px solid var(--hairline);
            border-radius: 20px; overflow: hidden; box-shadow: var(--shadow-card);
            display: flex; flex-direction: column; align-items: stretch;
            transition: all .35s cubic-bezier(.4,0,.2,1);
        }
        .hl-product:hover { transform: translateY(-8px); box-shadow: 0 20px 50px rgba(0,0,0,0.12); border-color: var(--accent); }
        .hl-product.featured { grid-column: span 2; }

        .product-media {
            flex: none; height: 220px; padding: 24px;
            display: flex; align-items: center; justify-content: center;
            background: linear-gradient(135deg, var(--surface-elevated), var(--surface-card));
            border-bottom: 1px solid var(--hairline); position: relative; overflow: hidden;
        }
        .product-media::after {
            content: ''; position: absolute; inset: 0;
            background: radial-gradient(circle at 80% 20%, rgba(254,192,16,0.06), transparent 60%);
            pointer-events: none;
        }
        .hl-product.featured .product-media { height: 280px; }
        .product-media img {
            max-width: 100%; max-height: 160px; object-fit: contain; display: block;
            filter: drop-shadow(0 10px 14px rgba(0, 0, 0, .4));
            transition: all 0.4s cubic-bezier(.175,.885,.32,1.275); position: relative; z-index: 1;
        }
        .hl-product:hover .product-media img { transform: scale(1.1) translateY(-6px); filter: drop-shadow(0 15px 25px rgba(0, 0, 0, .3)); }
        .hl-product.featured .product-media img { max-height: 220px; }

        .product-content { padding: 24px; flex: 1; display: flex; flex-direction: column; justify-content: flex-start; text-align: center; }
        .product-content small { color: var(--green); font-weight: 900; text-transform: uppercase; letter-spacing: .06em; font-size: 11px; }
        .product-content h3 { color: var(--ink); font-size: 20px; margin: 8px 0 12px; line-height: 1.2; font-weight: 800; }
        .hl-product.featured .product-content h3 { font-size: 26px; }
        .product-content p { color: var(--muted); font-size: 14px; line-height: 1.6; margin: 0; }

        .hl-product.cta-product {
            background: var(--surface-elevated); color: var(--ink); padding: 0;
            grid-column: 1 / -1; text-align: center;
            border: 1px solid var(--hairline-strong); position: relative; overflow: hidden;
        }
        .hl-product.cta-product::before {
            content: ''; position: absolute; inset: 0;
            background: radial-gradient(circle at top right, var(--success-dim), transparent 60%),
                radial-gradient(circle at bottom left, var(--info-dim), transparent 60%);
            pointer-events: none;
        }
        .hl-product.cta-product .product-content {
            padding: 56px; z-index: 1;
            display: flex; flex-direction: column; justify-content: center; align-items: center;
        }
        .hl-product.cta-product h3 { color: var(--ink); font-size: 36px; margin: 0 0 14px; line-height: 1.12; font-weight: 900; }
        .hl-product.cta-product p { color: var(--muted); margin: 0 auto 28px; font-size: 17px; max-width: 600px; line-height: 1.65; }

        .section-actions { margin-top: 40px; display: flex; justify-content: center; gap: 14px; flex-wrap: wrap; }

        /* ─── Packages ─── */
        .packages-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .package {
            background: var(--surface-card); border: 1px solid var(--hairline);
            border-radius: 20px; padding: 28px; box-shadow: var(--shadow-card);
            min-height: 220px; position: relative; overflow: hidden;
            transition: all .35s cubic-bezier(.4,0,.2,1);
        }
        .package:hover { border-color: var(--accent); transform: translateY(-5px); box-shadow: 0 15px 35px rgba(0,0,0,0.1); }
        .package strong { display: block; color: var(--ink); font-size: 20px; margin-bottom: 10px; }
        .package p { margin: 0; color: var(--muted); font-size: 14px; line-height: 1.65; }
        .package-discount {
            display: inline-flex; align-items: center; gap: 4px;
            background: linear-gradient(135deg, #fec010, #f59e0b); color: #000;
            padding: 6px 12px; border-radius: 999px; font-weight: 900; font-size: 12px;
            margin-bottom: 16px; box-shadow: 0 3px 10px rgba(254,192,16,0.25);
        }

        /* ─── Partners & Workflow ─── */
        .workflow-section { background: transparent; }
        .partner-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 46px; }
        .partner-logo {
            min-height: 90px; border: 1px solid var(--hairline); border-radius: 18px;
            background: var(--surface-card); display: grid; place-items: center;
            color: var(--muted); font-weight: 900; box-shadow: var(--shadow-card);
            transition: all .3s ease;
        }
        .partner-logo:hover { border-color: var(--accent); transform: translateY(-3px); }
        .workflow-panel {
            background: linear-gradient(135deg, #061b41, #0d3a84);
            border-radius: 26px; padding: 42px; color: #fff;
            box-shadow: var(--shadow-lg); overflow: hidden; position: relative;
        }
        .workflow-panel:after {
            content: ""; position: absolute; right: -100px; bottom: -120px;
            width: 320px; height: 320px; border-radius: 50%;
            background: radial-gradient(circle, rgba(255, 196, 0, .16), transparent 63%);
        }
        .workflow-panel h3 { color: #fff; font-size: 30px; margin: 0 0 10px; position: relative; z-index: 1; font-weight: 900; }
        .workflow-panel p { margin: 0 0 28px; color: rgba(255, 255, 255, .78); max-width: 800px; position: relative; z-index: 1; }
        .flow {
            display: grid; grid-template-columns: 1fr 40px 1fr 40px 1fr 40px 1fr;
            gap: 10px; align-items: center; position: relative; z-index: 1;
        }
        .flow-step {
            background: rgba(255, 255, 255, .1); border: 1px solid rgba(255, 255, 255, .16);
            border-radius: 14px; min-height: 86px; display: grid; place-items: center;
            text-align: center; padding: 14px; font-weight: 900; font-size: 14px;
            transition: all .3s ease; color: #fff;
        }
        .flow-step:hover { border-color: rgba(255,255,255,0.3); transform: scale(1.03); }
        .flow-arrow { color: var(--green); font-weight: 900; text-align: center; font-size: 24px; }

        /* ─── Contact ─── */
        .contact-section { background: transparent; }
        .contact-card {
            background: var(--surface-card); border: 1px solid var(--hairline);
            border-radius: 28px; box-shadow: var(--shadow-card); padding: 48px;
            display: grid; grid-template-columns: 1.05fr .95fr; gap: 48px; align-items: center;
        }
        .contact-card h2 { margin: 0 0 14px; color: var(--ink); font-size: 36px; line-height: 1.15; font-weight: 900; }
        .contact-card p { margin: 0 0 24px; color: var(--muted); max-width: 620px; }
        .contact-list { display: grid; gap: 12px; }
        .contact-item {
            background: var(--surface-elevated); border: 1px solid var(--hairline-strong);
            border-radius: 14px; padding: 16px 18px; color: var(--ink); font-weight: 750;
            display: flex; align-items: center; gap: 12px;
            transition: all .3s ease;
        }
        .contact-item:hover { border-color: var(--accent); transform: translateX(4px); }
        .contact-icon {
            width: 36px; height: 36px; border-radius: 10px;
            background: linear-gradient(135deg, rgba(254,192,16,0.12), rgba(59,130,246,0.08));
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }

        /* ─── Final CTA ─── */
        .final-cta { background: transparent; }
        .end-cta {
            background: linear-gradient(135deg, #0a1628 0%, #1949a1 60%, #0d2e6b 100%);
            color: #fff; border-radius: 28px; box-shadow: 0 20px 50px rgba(10,22,40,0.25);
            padding: 52px; display: flex; align-items: center;
            justify-content: space-between; gap: 30px;
            overflow: hidden; position: relative; border: none;
        }
        .end-cta:after {
            content: ""; position: absolute; right: -120px; top: -120px;
            width: 330px; height: 330px; border-radius: 50%;
            background: radial-gradient(circle, rgba(254,192,16,0.15), transparent 63%);
        }
        .end-cta > * { position: relative; z-index: 1; }
        .end-cta h2 { margin: 0 0 10px; color: #fff; font-size: 34px; line-height: 1.15; font-weight: 900; }
        .end-cta p { margin: 0; color: rgba(255,255,255,0.75); max-width: 660px; }
        .end-cta .btn-outline { border-color: rgba(255,255,255,0.3); color: #fff; }
        .end-cta .btn-outline:hover { border-color: #fec010; color: #fec010; }

        footer.hl-footer {
            background: transparent; color: var(--muted);
            text-align: center; padding: 30px 0; font-size: 14px;
            border-top: 1px solid var(--hairline);
        }

        /* ─── Scroll Animations ─── */
        .reveal {
            opacity: 0; transform: translateY(30px);
            transition: opacity .7s cubic-bezier(.4,0,.2,1), transform .7s cubic-bezier(.4,0,.2,1);
        }
        .reveal.visible { opacity: 1; transform: translateY(0); }

        /* ─── Responsive ─── */
        @media(max-width:1050px) {
            .hero-inner, .split, .contact-card { grid-template-columns: 1fr; }
            .hero-inner { padding: 70px 0 105px; }
            .hero h1 { font-size: 42px; }
            .overview-grid, .product-grid.product-showcase, .packages-grid, .partner-strip { grid-template-columns: repeat(2, 1fr); }
            .hl-product.featured { grid-column: span 1; }
            .flow { grid-template-columns: 1fr; }
            .flow-arrow { display: none; }
            .end-cta { display: block; }
            .end-cta .cta { margin-top: 24px; }
            .stats-bar { flex-wrap: wrap; gap: 16px; }
            .stat-divider { display: none; }
        }

        @media(max-width:640px) {
            .section { padding: 64px 0; }
            .section-title { font-size: 30px; }
            .hero h1 { font-size: 32px; }
            .hero p { font-size: 16px; }
            .hero-visual { display: none; }
            .overview-grid, .product-grid.product-showcase, .packages-grid, .partner-strip { grid-template-columns: 1fr; }
            .contact-card, .workflow-panel, .end-cta { padding: 28px; }
            .product-media, .hl-product.featured .product-media { min-height: 255px; }
            .product-media img, .hl-product.featured .product-media img { max-height: 290px; }
            .stats-bar { padding: 16px 20px; }
            .stat-value { font-size: 22px; }
        }

        @media(max-width:480px) {
            .hero h1 { font-size: 28px; }
            .section-title { font-size: 26px; }
            .cta { flex-direction: column; width: 100%; gap: 12px; }
            .cta .hl-btn { width: 100%; text-align: center; }
        }
      `}} />

      {/* ═══ HERO ═══ */}
      <section className="hero">
        {/* Floating particles */}
        <div className="floating-particle" />
        <div className="floating-particle" />
        <div className="floating-particle" />
        <div className="floating-particle" />
        <div className="floating-particle" />
        <div className="floating-particle" />

        <div className="hl-container hero-inner">
          <div>
            <div className={`slide ${currentSlide === 0 ? "active" : ""}`}>
              <div className="kicker">AGECS Solutions</div>
              <h1>Engineering Software Built for Real Structural Workflows</h1>
              <p>AGECS Solutions develops practical engineering software that helps structural engineers reduce repetitive drafting, improve detailing accuracy, and maintain full control over their workflow.</p>
              <div className="cta">
                <a href="#products" className="hl-btn btn-yellow">Explore Our Solutions</a>
                <a href="#contact" className="hl-btn btn-outline">Free 30-Day Trial</a>
              </div>
            </div>
            <div className={`slide ${currentSlide === 1 ? "active" : ""}`}>
              <div className="kicker">Official nanoCAD Provider</div>
              <h1>nanoCAD. More for Less.</h1>
              <p>Your official and sole provider of nanoCAD in Egypt and the Middle East. Work seamlessly with powerful DWG-compatible CAD, 2D and 3D drafting tools, and tailored modules to fit your needs.</p>
              <div className="cta">
                <a href="#nanocad" className="hl-btn btn-yellow">Explore nanoCAD</a>
                <a href="#contact" className="hl-btn btn-outline">Request Support</a>
              </div>
            </div>
            <div className={`slide ${currentSlide === 2 ? "active" : ""}`}>
              <div className="kicker">AGECS Ecosystem</div>
              <h1>One Ecosystem for Smarter Engineering Workflows</h1>
              <p>AGECS Solutions brings together specialized tools for drafting, detailing, documentation, and workflow automation — built to support real structural project delivery.</p>
              <div className="cta">
                <a href="#products" className="hl-btn btn-yellow">Explore Products</a>
                <a href="#contact" className="hl-btn btn-outline">Start Free Trial</a>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="stats-bar">
              <div className="stat-item">
                <span className="stat-value"><AnimatedCounter target={100} suffix="+" /></span>
                <span className="stat-label">CAD Tools</span>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <span className="stat-value"><AnimatedCounter target={500} suffix="+" /></span>
                <span className="stat-label">Engineers</span>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <span className="stat-value"><AnimatedCounter target={15} suffix="+" /></span>
                <span className="stat-label">Years</span>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <span className="stat-value"><AnimatedCounter target={24} suffix="/7" /></span>
                <span className="stat-label">Support</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-title"><span className="visual-title-dot"></span>AGECS Solutions 26</div>
            <div className="workflow-cards compact">
              <div className="workflow-card">
                <span className="workflow-card-icon">✏️</span>
                <div className="workflow-card-body"><strong>nanoCAD</strong><span>DWG-compatible CAD environment with AGECS local support.</span></div>
              </div>
              <div className="workflow-card">
                <span className="workflow-card-icon">🏗️</span>
                <div className="workflow-card-body"><strong>RCD / SDS</strong><span>Detailing and drafting tools for structural workflows.</span></div>
              </div>
              <div className="workflow-card full">
                <span className="workflow-card-icon">🔗</span>
                <div className="workflow-card-body"><strong>Drafting → Detailing → Documentation → Delivery</strong><span>A connected workflow designed for real project execution.</span></div>
              </div>
            </div>
          </div>
        </div>
        <div className="dots">
          <span className={`dot ${currentSlide === 0 ? "active" : ""}`} onClick={() => setCurrentSlide(0)}></span>
          <span className={`dot ${currentSlide === 1 ? "active" : ""}`} onClick={() => setCurrentSlide(1)}></span>
          <span className={`dot ${currentSlide === 2 ? "active" : ""}`} onClick={() => setCurrentSlide(2)}></span>
        </div>
      </section>

      {/* ═══ OVERVIEW ═══ */}
      <section id="overview" className="section">
        <div className="hl-container">
          <div className="center reveal">
            <div className="eyebrow">AGECS Overview</div>
            <h2 className="section-title">A Stronger Engineering Software Experience</h2>
            <p className="lead">AGECS combines official nanoCAD services, exclusive engineering tools, real consultancy usage, and direct expert support.</p>
          </div>
          <div className="overview-grid">
            {[
              { num: "01", title: "Official nanoCAD Provider", desc: "AGECS is the official and exclusive nanoCAD provider in Egypt and the Middle East, delivering professional CAD solutions compliant with DWG standards." },
              { num: "02", title: "AGECS Exclusive Solutions", desc: "AGECS develops exclusive CAD modules with 100+ tools tailored to meet real project demands in the engineering market." },
              { num: "03", title: "We Use What We Provide", desc: "We do not just sell nanoCAD. We use it every day across our engineering consultancy workflows and test our solutions on the ground." },
              { num: "04", title: "Instant Expert Support", desc: "Avoid ticketing delays with instant WhatsApp live support from professional engineers who understand real workflow challenges." },
            ].map((card, i) => (
              <article key={i} className="overview-card reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="icon">{card.num}</div>
                <h3>{card.title}</h3>
                <p>{card.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ NANOCAD ═══ */}
      <section id="nanocad" className="section blue-section">
        <div className="hl-container split">
          <div className="reveal">
            <div className="eyebrow">nanoCAD Official Service Provider</div>
            <h2 className="section-title">Official and Sole Service Provider of nanoCAD in Egypt and the Middle East</h2>
            <p className="lead" style={{ marginLeft: 0 }}>AGECS helps engineering teams adopt a reliable, cost-effective CAD environment supported by professional local expertise, implementation support, technical assistance, and workflow guidance.</p>
            <div className="cta">
              <a href="#" className="hl-btn btn-yellow">Explore nanoCAD</a>
              <a href="#contact" className="hl-btn btn-outline">Request nanoCAD Support</a>
            </div>
          </div>
          <div className="feature-list reveal" style={{ transitionDelay: '0.15s' }}>
            <div className="feature">
              <div className="icon">DWG</div>
              <div><b>DWG-Compatible CAD</b><span>Professional CAD platform for drafting and documentation workflows.</span></div>
            </div>
            <div className="feature">
              <div className="icon">2D</div>
              <div><b>2D & 3D Drafting Tools</b><span>A full set of drafting and modelling tools with tailored modules.</span></div>
            </div>
            <div className="feature">
              <div className="icon">⚙</div>
              <div><b>Local Implementation</b><span>Activation, setup, and workflow guidance by AGECS engineers.</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PRODUCTS ═══ */}
      <section id="products" className="section products-bg">
        <div className="hl-container">
          <div className="center reveal">
            <div className="eyebrow">Products</div>
            <h2 className="section-title">Choose the Right AGECS Product for Your Workflow</h2>
            <p className="lead">From reinforcement detailing and steel drafting to CAD productivity and structural documentation.</p>
          </div>
          <div className="product-grid product-showcase">
            {products.slice(0, 7).map((product, index) => (
              <article key={product.id || index} className={`hl-product reveal ${index === 0 ? "featured" : ""}`} style={{ transitionDelay: `${index * 0.08}s` }}>
                <div className="product-media">
                  {product.media && product.media.length > 0 && product.media[0].url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={resolveMediaUrl(product.media[0].url)} alt={product.name || "Product"} />
                  ) : (
                    <div style={{ color: "var(--muted)", fontWeight: "bold", opacity: 0.5, fontSize: index === 0 ? "24px" : "16px" }}>{product.name}</div>
                  )}
                </div>
                <div className="product-content">
                  <small>{product.family || "AGECS Ecosystem"}</small>
                  <h3>{product.name}</h3>
                  <p>{product.miniDescription || "Professional engineering software module for advanced structural workflows."}</p>
                  <div style={{ marginTop: "auto", paddingTop: "1rem" }}>
                    <Link href={`/products/${product.id}`} className="hl-btn btn-light-outline" style={{ minHeight: "38px", fontSize: "12px", padding: "0 18px" }}>
                      Learn More →
                    </Link>
                  </div>
                </div>
              </article>
            ))}

            <article className="hl-product cta-product reveal">
              <div className="product-content">
                <h3>Explore the AGECS Product Ecosystem</h3>
                <p>Choose the right tool for drafting, detailing, modeling, documentation, and workflow automation.</p>
                <div className="cta" style={{ justifyContent: "center" }}>
                  <Link href="/products" className="hl-btn btn-yellow">View All Products</Link>
                </div>
              </div>
            </article>
          </div>
          
          {products.length === 0 && (
            <div className="reveal" style={{ textAlign: "center", padding: "3rem", background: "var(--surface-card)", borderRadius: "20px", marginTop: "2rem", border: "1px solid var(--hairline)" }}>
              <p style={{ color: "var(--muted)", margin: 0 }}>No products available yet...</p>
            </div>
          )}
        </div>
      </section>

      {/* ═══ PACKAGES ═══ */}
      <section id="packages" className="section">
        <div className="hl-container">
          <div className="center reveal">
            <div className="eyebrow">Packages</div>
            <h2 className="section-title">Packages for Engineers, Teams, and Companies</h2>
            <p className="lead">AGECS packages combine software tools and services to provide better value for engineers, teams, and companies.</p>
          </div>
          <div className="packages-grid">
            {[
              { discount: "20% OFF", title: "Individual Packages", desc: "For engineers and freelancers who need professional tools for daily engineering work." },
              { title: "Team Packages", desc: "For small technical office teams that need multiple licenses and workflow support." },
              { title: "Company Packages", desc: "For companies looking to equip their engineering teams with AGECS tools, training, and support." },
              { title: "Training Packages", desc: "For engineers who want to learn how to use AGECS software effectively in real project workflows." },
            ].map((pkg, i) => (
              <article key={i} className="package reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
                {pkg.discount && <span className="package-discount">🏷️ {pkg.discount}</span>}
                <strong>{pkg.title}</strong>
                <p>{pkg.desc}</p>
              </article>
            ))}
          </div>
          <div className="section-actions reveal">
            <a href="#" className="hl-btn btn-blue">Explore Packages</a>
            <a href="#" className="hl-btn btn-light-outline">Company Licenses</a>
          </div>
        </div>
      </section>

      {/* ═══ PARTNERS + WORKFLOW ═══ */}
      <section id="partners" className="section workflow-section">
        <div className="hl-container">
          <div className="center reveal">
            <div className="eyebrow">Trusted Partners</div>
            <h2 className="section-title">Our Trusted Partner & Connected Workflow</h2>
            <p className="lead">Showcase partner logos and connect the AGECS workflow from CAD to documentation and project delivery.</p>
          </div>
          <div className="partner-strip reveal">
            <div className="partner-logo">Partner Logo</div>
            <div className="partner-logo">Partner Logo</div>
            <div className="partner-logo">Partner Logo</div>
            <div className="partner-logo">Partner Logo</div>
          </div>
          <div className="workflow-panel reveal">
            <h3>Connected Workflow for Better Project Delivery</h3>
            <p>AGECS Solutions connects CAD-based workflows with drafting, detailing, documentation, and delivery tools to help engineers reduce friction and work with better control.</p>
            <div className="flow">
              <div className="flow-step">nanoCAD</div>
              <div className="flow-arrow">→</div>
              <div className="flow-step">AGECS Solutions</div>
              <div className="flow-arrow">→</div>
              <div className="flow-step">Drafting & Detailing</div>
              <div className="flow-arrow">→</div>
              <div className="flow-step">Documentation & Delivery</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CONTACT ═══ */}
      <section id="contact" className="section contact-section">
        <div className="hl-container">
          <div className="contact-card reveal">
            <div>
              <div className="eyebrow">Contact</div>
              <h2>Get in Touch with AGECS Solutions</h2>
              <p>Contact our team for product inquiries, demo requests, technical support, nanoCAD services, company licenses, or partnership opportunities.</p>
              <div className="cta">
                <a href="#" className="hl-btn btn-yellow">Request Demo</a>
                <a href="#" className="hl-btn btn-blue">Start Free Trial</a>
              </div>
            </div>
            <div className="contact-list">
              <div className="contact-item">
                <div className="contact-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
                Email: info@agecs-eg.com
              </div>
              <div className="contact-item">
                <div className="contact-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </div>
                Phone / WhatsApp: +201012345678
              </div>
              <div className="contact-item">
                <div className="contact-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                Office Address: Cairo, Egypt
              </div>
              <div className="contact-item">
                <div className="contact-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                </div>
                Social Media Links
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="section final-cta">
        <div className="hl-container">
          <div className="end-cta reveal">
            <div>
              <h2>Ready to Work Smarter with AGECS Solutions?</h2>
              <p>Explore our products, start your free trial, or request support from our engineering software team.</p>
            </div>
            <div className="cta">
              <a href="#" className="hl-btn btn-yellow">Start Free Trial</a>
              <a href="#" className="hl-btn btn-outline">Request Demo</a>
            </div>
          </div>
        </div>
      </section>

      <footer className="hl-footer">
        AGECS Solutions © 2026 — Engineering Software Built for Real Structural Workflows
      </footer>
    </div>
  );
}
