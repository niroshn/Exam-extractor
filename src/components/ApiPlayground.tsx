import React, { useState } from 'react';
import { Terminal, Copy, Check, Send, Sparkles, BookOpen } from 'lucide-react';

export const ApiPlayground: React.FC = () => {
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedPython, setCopiedPython] = useState(false);
  const [activeSnippetTab, setActiveSnippetTab] = useState<'curl' | 'python' | 'node'>('curl');

  const curlCommand = `curl -X POST "http://localhost:8000/extract" \\
  -F "files=@student_001.pdf" \\
  -F "files=@student_002.pdf" \\
  -F 'questions=["6. Some strategies for building community resilience to earthquakes are more effective than others. To what extent do you agree?","Q7. Discuss coastal management techniques."]'`;

  const pythonSnippet = `import requests

url = "http://localhost:8000/extract"
files = [
    ("files", open("student_001.pdf", "rb")),
    ("files", open("student_002.pdf", "rb"))
]
data = {
    "questions": '["6. Some strategies for building community resilience...", "Q7. Discuss coastal management..."]'
}

response = requests.post(url, files=files, data=data)
print(response.json())`;

  const nodeSnippet = `import FormData from 'form-data';
import fs from 'fs';
import fetch from 'node-fetch';

const form = new FormData();
form.append('files', fs.createReadStream('student_001.pdf'));
form.append('files', fs.createReadStream('student_002.pdf'));
form.append('questions', JSON.stringify([
  "6. Some strategies for building community resilience...",
  "Q7. Discuss coastal management..."
]));

const res = await fetch('http://localhost:8000/extract', {
  method: 'POST',
  body: form
});
const data = await res.json();
console.log(JSON.stringify(data, null, 2));`;

  const handleCopy = (text: string, type: 'curl' | 'python') => {
    navigator.clipboard.writeText(text);
    if (type === 'curl') {
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    } else {
      setCopiedPython(true);
      setTimeout(() => setCopiedPython(false), 2000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Endpoint Header */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-md text-xs font-bold bg-indigo-600 text-white font-mono">
            POST
          </span>
          <span className="text-base font-bold font-mono text-zinc-900">/extract</span>
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
            multipart/form-data
          </span>
        </div>
        <p className="text-xs text-zinc-600 leading-relaxed">
          Accepts one or more multi-page student examination script PDFs (max 10 files, max 25MB each) and an ordered list of examination questions. Returns student responses grouped by question with exact spelling, grammar, caret insertions, and crossed-out text preserved.
        </p>
      </div>

      {/* Parameters Table */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700">
            Request Parameters (multipart/form-data)
          </h3>
        </div>
        <div className="divide-y divide-zinc-200 text-xs">
          <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3">
              <span className="font-mono font-bold text-zinc-900">files</span>
              <span className="text-red-500 ml-1">*</span>
              <div className="text-[11px] text-zinc-500">File / Binary</div>
            </div>
            <div className="md:col-span-9 text-zinc-600 space-y-1">
              <p>One or more PDF files representing complete student examination scripts.</p>
              <ul className="list-disc pl-4 text-[11px] text-zinc-500 space-y-0.5">
                <li>Constraint: Maximum 10 files per request.</li>
                <li>Constraint: Maximum 25 MB per PDF.</li>
                <li>Constraint: Uploaded filenames must be unique.</li>
              </ul>
            </div>
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3">
              <span className="font-mono font-bold text-zinc-900">questions</span>
              <span className="text-red-500 ml-1">*</span>
              <div className="text-[11px] text-zinc-500">JSON string or text</div>
            </div>
            <div className="md:col-span-9 text-zinc-600 space-y-1">
              <p>An ordered list of official examination questions (as a JSON array string e.g. <code className="bg-zinc-100 px-1 py-0.5 rounded font-mono">["Q1...", "Q2..."]</code> or newline-delimited).</p>
              <ul className="list-disc pl-4 text-[11px] text-zinc-500 space-y-0.5">
                <li>Every question in this list is returned in the response in exact order.</li>
                <li>Unanswered questions return <code className="bg-zinc-100 px-1 py-0.5 rounded font-mono">"response": null</code>.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Code Snippets */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-sm overflow-hidden space-y-0">
        <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSnippetTab('curl')}
              className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-all ${
                activeSnippetTab === 'curl'
                  ? 'bg-indigo-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              cURL
            </button>
            <button
              onClick={() => setActiveSnippetTab('python')}
              className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-all ${
                activeSnippetTab === 'python'
                  ? 'bg-indigo-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Python
            </button>
            <button
              onClick={() => setActiveSnippetTab('node')}
              className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-all ${
                activeSnippetTab === 'node'
                  ? 'bg-indigo-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Node.js
            </button>
          </div>

          <button
            onClick={() =>
              handleCopy(
                activeSnippetTab === 'curl'
                  ? curlCommand
                  : activeSnippetTab === 'python'
                  ? pythonSnippet
                  : nodeSnippet,
                'curl'
              )
            }
            className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs font-medium transition-all"
          >
            {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCurl ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>

        <pre className="p-6 text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed">
          {activeSnippetTab === 'curl'
            ? curlCommand
            : activeSnippetTab === 'python'
            ? pythonSnippet
            : nodeSnippet}
        </pre>
      </div>

      {/* HTTP Error Status Code Reference */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700">
            HTTP Status Codes & Error Handling
          </h3>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 space-y-1">
            <span className="font-mono font-bold text-emerald-700">200 OK</span>
            <p className="text-zinc-500">Extraction completed successfully for all uploaded files.</p>
          </div>
          <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 space-y-1">
            <span className="font-mono font-bold text-amber-700">400 Bad Request</span>
            <p className="text-zinc-500">Invalid file type, missing files, duplicate filenames, or &gt;10 files.</p>
          </div>
          <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 space-y-1">
            <span className="font-mono font-bold text-amber-700">413 Payload Too Large</span>
            <p className="text-zinc-500">Single PDF file exceeds maximum size limit of 25MB.</p>
          </div>
          <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 space-y-1">
            <span className="font-mono font-bold text-red-700">422 Unprocessable</span>
            <p className="text-zinc-500">Questions parameter is missing or empty list.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
