import React, { useState } from 'react';
import { FileResult } from '../types';
import { FidelityRenderer } from './FidelityRenderer';
import { Download, Copy, Check, FileText, Sparkles, Eye, Code, AlertTriangle, ArrowRight } from 'lucide-react';

interface ExaminerViewerProps {
  results: FileResult[];
  onNavigateToUploader: () => void;
}

export const ExaminerViewer: React.FC<ExaminerViewerProps> = ({
  results,
  onNavigateToUploader,
}) => {
  const [selectedFileIdx, setSelectedFileIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'visual' | 'raw_json'>('visual');
  const [copied, setCopied] = useState(false);

  if (!results || results.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-zinc-900">No Extractions Available Yet</h3>
        <p className="text-xs text-zinc-500 max-w-md mx-auto">
          Upload an examination script PDF or select one of the sample test scripts to inspect high-fidelity transcription results.
        </p>
        <button
          onClick={onNavigateToUploader}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-all shadow-xs"
        >
          <span>Go to Script Uploader</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  const currentFile = results[selectedFileIdx] || results[0];
  const answeredCount = currentFile.responses.filter((r) => r.response !== null).length;
  const unansweredCount = currentFile.responses.filter((r) => r.response === null).length;

  const handleCopyJson = () => {
    const jsonStr = JSON.stringify({ results }, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify({ results }, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extracted_exam_scripts_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header bar with stats & download */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-zinc-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-zinc-900">
              Extracted Examination Script
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-100 text-zinc-700 border border-zinc-200">
              {currentFile.filename}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Transcribed with strict preservation of grammar errors, spelling, caret insertions, and strikethroughs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-zinc-100 p-1 rounded-lg border border-zinc-200">
            <button
              onClick={() => setViewMode('visual')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === 'visual'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Fidelity View</span>
            </button>
            <button
              onClick={() => setViewMode('raw_json')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === 'raw_json'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Code className="w-3.5 h-3.5 text-amber-600" />
              <span>Contract JSON</span>
            </button>
          </div>

          <button
            onClick={handleCopyJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition-all shadow-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy JSON'}</span>
          </button>

          <button
            onClick={handleDownloadJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* File selector tabs if multiple files */}
      {results.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {results.map((res, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedFileIdx(idx)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedFileIdx === idx
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              {res.filename}
            </button>
          ))}
        </div>
      )}

      {/* Legend & stats bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-white rounded-lg border border-zinc-200 flex items-center justify-between">
          <span className="text-zinc-500 font-medium">Answered Prompts:</span>
          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            {answeredCount} / {currentFile.responses.length}
          </span>
        </div>
        <div className="p-3 bg-white rounded-lg border border-zinc-200 flex items-center justify-between">
          <span className="text-zinc-500 font-medium">Unanswered (null):</span>
          <span className="font-bold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
            {unansweredCount}
          </span>
        </div>
        <div className="p-3 bg-white rounded-lg border border-zinc-200 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0"></span>
          <span className="text-zinc-600">Crossed-out Text preserved</span>
        </div>
        <div className="p-3 bg-white rounded-lg border border-zinc-200 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span>
          <span className="text-zinc-600">Caret (^) Insertions placed</span>
        </div>
      </div>

      {viewMode === 'visual' ? (
        <div className="space-y-6">
          {currentFile.responses.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-xs"
            >
              {/* Question Header */}
              <div className="bg-zinc-50 p-4 border-b border-zinc-200 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-800">
                      Question #{idx + 1}
                    </span>
                    {item.response === null ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-200 text-zinc-600">
                        Unanswered
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                        Extracted Response
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-zinc-900 leading-snug">{item.question}</h4>
                </div>
              </div>

              {/* Response Body */}
              <div className="p-5">
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Faithfully Transcribed Text:
                </div>
                <FidelityRenderer text={item.response} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-zinc-800 pb-2">
            <span>JSON Output format strictly conforming to API Specification</span>
            <span className="font-mono text-zinc-300">Content-Type: application/json</span>
          </div>
          <pre className="text-xs font-mono text-emerald-400 overflow-x-auto p-2 leading-relaxed">
            {JSON.stringify(
              {
                results: [
                  {
                    filename: currentFile.filename,
                    responses: currentFile.responses,
                  },
                ],
              },
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  );
};
