import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { ExtractionUploader } from './components/ExtractionUploader';
import { ExaminerViewer } from './components/ExaminerViewer';
import { TestSuiteViewer } from './components/TestSuiteViewer';
import { ApiPlayground } from './components/ApiPlayground';
import { PythonCodebaseViewer } from './components/PythonCodebaseViewer';
import { FileResult } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'extractor' | 'viewer' | 'tests' | 'api' | 'codebase'>('extractor');
  const [results, setResults] = useState<FileResult[]>([]);

  const handleExtractionComplete = (newResults: FileResult[]) => {
    setResults(newResults);
    setActiveTab('viewer');
  };

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        resultsCount={results.length}
      />

      <main className="flex-1 pb-16">
        {activeTab === 'extractor' && (
          <ExtractionUploader onExtractionComplete={handleExtractionComplete} />
        )}

        {activeTab === 'viewer' && (
          <ExaminerViewer
            results={results}
            onNavigateToUploader={() => setActiveTab('extractor')}
          />
        )}

        {activeTab === 'tests' && <TestSuiteViewer />}

        {activeTab === 'api' && <ApiPlayground />}

        {activeTab === 'codebase' && <PythonCodebaseViewer />}
      </main>

      <footer className="border-t border-zinc-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-zinc-500 space-y-1">
          <p className="font-medium text-zinc-700">
            Handwritten Examination Script Extraction MVP • Strict Source of Truth Fidelity Engine
          </p>
          <p>
            Compliant with POST /extract contract • Zero-autocorrect • Strikethrough & Caret insertion preservation
          </p>
        </div>
      </footer>
    </div>
  );
}
