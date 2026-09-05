"use client";
import React from 'react';


export default function FeaturesSection() {
  return (
    <>
      <section id="nanocad" className="section blue-section">
      <div className="container split">
        <div>
          <div className="eyebrow">nanoCAD Official Service Provider</div>
          <h2 className="section-title">Official and Sole Service Provider of nanoCAD in Egypt and the Middle East</h2>
          <p className="lead" style={{marginLeft: '0'}}>AGECS helps engineering teams adopt a reliable, cost-effective CAD
            environment supported by professional local expertise, implementation support, technical assistance, and
            workflow guidance.</p>
          <div className="cta">
            <a href="#" className="btn btn-yellow">Explore nanoCAD</a>
            <a href="#contact" className="btn btn-outline">Request nanoCAD Support</a>
          </div>
        </div>

        <div className="feature-list">
          <div className="feature">
            <div className="icon">DWG</div>
            <div><b>DWG-Compatible CAD</b><span>Professional CAD platform for drafting and documentation
                workflows.</span></div>
          </div>
          <div className="feature">
            <div className="icon">2D</div>
            <div><b>2D & 3D Drafting Tools</b><span>A full set of drafting and modelling tools with tailored
                modules.</span></div>
          </div>
          <div className="feature">
            <div className="icon">⚙</div>
            <div><b>Local Implementation</b><span>Activation, setup, and workflow guidance by AGECS engineers.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
    </>
  );
}
