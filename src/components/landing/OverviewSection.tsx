"use client";
import React from 'react';


export default function OverviewSection() {
  return (
    <>
      <section id="overview" className="section">
      <div className="container">
        <div className="center">
          <div className="eyebrow">AGECS Overview</div>
          <h2 className="section-title">A Stronger Engineering Software Experience</h2>
          <p className="lead">AGECS combines official nanoCAD services, exclusive engineering tools, real consultancy usage,
            and direct expert support.</p>
        </div>

        <div className="overview-grid">
          <article className="overview-card">
            <div className="icon">01</div>
            <h3>Official nanoCAD Provider</h3>
            <p>AGECS is the official and exclusive nanoCAD provider in Egypt and the Middle East, delivering
              professional CAD solutions compliant with DWG standards.</p>
          </article>

          <article className="overview-card">
            <div className="icon">02</div>
            <h3>AGECS Exclusive Solutions</h3>
            <p>AGECS develops exclusive CAD modules with 100+ tools tailored to meet real project demands in the
              engineering market.</p>
          </article>

          <article className="overview-card">
            <div className="icon">03</div>
            <h3>We Use What We Provide</h3>
            <p>We do not just sell nanoCAD. We use it every day across our engineering consultancy workflows and test
              our solutions on the ground.</p>
          </article>

          <article className="overview-card">
            <div className="icon">04</div>
            <h3>Instant Expert Support</h3>
            <p>Avoid ticketing delays with instant WhatsApp live support from professional engineers who understand real
              workflow challenges.</p>
          </article>
        </div>
      </div>
    </section>
    </>
  );
}
