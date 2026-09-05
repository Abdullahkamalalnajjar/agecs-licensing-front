"use client";
import React from 'react';
import LandingHeader from '@/components/landing/LandingHeader';
import HeroSection from '@/components/landing/HeroSection';
import OverviewSection from '@/components/landing/OverviewSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import ProductsSection from '@/components/landing/ProductsSection';
import PackagesSection from '@/components/landing/PackagesSection';
import PartnersSection from '@/components/landing/PartnersSection';
import ContactSection from '@/components/landing/ContactSection';
import CtaSection from '@/components/landing/CtaSection';
import LandingFooter from '@/components/landing/LandingFooter';
import './home.css';

export default function HomePage() {
  return (
    <div id="landing-page">
      <LandingHeader />
      <HeroSection />
      <OverviewSection />
      <FeaturesSection />
      <ProductsSection />
      <PackagesSection />
      <PartnersSection />
      <ContactSection />
      <CtaSection />
      <LandingFooter />
    </div>
  );
}
