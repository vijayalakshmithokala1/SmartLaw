import React, { useState, useRef } from 'react';
import QuickActions from './QuickActions';
import Modal from './Modal';

const ACCEPTED = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.bmp,.tiff';
const FILE_LABELS = { pdf: 'PDF', doc: 'Word', docx: 'Word', jpg: 'Image', jpeg: 'Image', png: 'Image', bmp: 'Image', tiff: 'Image' };
const STEPS = ['📄 Extracting text', '🔒 Redacting PII', '🤖 Summarising'];



export default function DocUploader({ 
  token, apiBase, onSummaryReady, 
  step, setStep, 
  result, setResult, 
  error, setError,
  initialTab = 'summary'
}) {
  const [activeResultTab, setActiveResultTab] = useState(initialTab);
  const [dragOver, setDragOver] = useState(false);
  const [showPii, setShowPii] = useState(false);
  const [showEntitiesModal, setShowEntitiesModal] = useState(false);
  const fileRef = useRef();

  const reset = () => { setResult(null); setError(''); setStep(-1); setShowPii(false); setActiveResultTab(initialTab); };

  React.useEffect(() => {
    if (result) setActiveResultTab(initialTab);
  }, [initialTab, result]);

  const processFile = async (file) => {
    if (!file) return;
    reset();

    const ext = file.name.split('.').pop().toLowerCase();
    if (!FILE_LABELS[ext]) {
      setError('Unsupported file type. Please upload PDF, DOC, DOCX, JPG, or PNG.');
      return;
    }

    // Step 0 — show extraction
    setStep(0);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Step 0 — brief pause so user sees the extraction step
      await delay(700);
      setStep(1); // Redacting PII — fetch starts here

      const res = await fetch(`${apiBase}/document/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      setStep(2); // AI summarising
      await delay(300);

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Upload failed. Please try again.');
        setStep(-1);
        return;
      }

      setResult({ ...data, filename: file.name });
      setStep(3);

      // Pass full result to Dashboard
      if (onSummaryReady) {
        onSummaryReady({ ...data, filename: file.name });
      }
    } catch {
      setError('Could not connect to the server. Is the backend running?');
      setStep(-1);
    }
  };

  // Drag & drop handlers
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  const onFileChange = (e) => processFile(e.target.files[0]);

  const isProcessing = step >= 0 && step < 3;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Upload Zone */}
      {step === -1 && !result && (
        <div
          className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED}
            style={{ display: 'none' }}
            onChange={onFileChange}
            id="file-upload-input"
          />

          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📂</div>
          <p style={{ fontWeight: 700, fontSize: '1.0625rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
            Drop your legal document here
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            or click anywhere to browse
          </p>

          {/* File format badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px' }}>
            {['PDF', 'DOC', 'DOCX', 'JPG', 'PNG'].map(fmt => (
              <span key={fmt} className="badge badge-gold">{fmt}</span>
            ))}
          </div>
        </div>
      )}

      {/* Processing Steps */}
      {isProcessing && (
        <div className="glass-card fade-up" style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
            Processing your document…
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: 280, margin: '0 auto' }}>
            {STEPS.map((label, i) => {
              const isDone = step > i;
              const isActive = step === i;
              return (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.6rem 0.875rem',
                  borderRadius: 'var(--radius-sm)',
                  background: isDone ? 'rgba(16,185,129,0.08)' : isActive ? 'var(--gold-dim)' : 'transparent',
                  border: `1px solid ${isDone ? 'rgba(16,185,129,0.2)' : isActive ? 'var(--gold-border)' : 'var(--border)'}`,
                  transition: 'all 0.3s',
                }}>
                  <span style={{ fontSize: '1rem' }}>
                    {isDone ? '✅' : isActive ? '⏳' : '⬜️'}
                  </span>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 400,
                      color: isDone ? 'var(--success)' : isActive ? 'var(--gold-light)' : 'var(--text-muted)',
                    }}>
                    {label}
                  </span>
                  {isActive && (
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                      <span className="pulse-dot" />
                      <span className="pulse-dot" />
                      <span className="pulse-dot" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Privacy assurance */}
          <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            🔒 Sensitive information is being stripped before the AI sees your document
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="fade-up" style={{
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.25rem',
          color: 'var(--danger)',
          fontSize: '0.875rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
        }}>
          <span>⚠️ {error}</span>
          <button className="btn-ghost" onClick={reset} style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem', flexShrink: 0 }}>
            Try Again
          </button>
        </div>
      )}

      {/* Result */}
      {result && step === 3 && (
        <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, minHeight: 0 }}>

          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '8px', background: 'var(--gold-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>📄</div>
              <div>
                <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)', margin: 0 }}>
                  {result.filename}
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                   Analysis Complete • {result.char_count?.toLocaleString()} characters
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn-ghost" onClick={() => setActiveResultTab('document')} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                📄 View Document
              </button>
              <button className="btn-gold" onClick={reset} style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
                Analyze New
              </button>
            </div>
          </div>

          <div className="result-container">
            
            {/* MINI SIDEBAR */}
            <div className="result-mini-sidebar">
              {[
                { id: 'summary', icon: '📝', label: 'Summary' },
                { id: 'document', icon: '📜', label: 'Document View' },
                { id: 'risk', icon: '⚖️', label: 'Risk Analyzer' },
                { id: 'deadlines', icon: '📅', label: 'Obligations' },
                { id: 'negotiate', icon: '🤝', label: 'Negotiate' },
                { id: 'todo', icon: '📋', label: 'To-Do List' },
                { id: 'draft', icon: '✍️', label: 'Drafting' },
                { id: 'translate', icon: '🌐', label: 'Translate' },
                { id: 'simulator', icon: '🧪', label: 'Simulator' },
                { id: 'metadata', icon: '📁', label: 'Metadata' }
              ].map(item => (
                <div 
                  key={item.id} 
                  className={`result-sidebar-item ${activeResultTab === item.id ? 'active' : ''}`}
                  onClick={() => setActiveResultTab(item.id)}
                  title={item.label}
                >
                  {item.icon}
                </div>
              ))}
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="result-content-area">
              
              {/* Summary Tab */}
              {activeResultTab === 'summary' && (
                <div className="glass-card fade-up" style={{ padding: '1.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>📝</span>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--gold-light)', margin: 0 }}>
                      Executive Summary
                    </h3>
                    <span className="badge badge-blue" style={{ marginLeft: 'auto' }}>AI Simplified</span>
                  </div>
                  
                  <div className="summary-content" style={{ whiteSpace: 'pre-wrap', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                    {showPii && result.token_map 
                      ? Object.entries(result.token_map).reduce((t, [token, val]) => t.replaceAll(token, val), result.summary) 
                      : result.summary}
                  </div>
                </div>
              )}

              {/* Document View Tab */}
              {activeResultTab === 'document' && (
                <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                   <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button className="btn-gold" onClick={() => window.print()} style={{ padding: '0.5rem 1rem' }}>
                         📥 Download Official PDF
                      </button>
                   </div>
                   <div className="legal-paper">
                      <div className="legal-paper-header">
                         <h1>SmartLaw Official Draft</h1>
                         <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>ID: {result.filename?.toUpperCase()}</p>
                      </div>
                      <div className="legal-paper-content">
                         {showPii && result.token_map 
                           ? Object.entries(result.token_map).reduce((t, [token, val]) => t.replaceAll(token, val), result.summary) 
                           : result.summary}
                      </div>
                   </div>
                </div>
              )}

              {/* Other Tool Tabs — Handled by QuickActions */}
              <QuickActions 
                 token={token} 
                 apiBase={apiBase} 
                 redactedContext={result.redacted_text} 
                 summaryText={result.summary}
                 tokenMap={result.token_map}
                 showPii={showPii}
                 activeTab={activeResultTab}
                 result={result}
                 setShowEntitiesModal={setShowEntitiesModal}
              />
            </div>
          </div>



          {/* PII Entities Table Modal */}
          <Modal 
            isOpen={showEntitiesModal} 
            onClose={() => setShowEntitiesModal(false)}
            title="Privacy Guard: Redacted Entities"
          >
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              These items were removed from the document text before it was sent to the AI. 
              The server never saw these values.
            </p>
            <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-surface)', zIndex: 1 }}>
                  <tr>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>Label</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>Real Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(result.token_map || {}).map(([token, val], i) => (
                    <tr key={token} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '0.75rem', color: 'var(--gold-light)', fontWeight: 600 }}>{token}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-primary)' }}>{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button className="btn-gold" onClick={() => setShowEntitiesModal(false)}>Close</button>
            </div>
          </Modal>

        </div>
      )}
    </div>
  );
}

const delay = (ms) => new Promise(res => setTimeout(res, ms));
