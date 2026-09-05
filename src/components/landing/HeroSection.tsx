"use client";
import React from 'react';
import { useState, useEffect } from 'react';

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideCount = 3;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideCount);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <section className="hero">
      <div className="container hero-inner">
        <div>
          <div className={`slide ${currentSlide === 0 ? 'active' : ''}`}>
            <div className="kicker">AGECS Solutions</div>
            <h1>Engineering Software Built for Real Structural Workflows</h1>
            <p>AGECS Solutions develops practical engineering software that helps structural engineers reduce repetitive
              drafting, improve detailing accuracy, and maintain full control over their workflow.</p>
            <div className="cta">
              <a href="#products" className="btn btn-yellow">Explore Our Solutions</a>
              <a href="#contact" className="btn btn-outline">Free 30-Day Trial</a>
            </div>
          </div>
          <div className={`slide ${currentSlide === 1 ? 'active' : ''}`}>
            <div className="kicker">Official nanoCAD Provider</div>
            <h1>nanoCAD. More for Less.</h1>
            <p>Your official and sole provider of nanoCAD in Egypt and the Middle East. Work seamlessly with powerful
              DWG-compatible CAD, 2D and 3D drafting tools, and tailored modules to fit your needs.</p>
            <div className="cta">
              <a href="#nanocad" className="btn btn-yellow">Explore nanoCAD</a>
              <a href="#contact" className="btn btn-outline">Request Support</a>
            </div>
          </div>
          <div className={`slide ${currentSlide === 2 ? 'active' : ''}`}>
            <div className="kicker">AGECS Ecosystem</div>
            <h1>One Ecosystem for Smarter Engineering Workflows</h1>
            <p>AGECS Solutions brings together specialized tools for drafting, detailing, documentation, and workflow
              automation — built to support real structural project delivery.</p>
            <div className="cta">
              <a href="#products" className="btn btn-yellow">Explore Products</a>
              <a href="#contact" className="btn btn-outline">Start Free Trial</a>
            </div>
          </div>
        </div>

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
      </div>
      <div className="dots">
        {[0, 1, 2].map((idx) => (
          <span 
            key={idx} 
            className={`dot ${currentSlide === idx ? 'active' : ''}`} 
            onClick={() => setCurrentSlide(idx)}
          />
        ))}
      </div>
    </section>
    </>
  );
}
