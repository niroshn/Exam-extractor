import React, { useState, useEffect } from 'react';
import { FileCode, Folder, Copy, Check, Download, Terminal, Layers } from 'lucide-react';

export const PythonCodebaseViewer: React.FC = () => {
  const [files, setFiles] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<string>('app/main.py');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/python-codebase')
      .then((res) => res.json())
      .then((data) => {
        if (data.files) {
          setFiles(data.files);
        }
      })
      .catch((err) => console.error('Failed to load Python codebase:', err));
  }, []);

  const fileList = Object.keys(files);

  const handleCopy = () => {
    if (files[selectedFile]) {
      navigator.clipboard.writeText(files[selectedFile]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadFile = () => {
    if (files[selectedFile]) {
      const blob = new Blob([files[selectedFile]], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = selectedFile.split('/').pop() || 'file.txt';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-zinc-900">
              Python 3.11+ FastAPI Production Codebase
            </h2>
          </div>
          <p className="text-xs text-zinc-500">
            Explore the complete modular architecture including Pydantic models, PyMuPDF rendering, Vision service abstraction, 3-tier question matching, pytest suites, and Dockerfile.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition-all shadow-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy File'}</span>
          </button>

          <button
            onClick={handleDownloadFile}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: File Explorer */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-zinc-200 p-4 shadow-xs space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-2 pb-1 border-b border-zinc-100">
            Project Files
          </div>
          <div className="space-y-1 max-h-[600px] overflow-y-auto font-mono text-xs">
            {fileList.map((filename) => {
              const isSelected = selectedFile === filename;
              return (
                <button
                  key={filename}
                  onClick={() => setSelectedFile(filename)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all ${
                    isSelected
                      ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 shadow-xs'
                      : 'text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  <FileCode className={`w-4 h-4 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-zinc-400'}`} />
                  <span className="truncate">{filename}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Code Viewer */}
        <div className="lg:col-span-8 bg-zinc-950 rounded-xl border border-zinc-800 shadow-sm overflow-hidden space-y-0">
          <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 bg-zinc-900 text-xs">
            <span className="font-mono font-bold text-zinc-200">{selectedFile}</span>
            <span className="text-[11px] text-zinc-500 font-mono">
              {files[selectedFile] ? `${files[selectedFile].split('\n').length} lines` : ''}
            </span>
          </div>

          <pre className="p-5 text-xs font-mono text-emerald-400 overflow-x-auto max-h-[580px] leading-relaxed">
            {files[selectedFile] || '# Loading...'}
          </pre>
        </div>
      </div>
    </div>
  );
};
