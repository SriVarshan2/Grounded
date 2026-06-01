import React, { useEffect, useState } from 'react';

function gapColor(gap) {
  if (gap < 0.3)  return '#00FF94';
  if (gap < 0.6)  return '#FFB800';
  return '#FF4444';
}

function gapLabel(gap) {
  if (gap < 0.3) return 'Well Grounded';
  if (gap < 0.6) return 'Partially Grounded';
  if (gap < 0.8) return 'Poorly Grounded';
  return 'Ungrounded';
}

function getVerdictExplanation(gap) {
  if (gap < 0.3) {
    return "This article backs up what it claims. Safe to read and reference.";
  } else if (gap < 0.6) {
    return "Some claims lack sources. Verify key statistics before sharing.";
  } else if (gap < 0.8) {
    return "Most claims are unverified. Treat specific numbers with skepticism.";
  } else {
    return "Almost nothing is sourced. This article sounds authoritative but isn't.";
  }
}

function ReliabilityBadge({ reliability }) {
  const styles = {
    high:   { background: 'rgba(0,255,148,0.12)', color: '#00FF94' },
    medium: { background: 'rgba(255,184,0,0.12)',  color: '#FFB800' },
    low:    { background: 'rgba(255,68,68,0.12)',   color: '#FF4444' },
  };
  const s = styles[reliability] || styles.low;
  return (
    <span className="badge" style={{ ...s, padding: '4px 10px' }}>
      {reliability || 'low'} confidence
    </span>
  );
}

function AnimatedNumber({ target }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = null;
    const duration = 900;
    function step(ts) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(eased * target);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [target]);

  return <>{display.toFixed(2)}</>;
}

