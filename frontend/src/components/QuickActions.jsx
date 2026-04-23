import React, { useState } from 'react';

export default function QuickActions({ 
  token, apiBase, redactedContext, summaryText, tokenMap, showPii, 
  activeTab, result, setShowEntitiesModal 
}) {
  const [loadingAction, setLoadingAction] = useState(null);
  const [actionResults, setActionResults] = useState({}); // Store results by tab ID
  const [error, setError] = useState(null);
  
  const [selectedLang, setSelectedLang] = useState('Hindi');
  const [draftIntent, setDraftIntent] = useState('');
  const [whatIfScenario, setWhatIfScenario] = useState('');

  const handleAction = async (actionPath, payload, tabId) => {
    setLoadingAction(tabId);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/document/${actionPath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setActionResults(prev => ({
        ...prev,
        [tabId]: data.result
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const renderToolInterface = (id, title, icon, action, payload, description) => {
    const hasResult = actionResults[id];
    const isLoading = loadingAction === id;

    return (
      <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--gold)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.5rem' }}>{icon}</span>
            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{title}</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{description}</p>
          
          {id === 'translate' && (
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <select className="form-input" style={{ maxWidth: '200px' }} value={selectedLang} onChange={e => setSelectedLang(e.target.value)}>
                <option>Hindi</option><option>Telugu</option><option>Tamil</option><option>Marathi</option><option>Bengali</option><option>Gujarati</option>
              </select>
              <button className="btn-gold" disabled={isLoading} onClick={() => handleAction('translate', { text: summaryText, language: selectedLang }, 'translate')}>
                {isLoading ? 'Translating...' : 'Translate Summary'}
              </button>
            </div>
          )}

          {id === 'draft' && (
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <input 
                type="text" className="form-input" placeholder="e.g. Reply to this notice, Reject offer..."
                value={draftIntent} onChange={e => setDraftIntent(e.target.value)}
              />
              <button className="btn-gold" style={{ flexShrink: 0 }} disabled={!draftIntent || isLoading} onClick={() => handleAction('draft-letter', { redacted_context: redactedContext, intent: draftIntent }, 'draft')}>
                {isLoading ? 'Drafting...' : 'Generate Draft'}
              </button>
            </div>
          )}

          {id === 'simulator' && (
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <input 
                type="text" className="form-input" placeholder="e.g. What if payment is delayed by 30 days?"
                value={whatIfScenario} onChange={e => setWhatIfScenario(e.target.value)}
              />
              <button className="btn-gold" style={{ flexShrink: 0 }} disabled={!whatIfScenario || isLoading} onClick={() => handleAction('what-if', { redacted_context: redactedContext, scenario: whatIfScenario }, 'simulator')}>
                {isLoading ? 'Simulating...' : 'Run Simulation'}
              </button>
            </div>
          )}

          {(!['translate', 'draft', 'simulator'].includes(id)) && (
            <button className="btn-gold" disabled={isLoading} onClick={() => handleAction(action, payload, id)}>
              {isLoading ? 'Processing...' : `Run ${title}`}
            </button>
          )}
        </div>

        {hasResult && (
          <div className="glass-card fade-up" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h4 style={{ margin: 0, color: 'var(--gold-light)' }}>Analysis Result</h4>
              <button className="btn-ghost" style={{ padding: '4px 12px', fontSize: '0.8rem' }} onClick={() => navigator.clipboard.writeText(hasResult)}>Copy Text</button>
            </div>
            <div className="summary-content" style={{ whiteSpace: 'pre-wrap' }}>
              {showPii && tokenMap 
                ? Object.entries(tokenMap).reduce((t, [token, val]) => t.replaceAll(token, val), hasResult)
                : hasResult}
            </div>
          </div>
        )}

        {error && loadingAction === id && (
          <div style={{ color: 'var(--danger)', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)' }}>
            ⚠️ {error}
          </div>
        )}
      </div>
    );
  };

  if (activeTab === 'summary') return null; // Handled in DocUploader

  if (activeTab === 'risk') return renderToolInterface('risk', 'Legal Risk Analyzer', '⚖️', 'analyze-risk', { redacted_context: redactedContext }, 'Deep-dive into legal liabilities, hidden clauses, and potential risks in the document.');
  
  if (activeTab === 'deadlines') return renderToolInterface('deadlines', 'Obligation Tracker', '📅', 'extract-deadlines', { redacted_context: redactedContext }, 'Extract all critical dates, deadlines, and mandatory obligations mentioned in the text.');
  
  if (activeTab === 'negotiate') return renderToolInterface('negotiate', 'Negotiation Assistant', '🤝', 'negotiate', { redacted_context: redactedContext }, 'Get AI-powered strategies and counter-arguments for favorable negotiation.');
  
  if (activeTab === 'todo') return renderToolInterface('todo', 'Action Items', '📋', 'action-items', { redacted_context: redactedContext }, 'Generate a prioritized to-do list based on the document requirements.');
  
  if (activeTab === 'draft') return renderToolInterface('draft', 'Response Drafting', '✍️', 'draft-letter', {}, 'Generate professional legal responses or letters based on the document context.');
  
  if (activeTab === 'translate') return renderToolInterface('translate', 'Regional Translation', '🌐', 'translate', {}, 'Translate the summary into your preferred regional language for better understanding.');
  
  if (activeTab === 'simulator') return renderToolInterface('simulator', 'What-If Simulator', '🧪', 'what-if', {}, 'Simulate various scenarios to see how they might impact the legal standing of this document.');

  if (activeTab === 'metadata') {
    return (
      <div className="fade-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.25rem', color: 'var(--gold-light)' }}>📁 Document Details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
             {[
               { label: 'Filename', value: result.filename },
               { label: 'Type', value: result.filename.split('.').pop().toUpperCase() },
               { label: 'Size', value: `${(result.char_count / 1024).toFixed(2)} KB (approx)` },
               { label: 'Characters', value: result.char_count.toLocaleString() },
               { label: 'Language', value: 'English (Detected)' }
             ].map(row => (
               <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                 <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                 <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{row.value}</span>
               </div>
             ))}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.25rem', color: 'var(--success)' }}>🔒 Privacy Guard</h3>
          {result.pii_found ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                 <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--success)' }}>
                   Protected environment active. <strong>{Object.values(result.redaction_stats || {}).reduce((a,b)=>a+b, 0)}</strong> identifiers were redacted.
                 </p>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn-gold" style={{ flex: 1 }} onClick={() => setShowEntitiesModal(true)}>🔬 View Redaction Audit</button>
              </div>
            </div>
          ) : (
             <p style={{ color: 'var(--text-secondary)' }}>No sensitive PII was detected in this document.</p>
          )}
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
           <h3 style={{ marginBottom: '1.25rem', color: 'var(--blue)' }}>⚖️ Risk Score</h3>
           <div style={{ textAlign: 'center', padding: '2rem', borderRadius: '16px', background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: '3rem', margin: 0, color: result.risk_level === 'HIGH' ? 'var(--danger)' : 'var(--success)' }}>
                {result.risk_score || 'N/A'}
              </h2>
              <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>Aggregated Risk Level: <strong>{result.risk_level}</strong></p>
           </div>
        </div>
      </div>
    );
  }

  return null;
}

