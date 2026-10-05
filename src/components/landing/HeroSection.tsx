"use client";
import React from 'react';
import Link from 'next/link';
import { HeroIcon } from '@/lib/heroIcons';
import { resolveButtonLink, useHeroSlides } from '@/lib/heroSlides';
import { resolveMediaUrl } from '@/lib/mediaUrl';

export default function HeroSection() {
  const { slides, current: currentSlide, setCurrent: setCurrentSlide } = useHeroSlides();
  const activeSlide = slides[currentSlide] ?? slides[0];

  return (
    <>
      <section className="hero">
      <div className="container hero-inner">
        <div>
          {slides.map((slide, index) => (
            <div key={slide.id || index} className={`slide ${currentSlide === index ? 'active' : ''}`}>
              {slide.badge && <div className="kicker">{slide.badge}</div>}
              <h1>{slide.title}</h1>
              {slide.description && <p>{slide.description}</p>}
              {(slide.buttons ?? []).length > 0 && (
                <div className="cta">
                  {(slide.buttons ?? []).map((button, i) => {
                    const className = `btn ${button.variant === 'secondary' ? 'btn-outline' : 'btn-yellow'}`;
                    const content = <><HeroIcon name={button.icon} size={17} /><span>{button.text}</span></>;
                    const link = resolveButtonLink(button.url);
                    return link.kind === 'route'
                      ? <Link key={i} href={link.href} className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{content}</Link>
                      : <a key={i} href={link.href} className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                          {...(link.kind === 'external' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{content}</a>;
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {activeSlide?.imageUrl ? (
        <div className="hero-visual" key={activeSlide.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={resolveMediaUrl(activeSlide.imageUrl)} alt={activeSlide.title || ''} style={{ maxWidth: '100%', maxHeight: 420, objectFit: 'contain' }} />
        </div>
        ) : (
        <div className="hero-visual">
          <div className="visual-title"><span className="visual-title-dot"></span>AGECS Solutions 26</div>
          <div className="release-badges">
            <div className="release-badge"><img
                src="/placeholder.png"
                alt="SES 26" /></div>
            <div className="release-badge"><img
                src="/placeholder.png"
                alt="HBM 26" /></div>
          </div>
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
        )}
      </div>
      {slides.length > 1 && (
        <div className="dots">
          {slides.map((slide, idx) => (
            <span
              key={slide.id || idx}
              className={`dot ${currentSlide === idx ? 'active' : ''}`}
              onClick={() => setCurrentSlide(idx)}
            />
          ))}
        </div>
      )}
    </section>
    </>
  );
}