export default function ScoreCard({
  grounding_gap = 0,
  total_claims = 0,
  grounded_count = 0,
  ungrounded_count = 0,
  verdict = '',
  reliability = 'low',
  reliability_note = '',
  claims = [],
  compact = false,
  word_count = 0,
  sentence_count = 0,
  processing_time_ms = 0,
}) {
  const color = gapColor(grounding_gap);
  const pct = Math.round(grounding_gap * 100);

  // Confidence calculations based on claims found
  const confidenceLabel = total_claims >= 8 ? 'HIGH' : total_claims >= 4 ? 'MEDIUM' : 'LOW';
  const confidenceColor = confidenceLabel === 'HIGH' ? '#00FF94' : confidenceLabel === 'MEDIUM' ? '#FFB800' : '#FF4444';

  // Claim type breakdown counting
  const claimTypes = {
    number: 0,
    causal: 0,
    trigger_phrase: 0,
    comparative: 0
  };
  
  if (claims && claims.length > 0) {
    claims.forEach(c => {
      if (c.is_claim && claimTypes[c.claim_type] !== undefined) {
        claimTypes[c.claim_type]++;
      }
    });
  }

  const maxTypeCount = Math.max(...Object.values(claimTypes), 1);

  if (compact) {
    return (
      <div className="glass-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 40, fontWeight: 900, color, lineHeight: 1 }}>
            <AnimatedNumber target={grounding_gap} />
          </span>
          <span style={{ fontSize: 12, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Grounding Gap
          </span>
        </div>
        <p style={{ fontSize: 13, color: '#CCC', marginBottom: 12 }}>{verdict}</p>
        <div style={{ height: 4, background: '#222', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: color, width: `${pct}%`, transition: 'width 0.8s ease' }} />
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <span style={{ fontSize: 11, color: '#888' }}>Total: <strong style={{ color: '#FFF' }}>{total_claims}</strong></span>
          <span style={{ fontSize: 11, color: '#888' }}>Grounded: <strong style={{ color: '#00FF94' }}>{grounded_count}</strong></span>
          <span style={{ fontSize: 11, color: '#888' }}>Ungrounded: <strong style={{ color: '#FF4444' }}>{ungrounded_count}</strong></span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card animate-count-up" style={{ padding: 40 }}>
      {/* Top row */}
      <div className="scorecard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 40, alignItems: 'start' }}>

        {/* LEFT: Big score */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#555' }}>
              Grounding Gap
            </p>
            <ReliabilityBadge reliability={reliability} />
          </div>

          <div style={{ fontSize: 100, fontWeight: 900, lineHeight: 1, color, marginBottom: 16, letterSpacing: '-4px' }}>
            <AnimatedNumber target={grounding_gap} />
          </div>

          <p style={{ fontSize: 20, fontWeight: 600, color: '#FFF', marginBottom: 6 }}>{verdict}</p>
          <p style={{ fontSize: 14, color: '#888', lineHeight: 1.5, marginBottom: 14 }}>
            {getVerdictExplanation(grounding_gap)}
          </p>
          <p style={{ fontSize: 12, color: '#555', fontStyle: 'italic' }}>{gapLabel(grounding_gap)}</p>
        </div>

        {/* RIGHT: Stats column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 180 }}>
          {[
            { label: 'Total Claims',  value: total_claims,    color: '#FFF' },
            { label: 'Grounded',      value: grounded_count,  color: '#00FF94' },
            { label: 'Ungrounded',    value: ungrounded_count, color: '#FF4444' },
          ].map(({ label, value, color: c }) => (
            <div key={label} style={{
              background: '#0A0A0A', border: '1px solid #222222',
              borderRadius: 10, padding: '16px 20px',
            }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#555', marginBottom: 6 }}>
                {label}
              </p>
              <p style={{ fontSize: 28, fontWeight: 800, color: c, lineHeight: 1 }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginTop: 36, height: 8, background: '#222222', borderRadius: 4, overflow: 'hidden' }}>
        <div
          className="progress-fill"
          style={{
            height: '100%', background: color, borderRadius: 4,
            '--fill-width': `${pct}%`,
          }}
        />
      </div>

      {/* Scale labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, borderBottom: '1px solid #1A1A1A', paddingBottom: 24 }}>
        {['0.0 Well Grounded', '0.3', '0.6 Poorly Grounded', '1.0 Ungrounded'].map((l, i) => (
          <span key={i} style={{ fontSize: 10, color: '#333', fontWeight: 500 }}>{l}</span>
        ))}
      </div>

      {/* Signal Confidence Indicator (UPGRADE 3) */}
      <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555' }}>
          Signal Confidence:
        </span>
        <span style={{ fontSize: 12, fontWeight: 800, color: confidenceColor }}>
          {confidenceLabel}
        </span>
        <span style={{ fontSize: 12, color: '#666' }}>
          • Based on {total_claims} specific claims found
        </span>
      </div>

      {/* Claim Type Breakdown Panel (UPGRADE 4) */}
      <div style={{ marginTop: 32 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', marginBottom: 16 }}>
          Claim Types Found
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'Number Claims', count: claimTypes.number, eg: 'e.g. "reduces by 40%"' },
            { label: 'Causal Claims', count: claimTypes.causal, eg: 'e.g. "prevents disease"' },
            { label: 'Trigger Phrases', count: claimTypes.trigger_phrase, eg: 'e.g. "studies show"' },
            { label: 'Comparatives', count: claimTypes.comparative, eg: 'e.g. "more effective than"' },
          ].map(({ label, count, eg }) => {
            const barWidth = Math.max((count / maxTypeCount) * 100, 3);
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 140, flexShrink: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#CCC' }}>{label}</p>
                  <p style={{ fontSize: 10, color: '#555' }}>{eg}</p>
                </div>
                <div style={{ flex: 1, height: 8, background: '#1A1A1A', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', background: '#00FF94', borderRadius: 4,
                    width: `${barWidth}%`, transition: 'width 0.8s ease'
                  }} />
                </div>
                <div style={{ width: 24, textAlignment: 'right', fontSize: 13, fontWeight: 700, color: '#FFF' }}>
                  {count}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PROBLEM 3: ARTICLE STATS Section */}
      <div style={{ marginTop: 32, borderTop: '1px solid #1A1A1A', paddingTop: 24 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', marginBottom: 16 }}>
          Article Processing Stats
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 12
        }}>
          {[
            { label: 'Words analyzed', value: word_count || 'N/A' },
            { label: 'Sentences processed', value: sentence_count || 'N/A' },
            { label: 'Processing time', value: `${processing_time_ms || 0}ms` },
            { label: 'Claim density', value: `${sentence_count > 0 ? Math.round((total_claims / sentence_count) * 100) : 0}%` },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: '#070707',
              border: '1px solid #1A1A1A',
              borderRadius: 10,
              padding: '12px 16px',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#555555', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                {label}
              </span>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF' }}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {reliability_note && (
        <p style={{ marginTop: 24, fontSize: 12, color: '#444', fontStyle: 'italic' }}>
          {reliability_note}
        </p>
      )}
    </div>
  );
}
