"use client";
import React from 'react';

export default function WorkflowSection() {
  return (
    <section id="workflow" className="section workflow-section">
      <div className="container">
        {/* Partner Strip */}
        <div className="partner-strip">
          {['Nanosoft', 'Autodesk', 'Bentley', 'IDEA StatiCa'].map((name) => (
            <div key={name} className="partner-logo">{name}</div>
          ))}
        </div>

        {/* Workflow Panel */}
        <div className="workflow-panel">
          <h3>How AGECS Works</h3>
          <p>From drafting to delivery — AGECS provides a connected workflow for structural engineering teams.</p>
          <div className="flow">
            <div className="flow-step">📐 Drafting<br />nanoCAD</div>
            <div className="flow-arrow">→</div>
            <div className="flow-step">🏗️ Detailing<br />RCD / SDS</div>
            <div className="flow-arrow">→</div>
            <div className="flow-step">📊 Analysis<br />PractiFEA</div>
            <div className="flow-arrow">→</div>
            <div className="flow-step">📁 Delivery<br />OmniDoc</div>
          </div>
        </div>
      </div>
    </section>
  );
}
