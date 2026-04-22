import React from 'react';
import Dropdown from './Dropdown';

export default function Navbar({ user, onLogout, onMenuClick, theme, toggleTheme }) {
  return (
    <nav className="navbar" style={{ padding: '0 2rem', background: 'transparent', borderBottom: 'none' }}>
      {onMenuClick && (
        <button 
          className="mobile-menu-btn" 
          onClick={onMenuClick}
          style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '1.5rem', cursor: 'pointer', padding: '0.25rem' }}
        >
          ☰
        </button>
      )}
      <div className="desktop-only" style={{ flex: 1 }}></div>

      {/* Right — User info + Dropdowns */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {/* Theme Toggle */}
        <button 
          className="btn-ghost" 
          onClick={toggleTheme}
          style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '40px' }}
          title="Toggle Light/Dark Mode"
        >
          {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
        </button>

        {/* Help & Support Helplines Dropdown */}
        <Dropdown align="left" trigger={
          <button className="btn-ghost" style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📞</span> Help & Support
          </button>
        }>
           <div style={{ padding: '0.75rem 1rem', width: '280px' }}>
              <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, fontSize: '0.9rem', color: 'var(--gold-light)' }}>
                 India Legal Helplines
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                 <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '4px' }}>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Free Legal Aid (NALSA)</p>
                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>15100</p>
                 </div>
                 <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '4px' }}>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Women in Distress</p>
                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>1091</p>
                 </div>
                 <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '4px' }}>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cyber Crime Helpline</p>
                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>1930</p>
                 </div>
              </div>
           </div>
        </Dropdown>

        {/* Profile Dropdown */}
        <Dropdown  
          align="right"
          trigger={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem', borderRadius: '40px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--gold), #E8C97A)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8125rem', fontWeight: 700, color: '#07090F',
              }}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', paddingRight: '0.5rem' }}>
                {user?.name}
              </span>
              <span style={{ color: 'var(--text-muted)', paddingRight: '0.5rem', fontSize: '0.75rem' }}>▼</span>
            </div>
          }
        >
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{user?.name}</p>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.email}</p>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', margin: '0.25rem 0' }}></div>
          <button className="dropdown-item danger" onClick={onLogout}>🚪 Sign Out</button>
        </Dropdown>
      </div>
    </nav>
  );
}
