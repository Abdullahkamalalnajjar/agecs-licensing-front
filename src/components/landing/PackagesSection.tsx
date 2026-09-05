"use client";
import React from 'react';


export default function PackagesSection() {
  return (
    <>
      <section id="packages" className="section">
      <div className="container">
        <div className="center">
          <div className="eyebrow">Packages</div>
          <h2 className="section-title">Packages for Engineers, Teams, and Companies</h2>
          <p className="lead">AGECS packages combine software tools and services to provide better value for engineers,
            teams, and companies.</p>
        </div>

        <div className="packages-grid">
          <article className="package">
            <span className="discount">20%</span>
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
          <a href="#" className="btn btn-blue">Explore Packages</a>
          <a href="#" className="btn btn-light-outline">Company Licenses</a>
        </div>
      </div>
    </section>
    </>
  );
}
