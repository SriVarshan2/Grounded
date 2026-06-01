import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BarChart2, Play, Loader2, Info } from 'lucide-react';
import { evalArticles } from '../eval_data';

/**
 * EvalPanel Component
 * Displays confusion matrix and classification benchmarks (F1, Precision, Recall, Accuracy).
 * Features a collapsible container and an on-demand trigger to run the benchmark.
 */
export default function EvalPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [evalResult, setEvalResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runBenchmark = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ articles: evalArticles }),
      });

      if (!response.ok) {
        throw new Error('Backend failed to complete evaluation benchmark.');
      }

      const data = await response.json();
      setEvalResult(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error running evaluation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-12 border border-slate-800 rounded-2xl bg-slate-950/70 backdrop-blur-md overflow-hidden transition-all duration-300">
      {/* Panel Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-900/40 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <BarChart2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Hackathon Evaluation Engine
              <span className="text-[10px] lowercase bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-normal">
                judges portal
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Verify Grounded's deterministic claim signal quality with confusion matrices.
            </p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>

      {/* Panel Content */}
      {isOpen && (
        <div className="p-6 border-t border-slate-900 bg-slate-950/30">
          {!evalResult ? (
            <div className="flex flex-col items-center justify-center py-8 text-center max-w-md mx-auto">
              <Info className="w-10 h-10 text-slate-500 mb-3 opacity-60" />
              <h4 className="text-sm font-semibold text-slate-200 mb-1">Run Grounding Benchmark</h4>
              <p className="text-xs text-slate-400 mb-5">
                Execute the full pipeline across a pre-labeled dataset of 10 articles (5 slop, 5 quality) to verify performance.
              </p>
              <button
                onClick={runBenchmark}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/50 text-xs font-semibold text-white transition-all shadow-lg shadow-indigo-600/10 active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Executing Pipeline...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    Run 10-Article Validation
                  </>
                )}
              </button>
              {error && <p className="text-xs text-rose-400 mt-3">{error}</p>}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Classification Metrics */}
              <div className="flex flex-col justify-between">
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-4">
                    Benchmark Metrics
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl text-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                        Accuracy
                      </span>
                      <span className="text-xl font-bold text-white">
                        {(evalResult.accuracy * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl text-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                        Precision
                      </span>
                      <span className="text-xl font-bold text-indigo-400">
                        {(evalResult.precision * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl text-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                        Recall
                      </span>
                      <span className="text-xl font-bold text-emerald-400">
                        {(evalResult.recall * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl text-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                        F1-Score
                      </span>
                      <span className="text-xl font-bold text-amber-400">
                        {(evalResult.f1 * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-xs text-slate-400 leading-relaxed border-t border-slate-900 pt-4">
                  <p className="mb-2">
                    <strong className="text-white">Classification Threshold:</strong> Grounding Gap of <code className="text-indigo-400 px-1 py-0.5 bg-slate-900 rounded font-semibold">0.60</code> is used as the split line.
                  </p>
                  <p>
                    Articles with grounding gaps &ge; 0.60 are flagged as <span className="text-rose-400 font-semibold">slop</span> (poorly referenced specific claims), and those below are classified as <span className="text-emerald-400 font-semibold">quality</span>.
                  </p>
                </div>
              </div>

              {/* Confusion Matrix Visual */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                    Confusion Matrix Grid
                  </h4>
                  <button
                    onClick={runBenchmark}
                    className="text-[10px] text-indigo-400 hover:text-white underline transition-colors"
                  >
                    Rerun Benchmark
                  </button>
                </div>
                
                {/* 2x2 Grid Layout */}
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/20 text-xs">
                  <div className="grid grid-cols-3 border-b border-slate-800 text-center font-bold text-slate-400 py-2">
                    <div></div>
                    <div>Predicted Slop</div>
                    <div>Predicted Quality</div>
                  </div>
                  
                  {/* Row 1: Actual Slop */}
                  <div className="grid grid-cols-3 border-b border-slate-800 items-center text-center py-4">
                    <div className="font-bold text-slate-400 border-r border-slate-800 px-2 text-left">
                      Actual Slop
                    </div>
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-2xl font-extrabold text-white">
                        {evalResult.confusion_matrix[0][0]}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 font-medium mt-1">
                        True Positive
                      </span>
                    </div>
                    <div className="flex flex-col items-center justify-center border-l border-slate-800/30">
                      <span className="text-2xl font-extrabold text-rose-500/80">
                        {evalResult.confusion_matrix[1][0]}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 font-medium mt-1">
                        False Negative
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Actual Quality */}
                  <div className="grid grid-cols-3 items-center text-center py-4">
                    <div className="font-bold text-slate-400 border-r border-slate-800 px-2 text-left">
                      Actual Quality
                    </div>
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-2xl font-extrabold text-amber-500/80">
                        {evalResult.confusion_matrix[0][1]}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 font-medium mt-1">
                        False Positive
                      </span>
                    </div>
                    <div className="flex flex-col items-center justify-center border-l border-slate-800/30">
                      <span className="text-2xl font-extrabold text-white">
                        {evalResult.confusion_matrix[1][1]}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 font-medium mt-1">
                        True Negative
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
