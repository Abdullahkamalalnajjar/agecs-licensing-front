"use client";
import React from 'react';


export default function ProductsSection() {
  return (
    <>
      <section id="products" className="section products">
      <div className="container">
        <div className="center">
          <div className="eyebrow">Products</div>
          <h2 className="section-title">AGECS Products and nanoCAD Products</h2>
          <p className="lead">A connected software ecosystem covering AGECS engineering tools, OneAPI integrations, office productivity tools, and professional nanoCAD products.</p>
        </div>

        <div className="home-products-v2">
          <div className="home-product-family">
            <div className="family-head">
              <div>
                <div className="eyebrow">AGECS Products</div>
                <h3>Engineering Tools Built for Real Project Workflows</h3>
              </div>
              <p>AGECS products support engineers from drafting and modeling to detailing, analysis, documentation, and project delivery.</p>
            </div>
            <div className="family-grid">
              <article className="product product-image">
                <div className="product-media"><img src="/placeholder.png" alt="AGECS CADxBIM" /></div>
                <div className="product-content">
                  <small>AGECS Products</small>
                  <h3>AGECS CADxBIM</h3>
                  <p>Engineering tools for CAD, BIM, detailing, modeling, infrastructure, historical buildings, and finite element analysis.</p>
                  <div className="product-tags"><span className="product-tag">SES</span><span className="product-tag">RCD</span><span className="product-tag">SDS</span><span className="product-tag">SBM</span><span className="product-tag">SDU</span><span className="product-tag">HBM</span><span className="product-tag">CIM</span><span className="product-tag">PractiFEA</span></div>
                  <a href="#" className="mini-link">View Products</a>
                </div>
              </article>

              <article className="product product-image">
                <div className="product-media"><img src="/placeholder.png" alt="AGECS OneAPI Hub" /></div>
                <div className="product-content">
                  <small>AGECS Products</small>
                  <h3>AGECS OneAPI Hub</h3>
                  <p>Connected integration direction linking AGECS workflows with major engineering platforms and BIM ecosystems.</p>
                  <div className="product-tags"><span className="product-tag">Revit</span><span className="product-tag">Tekla</span><span className="product-tag">IDEA StatiCa</span><span className="product-tag">CSI</span></div>
                  <a href="#" className="mini-link">Coming Soon</a>
                </div>
              </article>

              <article className="product product-image">
                <div className="product-media"><img src="/placeholder.png" alt="AGECS Office Tools" /></div>
                <div className="product-content">
                  <small>AGECS Products</small>
                  <h3>AGECS Office Tools</h3>
                  <p>Office productivity tools for document management, 3D review, and secure project folder backups.</p>
                  <div className="product-tags"><span className="product-tag">OmniDoc</span><span className="product-tag">Univers 3D</span><span className="product-tag">Backup Forge</span></div>
                  <a href="#" className="mini-link">View Products</a>
                </div>
              </article>
            </div>
          </div>

          <div className="home-product-family dark-family">
            <div className="family-head">
              <div>
                <div className="eyebrow">nanoCAD Products</div>
                <h3>DWG-Compatible CAD Platform with Specialized Add-ons</h3>
              </div>
              <p>As the official and sole service provider of nanoCAD in Egypt and the Middle East, AGECS supports the nanoCAD platform and its specialized modules for engineering teams.</p>
            </div>
            <div className="family-grid nano-grid">
              <article className="product product-image">
                <div className="product-media"><img src="/placeholder.png" alt="nanoCAD 26 Platform" /></div>
                <div className="product-content">
                  <small>Core CAD Platform</small>
                  <h3>nanoCAD 26 Platform</h3>
                  <p>Professional DWG-compatible CAD platform for 2D drafting, 3D modeling, and modular engineering workflows.</p>
                  
                  <a href="#" className="mini-link">Explore nanoCAD</a>
                </div>
              </article>

              <article className="product product-image">
                <div className="product-media"><img src="/placeholder.png" alt="Mechanica" /></div>
                <div className="product-content">
                  <small>Mechanical Add-on</small>
                  <h3>Mechanica</h3>
                  <p>Mechanical design add-on for machinery, parts, and production-oriented drafting environments.</p>
                  
                  <a href="#" className="mini-link">Explore nanoCAD</a>
                </div>
              </article>

              <article className="product product-image">
                <div className="product-media"><img src="/placeholder.png" alt="Topoplan" /></div>
                <div className="product-content">
                  <small>Topography Add-on</small>
                  <h3>Topoplan</h3>
                  <p>Topographic and survey-focused add-on for terrain representation and site planning workflows.</p>
                  
                  <a href="#" className="mini-link">Explore nanoCAD</a>
                </div>
              </article>

              <article className="product product-image">
                <div className="product-media"><img src="/placeholder.png" alt="Raster" /></div>
                <div className="product-content">
                  <small>Raster Add-on</small>
                  <h3>Raster</h3>
                  <p>Raster processing add-on for scanned drawings, image references, and hybrid CAD documentation.</p>
                  
                  <a href="#" className="mini-link">Explore nanoCAD</a>
                </div>
              </article>

              <article className="product product-image">
                <div className="product-media"><img src="/placeholder.png" alt="Construction" /></div>
                <div className="product-content">
                  <small>Construction Add-on</small>
                  <h3>Construction</h3>
                  <p>Construction-oriented add-on for building documentation and project drafting tasks.</p>
                  
                  <a href="#" className="mini-link">Explore nanoCAD</a>
                </div>
              </article>

              <article className="product product-image">
                <div className="product-media"><img src="/placeholder.png" alt="3D Solid Modeling" /></div>
                <div className="product-content">
                  <small>3D Modeling Add-on</small>
                  <h3>3D Solid Modeling</h3>
                  <p>3D solid modeling add-on for creating and refining detailed engineering and design models.</p>
                  
                  <a href="#" className="mini-link">Explore nanoCAD</a>
                </div>
              </article>
            </div>
          </div>
        </div>

        <div className="section-actions">
          <a href="#" className="btn btn-blue">View All Products</a>
          <a href="#nanocad" className="btn btn-light-outline">Explore nanoCAD</a>
          <a href="#contact" className="btn btn-light-outline">Request Demo</a>
        </div>
      </div>
    </section>
    </>
  );
}
