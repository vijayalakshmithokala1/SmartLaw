import React, { useState, useEffect } from 'react';

/**
 * CaseRoadmap — Interactive visual pipeline showing every stage a document
 * passes through: Upload → Redact → Summarise → [user-driven tools].
 *
 * Props:
 *   result        — the full document result object (null = no doc loaded)
 *   uploadStep    — -1 idle, 0 extracting, 1 redacting, 2 summarising, 3 done
 *   onNavigate    — (tabId) callback to switch the active result tab
 *   activeTab     — currently active result tab id
 */
export default function CaseRoadmap({ result, uploadStep, onNavigate, activeTab }) {
  const [animatedStage, setAnimatedStage] = useState(-1);

  // Animate nodes appearing one-by-one when document is done
  useEffect(() => {
    if (uploadStep === 3 && result) {
      let i = 0;
      const interval = setInterval(() => {
        setAnimatedStage(i);
        i++;
        if (i >= PIPELINE.length) clearInterval(interval);
      }, 120);
      return () => clearInterval(interval);
    } else {
      setAnimatedStage(-1);
    }
  }, [uploadStep, result]);

  // ── Pipeline definition ────────────────────────────────────────────────
  const PIPELINE = [
    {
      id: 'upload',
      icon: '📂',
      label: 'File Upload',
      desc: 'Document received',
      autoCompleted: uploadStep >= 1,
      alwaysVisible: true,
      color: '#C9A84C',
    },
    {
      id: 'redact',
      icon: '🔒',
      label: 'PII Redaction',
      desc: result?.pii_found ? `${Object.keys(result.token_map || {}).length} entities redacted` : 'Privacy scan complete',
      autoCompleted: uploadStep >= 2,
      alwaysVisible: true,
      color: '#10B981',
    },
    {
      id: 'summary',
      icon: '📝',
      label: 'AI Summary',
      desc: 'Plain-English explanation',
      autoCompleted: uploadStep === 3,
      alwaysVisible: true,
      color: '#3B82F6',
      tab: 'summary',
    },
    {
      id: 'risk',
      icon: '⚖️',
      label: 'Risk Analysis',
      desc: result?.risk_level ? `Level: ${result.risk_level}` : 'Run to see risk level',
      autoCompleted: false,
      alwaysVisible: false,
      color: result?.risk_level === 'HIGH' || result?.risk_level === 'CRITICAL' ? '#EF4444' : '#F59E0B',
      tab: 'risk',
    },
    {
      id: 'deadlines',
      icon: '📅',
      label: 'Obligations',
      desc: 'Deadlines & duties',
      autoCompleted: false,
      alwaysVisible: false,
      color: '#8B5CF6',
      tab: 'deadlines',
    },
    {
      id: 'negotiate',
      icon: '🤝',
      label: 'Negotiate',
      desc: 'Counter-clause strategy',
      autoCompleted: false,
      alwaysVisible: false,
      color: '#06B6D4',
      tab: 'negotiate',
    },
    {
      id: 'todo',
      icon: '📋',
      label: 'Action Items',
      desc: 'Prioritized to-do list',
      autoCompleted: false,
      alwaysVisible: false,
      color: '#EC4899',
      tab: 'todo',
    },
    {
      id: 'draft',
      icon: '✍️',
      label: 'Draft Letter',
      desc: 'AI response generation',
      autoCompleted: false,
      alwaysVisible: false,
      color: '#F97316',
      tab: 'draft',
    },
  ];

  // While still uploading — show a condensed in-progress strip
  if (uploadStep >= 0 && uploadStep < 3) {
    return <ProcessingRoadmap step={uploadStep} />;
  }

  // No document loaded yet
  if (!result) {
    return <EmptyRoadmap />;
  }

  // Full interactive roadmap
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
        <span style={{ fontSize: '1rem' }}>🗺️</span>
        <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.03em' }}>
          CASE ROADMAP
        </h3>
        <span className="badge badge-green" style={{ marginLeft: 'auto', fontSize: '0.65rem' }}>LIVE</span>
      </div>

      {/* Nodes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {PIPELINE.map((stage, idx) => {
          const isVisible = stage.alwaysVisible || result;
          if (!isVisible) return null;

          const isActive = activeTab === stage.tab;
          const isClickable = !!stage.tab && uploadStep === 3;
          const isAnimatedIn = animatedStage >= idx;

          return (
            <div
              key={stage.id}
              style={{
                opacity: isAnimatedIn ? 1 : 0,
                transform: isAnimatedIn ? 'translateX(0)' : 'translateX(-8px)',
                transition: `opacity 0.3s ease ${idx * 0.05}s, transform 0.3s ease ${idx * 0.05}s`,
              }}
            >
              {/* Connector line (except first) */}
              {idx > 0 && (
                <div style={{
                  width: 2,
                  height: 12,
                  marginLeft: 20,
                  background: stage.alwaysVisible && stage.autoCompleted
                    ? 'rgba(16,185,129,0.5)'
                    : 'var(--border)',
                  transition: 'background 0.4s',
                }} />
              )}

              {/* Node row */}
              <div
                onClick={() => isClickable && onNavigate(stage.tab)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.55rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  cursor: isClickable ? 'pointer' : 'default',
                  border: `1px solid ${isActive ? stage.color + '55' : 'transparent'}`,
                  background: isActive ? `${stage.color}10` : 'transparent',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
                className={isClickable ? 'roadmap-node-hover' : ''}
                title={stage.label}
              >
                {/* Status circle */}
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: stage.autoCompleted
                    ? 'rgba(16,185,129,0.12)'
                    : isActive
                      ? `${stage.color}18`
                      : 'var(--bg-surface)',
                  border: `2px solid ${
                    stage.autoCompleted
                      ? 'rgba(16,185,129,0.5)'
                      : isActive
                        ? stage.color
                        : 'var(--border)'
                  }`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  flexShrink: 0,
                  transition: 'all 0.3s',
                  boxShadow: isActive ? `0 0 10px ${stage.color}44` : 'none',
                }}>
                  {stage.autoCompleted ? '✅' : stage.icon}
                </div>

                {/* Label + desc */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: isActive ? stage.color : stage.autoCompleted ? 'var(--success)' : 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    transition: 'color 0.2s',
                  }}>
                    {stage.label}
                  </div>
                  <div style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {stage.desc}
                  </div>
                </div>

                {/* Arrow for clickable items */}
                {isClickable && stage.tab && (
                  <span style={{
                    fontSize: '0.65rem',
                    color: isActive ? stage.color : 'var(--text-muted)',
                    transition: 'color 0.2s, transform 0.2s',
                    transform: isActive ? 'translateX(2px)' : 'none',
                  }}>▶</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer stats */}
      {result && (
        <div style={{
          marginTop: '0.5rem',
          padding: '0.6rem 0.75rem',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem',
        }}>
          <StatRow label="Doc size" value={`${(result.char_count / 1024).toFixed(1)} KB`} />
          <StatRow
            label="Privacy"
            value={result.pii_found ? `🔒 ${Object.keys(result.token_map || {}).length} redacted` : '✅ Clean'}
            valueColor={result.pii_found ? '#10B981' : '#6EE7B7'}
          />
          {result.risk_level && (
            <StatRow
              label="Risk"
              value={result.risk_level}
              valueColor={
                result.risk_level === 'HIGH' || result.risk_level === 'CRITICAL'
                  ? '#EF4444'
                  : result.risk_level === 'MEDIUM'
                    ? '#F59E0B'
                    : '#10B981'
              }
            />
          )}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

function StatRow({ label, value, valueColor }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: valueColor || 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

function ProcessingRoadmap({ step }) {
  const stages = [
    { icon: '📂', label: 'Extracting text' },
    { icon: '🔒', label: 'Redacting PII' },
    { icon: '🤖', label: 'AI Summarising' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
        <span style={{ fontSize: '0.85rem' }}>⚙️</span>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.03em' }}>PROCESSING</span>
      </div>
      {stages.map((s, i) => {
        const isDone = step > i;
        const isActive = step === i;
        return (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.45rem 0.5rem',
            borderRadius: 'var(--radius-sm)',
            background: isDone ? 'rgba(16,185,129,0.06)' : isActive ? 'var(--gold-dim)' : 'transparent',
            border: `1px solid ${isDone ? 'rgba(16,185,129,0.2)' : isActive ? 'var(--gold-border)' : 'transparent'}`,
            transition: 'all 0.3s',
          }}>
            <span style={{ fontSize: '0.9rem' }}>{isDone ? '✅' : isActive ? '⏳' : '⬜'}</span>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: isActive ? 700 : 400,
              color: isDone ? 'var(--success)' : isActive ? 'var(--gold-light)' : 'var(--text-muted)',
            }}>{s.label}</span>
            {isActive && (
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 3 }}>
                <span className="pulse-dot" style={{ width: 5, height: 5 }} />
                <span className="pulse-dot" style={{ width: 5, height: 5 }} />
                <span className="pulse-dot" style={{ width: 5, height: 5 }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function EmptyRoadmap() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '1.25rem 0.5rem',
      textAlign: 'center',
    }}>
      <span style={{ fontSize: '1.5rem', opacity: 0.4 }}>🗺️</span>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
        Upload a document to see its Case Roadmap here
      </p>
    </div>
  );
}
