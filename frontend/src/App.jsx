import React, { useState, useEffect, useRef } from 'react';
import ScoreCard from './components/ScoreCard';
import ArticleView from './components/ArticleView';
import ResultsDashboard from './components/ResultsDashboard';
import { CloudDownload, Search, ShieldCheck, BarChart3 } from 'lucide-react';

const PRESETS = [
  { label: 'Sleep Health',  url: 'https://medlineplus.gov/healthysleep.html' },
  { label: 'Caffeine',      url: 'https://medlineplus.gov/caffeine.html' },
  { label: 'Blueberries',   url: 'https://www.healthline.com/nutrition/10-proven-benefits-of-blueberries' },
];

const LOADING_MESSAGES = [
  'Fetching article...',
  'Detecting specific claims...',
  'Checking sources...',
  'Computing Grounding Gap...',
];

const MAX_HISTORY = 5;

function gapColor(gap) {
  if (gap < 0.3)  return '#00FF94';
  if (gap < 0.6)  return '#FFB800';
  return '#FF4444';
}

function normalizeUrl(raw) {
  const s = raw.trim();
  if (!s.startsWith('http://') && !s.startsWith('https://')) return 'https://' + s;
  return s;
}

function loadHistory() {
  try { return JSON.parse(localStorage.getItem('grounded_history') || '[]'); }
  catch { return []; }
}

function saveHistory(entry, prev) {
  const next = [entry, ...prev.filter(h => h.url !== entry.url)].slice(0, MAX_HISTORY);
  try { localStorage.setItem('grounded_history', JSON.stringify(next)); }
  catch {}
  return next;
}

// ─── Loading Screen ───────────────────────────────────────────────────────────
function LoadingScreen() {
  const [msgIdx, setMsgIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setMsgIdx(i => (i + 1) % LOADING_MESSAGES.length);
      setProgress(p => Math.min(p + 22, 88));
    }, 600);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="animate-fade-in" style={{ textAlign: 'center', padding: '80px 24px' }}>
      <div className="animate-pulse-slow" style={{ marginBottom: 32 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: 'linear-gradient(135deg, #00FF94 0%, #00CC75 100%)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, fontWeight: 900, color: '#000',
        }}>G</div>
      </div>

      <p style={{ color: '#888888', fontSize: 15, marginBottom: 32, minHeight: 24, transition: 'all 0.3s' }}>
        {LOADING_MESSAGES[msgIdx]}
      </p>

      <div style={{
        maxWidth: 360, margin: '0 auto',
        height: 4, background: '#222222', borderRadius: 2, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', background: '#00FF94', borderRadius: 2,
          width: `${progress}%`, transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  );
}

