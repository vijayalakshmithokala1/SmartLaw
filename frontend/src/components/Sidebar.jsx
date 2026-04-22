import React, { useState } from 'react';

export default function Sidebar({ user, activeNav = 'dashboard', recentDocs = [], isOpen = false, onClose, onLoadDoc, onNavChange }) {
  const [showRecent, setShowRecent] = useState(false);

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Logo and Mobile Close */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h1 className="logo-text" style={{ fontSize: '1.5rem', lineHeight: 1 }}>
            SmartLaw
          </h1>
        </div>
        {onClose && (
          <button 
            className="mobile-menu-btn" 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.25rem', cursor: 'pointer', padding: '0.25rem' }}
          >
            ✕
          </button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '99px', padding: '4px 10px', width: 'fit-content' }}>
        <span style={{ color: '#10B981', fontSize: '0.65rem' }}>●</span>
        PII Protected Environment
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div 
          className={`sidebar-link ${activeNav === 'dashboard' ? 'active' : ''}`}
          onClick={() => onNavChange && onNavChange('dashboard')}
        >
          <span>📄</span> Dashboard Hub
        </div>
        
        <div 
          className={`sidebar-link ${activeNav === 'library' ? 'active' : ''}`}
          onClick={() => onNavChange && onNavChange('library')}
        >
          <span>📚</span> Legal Library
        </div>

        <div 
          className={`sidebar-link ${activeNav === 'chat' ? 'active' : ''}`}
          onClick={() => onNavChange && onNavChange('chat')}
        >
          <span>💬</span> AI Chatbot
        </div>        <div 
          className="sidebar-link" 
          onClick={() => setShowRecent(!showRecent)}
          style={{ justifyContent: 'space-between', marginTop: '0.5rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span>🕒</span> Recent Documents
          </div>
          <span style={{ fontSize: '0.75rem' }}>{showRecent ? '▲' : '▼'}</span>
        </div>
        
        {/* Toggleable Recent Docs List */}
        {showRecent && (
          <div className="sidebar-scroll-area">
            {recentDocs.length === 0 ? (
              <div style={{ padding: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>No documents uploaded yet.</div>
            ) : (
              recentDocs.map(doc => (
                <div 
                  key={doc.id} 
                  className="sidebar-link" 
                  style={{ padding: '0.4rem 0.5rem', fontSize: '0.85rem' }}
                  onClick={() => { if(onLoadDoc) onLoadDoc(doc); }}
                >
                  <span style={{ fontSize: '0.9rem' }}>📝</span> {doc.name}
                </div>
              ))
            )}
          </div>
        )}

      </nav>

      {/* Bottom Info */}
      <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
        <div className="glass-card" style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)' }}>
          <p style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Session Only</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>Your recent documents will be permanently cleared when you log out.</p>
        </div>
      </div>
    </aside>
  );
}
