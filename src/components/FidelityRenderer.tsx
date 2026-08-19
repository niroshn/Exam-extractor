import React from 'react';

interface FidelityRendererProps {
  text: string | null;
  className?: string;
  showRawTags?: boolean;
}

export const FidelityRenderer: React.FC<FidelityRendererProps> = ({
  text,
  className = '',
  showRawTags = false,
}) => {
  if (text === null || text === undefined) {
    return (
      <div className="text-zinc-400 italic text-sm py-2 px-3 bg-zinc-50 border border-zinc-200 rounded-md">
        (No response provided by student — null)
      </div>
    );
  }

  if (showRawTags) {
    return (
      <pre className="text-xs font-mono text-zinc-800 bg-zinc-900 text-zinc-100 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap leading-relaxed">
        {text}
      </pre>
    );
  }

  // Parse paragraphs
  const paragraphs = text.split(/\n\n+/);

  const renderFormattedLine = (line: string) => {
    // Regex for <strikethrough>...</strikethrough>, <caret>...</caret>, and [UNCLEAR]
    const tokenRegex = /(<strikethrough>[\s\S]*?<\/strikethrough>|<caret>[\s\S]*?<\/caret>|\[UNCLEAR\])/g;
    const parts = line.split(tokenRegex);

    return parts.map((part, idx) => {
      if (part.startsWith('<strikethrough>') && part.endsWith('</strikethrough>')) {
        const content = part.replace(/^<strikethrough>/, '').replace(/<\/strikethrough>$/, '');
        return (
          <span
            key={idx}
            className="inline-flex items-center px-1.5 py-0.5 mx-1 text-xs font-medium bg-red-100 text-red-700 line-through rounded border border-red-200"
            title="Preserved Crossed-out Text"
          >
            {content}
          </span>
        );
      }
      if (part.startsWith('<caret>') && part.endsWith('</caret>')) {
        const content = part.replace(/^<caret>/, '').replace(/<\/caret>$/, '');
        return (
          <span
            key={idx}
            className="inline-flex items-center px-2 py-0.5 mx-1 text-xs font-medium bg-blue-100 text-blue-800 rounded border border-blue-300 shadow-xs"
            title="Preserved Caret Insertion (^)"
          >
            <span className="font-bold text-blue-600 mr-0.5 text-xs">^</span>
            {content}
          </span>
        );
      }
      if (part === '[UNCLEAR]') {
        return (
          <span
            key={idx}
            className="inline-flex items-center px-1.5 py-0.5 mx-1 text-xs font-medium bg-amber-100 text-amber-800 rounded border border-amber-300"
            title="Unclear handwriting token"
          >
            [UNCLEAR]
          </span>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div className={`space-y-4 text-zinc-800 text-sm leading-relaxed ${className}`}>
      {paragraphs.map((p, pIdx) => (
        <p key={pIdx} className="bg-white p-3 rounded border border-zinc-200">
          {renderFormattedLine(p)}
        </p>
      ))}
    </div>
  );
};
