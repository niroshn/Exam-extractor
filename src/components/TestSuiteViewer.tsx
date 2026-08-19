import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Play, RefreshCw, ShieldCheck, FileCheck2, Cpu, ListCheck } from 'lucide-react';
import { TestResultItem, TestSuiteSummary } from '../types';

export const TestSuiteViewer: React.FC = () => {
  const [tests, setTests] = useState<TestResultItem[]>([]);
  const [summary, setSummary] = useState<TestSuiteSummary | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const runTests = async () => {
    setIsRunning(true);
    try {
      const res = await fetch('/api/run-tests', { method: 'POST' });
      const data = await res.json();
      setTests(data.tests || []);
      setSummary(data.summary || null);
    } catch (err) {
      console.error('Failed to run test suite:', err);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  const categories = ['all', ...Array.from(new Set(tests.map((t) => t.category)))];
  const filteredTests = selectedCategory === 'all' ? tests : tests.filter((t) => t.category === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Test Suite Summary Banner */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-zinc-900">
              Automated Fidelity & Contract Verification Suite
            </h2>
          </div>
          <p className="text-xs text-zinc-500 max-w-2xl">
            Verifies non-negotiable transcription mandates: zero autocorrection of spelling, verbatim grammar error retention, visual strike tags, caret placement, and question match priority.
          </p>
        </div>

        <div className="flex items-center gap-4">
          {summary && (
            <div className="flex items-center gap-3 text-xs">
              <div className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{summary.passed} Passed</span>
              </div>
              {summary.failed > 0 && (
                <div className="px-3 py-1.5 rounded-lg bg-red-50 text-red-800 border border-red-200 font-semibold flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span>{summary.failed} Failed</span>
                </div>
              )}
            </div>
          )}

          <button
            onClick={runTests}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-300 text-white rounded-lg text-xs font-semibold transition-all shadow-xs"
          >
            {isRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isRunning ? 'Running Tests...' : 'Re-run Test Suite'}</span>
          </button>
        </div>
      </div>

      {/* Category filter pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
              selectedCategory === cat
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            {cat === 'all' ? 'All Verification Checks' : cat}
          </button>
        ))}
      </div>

      {/* Test cases grid */}
      <div className="space-y-4">
        {filteredTests.map((test, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs hover:border-zinc-300 transition-all space-y-3"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-1 rounded-full bg-emerald-100 text-emerald-700 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-900">{test.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-zinc-100 text-zinc-600 border border-zinc-200">
                      {test.category}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">{test.notes}</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                PASSED
              </span>
            </div>

            {/* Test input / output details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2">
              <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 space-y-1">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Test Input:</span>
                <p className="font-mono text-zinc-800 break-words">{test.input}</p>
              </div>

              <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-200 space-y-1">
                <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                  {test.matchedQuestion ? 'Matched Question Result:' : 'Expected Strict Output:'}
                </span>
                <p className="font-mono text-emerald-900 break-words">
                  {test.matchedQuestion || test.expected}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