// ─── CompareMode ─────────────────────────────────────────────────────────────
function CompareMode({ onClose }) {
  const [urlA, setUrlA] = useState('');
  const [urlB, setUrlB] = useState('');
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [resultA, setResultA] = useState(null);
  const [resultB, setResultB] = useState(null);
  const [errorA, setErrorA] = useState(null);
  const [errorB, setErrorB] = useState(null);

  async function analyzeUrl(url, setLoading, setResult, setError) {
    const fixed = normalizeUrl(url);
    if (!fixed) return;
    setLoading(true); setError(null); setResult(null);
    const t0 = Date.now();
    try {
      const res = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: fixed }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Failed'); }
      const data = await res.json();
      const elapsed = Date.now() - t0;
      if (elapsed < 1500) await new Promise(r => setTimeout(r, 1500 - elapsed));
      setResult(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  function handleCompare() {
    if (urlA.trim()) analyzeUrl(urlA, setLoadingA, setResultA, setErrorA);
    if (urlB.trim()) analyzeUrl(urlB, setLoadingB, setResultB, setErrorB);
  }

  return (
    <div className="animate-fade-up glass-card" style={{ padding: 32, marginTop: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Compare Two Articles</h2>
        <button className="btn-ghost" onClick={onClose} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13 }}>Close</button>
      </div>

      <div className="compare-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {[
          { val: urlA, set: setUrlA, label: 'Article A', ph: 'Paste first URL...' },
          { val: urlB, set: setUrlB, label: 'Article B', ph: 'Paste second URL...' },
        ].map(({ val, set, label, ph }) => (
          <div key={label}>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 8, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</p>
            <input
              className="url-input"
              value={val} onChange={e => set(e.target.value)}
              placeholder={ph}
              style={{
                width: '100%', padding: '12px 16px',
                background: '#0A0A0A', border: '1px solid #222222', borderRadius: 10,
                color: '#FFF', fontSize: 14, transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
            />
          </div>
        ))}
      </div>

      <button className="btn-primary" onClick={handleCompare} style={{ padding: '12px 28px', borderRadius: 10, fontSize: 14 }}>
        Compare
      </button>

      {(resultA || resultB || loadingA || loadingB) && (
        <div className="compare-grid animate-fade-up" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 32 }}>
          {[
            { loading: loadingA, result: resultA, error: errorA, label: 'Article A' },
            { loading: loadingB, result: resultB, error: errorB, label: 'Article B' },
          ].map(({ loading, result, error, label }) => (
            <div key={label}>
              <p style={{ fontSize: 12, color: '#888', marginBottom: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</p>
              {loading && <p style={{ color: '#888', fontSize: 14 }}>Analyzing...</p>}
              {error && <p style={{ color: '#FF4444', fontSize: 13 }}>{error}</p>}
              {result && <ScoreCard {...result} compact />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [mode, setMode] = useState('URL'); // 'URL' or 'TEXT'
  const [url, setUrl] = useState('');
  const [textInput, setTextInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState(loadHistory);
  const [compareOpen, setCompareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);

  async function handleAnalyze(targetUrl = url) {
    let payload = {};
    let endpoint = 'http://localhost:8000/analyze';

    if (mode === 'URL') {
      const fixed = normalizeUrl(targetUrl);
      if (!fixed || fixed === 'https://') return;
      setUrl(fixed);
      payload = { url: fixed };
    } else {
      if (!textInput.trim()) return;
      payload = { text: textInput };
      endpoint = 'http://localhost:8000/analyze-text';
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const t0 = Date.now();
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.detail || 'Could not analyze this input.');
      }
      const data = await res.json();
      
      const elapsed = Date.now() - t0;
      if (elapsed < 1500) await new Promise(r => setTimeout(r, 1500 - elapsed));
      
      setResult(data);
      
      if (mode === 'URL') {
        const targetUrlNorm = normalizeUrl(targetUrl);
        setHistory(h => saveHistory({ url: targetUrlNorm, gap: data.grounding_gap, verdict: data.verdict }, h));
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setError(null);
    setUrl('');
    setTextInput('');
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  function handleCopyReport() {
    if (!result) return;
    const text = `I analyzed ${result.url || 'Direct Text'} with Grounded.\nGrounding Gap: ${result.grounding_gap.toFixed(2)} — ${result.verdict}\n${result.total_claims} specific claims found, ${result.ungrounded_count} had no sources.\ngrounded.app`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleExport() {
    if (!result) return;
    const lines = [
      `GROUNDED ANALYSIS REPORT`,
      `========================`,
      `Source: ${result.url || 'Direct Text Input'}`,
      `Grounding Gap: ${result.grounding_gap.toFixed(2)}`,
      `Verdict: ${result.verdict}`,
      `Total Claims: ${result.total_claims}`,
      `Grounded: ${result.grounded_count}`,
      `Ungrounded: ${result.ungrounded_count}`,
      ``,
      `CLAIM BREAKDOWN`,
      `---------------`,
      ...result.claims
        .filter(c => c.is_claim)
        .map(c => `[${c.grounded ? 'GROUNDED' : 'UNGROUNDED'}] ${c.text}`),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'grounded-report.txt';
    a.click();
  }

  // Map specific user-friendly error messages (UPGRADE 6)
  function getFriendlyErrorMessage(errStr) {
    if (errStr.includes("blocks") || errStr.includes("timeout") || errStr.includes("too long")) {
      return "This site blocks automated access or timed out. Try switching to TEXT mode and pasting the article.";
    }
    if (errStr.includes("readable") || errStr.includes("Not enough")) {
      return "Couldn't extract readable article text. This might be a paywall page or require login. Switch to TEXT mode to paste it directly.";
    }
    if (errStr.includes("short")) {
      return "Article too short to analyze meaningfully. Need at least 20 words.";
    }
    return errStr;
  }

  const showLanding = !loading && !result && !error;

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex', flexDirection: 'column' }}>

      {/* GitHub/Hackathon Banner (UPGRADE 8) */}
      <div style={{
        background: '#111',
        borderBottom: '1px solid #222',
        padding: '8px 24px',
        textAlign: 'center',
        fontSize: 12,
        color: '#888'
      }}>
        Open source • Built for Slop Scan 2026 • <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ color: '#00FF94', textDecoration: 'none', fontWeight: 600 }}>View on GitHub →</a>
      </div>

      {/* ── Navbar ── */}
      <nav style={{
        borderBottom: '1px solid #1A1A1A',
        padding: '0 24px',
        height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(12px)',
      }}>
        <button onClick={handleReset} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #00FF94 0%, #00CC75 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 16, color: '#000',
          }}>G</div>
          <span style={{ fontWeight: 800, fontSize: 17, color: '#FFF' }}>Grounded</span>
        </button>
        <span style={{ fontSize: 12, color: '#444', fontWeight: 500 }}>Built for Slop Scan 2026</span>
      </nav>

      {/* ── Main ── */}
      <main style={{ flex: 1, maxWidth: 900, width: '100%', margin: '0 auto', padding: '0 24px 80px' }}>

        {/* ── Hero (landing only) ── */}
        {showLanding && (
          <div className="animate-fade-up" style={{ textAlign: 'center', padding: '80px 0 32px' }}>
            <p style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.2em',
              textTransform: 'uppercase', color: '#00FF94', marginBottom: 20,
            }}>
              Claim Verification Engine
            </p>
            <h1 className="hero-title" style={{ fontSize: 96, fontWeight: 900, lineHeight: 1, color: '#FFF', marginBottom: 24 }}>
              Grounded
            </h1>
            <p style={{ fontSize: 20, color: '#888888', fontWeight: 400 }}>
              Specific claims. No sources. We count them.
              <span className="animate-blink" style={{ color: '#00FF94', marginLeft: 2, fontWeight: 300 }}>|</span>
            </p>
          </div>
        )}

        {/* ── Results header ── */}
        {result && !loading && (
          <div className="animate-fade-in" style={{ padding: '32px 0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <button onClick={handleReset} className="btn-ghost" style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              ← New Scan
            </button>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleCopyReport} className="btn-ghost" style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13 }}>
                {copied ? '✓ Copied!' : 'Copy Report'}
              </button>
              <button onClick={handleExport} className="btn-ghost" style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13 }}>
                Export .txt
              </button>
            </div>
          </div>
        )}

        {/* ── Mode Toggle Switch (UPGRADE 2) ── */}
        {showLanding && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <div style={{ background: '#111', padding: 4, borderRadius: 100, display: 'flex', gap: 4, border: '1px solid #222' }}>
              <button
                onClick={() => setMode('URL')}
                style={{
                  padding: '6px 18px', borderRadius: 100, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                  background: mode === 'URL' ? '#FFF' : 'transparent',
                  color: mode === 'URL' ? '#000' : '#888',
                  transition: 'all 0.2s'
                }}
              >
                URL MODE
              </button>
              <button
                onClick={() => setMode('TEXT')}
                style={{
                  padding: '6px 18px', borderRadius: 100, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                  background: mode === 'TEXT' ? '#FFF' : 'transparent',
                  color: mode === 'TEXT' ? '#000' : '#888',
                  transition: 'all 0.2s'
                }}
              >
                TEXT MODE
              </button>
            </div>
          </div>
        )}

        {/* ── Input Box / Text Area ── */}
        {!loading && !result && !error && (
          <div style={{ marginBottom: 40 }}>
            {mode === 'URL' ? (
              <div style={{
                display: 'flex', gap: 10, alignItems: 'stretch',
                background: '#111111', border: '1px solid #222222',
                borderRadius: 14, padding: 8,
              }}>
                <input
                  ref={inputRef}
                  className="url-input"
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                  placeholder="Paste any health article URL..."
                  style={{
                    flex: 1, padding: '12px 16px', background: 'transparent',
                    border: '1px solid transparent', borderRadius: 10,
                    color: '#FFF', fontSize: 15,
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                />
                <button
                  className="btn-primary"
                  onClick={() => handleAnalyze()}
                  disabled={!url.trim()}
                  style={{ padding: '12px 28px', borderRadius: 10, fontSize: 15, whiteSpace: 'nowrap' }}
                >
                  Analyze
                </button>
              </div>
            ) : (
              <div style={{
                display: 'flex', flexDirection: 'column', gap: 12,
                background: '#111111', border: '1px solid #222222',
                borderRadius: 14, padding: 12,
              }}>
                <textarea
                  ref={inputRef}
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  placeholder="Paste article text directly here..."
                  style={{
                    width: '100%', height: 160, background: 'transparent',
                    border: 'none', resize: 'none', color: '#FFF', fontSize: 14,
                    lineHeight: 1.6, outline: 'none'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="btn-primary"
                    onClick={() => handleAnalyze()}
                    disabled={!textInput.trim()}
                    style={{ padding: '10px 24px', borderRadius: 10, fontSize: 14 }}
                  >
                    Analyze Text
                  </button>
                </div>
              </div>
            )}

            {/* Presets */}
            {mode === 'URL' && (
              <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#555', fontWeight: 500 }}>Try:</span>
                {PRESETS.map(p => (
                  <button
                    key={p.label}
                    className="btn-ghost"
                    onClick={() => { setUrl(p.url); handleAnalyze(p.url); }}
                    style={{ padding: '5px 14px', borderRadius: 100, fontSize: 12 }}
                  >
                    {p.label}
                  </button>
                ))}
                <button
                  className="btn-ghost"
                  onClick={() => setCompareOpen(v => !v)}
                  style={{ padding: '5px 14px', borderRadius: 100, fontSize: 12, marginLeft: 'auto' }}
                >
                  ⊞ Compare Two Articles
                </button>
              </div>
            )}
          </div>
        )}
        {/* --- NEW HOMEPAGE CREDIBILITY SECTIONS --- */}
        {showLanding && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 56, marginTop: 48 }} className="animate-fade-up">
            
            {/* LIVE STATS */}
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#00FF94', marginBottom: 12 }}>
                Built on Signal, Not Models
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 16,
                marginTop: 20
              }} className="compare-grid">
                {[
                  { label: '0 LLM API calls', desc: 'No hallucination risk' },
                  { label: '4 detection signals', desc: 'spaCy syntactic rules' },
                  { label: '100% deterministic', desc: 'Repeatable verification' }
                ].map((stat, idx) => (
                  <div key={idx} style={{
                    background: '#111111',
                    border: '1px solid #222222',
                    borderRadius: 16,
                    padding: 24,
                    textAlign: 'center'
                  }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: '#FFFFFF', display: 'block', marginBottom: 4 }}>
                      {stat.label}
                    </span>
                    <span style={{ fontSize: 12, color: '#666666', fontWeight: 500 }}>
                      {stat.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* HOW IT WORKS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h3 style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.15em', color: '#888', textTransform: 'uppercase', textAlign: 'center' }}>
                How It Works
              </h3>
              <div style={{
                display: 'flex',
                alignItems: 'stretch',
                justifyContent: 'space-between',
                gap: 12
              }} className="compare-grid">
                {[
                  { 
                    step: '1', 
                    title: 'FETCH', 
                    desc: 'We retrieve the article from the URL you provide', 
                    icon: <CloudDownload className="w-5 h-5 text-indigo-400" />
                  },
                  { 
                    step: '2', 
                    title: 'DETECT', 
                    desc: 'spaCy NLP identifies every specific claim — numbers, causal assertions, trigger phrases', 
                    icon: <Search className="w-5 h-5 text-emerald-400" />
                  },
                  { 
                    step: '3', 
                    title: 'VERIFY', 
                    desc: 'Each claim is checked for adjacent sources, named authorities, and citation patterns', 
                    icon: <ShieldCheck className="w-5 h-5 text-amber-400" />
                  },
                  { 
                    step: '4', 
                    title: 'SCORE', 
                    desc: 'Grounding Gap = Ungrounded ÷ Total Claims. One honest number. No LLM involved.', 
                    icon: <BarChart3 className="w-5 h-5 text-pink-400" />
                  }
                ].map((item, idx) => (
                  <React.Fragment key={idx}>
                    <div style={{
                      flex: 1,
                      background: '#111111',
                      border: '1px solid #222222',
                      borderRadius: 16,
                      padding: 24,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      alignItems: 'center',
                      textAlign: 'center',
                      minHeight: 200
                    }}>
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: '#1A1A1A',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 4
                      }}>
                        {item.icon}
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#888888', letterSpacing: '0.1em' }}>
                        STEP {item.step}: {item.title}
                      </span>
                      <p style={{ fontSize: 12, color: '#CCCCCC', lineHeight: 1.5, margin: 0 }}>
                        {item.desc}
                      </p>
                    </div>
                    {idx < 3 && (
                      <div style={{ 
                        fontSize: 24, 
                        fontWeight: 900, 
                        color: '#333333',
                        display: 'flex',
                        alignItems: 'center'
                      }} className="arrow-divider">
                        →
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* EXAMPLE RESULTS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h3 style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.15em', color: '#888', textTransform: 'uppercase', textAlign: 'center' }}>
                Example Results
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 20
              }} className="compare-grid">
                
                {/* Example 1: Sleep Health (green) */}
                <div 
                  onClick={() => {
                    setUrl('https://medlineplus.gov/healthysleep.html');
                    handleAnalyze('https://medlineplus.gov/healthysleep.html');
                  }}
                  style={{
                    background: '#111111',
                    border: '1px solid rgba(0, 255, 148, 0.2)',
                    borderRadius: 16,
                    padding: 24,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#00FF94';
                    e.currentTarget.style.boxShadow = '0 4px 24px rgba(0, 255, 148, 0.1)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(0, 255, 148, 0.2)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#888888', wordBreak: 'break-all' }}>
                      medlineplus.gov/healthysleep.html
                    </span>
                    <span style={{ 
                      background: 'rgba(0, 255, 148, 0.12)', 
                      color: '#00FF94',
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: 4
                    }}>
                      ✓ Government health source
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                    <span style={{ fontSize: 36, fontWeight: 900, color: '#00FF94', fontFamily: 'monospace' }}>
                      0.18
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#CCCCCC' }}>
                      Grounding Gap
                    </span>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                    "Well Grounded"
                  </p>
                  <span style={{ fontSize: 11, color: '#666666', marginTop: 'auto' }}>
                    Click to load this analysis instantly →
                  </span>
                </div>

                {/* Example 2: Blueberries (red) */}
                <div 
                  onClick={() => {
                    setUrl('https://www.healthline.com/nutrition/10-proven-benefits-of-blueberries');
                    handleAnalyze('https://www.healthline.com/nutrition/10-proven-benefits-of-blueberries');
                  }}
                  style={{
                    background: '#111111',
                    border: '1px solid rgba(255, 68, 68, 0.2)',
                    borderRadius: 16,
                    padding: 24,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#FF4444';
                    e.currentTarget.style.boxShadow = '0 4px 24px rgba(255, 68, 68, 0.1)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255, 68, 68, 0.2)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#888888', wordBreak: 'break-all' }}>
                      healthline.com/nutrition/blueberries
                    </span>
                    <span style={{ 
                      background: 'rgba(255, 68, 68, 0.12)', 
                      color: '#FF4444',
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: 4
                    }}>
                      ⚠ Content farm article
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                    <span style={{ fontSize: 36, fontWeight: 900, color: '#FF4444', fontFamily: 'monospace' }}>
                      0.84
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#CCCCCC' }}>
                      Grounding Gap
                    </span>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                    "Ungrounded"
                  </p>
                  <span style={{ fontSize: 11, color: '#666666', marginTop: 'auto' }}>
                    Click to load this analysis instantly →
                  </span>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* ── Compare Mode ── */}
        {compareOpen && showLanding && <CompareMode onClose={() => setCompareOpen(false)} />}

        {/* ── Recent History ── */}
        {showLanding && history.length > 0 && (
          <div className="animate-fade-up" style={{ marginTop: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#555', marginBottom: 14 }}>
              Recent Scans
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {history.map((h, i) => (
                <button
                  key={i}
                  className="btn-ghost"
                  onClick={() => { setUrl(h.url); handleAnalyze(h.url); }}
                  style={{
                    padding: '12px 16px', borderRadius: 10, fontSize: 13,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    textAlign: 'left', gap: 12,
                  }}
                >
                  <span style={{ color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{h.url}</span>
                  <span style={{ fontWeight: 700, color: gapColor(h.gap), flexShrink: 0 }}>{h.gap.toFixed(2)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Loading State ── */}
        {loading && <LoadingScreen />}

        {/* ── Error State (UPGRADE 6) ── */}
        {error && !loading && (
          <div className="animate-fade-up glass-card" style={{ padding: 32, borderColor: 'rgba(255,68,68,0.3)', marginTop: 8 }}>
            <p style={{ color: '#FF4444', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Scan Failed</p>
            <p style={{ color: '#888', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
              {getFriendlyErrorMessage(error)}
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="btn-primary"
                onClick={() => {
                  setMode('TEXT');
                  setError(null);
                }}
                style={{ padding: '8px 20px', borderRadius: 8, fontSize: 13 }}
              >
                Switch to Text Mode
              </button>
              <button className="btn-ghost" onClick={() => handleAnalyze()} style={{ padding: '8px 20px', borderRadius: 8, fontSize: 13 }}>
                Retry Scan
              </button>
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {result && !loading && (
          <ResultsDashboard
            result={result}
            onReset={handleReset}
            onCopy={handleCopyReport}
            copied={copied}
            onExport={handleExport}
            onCompare={() => {
              handleReset();
              setCompareOpen(true);
            }}
          />
        )}
      </main>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid #1A1A1A', padding: '20px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: '#333' }}>
          All analysis is computed locally — deterministic spaCy NLP, no LLM APIs.
        </p>
      </footer>
    </div>
  );
}
