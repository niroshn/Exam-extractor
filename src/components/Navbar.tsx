import React from 'react';
import { FileText, CheckCircle2, Terminal, Code2, Sparkles, BookOpen } from 'lucide-react';

interface NavbarProps {
  activeTab: 'extractor' | 'viewer' | 'tests' | 'api' | 'codebase';
  setActiveTab: (tab: 'extractor' | 'viewer' | 'tests' | 'api' | 'codebase') => void;
  resultsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, resultsCount }) => {
  return (
    <header className="bg-white border-b border-zinc-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center text-white shadow-xs">
              <FileText className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-zinc-900 tracking-tight">
                  Handwritten Exam Script Extraction
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  MVP v1.0
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                High-fidelity transcription preserving spelling, grammar, carets & strikethroughs
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg border border-zinc-200">
            <button
              onClick={() => setActiveTab('extractor')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'extractor'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Extract & Upload</span>
            </button>

            <button
              onClick={() => setActiveTab('viewer')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'viewer'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Fidelity Viewer</span>
              {resultsCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center">
                  {resultsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('tests')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'tests'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Test Suite</span>
            </button>

            <button
              onClick={() => setActiveTab('api')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'api'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-amber-600" />
              <span>API Playground</span>
            </button>

            <button
              onClick={() => setActiveTab('codebase')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'codebase'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-violet-600" />
              <span>Python Codebase</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
