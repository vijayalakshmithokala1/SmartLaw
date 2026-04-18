import React, { useState } from 'react';

export default function ResetPasswordPage({ token, apiBase }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setStatus('error');
      setMessage('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setStatus('error');
      setMessage('Password must be at least 8 characters.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch(`${apiBase}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password })
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setMessage(data.error || 'Failed to reset password.');
        return;
      }

      setStatus('success');
      setMessage(data.message || 'Password successfully reset.');
    } catch {
      setStatus('error');
      setMessage('Cannot connect to server.');
    }
  };

  return (
    <div className="auth-bg">
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 className="logo-text" style={{ fontSize: '2.6rem', lineHeight: 1 }}>
            SmartLaw
          </h1>
        </div>

        <div className="glass-card" style={{ padding: '2.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--text-main)', textAlign: 'center' }}>
            Set New Password
          </h2>

          {status === 'success' ? (
            <div style={{ textAlign: 'center' }}>
              <div className="fade-up" style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                color: '#34D399',
                padding: '0.75rem',
                borderRadius: '6px',
                fontSize: '0.9rem',
                marginBottom: '1.25rem'
              }}>
                ✅ {message}
              </div>
              <a href="/" style={{ color: '#C9A84C', textDecoration: 'none', fontWeight: 600 }}>
                ← Return to Sign In
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>New Password</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Confirm New Password</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Min. 8 characters"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </div>

              {status === 'error' && (
                <div style={errorStyle} className="fade-up">
                  <span>⚠️</span> {message}
                </div>
              )}

              <button
                className="btn-gold"
                type="submit"
                disabled={status === 'loading'}
                style={{ padding: '0.85rem', fontSize: '0.9375rem', marginTop: '0.5rem' }}
              >
                {status === 'loading' ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  marginBottom: '0.4rem',
  letterSpacing: '0.01em',
};

const errorStyle = {
  background: 'rgba(239,68,68,0.1)',
  border: '1px solid rgba(239,68,68,0.25)',
  borderRadius: 'var(--radius-sm)',
  color: '#FCA5A5',
  fontSize: '0.8125rem',
  padding: '0.65rem 0.875rem',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};
