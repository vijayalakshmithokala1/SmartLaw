import React, { useState, useEffect, useCallback } from 'react';

const BASE_URL = import.meta.env.VITE_API_URL;

// ── Utility ──────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function truncateHash(hash) {
  if (!hash) return '—';
  return hash.substring(0, 29) + '…';
}

// ── Small Components ─────────────────────────────────────────────
function StatusBadge({ verified }) {
  return verified ? (
    <span className="badge badge-green">✓ Verified</span>
  ) : (
    <span className="badge badge-red">✗ Pending</span>
  );
}

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="glass-card" style={{ padding: '1.25rem 1.5rem', flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{icon}</div>
      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--gold-light)', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{sub}</div>}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────
export default function DbExplorer() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [expandedHash, setExpandedHash] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [pulse, setPulse] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/admin/users`);
      if (!res.ok) throw new Error('Failed to load users');
      const data = await res.json();
      setUsers(data.users || []);
      setLastRefresh(new Date());
      setPulse(true);
      setTimeout(() => setPulse(false), 600);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const id = setInterval(fetchUsers, 5000);
    return () => clearInterval(id);
  }, [fetchUsers]);

  const handleVerify = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/admin/users/${id}/verify`, { method: 'POST' });
      const data = await res.json();
      setActionMsg(data.message);
      fetchUsers();
    } catch { setActionMsg('Action failed.'); }
    setTimeout(() => setActionMsg(''), 3000);
  };

  const handleDelete = async (id, email) => {
    if (!window.confirm(`Delete user "${email}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${BASE_URL}/admin/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      setActionMsg(data.message);
      fetchUsers();
    } catch { setActionMsg('Delete failed.'); }
    setTimeout(() => setActionMsg(''), 3000);
  };

  const verified = users.filter(u => u.is_verified).length;
  const pending  = users.length - verified;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 10% 30%, rgba(201,168,76,0.05), transparent 60%), var(--bg-base)',
      padding: '2rem 1.5rem',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* ── Header ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🔬</span>
              <h1 className="logo-text" style={{ fontSize: '1.75rem', margin: 0 }}>Database Explorer</h1>
              <span className="badge badge-gold">DEV MODE</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginLeft: '2.25rem' }}>
              Live view of <code>smartlaw.db</code> → <code>users</code> table
              {lastRefresh && (
                <span> · Last sync: {lastRefresh.toLocaleTimeString()}</span>
              )}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="btn-ghost"
              onClick={fetchUsers}
              style={{ padding: '0.6rem 1.25rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              🔄 Refresh
            </button>
            <a
              href="/"
              className="btn-gold"
              style={{ padding: '0.6rem 1.25rem', fontSize: '0.875rem', textDecoration: 'none', borderRadius: 8, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              ← Back to App
            </a>
          </div>
        </div>

        {/* ── Action Message ── */}
        {actionMsg && (
          <div className="fade-up" style={{
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.5rem',
            color: '#6EE7B7', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}>
            ✅ {actionMsg}
          </div>
        )}

        {/* ── Stat Cards ── */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <StatCard icon="👥" label="Total Users" value={loading ? '—' : users.length} />
          <StatCard icon="✅" label="Verified" value={loading ? '—' : verified} sub="Email confirmed" />
          <StatCard icon="⏳" label="Pending" value={loading ? '—' : pending} sub="Awaiting email" />
          <StatCard icon="🗄️" label="Database" value="SQLite" sub="smartlaw.db" />
        </div>

        {/* ── Security Note ── */}
        <div style={{
          background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem',
          display: 'flex', gap: '0.75rem', alignItems: 'flex-start'
        }}>
          <span style={{ fontSize: '1.25rem', marginTop: '0.1rem' }}>🔐</span>
          <div>
            <div style={{ fontWeight: 700, color: '#93C5FD', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Security Audit Note</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8375rem', lineHeight: 1.6 }}>
              Passwords are hashed using <strong style={{ color: '#93C5FD' }}>bcrypt</strong> with a random salt — plaintext passwords are <strong style={{ color: '#6EE7B7' }}>never stored</strong>.
              The <code>$2b$12$…</code> prefix confirms bcrypt with 12 cost rounds. Click any hash to expand and inspect it.
            </div>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="glass-card" style={{
          overflow: 'hidden',
          transition: 'box-shadow 0.3s',
          boxShadow: pulse ? '0 0 0 2px rgba(201,168,76,0.3)' : undefined
        }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                TABLE: users
              </span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'inline-block', boxShadow: '0 0 6px rgba(16,185,129,0.6)' }} />
              <span style={{ fontSize: '0.72rem', color: 'var(--success)' }}>LIVE</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Auto-refreshing every 5s</span>
          </div>

          {loading && users.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⏳</div>
              Loading database…
            </div>
          ) : error ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--danger)' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>❌</div>
              {error}
            </div>
          ) : users.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
              <div style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>No users registered yet</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                Create an account on the <a href="/" style={{ color: 'var(--gold)' }}>main page</a> to see records appear here.
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-surface)' }}>
                    {['ID', 'Name', 'Email', 'Status', 'Password Hash (bcrypt)', 'Created At', 'Actions'].map(h => (
                      <th key={h} style={{
                        padding: '0.75rem 1rem', textAlign: 'left',
                        color: 'var(--text-muted)', fontWeight: 700,
                        fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em',
                        borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap'
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, idx) => (
                    <tr key={u.id} className="fade-up" style={{
                      borderBottom: '1px solid var(--border)',
                      background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                      transition: 'background 0.2s',
                      animationDelay: `${idx * 0.04}s`
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'}
                    >
                      {/* ID */}
                      <td style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)', fontFamily: 'monospace', fontWeight: 700 }}>
                        #{u.id}
                      </td>
                      {/* Name */}
                      <td style={{ padding: '0.875rem 1rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {u.name}
                      </td>
                      {/* Email */}
                      <td style={{ padding: '0.875rem 1rem', color: 'var(--blue)', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {u.email}
                      </td>
                      {/* Status */}
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <StatusBadge verified={u.is_verified} />
                      </td>
                      {/* Hash */}
                      <td style={{ padding: '0.875rem 1rem', maxWidth: 260 }}>
                        <div
                          style={{ cursor: 'pointer' }}
                          onClick={() => setExpandedHash(expandedHash === u.id ? null : u.id)}
                          title="Click to expand/collapse"
                        >
                          {expandedHash === u.id ? (
                            <code style={{
                              fontSize: '0.72rem', wordBreak: 'break-all',
                              background: 'rgba(201,168,76,0.08)', padding: '6px 8px',
                              borderRadius: 6, display: 'block', lineHeight: 1.6,
                              border: '1px solid var(--gold-border)'
                            }}>
                              {u.password_hash}
                            </code>
                          ) : (
                            <code style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {truncateHash(u.password_hash)} <span style={{ color: 'var(--gold)', fontSize: '0.7rem' }}>▼</span>
                            </code>
                          )}
                        </div>
                      </td>
                      {/* Created At */}
                      <td style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {formatDate(u.created_at)}
                      </td>
                      {/* Actions */}
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {!u.is_verified && (
                            <button
                              className="btn-gold"
                              onClick={() => handleVerify(u.id)}
                              title="Manually verify this user"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: 6 }}
                            >
                              Verify
                            </button>
                          )}
                          <button
                            className="btn-ghost"
                            onClick={() => handleDelete(u.id, u.email)}
                            title="Delete this user"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: 6, color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Schema Panel ── */}
        <div style={{ marginTop: '1.5rem' }} className="glass-card">
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
              📐 Schema Definition
            </span>
          </div>
          <div style={{ padding: '1.25rem 1.5rem', overflowX: 'auto' }}>
            <pre style={{
              margin: 0, fontSize: '0.82rem', lineHeight: 1.8,
              color: 'var(--text-secondary)', fontFamily: "'Courier New', monospace"
            }}>
{`CREATE TABLE users (
  id            INTEGER     PRIMARY KEY AUTOINCREMENT,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(120) NOT NULL  UNIQUE  INDEX,
  password_hash VARCHAR(255) NOT NULL,           -- bcrypt ($2b$12$...)
  is_verified   BOOLEAN     DEFAULT FALSE,       -- email verification flag
  created_at    DATETIME    DEFAULT CURRENT_TIMESTAMP
);`}
            </pre>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
          🔒 SmartLaw • Development Evaluator Mode • Data visible only when <code>DEVELOPMENT_MODE=true</code>
        </div>
      </div>
    </div>
  );
}
