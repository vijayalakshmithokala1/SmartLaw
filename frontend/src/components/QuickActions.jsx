import React, { useState, useRef } from 'react';
import Modal from './Modal';
import Dropdown from './Dropdown';

export default function QuickActions({ token, apiBase, redactedContext, summaryText, tokenMap, showPii }) {
  const [loadingAction, setLoadingAction] = useState(null);
  const [actionResults, setActionResults] = useState([]); // Now an array to keep multiple results
  const [error, setError] = useState(null);
  
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState('Hindi');
  const [draftIntent, setDraftIntent] = useState('');
  const [whatIfScenario, setWhatIfScenario] = useState('');

  const handleAction = async (actionPath, payload, typeName) => {
    setLoadingAction(actionPath);
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
      setActionResults(prev => [{
        id: Date.now(),
        type: typeName,
        text: data.result
      }, ...prev]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const removeResult = (id) => {
    setActionResults(prev => prev.filter(r => r.id !== id));
  };

  const tools = [
    { name: '⚖️ Risk Analyzer', action: 'analyze-risk', payload: { redacted_context: redactedContext }, label: '⚖️ Legal Risk Analysis', color: '#EF4444' },
    { name: '📅 Obligation Tracker', action: 'extract-deadlines', payload: { redacted_context: redactedContext }, label: '📅 Obligations & Deadlines', color: '#3B82F6' },
    { name: '🤝 Negotiation Assistant', action: 'negotiate', payload: { redacted_context: redactedContext }, label: '🤝 Negotiation Strategy', color: '#10B981' },
    { name: '📋 Generate To-Do List', action: 'action-items', payload: { redacted_context: redactedContext }, label: '📋 Action Items (To-Do List)', color: '#F59E0B' },
    { name: '⚖️ Find Lawyer Advice', action: 'lawyer-advice', payload: { redacted_context: redactedContext }, label: '⚖️ Lawyer Advice', color: '#8B5CF6' },
  ];

  return (
    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Floating Action Button Interface */}
      <div className="fab-container">
        {isFabOpen && (
          <div className="fab-menu fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
             {/* Interactive Tools in FAB */}
             <div className="glass-card fade-up" style={{ padding: '1rem', width: '300px', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--gold-border)' }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: 'var(--gold-light)' }}>🧪 Advanced AI Tools</p>
                
                <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                  <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600 }}>🌐 Translate Summary</p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select className="form-input" style={{ padding: '0.3rem', fontSize: '0.8rem' }} value={selectedLang} onChange={e => setSelectedLang(e.target.value)}>
                      <option>Hindi</option><option>Telugu</option><option>Tamil</option><option>Marathi</option>
                    </select>
                    <button className="btn-gold" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }} disabled={loadingAction} onClick={() => { handleAction('translate', { text: summaryText, language: selectedLang }, `Translated to ${selectedLang}`); setIsFabOpen(false); }}>Go</button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                   <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600 }}>📝 Draft Letter</p>
                   <input 
                      type="text" className="form-input" placeholder="Intent (e.g. Reject offer)"
                      style={{ padding: '0.4rem', fontSize: '0.8rem' }}
                      value={draftIntent} onChange={e => setDraftIntent(e.target.value)}
                   />
                   <button 
                      className="btn-gold" style={{ padding: '0.4rem', fontSize: '0.8rem' }}
                      disabled={!draftIntent || loadingAction} 
                      onClick={() => { handleAction('draft-letter', { redacted_context: redactedContext, intent: draftIntent }, '📝 Draft Letter'); setIsFabOpen(false); }}
                   >
                      Draft It
                   </button>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                   <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600 }}>🧪 What-if Simulator</p>
                   <input 
                      type="text" className="form-input" placeholder="e.g. Payment delay"
                      style={{ padding: '0.4rem', fontSize: '0.8rem' }}
                      value={whatIfScenario} onChange={e => setWhatIfScenario(e.target.value)}
                   />
                   <button 
                      className="btn-gold" style={{ padding: '0.4rem', fontSize: '0.8rem' }}
                      disabled={!whatIfScenario || loadingAction} 
                      onClick={() => { handleAction('what-if', { redacted_context: redactedContext, scenario: whatIfScenario }, `🧪 Scenario: ${whatIfScenario}`); setIsFabOpen(false); }}
                   >
                      Simulate
                   </button>
                </div>
             </div>

             {/* Quick Buttons */}
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                {tools.map(tool => (
                  <button 
                    key={tool.action}
                    className="btn-ghost fade-up"
                    style={{ 
                      padding: '0.6rem 1rem', 
                      borderRadius: '40px', 
                      background: 'var(--bg-card)', 
                      border: `1px solid ${tool.color}44`,
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      boxShadow: `0 4px 12px ${tool.color}11`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                    onClick={() => { handleAction(tool.action, tool.payload, tool.label); setIsFabOpen(false); }}
                  >
                    {tool.name}
                  </button>
                ))}
             </div>
          </div>
        )}

        <button 
          className="btn-gold fab-trigger" 
          onClick={() => setIsFabOpen(!isFabOpen)}
          style={{ 
            width: '60px', 
            height: '60px', 
            borderRadius: '50%', 
            fontSize: '1.5rem', 
            boxShadow: '0 8px 32px rgba(201, 168, 76, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          {isFabOpen ? '✕' : '✨'}
        </button>
      </div>

      {error && <div style={{ color: 'var(--danger)', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)' }}>{error}</div>}

      {/* Render All Persistent Results */}
      {actionResults.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
             <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>🛠️ Tool Outputs</h3>
             <span className="badge badge-gold">{actionResults.length}</span>
          </div>
          {actionResults.map(res => (
            <div key={res.id} className="glass-card fade-up" style={{ padding: '1.25rem', borderLeft: '4px solid var(--gold)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, color: 'var(--gold-light)' }}>{res.type}</h4>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => navigator.clipboard.writeText(res.text)}>Copy</button>
                  <button className="btn-ghost danger" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => removeResult(res.id)}>✕</button>
                </div>
              </div>
              <div className="summary-content" style={{ whiteSpace: 'pre-wrap' }}>
                 {showPii && tokenMap 
                   ? Object.entries(tokenMap).reduce((t, [token, val]) => t.replaceAll(token, val), res.text)
                   : res.text}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

