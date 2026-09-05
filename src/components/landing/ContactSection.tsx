"use client";
import React from 'react';


export default function ContactSection() {
  return (
    <>
      <section id="contact" className="section contact-section">
      <div className="container">
        <div className="contact-card">
          <div>
            <div className="eyebrow">Contact</div>
            <h2>Get in Touch with AGECS Solutions</h2>
            <p>Contact our team for product inquiries, demo requests, technical support, nanoCAD services, company
              licenses, or partnership opportunities.</p>
            <div className="cta">
              <a href="#" className="btn btn-yellow">Request Demo</a>
              <a href="#" className="btn btn-blue">Start Free Trial</a>
            </div>
          </div>

          <div className="contact-list">
            <div className="contact-item">Email: info@agecs-eg.com</div>
            <div className="contact-item">Phone / WhatsApp</div>
            <div className="contact-item">Office Address</div>
            <div className="contact-item">Social Media Links</div>
          </div>
        </div>
      </div>
    </section>
    </>
  );
}
