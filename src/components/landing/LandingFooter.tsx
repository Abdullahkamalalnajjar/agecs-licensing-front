"use client";
import React from 'react';


export default function LandingFooter() {
  return (
    <>
      <footer className="site-footer" role="contentinfo">
    <div className="container footer-inner">
      <div className="footer-col footer-brand">
        <a href="#" className="footer-logo" aria-label="AGECS Software Solutions">
          <img src="agecs-theme/assets/images/logo.png" alt="AGECS Software Solutions" loading="lazy" />
        </a>
        <p className="footer-tagline">Engineering Software Built for Real Structural Workflows</p>
        <div className="footer-social" aria-label="Social Media">
          <a href="#" aria-label="Facebook">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </a>
          <a href="#" aria-label="LinkedIn">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          </a>
          <a href="#" aria-label="YouTube">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
          </a>
        </div>
      </div>

      <div className="footer-col">
        <h4 className="footer-title">Quick Links</h4>
        <ul className="footer-links">
          <li><a href="#">Home</a></li>
          <li><a href="#">About Us</a></li>
          <li><a href="#">Products</a></li>
          <li><a href="#">Shop</a></li>
          <li><a href="#">FAQ</a></li>
          <li><a href="#">Contact</a></li>
        </ul>
      </div>

      <div className="footer-col">
        <h4 className="footer-title">Products</h4>
        <ul className="footer-links">
          <li><a href="#">nanoCAD</a></li>
          <li><a href="#">nanoCAD Construction</a></li>
          <li><a href="#">KOMPAS-3D</a></li>
          <li><a href="#">Vault</a></li>
          <li><a href="#">View All Products</a></li>
        </ul>
      </div>

      <div className="footer-col footer-contact-col">
        <h4 className="footer-title">Contact Us</h4>
        <ul className="footer-contact">
          <li>
            <span className="contact-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            </span>
            <a href="mailto:support@agecs-eg.com">support@agecs-eg.com</a>
          </li>
          <li>
            <span className="contact-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            </span>
            <a href="tel:+202123456789">+20 2 123 456 789</a>
          </li>
          <li>
            <span className="contact-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            </span>
            <span>Cairo, Egypt</span>
          </li>
        </ul>
      </div>
    </div>

    <div className="footer-bottom">
      <div className="container">
        <p>&copy; 2026 <a href="#">AGECS Software Solutions</a> — All rights reserved.</p>
      </div>
    </div>
  </footer>
    </>
  );
}
