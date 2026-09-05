"use client";
import React from 'react';
import Link from 'next/link';
import { useState } from 'react';

export default function LandingHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <div className="promo-bar">
        <span className="discount">20% OFF</span>
        <span>Your First Year License for nanoCAD 26</span>
        <Link href="/products" className="buy">Buy Now</Link>
      </div>
      <header className="site-header">
        <div className="container nav">

          <Link href="/" className="logo" aria-label="AGECS Homepage">
            <img src="/agecs-logo-gray.png" alt="AGECS Engineering and Technological Consultancy & Services" className="site-logo" />
          </Link>

          <div className="nav-main">
            <nav className="menu">
              <Link href="/" className="current">Homepage</Link>
              <Link href="#">About</Link>
              <Link href="/products">Products</Link>
              <Link href="#">FAQ</Link>
              <Link href="#">Contact</Link>
              <Link href="#">Company Licenses</Link>
              <Link href="/login" className="students-link">Students</Link>
            </nav>

            <div className="right-tools">
              <span className="currency">EGP</span>
              <span className="icon-btn" title="Wishlist">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </span>
              <Link href="/login" className="icon-btn" title="Account">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </Link>
              <span className="icon-btn" title="Cart">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <span className="cart-count">3</span>
              </span>
            </div>
          </div>

          <button 
            className={`hamburger ${isMobileMenuOpen ? 'is-active' : ''}`} 
            aria-label="Toggle menu" 
            aria-expanded={isMobileMenuOpen} 
            aria-controls="mobile-menu"
            onClick={toggleMobileMenu}
          >
            <span className="hamburger-box" aria-hidden="true">
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
            </span>
          </button>

        </div>

        <div className={`mobile-menu ${isMobileMenuOpen ? 'is-open' : ''}`} id="mobile-menu" aria-hidden={!isMobileMenuOpen}>
          <div className="mobile-menu-header">
            <Link href="/" className="logo mobile-logo" aria-label="AGECS Homepage" onClick={toggleMobileMenu}>
              <img src="/agecs-logo-gray.png" alt="AGECS Engineering and Technological Consultancy & Services" className="site-logo" />
            </Link>
            <button className="mobile-menu-close" aria-label="Close menu" onClick={toggleMobileMenu}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <nav className="mobile-nav">
            <Link href="/" className="current" onClick={toggleMobileMenu}>Homepage</Link>
            <Link href="#" onClick={toggleMobileMenu}>About</Link>
            <Link href="/products" onClick={toggleMobileMenu}>Products</Link>
            <Link href="#" onClick={toggleMobileMenu}>FAQ</Link>
            <Link href="#" onClick={toggleMobileMenu}>Contact</Link>
            <Link href="#" onClick={toggleMobileMenu}>Company Licenses</Link>
            <Link href="/login" onClick={toggleMobileMenu}>Students</Link>
          </nav>
          <div className="mobile-tools">
            <span className="currency">EGP</span>
            <Link href="/login" className="mobile-account" onClick={toggleMobileMenu}>Account</Link>
            <Link href="/products" className="mobile-cart" onClick={toggleMobileMenu}>
              Cart
              <span className="cart-count">3</span>
            </Link>
          </div>
        </div>
        
        {/* Backdrop for mobile menu */}
        <div 
          className={`mobile-menu-backdrop ${isMobileMenuOpen ? 'is-visible' : ''}`} 
          onClick={toggleMobileMenu}
        />
      </header>
    </>
  );
}
