import React, { useState, useEffect } from 'react';
import { 
  Hash, 
  ArrowRight, 
  Quote, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  FileText, 
  CornerDownRight, 
  ExternalLink,
  Info,
  Clock,
  Sparkles,
  BookOpen,
  ArrowUpRight
} from 'lucide-react';
import ScoreCard from './ScoreCard';

// Color formatting functions based on grounding gap score
function gapColor(gap) {
  if (gap < 0.3) return '#00FF94'; // Sleek green
  if (gap < 0.6) return '#FFB800'; // Sleek amber
  return '#FF4444'; // Sleek red
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

export default function ResultsDashboard({
  result,
  onReset,
  onCopy,
  copied,
  onExport,
  onCompare
}) {
  const [fullArticleExpanded, setFullArticleExpanded] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const {
    grounding_gap = 0,
    total_claims = 0,
    grounded_count = 0,
    ungrounded_count = 0,
    verdict = '',
    claims = [],
    word_count = 0,
    sentence_count = 0,
    processing_time_ms = 0,
    full_text = '',
    url = ''
  } = result;

  const pct = Math.round((1 - grounding_gap) * 100);
  const color = gapColor(grounding_gap);

  // Claim type breakdown counting and real examples
  const claimTypes = {
    number: { count: 0, icon: <Hash className="w-5 h-5 text-indigo-400" />, label: 'NUMBER CLAIMS', eg: 'e.g. "reduces by 40%"', matchedIcon: '#' },
    causal: { count: 0, icon: <ArrowRight className="w-5 h-5 text-emerald-400" />, label: 'CAUSAL CLAIMS', eg: 'e.g. "prevents disease"', matchedIcon: '→' },
    trigger_phrase: { count: 0, icon: <Quote className="w-5 h-5 text-amber-400" />, label: 'TRIGGER PHRASES', eg: 'e.g. "studies show"', matchedIcon: '"' },
    comparative: { count: 0, icon: <ArrowUpRight className="w-5 h-5 text-pink-400" />, label: 'COMPARATIVES', eg: 'e.g. "more effective than"', matchedIcon: '>' }
  };

  const typeExamples = {
    number: null,
    causal: null,
    trigger_phrase: null,
    comparative: null
  };

  claims.forEach(c => {
    if (c.is_claim && claimTypes[c.claim_type]) {
      claimTypes[c.claim_type].count++;
      if (!typeExamples[c.claim_type]) {
        typeExamples[c.claim_type] = c.text;
      }
    }
  });

  // Ungrounded and Grounded list division
  const ungroundedClaims = claims.filter(c => c.is_claim && !c.grounded);
  const groundedClaims = claims.filter(c => c.is_claim && c.grounded);

  // Dynamic explanations based on grounding gap score
  let whatThisMeansTitle = "WHAT THIS SCORE MEANS";
  let whatThisMeansText = "";

  if (grounding_gap > 0.6) {
    const groundedPercentage = Math.round((grounded_count / (total_claims || 1)) * 100);
    whatThisMeansText = `This article makes ${total_claims} specific claims but provides sources for only ${groundedPercentage}% of them. Before sharing or acting on this information, verify the key statistics independently.`;
  } else if (grounding_gap >= 0.3) {
    whatThisMeansText = `This article is partially sourced. ${grounded_count} claims have evidence, ${ungrounded_count} do not. Check the ungrounded claims above before citing this article.`;
  } else {
    whatThisMeansText = `This article is well sourced. Most specific claims have evidence behind them. It scores better than most health content online.`;
  }

  // Get nice banner gradient backgrounds
  const getBannerStyle = () => {
    if (grounding_gap > 0.6) {
      return {
        background: 'linear-gradient(135deg, #FF4444 0%, #B30000 100%)',
        color: '#FFFFFF'
      };
    } else if (grounding_gap >= 0.3) {
      return {
        background: 'linear-gradient(135deg, #FFB800 0%, #B88600 100%)',
        color: '#FFFFFF'
      };
    } else {
      return {
        background: 'linear-gradient(135deg, #00FF94 0%, #008F52 100%)',
        color: '#000000'
      };
    }
  };

  const bannerStyle = getBannerStyle();

  return (
    <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 32, marginTop: 24, paddingBottom: 120 }}>
      
      {/* SECTION 1: Hero Score Bar */}
      <div style={{
        ...bannerStyle,
        borderRadius: 20,
        padding: '32px 40px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Sleek background decoration */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-20%',
          width: '50%',
          height: '200%',
          background: 'rgba(255, 255, 255, 0.08)',
          transform: 'skewX(-20deg)',
          pointerEvents: 'none'
        }} />

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: 32,
          alignItems: 'center'
        }} className="scorecard-grid">
          
          {/* LEFT: Big Gap Number + Verdict */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ 
              fontSize: 10, 
              fontWeight: 800, 
              letterSpacing: '0.2em', 
              textTransform: 'uppercase', 
              opacity: 0.8
            }}>
              Grounding Gap
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
              <span style={{ 
                fontSize: 88, 
                fontWeight: 900, 
                lineHeight: 1, 
                letterSpacing: '-2px',
                fontFamily: 'monospace'
              }}>
                {grounding_gap.toFixed(2)}
              </span>
              <span style={{
                fontSize: 16,
                fontWeight: 700,
                padding: '4px 12px',
                borderRadius: 100,
                background: 'rgba(255,255,255,0.2)',
                color: grounding_gap < 0.3 ? '#000000' : '#FFFFFF',
                backdropFilter: 'blur(4px)'
              }}>
                {gapLabel(grounding_gap)}
              </span>
            </div>
            <p style={{ 
              fontSize: 18, 
              fontWeight: 800, 
              lineHeight: 1.3,
              marginTop: 4
            }}>
              {verdict}
            </p>
          </div>

          {/* RIGHT: Three stats */}
          <div style={{ 
            display: 'flex', 
            gap: 16, 
            background: 'rgba(0,0,0,0.15)', 
            padding: 24, 
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)',
            minWidth: 320
          }} className="compare-grid">
            {[
              { label: 'Total Claims', val: total_claims },
              { label: 'Grounded', val: grounded_count },
              { label: 'Ungrounded', val: ungrounded_count }
            ].map((stat, idx) => (
              <div key={idx} style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: 4
              }}>
                <span style={{ 
                  fontSize: 9, 
                  fontWeight: 800, 
                  letterSpacing: '0.08em', 
                  textTransform: 'uppercase', 
                  opacity: 0.7,
                  textAlign: 'center'
                }}>
                  {stat.label}
                </span>
                <span style={{ 
                  fontSize: 32, 
                  fontWeight: 900,
                  lineHeight: 1,
                  color: '#FFFFFF'
                }}>
                  {stat.val}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM: Progress bar showing gap position on scale */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
          <div style={{ 
            height: 8, 
            background: 'rgba(0,0,0,0.2)', 
            borderRadius: 100, 
            position: 'relative', 
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{
              height: '100%',
              width: `${Math.round(grounding_gap * 100)}%`,
              background: '#FFFFFF',
              borderRadius: 100,
              transition: 'width 0.8s ease'
            }} />
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            fontSize: 10, 
            fontWeight: 700, 
            opacity: 0.8
          }}>
            <span>0.0 Well Grounded</span>
            <span>0.3</span>
            <span>0.6</span>
            <span>1.0 Ungrounded</span>
          </div>
        </div>
      </div>

      {/* RENDER SCORECARD JUST FOR THE ARTICLE STATS & QUALITY CONTROLS */}
      <ScoreCard 
        grounding_gap={grounding_gap}
        total_claims={total_claims}
        grounded_count={grounded_count}
        ungrounded_count={ungrounded_count}
        verdict={verdict}
        word_count={word_count}
        sentence_count={sentence_count}
        processing_time_ms={processing_time_ms}
        claims={claims}
        compact={false}
      />

      {/* SECTION 2: Signal Summary Row */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h3 style={{ 
          fontSize: 12, 
          fontWeight: 800, 
          letterSpacing: '0.15em', 
          color: '#888', 
          textTransform: 'uppercase'
        }}>
          🔍 Claim Detection Metrics
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16
        }} className="compare-grid">
          {[
            { key: 'number', label: 'NUMBER CLAIMS', symbol: '#' },
            { key: 'causal', label: 'CAUSAL CLAIMS', symbol: '→' },
            { key: 'trigger_phrase', label: 'TRIGGER PHRASES', symbol: '"' },
            { key: 'comparative', label: 'COMPARATIVES', symbol: '>' }
          ].map(({ key, label, symbol }) => {
            const data = claimTypes[key];
            const rawEg = typeExamples[key];
            const egSentence = rawEg 
              ? (rawEg.length > 60 ? rawEg.slice(0, 60) + '...' : rawEg) 
              : "No specific claims of this type detected.";

            return (
              <div 
                key={key} 
                className="dashboard-card"
                style={{
                  background: '#111111',
                  border: '1px solid #222222',
                  borderRadius: 16,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  transition: 'all 0.2s ease',
                  cursor: 'default',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = color;
                  e.currentTarget.style.boxShadow = `0 4px 20px ${color}10`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#222222';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: '#1A1A1A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      fontWeight: 900,
                      color: color
                    }}>
                      {symbol}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#888888', letterSpacing: '0.05em' }}>
                      {label}
                    </span>
                  </div>
                  <span style={{ fontSize: 24, fontWeight: 900, color: '#FFFFFF' }}>
                    {data.count}
                  </span>
                </div>

                <div style={{ 
                  background: '#070707', 
                  borderRadius: 10, 
                  padding: '10px 12px',
                  border: '1px solid #1A1A1A',
                  flex: 1
                }}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: '#555555', letterSpacing: '0.05em', marginBottom: 4, textTransform: 'uppercase' }}>
                    {rawEg ? 'Example Found' : 'Metric Details'}
                  </p>
                  <p style={{ 
                    fontSize: 11, 
                    color: rawEg ? '#CCCCCC' : '#444444', 
                    fontStyle: rawEg ? 'italic' : 'normal',
                    lineHeight: 1.4 
                  }}>
                    {rawEg ? `"${egSentence}"` : egSentence}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: Claim by Claim Analysis */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* UNGROUNDED CLAIMS LIST */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 style={{ 
            fontSize: 14, 
            fontWeight: 800, 
            color: '#FF4444', 
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <AlertTriangle className="w-5 h-5" /> 
            ⚠ UNGROUNDED CLAIMS ({ungroundedClaims.length})
          </h3>
          
          {ungroundedClaims.length === 0 ? (
            <div style={{
              background: 'rgba(0, 255, 148, 0.03)',
              border: '1px dashed rgba(0, 255, 148, 0.2)',
              borderRadius: 12,
              padding: 24,
              textAlign: 'center',
              color: '#888'
            }}>
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
              Perfect score! No ungrounded claims detected in this article.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {ungroundedClaims.map((claim, idx) => (
                <div 
                  key={idx}
                  style={{
                    borderLeft: '3px solid #FF4444',
                    background: 'rgba(255, 68, 68, 0.04)',
                    borderTop: '1px solid rgba(255, 68, 68, 0.08)',
                    borderRight: '1px solid rgba(255, 68, 68, 0.08)',
                    borderBottom: '1px solid rgba(255, 68, 68, 0.08)',
                    borderRadius: '0 12px 12px 0',
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12
                  }}
                >
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ 
                      background: 'rgba(255,68,68,0.12)', 
                      color: '#FF4444',
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: 4,
                      letterSpacing: '0.05em'
                    }}>
                      UNGROUNDED
                    </span>
                    <span style={{ 
                      background: 'rgba(255,255,255,0.05)', 
                      color: '#AAAAAA',
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: 4,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase'
                    }}>
                      {claim.claim_type}
                    </span>
                  </div>

                  <p style={{ 
                    fontSize: 14, 
                    color: '#FFF2F2', 
                    fontWeight: 500,
                    lineHeight: 1.6
                  }}>
                    "{claim.text}"
                  </p>

                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 6, 
                    color: '#FF8888', 
                    fontSize: 12,
                    fontWeight: 600
                  }}>
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>
                      ⚠ Reason: {claim.grounding_reason || 'No source found adjacent to this claim'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* GROUNDED CLAIMS LIST */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
          <h3 style={{ 
            fontSize: 14, 
            fontWeight: 800, 
            color: '#00FF94', 
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <CheckCircle2 className="w-5 h-5" /> 
            ✓ GROUNDED CLAIMS ({groundedClaims.length})
          </h3>
          
          {groundedClaims.length === 0 ? (
            <div style={{
              background: 'rgba(255, 68, 68, 0.03)',
              border: '1px dashed rgba(255, 68, 68, 0.2)',
              borderRadius: 12,
              padding: 24,
              textAlign: 'center',
              color: '#888'
            }}>
              <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-2 opacity-80" />
              Critically ungrounded article. Not a single verified grounded claim detected.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {groundedClaims.map((claim, idx) => (
                <div 
                  key={idx}
                  style={{
                    borderLeft: '3px solid #00FF94',
                    background: 'rgba(0, 255, 148, 0.03)',
                    borderTop: '1px solid rgba(0, 255, 148, 0.08)',
                    borderRight: '1px solid rgba(0, 255, 148, 0.08)',
                    borderBottom: '1px solid rgba(0, 255, 148, 0.08)',
                    borderRadius: '0 12px 12px 0',
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12
                  }}
                >
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ 
                      background: 'rgba(0,255,148,0.12)', 
                      color: '#00FF94',
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: 4,
                      letterSpacing: '0.05em'
                    }}>
                      GROUNDED
                    </span>
                    <span style={{ 
                      background: 'rgba(255,255,255,0.05)', 
                      color: '#AAAAAA',
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: 4,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase'
                    }}>
                      {claim.claim_type}
                    </span>
                  </div>

                  <p style={{ 
                    fontSize: 14, 
                    color: '#E6FFF4', 
                    fontWeight: 500,
                    lineHeight: 1.6
                  }}>
                    "{claim.text}"
                  </p>

                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 6, 
                    color: '#80FFC9', 
                    fontSize: 12,
                    fontWeight: 600
                  }}>
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>
                      ✓ Source: {claim.grounding_reason || 'Verified adjacent citation / named authority link'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 5: What This Means */}
      <div style={{
        background: '#111111',
        border: `1px solid ${color}30`,
        borderRadius: 16,
        padding: '24px 28px',
        boxShadow: `0 8px 30px rgba(0,0,0,0.5), inset 0 0 15px ${color}05`,
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>
        <h4 style={{ 
          fontSize: 12, 
          fontWeight: 800, 
          letterSpacing: '0.15em', 
          color: color, 
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <Info className="w-4 h-4" />
          {whatThisMeansTitle}
        </h4>
        <p style={{ 
          fontSize: 14, 
          color: '#E0E0E0', 
          lineHeight: 1.6,
          fontWeight: 500
        }}>
          {whatThisMeansText}
        </p>
      </div>

      {/* SECTION 4: Article Full Text */}
      <div style={{ 
        background: '#111111', 
        border: '1px solid #222222', 
        borderRadius: 16, 
        overflow: 'hidden'
      }}>
        <button
          onClick={() => setFullArticleExpanded(!fullArticleExpanded)}
          style={{
            width: '100%',
            background: 'none',
            border: 'none',
            padding: '20px 24px',
            color: '#FFFFFF',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.08em' }}>
              VIEW FULL ARTICLE ANALYSIS
            </span>
          </div>
          {fullArticleExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {fullArticleExpanded && (
          <div style={{
            padding: '24px 28px',
            background: '#070707',
            borderTop: '1px solid #222222',
            fontSize: 15,
            lineHeight: 1.8,
            color: '#BBBBBB',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            {claims.map((item, idx) => {
              if (!item.is_claim) {
                return (
                  <span key={idx} style={{ transition: 'opacity 0.2s' }}>
                    {item.text}{' '}
                  </span>
                );
              }

              const isGrounded = item.grounded;
              const hlColor = isGrounded ? 'rgba(0, 255, 148, 0.15)' : 'rgba(255, 68, 68, 0.15)';
              const underlineColor = isGrounded ? '#00FF94' : '#FF4444';

              return (
                <span 
                  key={idx} 
                  style={{
                    background: hlColor,
                    borderBottom: `2px solid ${underlineColor}`,
                    padding: '2px 4px',
                    margin: '0 2px',
                    borderRadius: 4,
                    color: '#FFFFFF',
                    fontWeight: 500,
                    cursor: 'help',
                    display: 'inline-block'
                  }}
                  title={`[${isGrounded ? 'GROUNDED' : 'UNGROUNDED'}] - ${item.grounding_reason || 'Source validation details'}`}
                >
                  {item.text}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 6: Sticky Bottom Action Bar */}
      <div style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 48px)',
        maxWidth: 720,
        background: 'rgba(17, 17, 17, 0.85)',
        border: '1px solid #333333',
        boxShadow: '0 10px 30px rgba(0,0,0,0.8), inset 0 0 10px rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 1000,
        backdropFilter: 'blur(16px)'
      }} className="compare-grid">
        
        {/* Left-most back button */}
        <button 
          onClick={onReset} 
          className="btn-ghost" 
          style={{ 
            padding: '10px 18px', 
            borderRadius: 10, 
            fontSize: 13, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 6,
            fontWeight: 700,
            color: '#FFFFFF',
            background: 'rgba(255,255,255,0.05)'
          }}
        >
          ← New Scan
        </button>

        {/* Action Group */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }} className="compare-grid">
          <button 
            onClick={() => {
              onCopy();
              setCopiedSuccess(true);
              setTimeout(() => setCopiedSuccess(false), 2000);
            }} 
            className="btn-ghost" 
            style={{ 
              padding: '10px 18px', 
              borderRadius: 10, 
              fontSize: 13,
              fontWeight: 600,
              color: '#CCCCCC',
              background: 'transparent',
              borderColor: '#222'
            }}
          >
            {copiedSuccess ? '✓ Copied!' : 'Copy Report'}
          </button>
          
          <button 
            onClick={onExport} 
            className="btn-ghost" 
            style={{ 
              padding: '10px 18px', 
              borderRadius: 10, 
              fontSize: 13,
              fontWeight: 600,
              color: '#CCCCCC',
              background: 'transparent',
              borderColor: '#222'
            }}
          >
            Export .txt
          </button>

          <button 
            onClick={onCompare} 
            className="btn-primary" 
            style={{ 
              padding: '10px 18px', 
              borderRadius: 10, 
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontWeight: 700
            }}
          >
            Compare with another article →
          </button>
        </div>
      </div>

    </div>
  );
}
