import React, { useState, useEffect } from 'react';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import DbExplorer from './pages/DbExplorer';
import ResetPasswordPage from './pages/ResetPasswordPage';
import './index.css';

const BASE_URL = import.meta.env.VITE_API_URL;

export default function App() {
  const [user, setUser] = useState(null);       // { name, email, token }
  const [loading, setLoading] = useState(true); // check localStorage on mount

  // ── Show DB Explorer at /db-explorer ───────
  if (window.location.pathname === '/db-explorer') {
    return <DbExplorer />;
  }

  // ── Show Reset Password Page at /reset-password ──
  if (window.location.pathname === '/reset-password') {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    return <ResetPasswordPage token={token} apiBase={BASE_URL} />;
  }

  // ── Restore session from localStorage ──────
  useEffect(() => {
    const stored = localStorage.getItem('smartlaw_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Quick token validation — call /me
        fetch(`${BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${parsed.token}` }
        })
          .then(r => r.ok ? setUser(parsed) : handleLogout())
          .catch(() => handleLogout())
          .finally(() => setLoading(false));
      } catch {
        handleLogout();
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('smartlaw_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('smartlaw_user');
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-base)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p className="logo-text" style={{ fontSize: '2rem' }}>SmartLaw</p>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
            Loading…
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-orbs"></div>
      {user ? (
        <Dashboard user={user} onLogout={handleLogout} apiBase={BASE_URL} />
      ) : (
        <AuthPage onLogin={handleLogin} apiBase={BASE_URL} />
      )}
    </>
  );
}