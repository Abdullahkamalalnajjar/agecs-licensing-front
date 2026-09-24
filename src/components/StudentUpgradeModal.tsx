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
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000, position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease-out' }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ 
        maxWidth: '440px', width: '90%', padding: '2.5rem', 
        borderRadius: '24px', 
        background: '#0f172a', // Forced dark background
        border: '1px solid rgba(255, 255, 255, 0.1)', 
        boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
        position: 'relative',
        overflow: 'hidden',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        
        {/* Subtle background glow */}
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', position: 'relative' }}>
          <div>
            <div style={{ 
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', 
              width: '48px', height: '48px', borderRadius: '14px', 
              background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(29,78,216,0.1))', 
              color: '#60a5fa', marginBottom: '1.25rem', 
              border: '1px solid rgba(59,130,246,0.2)',
              boxShadow: '0 4px 12px rgba(59,130,246,0.1)'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
              </svg>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Student Upgrade
            </h2>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.5 }}>
              Verify your university email to unlock educational benefits and free licenses.
            </p>
          </div>
          <button onClick={onClose} style={{ 
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
            color: '#94a3b8', cursor: 'pointer',
            width: '32px', height: '32px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s ease', flexShrink: 0
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {error && (
          <div style={{ padding: '0.875rem 1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', color: '#ef4444', marginBottom: '1.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>University Email (.edu)</label>
              <div style={{ position: 'relative' }}>
                <svg style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  required
                  autoFocus
                  style={{ 
                    width: '100%', padding: '0.875rem 1rem 0.875rem 2.75rem', 
                    borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', 
                    background: 'rgba(255,255,255,0.05)', color: '#ffffff',
                    fontSize: '0.95rem', transition: 'all 0.2s ease', outline: 'none'
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading || !email.endsWith(".edu")}
              style={{ 
                width: '100%', padding: '0.875rem', borderRadius: '12px', border: 'none', 
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', 
                color: 'white', fontWeight: 600, fontSize: '0.95rem',
                cursor: loading ? 'wait' : 'pointer', opacity: (loading || !email.endsWith(".edu")) ? 0.7 : 1, 
                marginTop: '0.5rem',
                boxShadow: '0 4px 14px rgba(59,130,246,0.35)',
                transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
              }}
              onMouseEnter={e => { if(!loading && email.endsWith(".edu")) { e.currentTarget.style.boxShadow = '0 6px 20px rgba(59,130,246,0.5)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(59,130,246,0.35)'; e.currentTarget.style.transform = 'none'; }}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderTopColor: '#fff' }}></div>
                  Sending OTP...
                </>
              ) : 'Send Verification OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative' }}>
            <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.5rem', lineHeight: 1.5, background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              We sent a 6-digit verification code to <br/><strong style={{ color: '#ffffff', marginTop: '0.25rem', display: 'inline-block' }}>{email}</strong>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>Enter OTP Code</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                maxLength={6}
                required
                autoFocus
                style={{ 
                  width: '100%', padding: '1rem', 
                  borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', 
                  background: 'rgba(255,255,255,0.05)', color: '#ffffff',
                  letterSpacing: '8px', textAlign: 'center', fontSize: '1.5rem', fontWeight: 700,
                  transition: 'all 0.2s ease', outline: 'none'
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || otp.length < 5}
              style={{ 
                width: '100%', padding: '0.875rem', borderRadius: '12px', border: 'none', 
                background: 'linear-gradient(135deg, #10b981, #059669)', 
                color: 'white', fontWeight: 600, fontSize: '0.95rem',
                cursor: loading ? 'wait' : 'pointer', opacity: (loading || otp.length < 5) ? 0.7 : 1, 
                marginTop: '0.5rem',
                boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
              }}
              onMouseEnter={e => { if(!loading && otp.length >= 5) { e.currentTarget.style.boxShadow = '0 6px 20px rgba(16,185,129,0.45)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(16,185,129,0.3)'; e.currentTarget.style.transform = 'none'; }}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderTopColor: '#fff' }}></div>
                  Verifying...
                </>
              ) : 'Verify & Upgrade'}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              style={{ 
                background: 'transparent', border: 'none', color: '#94a3b8', 
                fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', marginTop: '0.25rem',
                transition: 'color 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
              onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
            >
              Change Email Address
            </button>
          </form>
        )}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}} />
    </div>
  );
}
