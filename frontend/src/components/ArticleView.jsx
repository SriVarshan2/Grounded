import React, { useState } from 'react';

export default function ArticleView({ claims = [], url = '' }) {
  const [activeIdx, setActiveIdx] = useState(null);

  if (!claims || claims.length === 0) return null;

  const totalClaims     = claims.filter(c => c.is_claim).length;
  const groundedCount   = claims.filter(c => c.is_claim && c.grounded).length;
  const ungroundedCount = totalClaims - groundedCount;

  return (
    <div className="glass-card" style={{ marginTop: 24, padding: '32px 36px' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12, marginBottom: 28,
        paddingBottom: 20, borderBottom: '1px solid #1A1A1A',
      }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#555', marginBottom: 6 }}>
            Claim Analysis
          </p>
          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 12, color: '#444', textDecoration: 'none', display: 'block', marginTop: 2 }}
              onMouseEnter={e => e.target.style.color = '#888'}
              onMouseLeave={e => e.target.style.color = '#444'}
            >
              {url.length > 70 ? url.slice(0, 70) + '…' : url}
            </a>
          )}
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 13, fontWeight: 600 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00FF94', display: 'inline-block' }} />
            <span style={{ color: '#888' }}>Grounded</span>
            <strong style={{ color: '#00FF94' }}>{groundedCount}</strong>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF4444', display: 'inline-block' }} />
            <span style={{ color: '#888' }}>Ungrounded</span>
            <strong style={{ color: '#FF4444' }}>{ungroundedCount}</strong>
          </span>
        </div>
      </div>

      {/* Claims list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {claims.map((claim, i) => {
          if (!claim.is_claim) {
            return (
              <p key={i} className="claim-item" style={{
                fontSize: 14, color: '#555', lineHeight: 1.7,
                padding: '4px 0', animationDelay: `${i * 20}ms`,
              }}>
                {claim.text}
              </p>
            );
          }

          const isGrounded = claim.grounded;
          const isActive = activeIdx === i;

          return (
            <div
              key={i}
              className={`claim-row claim-item ${isGrounded ? 'claim-grounded' : 'claim-ungrounded'}`}
              style={{
                position: 'relative',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                gap: 12, padding: '10px 14px', cursor: 'pointer',
                transition: 'background 0.15s ease',
                animationDelay: `${i * 20}ms`,
              }}
              onClick={() => setActiveIdx(isActive ? null : i)}
            >
              <p style={{ fontSize: 14, color: isGrounded ? '#CCFCE7' : '#FFD5D5', lineHeight: 1.7, flex: 1 }}>
                {claim.text}
              </p>
              <span className="badge" style={{
                ...(isGrounded
                  ? { background: 'rgba(0,255,148,0.12)', color: '#00FF94' }
                  : { background: 'rgba(255,68,68,0.12)', color: '#FF4444' }),
                flexShrink: 0, marginTop: 3,
              }}>
                {isGrounded ? 'Grounded' : 'Ungrounded'}
              </span>

              {/* Expanded detail panel */}
              {isActive && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
                  background: '#1A1A1A', border: '1px solid #333333',
                  borderRadius: '0 0 8px 8px', padding: 16,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#555', marginBottom: 4 }}>Claim Type</p>
                      <p style={{ fontSize: 13, color: '#CCC' }}>{claim.claim_type || '—'}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#555', marginBottom: 4 }}>Condition Met</p>
                      <p style={{ fontSize: 13, color: '#CCC', fontFamily: 'monospace' }}>{claim.condition_met || '—'}</p>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#555', marginBottom: 4 }}>Reason</p>
                      <p style={{ fontSize: 13, color: '#CCC', lineHeight: 1.5 }}>{claim.grounding_reason || 'No grounding source found.'}</p>
                    </div>
                    {claim.matched_pattern && (
                      <div>
                        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#555', marginBottom: 4 }}>Matched Pattern</p>
                        <code style={{ fontSize: 12, background: '#0A0A0A', color: '#00FF94', padding: '2px 6px', borderRadius: 4 }}>
                          "{claim.matched_pattern}"
                        </code>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
