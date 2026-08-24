"use client";

import React, { useState } from "react";
import { postIdentityStudentUpgradeRequest, postIdentityStudentUpgradeVerify } from "@/client";

interface StudentUpgradeModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function StudentUpgradeModal({ onClose, onSuccess }: StudentUpgradeModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim().toLowerCase().endsWith(".edu")) {
      setError("Please provide a valid .edu university email address.");
      return;
    }

    setLoading(true);
    try {
      const response = await postIdentityStudentUpgradeRequest({
        body: { email: email.trim() }
      });
      if (response.error) {
        setError(JSON.stringify(response.error));
      } else {
        setStep(2);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!otp.trim()) {
      setError("Please enter the OTP.");
      return;
    }

    setLoading(true);
    try {
      const response = await postIdentityStudentUpgradeVerify({
        body: { otpCode: otp.trim() }
      });
      if (response.error) {
        setError(JSON.stringify(response.error));
      } else {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000, position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)' }}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', width: '90%', padding: '2rem', borderRadius: '16px', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Upgrade to Student
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {error && (
          <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#ef4444', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>University Email (.edu)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu"
                className="input-field"
                required
                autoFocus
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || !email.endsWith(".edu")}
              className="btn-primary"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: 'none', background: 'var(--brand-primary)', color: 'white', fontWeight: 500, cursor: loading ? 'wait' : 'pointer', opacity: (loading || !email.endsWith(".edu")) ? 0.7 : 1, marginTop: '0.5rem' }}
            >
              {loading ? 'Sending OTP...' : 'Send Verification OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              We sent a 6-digit OTP to <strong>{email}</strong>.
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>OTP Code</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="input-field"
                maxLength={6}
                required
                autoFocus
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', letterSpacing: '4px', textAlign: 'center', fontSize: '1.25rem', fontWeight: 600 }}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || otp.length < 5}
              className="btn-primary"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: 'none', background: 'var(--brand-primary)', color: 'white', fontWeight: 500, cursor: loading ? 'wait' : 'pointer', opacity: (loading || otp.length < 5) ? 0.7 : 1, marginTop: '0.5rem' }}
            >
              {loading ? 'Verifying...' : 'Verify & Upgrade'}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.875rem', cursor: 'pointer', marginTop: '0.5rem' }}
            >
              Change Email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
