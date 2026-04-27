import React, { useState, useEffect } from 'react';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import ResetPasswordPage from './pages/ResetPasswordPage';
import './index.css';

const BASE_URL = import.meta.env.VITE_API_URL;

export default function App() {
  const [user, setUser] = useState(null);       // { name, email, token }
  const [loading, setLoading] = useState(true); // check localStorage on mount
  const [theme, setTheme] = useState(() => localStorage.getItem('smartlaw_theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('smartlaw_theme', theme);
  }, [theme]);
  
  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  // ── Show Reset Password Page at /reset-password ──
  if (window.location.pathname === '/reset-password') {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    return <ResetPasswordPage token={token} apiBase={BASE_URL} />;
  }

  // ── Restore session from storage ──────
  useEffect(() => {
    const stored = localStorage.getItem('smartlaw_user') || sessionStorage.getItem('smartlaw_user');
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

  const handleLogin = (userData, rememberMe) => {
    setUser(userData);
    if (rememberMe) {
      localStorage.setItem('smartlaw_user', JSON.stringify(userData));
    } else {
      sessionStorage.setItem('smartlaw_user', JSON.stringify(userData));
    }
  };

  const handleLogout = async () => {
    // AuthService.revokeToken() — revoke JWT server-side first (matches sequence diagram Fig. 6)
    const stored = localStorage.getItem('smartlaw_user') || sessionStorage.getItem('smartlaw_user');
    if (stored) {
      try {
        const { token } = JSON.parse(stored);
        if (token) {
          await fetch(`${BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      } catch {
        // Logout continues even if the server call fails
      }
    }
    // clearSession() — purge all local session data
    setUser(null);
    localStorage.removeItem('smartlaw_user');
    sessionStorage.removeItem('smartlaw_user');
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
        <Dashboard user={user} onLogout={handleLogout} apiBase={BASE_URL} theme={theme} toggleTheme={toggleTheme} />
      ) : (
        <AuthPage onLogin={handleLogin} apiBase={BASE_URL} />
      )}
    </>
  );
}