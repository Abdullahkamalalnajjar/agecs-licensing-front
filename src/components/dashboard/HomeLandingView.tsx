"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ProductDto } from "@/client/types.gen";
import { resolveMediaUrl } from "@/lib/mediaUrl";

interface HomeLandingViewProps {
  products: ProductDto[];
}

export default function HomeLandingView({ products }: HomeLandingViewProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 3;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="home-landing-container">
      <style dangerouslySetInnerHTML={{ __html: `
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
            font-family: var(--font-primary);
            color: var(--text);
            background: transparent;
            line-height: 1.58;
            margin: -2rem; /* Negate the dashboard padding if needed */
        }

        .home-landing-container * {
            box-sizing: border-box;
        }

        .home-landing-container a {
            text-decoration: none;
            color: inherit;
        }

        .hl-container {
            max-width: var(--container);
            margin: auto;
            padding: 0 24px;
        }

        /* Top offer bar */
        .promo-bar {
            background: var(--surface-card);
            border-bottom: 1px solid var(--hairline);
            min-height: 46px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            font-weight: 600;
            letter-spacing: 0.02em;
            color: var(--ink);
            font-size: 13.5px;
            text-align: center;
            padding: 8px 24px;
        }

        .promo-bar .discount {
            background: var(--success-dim);
            color: var(--success);
            padding: 4px 10px;
            border-radius: 100px;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.05em;
            display: inline-flex;
            align-items: center;
        }

        .promo-bar .buy {
            margin-left: 12px;
            background: var(--green);
            color: #000;
            padding: 6px 16px;
            border-radius: 100px;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.01em;
            box-shadow: 0 2px 10px var(--success-dim);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: inline-flex;
            align-items: center;
            line-height: 1;
        }

        .promo-bar .buy:hover {
            background: var(--accent-light);
            transform: translateY(-1px);
        }

        /* Buttons */
        .hl-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 48px;
            padding: 0 24px;
            border-radius: var(--radius-pill);
            font-size: 14px;
            font-weight: 900;
            text-transform: uppercase;
            transition: .25s ease;
            cursor: pointer;
            border: 1px solid transparent;
        }

        .hl-btn:hover {
            transform: translateY(-2px);
        }

        .btn-yellow { background: var(--green); color: #000; }
        .btn-blue { background: var(--surface-elevated); color: var(--ink); border: 1px solid var(--hairline-strong); }
        .btn-outline { border-color: var(--hairline-strong); color: var(--ink); }
        .btn-light-outline { border-color: var(--hairline-strong); color: var(--ink); background: transparent; }
        .btn-light-outline:hover { border-color: var(--green); color: var(--green); }

        .cta { display: flex; gap: 14px; flex-wrap: wrap; align-items: center; }

        /* Hero */
        .hero {
            position: relative;
            min-height: 660px;
            overflow: hidden;
            background: radial-gradient(circle at 82% 18%, var(--success-dim), transparent 22%),
                linear-gradient(115deg, var(--canvas) 0%, var(--surface-card) 52%, var(--canvas) 100%);
            color: var(--ink);
        }

        .hero:before {
            content: "";
            position: absolute;
            inset: 0;
            background-image:
                linear-gradient(rgba(255, 255, 255, .02) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, .02) 1px, transparent 1px);
            background-size: 48px 48px;
            opacity: .8;
        }

        .hero:after {
            content: "";
            position: absolute;
            right: -160px;
            top: 80px;
            width: 560px;
            height: 560px;
            border-radius: 50%;
            border: 1px solid var(--hairline);
            box-shadow: inset 0 0 0 30px var(--surface-soft), inset 0 0 0 90px var(--surface-card);
        }

        .hero-inner {
            position: relative;
            z-index: 1;
            min-height: 660px;
            display: grid;
            grid-template-columns: 1.1fr .9fr;
            align-items: center;
            gap: 60px;
        }

        .slide { display: none; animation: fade .65s ease both; }
        .slide.active { display: block; }

        @keyframes fade {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .kicker { color: var(--green); text-transform: uppercase; letter-spacing: .14em; font-weight: 900; font-size: 13px; margin-bottom: 16px; }
        .hero h1 { font-size: 58px; line-height: 1.05; margin: 0 0 22px; max-width: 780px; letter-spacing: -.045em; color: var(--ink); }
        .hero p { max-width: 690px; font-size: 19px; line-height: 1.65; color: var(--muted); margin: 0 0 30px; }

        .hero-visual {
            min-height: 500px;
            border-radius: 28px;
            background: var(--surface-card);
            box-shadow: var(--shadow-hero);
            padding: 30px;
            position: relative;
            overflow: hidden;
            border: 1px solid var(--hairline);
        }

        .hero-visual::before {
            content: "";
            position: absolute; top: -1px; left: -1px; right: -1px; bottom: -1px;
            border-radius: 28px;
            background: linear-gradient(135deg, var(--success-dim) 0%, transparent 40%, transparent 60%, var(--info-dim) 100%);
            pointer-events: none; opacity: .6; z-index: 0;
        }

        .hero-visual:after {
            content: "";
            position: absolute; right: -70px; bottom: -70px; width: 300px; height: 300px;
            border-radius: 50%;
            background: radial-gradient(circle, var(--success-dim), transparent 65%);
            pointer-events: none;
        }

        .hero-visual > * { position: relative; z-index: 1; }

        @keyframes hv-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: .5; transform: scale(.85); }
        }

        .visual-title {
            display: inline-flex; align-items: center; gap: 8px; color: var(--ink); font-weight: 700; font-size: 11px;
            margin-bottom: 20px; letter-spacing: .1em; text-transform: uppercase; background: var(--surface-elevated);
            border: 1px solid var(--hairline-strong); padding: 6px 14px 6px 10px; border-radius: 100px;
        }

        .visual-title-dot {
            width: 7px; height: 7px; border-radius: 50%; background: var(--green); box-shadow: 0 0 10px var(--green);
            animation: hv-pulse 2s ease-in-out infinite; flex-shrink: 0;
        }

        .workflow-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; position: relative; z-index: 1; }

        .workflow-card {
            background: var(--surface-elevated); color: var(--ink); border-radius: 14px; padding: 16px; min-height: 110px;
            border: 1px solid var(--hairline-strong); backdrop-filter: blur(6px);
            transition: background .25s, border-color .25s, transform .25s;
        }

        .workflow-card:hover { background: var(--surface-soft); border-color: var(--accent); transform: translateY(-2px); }
        .workflow-card strong { display: block; font-size: 15px; margin-bottom: 6px; color: var(--ink); }
        .workflow-card span { display: block; color: var(--muted); font-size: 12px; line-height: 1.5; }
        .workflow-card.full { grid-column: 1/-1; background: var(--surface-elevated); border-color: var(--hairline-strong); }
        .workflow-card.full strong { background: linear-gradient(90deg, var(--green), #60d4ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

        .dots { position: absolute; bottom: 28px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; z-index: 2; }
        .dot { width: 34px; height: 5px; border-radius: 20px; background: var(--hairline-strong); cursor: pointer; }
        .dot.active { width: 56px; background: var(--green); }

        .workflow-cards.compact .workflow-card { min-height: auto; padding: 14px 16px; display: flex; align-items: flex-start; gap: 10px; }
        .workflow-card-icon { font-size: 18px; flex-shrink: 0; margin-top: 1px; line-height: 1; }
        .workflow-card-body { flex: 1; }

        /* Shared sections */
        .section { padding: 86px 0; }
        .center { text-align: center; }
        .eyebrow { color: var(--green); font-size: 12px; font-weight: 900; letter-spacing: .14em; text-transform: uppercase; margin-bottom: 12px; }
        .section-title { font-size: 38px; line-height: 1.18; color: var(--ink); margin: 0 0 12px; font-weight: 900; }
        .lead { font-size: 17px; color: var(--muted); max-width: 800px; margin: 0 auto 40px; line-height: 1.65; }

        /* Overview */
        .overview-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .overview-card {
            background: var(--surface-card); border: 1px solid var(--hairline); border-radius: 18px; padding: 26px;
            box-shadow: var(--shadow-card); min-height: 230px; position: relative; overflow: hidden;
        }
        .overview-card:before { content: ""; position: absolute; left: 0; top: 0; width: 100%; height: 5px; background: linear-gradient(90deg, var(--green), var(--accent-light)); }
        .overview-card .icon { width: 48px; height: 48px; border-radius: 12px; background: var(--surface-elevated); color: var(--green); display: grid; place-items: center; font-weight: 900; margin-bottom: 16px; border: 1px solid var(--hairline-strong); }
        .overview-card h3 { margin: 0 0 10px; color: var(--ink); font-size: 18px; }
        .overview-card p { margin: 0; color: var(--muted); font-size: 14px; line-height: 1.6; }

        /* nanoCAD */
        .blue-section { background: var(--surface-card); color: var(--ink); position: relative; overflow: hidden; border-top: 1px solid var(--hairline); border-bottom: 1px solid var(--hairline); }
        .blue-section:before { content: ""; position: absolute; right: -180px; top: -180px; width: 520px; height: 520px; border-radius: 50%; background: radial-gradient(circle, var(--warning-dim), transparent 62%); }
        .blue-section .hl-container { position: relative; z-index: 1; }
        .blue-section .section-title { color: var(--ink); }
        .blue-section .lead { color: var(--muted); }
        .blue-section .eyebrow { color: var(--green); }
        .split { display: grid; grid-template-columns: 1fr 1fr; gap: 46px; align-items: center; }
        .feature-list { display: grid; gap: 14px; }
        .feature { border: 1px solid var(--hairline); background: var(--surface-elevated); border-radius: 14px; padding: 18px; display: flex; gap: 14px; align-items: flex-start; }
        .feature b { display: block; margin-bottom: 3px; color: var(--ink); }
        .feature span { font-size: 14px; color: var(--muted); }

        /* Products */
        .products-bg { background: transparent; }
        .product-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; }
        .product-showcase { align-items: stretch; gap: 24px; }

        .hl-product {
            background: var(--surface-card); border: 1px solid var(--hairline); border-radius: 16px; overflow: hidden;
            box-shadow: var(--shadow-card); display: flex; flex-direction: column; align-items: stretch;
            transition: .25s ease;
        }
        .hl-product:hover { transform: translateY(-5px); box-shadow: var(--shadow-lg); border-color: var(--accent-border); }
        .hl-product.featured { grid-column: span 2; }

        .product-media {
            flex: none; height: 220px; padding: 24px; display: flex; align-items: center; justify-content: center;
            background: var(--surface-elevated);
            border-bottom: 1px solid var(--hairline);
        }
        .hl-product.featured .product-media { height: 280px; }
        .product-media img { max-width: 100%; max-height: 160px; object-fit: contain; display: block; filter: drop-shadow(0 10px 14px rgba(0, 0, 0, .5)); transition: transform 0.3s ease; }
        .hl-product:hover .product-media img { transform: scale(1.08) translateY(-4px); }
        .hl-product.featured .product-media img { max-height: 220px; }

        .product-content { padding: 24px; flex: 1; display: flex; flex-direction: column; justify-content: flex-start; text-align: center; }
        .product-content small { color: var(--green); font-weight: 900; text-transform: uppercase; letter-spacing: .04em; font-size: 11px; }
        .product-content h3 { color: var(--ink); font-size: 20px; margin: 8px 0 12px; line-height: 1.2; }
        .hl-product.featured .product-content h3 { font-size: 26px; }
        .product-content p { color: var(--muted); font-size: 14px; line-height: 1.5; margin: 0; }

        .hl-product.cta-product {
            background: var(--surface-elevated); color: var(--ink); padding: 0; grid-column: 1 / -1; text-align: center;
            border: 1px solid var(--hairline-strong); position: relative; overflow: hidden;
            box-shadow: var(--shadow-card);
        }
        .hl-product.cta-product::before {
            content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            background: radial-gradient(circle at top right, var(--success-dim), transparent 60%), radial-gradient(circle at bottom left, var(--info-dim), transparent 60%);
            pointer-events: none;
        }
        .hl-product.cta-product .product-content { padding: 64px; flex: 1; text-align: center; z-index: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; }
        .hl-product.cta-product h3 { color: var(--ink); font-size: 40px; margin: 0 0 16px; line-height: 1.1; font-weight: 800; }
        .hl-product.cta-product p { color: var(--muted); margin: 0 auto 32px; font-size: 18px; max-width: 600px; line-height: 1.6; }

        .section-actions { margin-top: 36px; display: flex; justify-content: center; gap: 14px; flex-wrap: wrap; }

        /* Packages */
        .packages-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; }
        .package { background: var(--surface-card); border: 1px solid var(--hairline); border-radius: 18px; padding: 26px; box-shadow: var(--shadow-card); min-height: 210px; position: relative; overflow: hidden; transition: .2s ease; }
        .package:hover { border-color: var(--accent); }
        .package strong { display: block; color: var(--ink); font-size: 20px; margin-bottom: 9px; }
        .package p { margin: 0; color: var(--muted); font-size: 14px; line-height: 1.6; }
        .package-discount { display: inline-block; background: var(--green); color: #000; padding: 6px 10px; border-radius: 999px; font-weight: 900; font-size: 12px; margin-bottom: 15px; }

        /* Partner and workflow */
        .workflow-section { background: transparent; }
        .partner-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 42px; }
        .partner-logo { min-height: 86px; border: 1px solid var(--hairline); border-radius: 16px; background: var(--surface-card); display: grid; place-items: center; color: var(--muted); font-weight: 900; box-shadow: var(--shadow-card); }
        .workflow-panel { background: var(--surface-elevated); border: 1px solid var(--hairline-strong); border-radius: 26px; padding: 42px; color: var(--ink); box-shadow: var(--shadow-lg); overflow: hidden; position: relative; }
        .workflow-panel:after { content: ""; position: absolute; right: -100px; bottom: -120px; width: 320px; height: 320px; border-radius: 50%; background: radial-gradient(circle, var(--warning-dim), transparent 63%); }
        .workflow-panel h3 { color: var(--ink); font-size: 30px; margin: 0 0 10px; position: relative; z-index: 1; }
        .workflow-panel p { margin: 0 0 28px; color: var(--muted); max-width: 800px; position: relative; z-index: 1; }
        .flow { display: grid; grid-template-columns: 1fr 40px 1fr 40px 1fr 40px 1fr; gap: 10px; align-items: center; position: relative; z-index: 1; }
        .flow-step { background: var(--surface-card); border: 1px solid var(--hairline); border-radius: 14px; min-height: 86px; display: grid; place-items: center; text-align: center; padding: 14px; font-weight: 900; }
        .flow-arrow { color: var(--green); font-weight: 900; text-align: center; font-size: 24px; }

        /* Contact */
        .contact-section { background: transparent; }
        .contact-card { background: var(--surface-card); border: 1px solid var(--hairline); border-radius: 26px; box-shadow: var(--shadow-card); padding: 44px; display: grid; grid-template-columns: 1.05fr .95fr; gap: 44px; align-items: center; }
        .contact-card h2 { margin: 0 0 12px; color: var(--ink); font-size: 36px; line-height: 1.15; }
        .contact-card p { margin: 0 0 22px; color: var(--muted); max-width: 620px; }
        .contact-list { display: grid; gap: 12px; }
        .contact-item { background: var(--surface-elevated); border: 1px solid var(--hairline-strong); border-radius: 14px; padding: 15px 16px; color: var(--ink); font-weight: 750; }

        /* Final CTA */
        .final-cta { background: transparent; }
        .end-cta { background: var(--surface-card); border: 1px solid var(--hairline); color: var(--ink); border-radius: 26px; box-shadow: var(--shadow-lg); padding: 46px; display: flex; align-items: center; justify-content: space-between; gap: 30px; overflow: hidden; position: relative; }
        .end-cta:after { content: ""; position: absolute; right: -120px; top: -120px; width: 330px; height: 330px; border-radius: 50%; background: radial-gradient(circle, var(--warning-dim), transparent 63%); }
        .end-cta > * { position: relative; z-index: 1; }
        .end-cta h2 { margin: 0 0 8px; color: var(--ink); font-size: 34px; line-height: 1.15; }
        .end-cta p { margin: 0; color: var(--muted); max-width: 660px; }

        footer.hl-footer { background: transparent; color: var(--muted); text-align: center; padding: 26px 0; font-size: 14px; border-top: 1px solid var(--hairline); }

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
        }

        @media(max-width:640px) {
            .promo-bar { font-size: 12px; padding: 8px 12px; flex-wrap: wrap; }
            .promo-bar .discount { font-size: 18px; }
            .section { padding: 64px 0; }
            .section-title { font-size: 30px; }
            .hero h1 { font-size: 34px; }
            .hero p { font-size: 16px; }
            .hero-visual { display: none; }
            .overview-grid, .product-grid.product-showcase, .packages-grid, .partner-strip { grid-template-columns: 1fr; }
            .contact-card, .workflow-panel, .end-cta { padding: 28px; }
            .product-media, .hl-product.featured .product-media { min-height: 255px; }
            .product-media img, .hl-product.featured .product-media img { max-height: 290px; }
        }
      `}} />



      {/* HERO */}
      <section className="hero">
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

      {/* AGECS OVERVIEW */}
      <section id="overview" className="section">
        <div className="hl-container">
          <div className="center">
            <div className="eyebrow">AGECS Overview</div>
            <h2 className="section-title">A Stronger Engineering Software Experience</h2>
            <p className="lead">AGECS combines official nanoCAD services, exclusive engineering tools, real consultancy usage, and direct expert support.</p>
          </div>
          <div className="overview-grid">
            <article className="overview-card">
              <div className="icon">01</div>
              <h3>Official nanoCAD Provider</h3>
              <p>AGECS is the official and exclusive nanoCAD provider in Egypt and the Middle East, delivering professional CAD solutions compliant with DWG standards.</p>
            </article>
            <article className="overview-card">
              <div className="icon">02</div>
              <h3>AGECS Exclusive Solutions</h3>
              <p>AGECS develops exclusive CAD modules with 100+ tools tailored to meet real project demands in the engineering market.</p>
            </article>
            <article className="overview-card">
              <div className="icon">03</div>
              <h3>We Use What We Provide</h3>
              <p>We do not just sell nanoCAD. We use it every day across our engineering consultancy workflows and test our solutions on the ground.</p>
            </article>
            <article className="overview-card">
              <div className="icon">04</div>
              <h3>Instant Expert Support</h3>
              <p>Avoid ticketing delays with instant WhatsApp live support from professional engineers who understand real workflow challenges.</p>
            </article>
          </div>
        </div>
      </section>

      {/* OFFICIAL nanoCAD SERVICE PROVIDER */}
      <section id="nanocad" className="section blue-section">
        <div className="hl-container split">
          <div>
            <div className="eyebrow">nanoCAD Official Service Provider</div>
            <h2 className="section-title">Official and Sole Service Provider of nanoCAD in Egypt and the Middle East</h2>
            <p className="lead" style={{ marginLeft: 0 }}>AGECS helps engineering teams adopt a reliable, cost-effective CAD environment supported by professional local expertise, implementation support, technical assistance, and workflow guidance.</p>
            <div className="cta">
              <a href="#" className="hl-btn btn-yellow">Explore nanoCAD</a>
              <a href="#contact" className="hl-btn btn-outline">Request nanoCAD Support</a>
            </div>
          </div>
          <div className="feature-list">
            <div className="feature">
              <div className="icon" style={{ background: "transparent", color: "var(--green)" }}>DWG</div>
              <div><b>DWG-Compatible CAD</b><span>Professional CAD platform for drafting and documentation workflows.</span></div>
            </div>
            <div className="feature">
              <div className="icon" style={{ background: "transparent", color: "var(--green)" }}>2D</div>
              <div><b>2D & 3D Drafting Tools</b><span>A full set of drafting and modelling tools with tailored modules.</span></div>
            </div>
            <div className="feature">
              <div className="icon" style={{ background: "transparent", color: "var(--green)" }}>⚙</div>
              <div><b>Local Implementation</b><span>Activation, setup, and workflow guidance by AGECS engineers.</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTS (DYNAMIC FROM API) */}
      <section id="products" className="section products-bg">
        <div className="hl-container">
          <div className="center">
            <div className="eyebrow">Products</div>
            <h2 className="section-title">Choose the Right AGECS Product for Your Workflow</h2>
            <p className="lead">From reinforcement detailing and steel drafting to CAD productivity and structural documentation.</p>
          </div>
          <div className="product-grid product-showcase">
            {products.slice(0, 7).map((product, index) => (
              <article key={product.id || index} className={`hl-product ${index === 0 ? "featured" : ""}`}>
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
                  
                  <div style={{ marginTop: "1rem" }}>
                    <Link href={`/products/${product.id}`} className="hl-btn btn-light-outline" style={{ minHeight: "36px", fontSize: "12px", padding: "0 16px" }}>
                      Learn More
                    </Link>
                  </div>
                </div>
              </article>
            ))}

            <article className="hl-product cta-product">
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
            <div style={{ textAlign: "center", padding: "3rem", background: "white", borderRadius: "16px", marginTop: "2rem" }}>
              <p style={{ color: "var(--muted)" }}>No products available yet...</p>
            </div>
          )}
        </div>
      </section>

      {/* PACKAGES */}
      <section id="packages" className="section">
        <div className="hl-container">
          <div className="center">
            <div className="eyebrow">Packages</div>
            <h2 className="section-title">Packages for Engineers, Teams, and Companies</h2>
            <p className="lead">AGECS packages combine software tools and services to provide better value for engineers, teams, and companies.</p>
          </div>
          <div className="packages-grid">
            <article className="package">
              <span className="package-discount">20% OFF</span>
              <strong>Individual Packages</strong>
              <p>For engineers and freelancers who need professional tools for daily engineering work.</p>
            </article>
            <article className="package">
              <strong>Team Packages</strong>
              <p>For small technical office teams that need multiple licenses and workflow support.</p>
            </article>
            <article className="package">
              <strong>Company Packages</strong>
              <p>For companies looking to equip their engineering teams with AGECS tools, training, and support.</p>
            </article>
            <article className="package">
              <strong>Training Packages</strong>
              <p>For engineers who want to learn how to use AGECS software effectively in real project workflows.</p>
            </article>
          </div>
          <div className="section-actions">
            <a href="#" className="hl-btn btn-blue">Explore Packages</a>
            <a href="#" className="hl-btn btn-light-outline">Company Licenses</a>
          </div>
        </div>
      </section>

      {/* TRUSTED PARTNERS + CONNECTED WORKFLOW */}
      <section id="partners" className="section workflow-section">
        <div className="hl-container">
          <div className="center">
            <div className="eyebrow">Trusted Partners</div>
            <h2 className="section-title">Our Trusted Partner & Connected Workflow</h2>
            <p className="lead">Showcase partner logos and connect the AGECS workflow from CAD to documentation and project delivery.</p>
          </div>
          <div className="partner-strip">
            <div className="partner-logo">Partner Logo</div>
            <div className="partner-logo">Partner Logo</div>
            <div className="partner-logo">Partner Logo</div>
            <div className="partner-logo">Partner Logo</div>
          </div>
          <div className="workflow-panel">
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

      {/* CONTACTS */}
      <section id="contact" className="section contact-section">
        <div className="hl-container">
          <div className="contact-card">
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
              <div className="contact-item">Email: info@agecs-eg.com</div>
              <div className="contact-item">Phone / WhatsApp: +201012345678</div>
              <div className="contact-item">Office Address: Cairo, Egypt</div>
              <div className="contact-item">Social Media Links</div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="section final-cta">
        <div className="hl-container">
          <div className="end-cta">
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
