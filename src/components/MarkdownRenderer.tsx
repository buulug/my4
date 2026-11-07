import React, { useState } from 'react';
import { Copy, Check, Terminal, ExternalLink, Sparkles } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  onSelectPrompt?: (prompt: string) => void;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  onSelectPrompt,
}) => {
  // Split content to see if there's an "Explore Next with 4life" section
  const exploreSectionRegex = /(?:###?\s*(?:🔮\s*)?Explore Next with 4life[\s\S]*)/i;
  const match = content.match(exploreSectionRegex);

  let mainBody = content;
  let exploreItems: string[] = [];

  if (match) {
    mainBody = content.substring(0, match.index).trim();
    const exploreText = match[0];
    const lines = exploreText.split('\n');
    exploreItems = lines
      .filter((line) => line.trim().startsWith('- ') || line.trim().startsWith('* '))
      .map((line) => line.replace(/^[-*]\s*/, '').trim())
      .filter((item) => item.length > 0);
  }

  return (
    <div className="space-y-4 text-slate-200 leading-relaxed break-words font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {renderMarkdownBlocks(mainBody)}

      {exploreItems.length > 0 && (
        <div className="mt-8 pt-6 border-t border-cyan-500/20 bg-gradient-to-br from-cyan-950/30 via-slate-900/40 to-emerald-950/20 rounded-2xl p-5 border border-cyan-500/15">
          <div className="flex items-center gap-2 mb-3 text-cyan-300 font-semibold text-sm tracking-wide">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>EXPLORE NEXT WITH 4LIFE</span>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2.5">
            {exploreItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => onSelectPrompt && onSelectPrompt(item)}
                className="group flex items-center justify-between gap-3 text-left px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-cyan-950/60 border border-slate-700/60 hover:border-cyan-400/50 text-slate-300 hover:text-cyan-200 text-sm transition-all duration-200 shadow-sm hover:shadow-cyan-900/20"
              >
                <span className="line-clamp-2">{item}</span>
                <span className="text-cyan-400 text-xs font-mono opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                  →
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

function renderMarkdownBlocks(text: string) {
  // Regex to split on code blocks ```lang ... ```
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const blocks: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  let blockKey = 0;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    const textBefore = text.substring(lastIndex, match.index);
    if (textBefore) {
      blocks.push(
        <div key={`txt-${blockKey++}`} className="space-y-3">
          {renderTextParagraphs(textBefore)}
        </div>
      );
    }

    const language = match[1] || 'plaintext';
    const code = match[2];
    blocks.push(
      <CodeBlock key={`code-${blockKey++}`} language={language} code={code} />
    );

    lastIndex = match.index + match[0].length;
  }

  const remaining = text.substring(lastIndex);
  if (remaining) {
    blocks.push(
      <div key={`txt-${blockKey++}`} className="space-y-3">
        {renderTextParagraphs(remaining)}
      </div>
    );
  }

  return blocks;
}

function renderTextParagraphs(text: string): React.ReactNode[] {
  const paragraphs = text.split(/\n\s*\n/);
  return paragraphs.map((para, i) => {
    const trimmed = para.trim();
    if (!trimmed) return null;

    // Headings
    if (trimmed.startsWith('### ')) {
      return (
        <h3
          key={i}
          className="text-lg font-bold text-white mt-6 mb-2 tracking-tight flex items-center gap-2"
        >
          <span className="w-1.5 h-4 bg-cyan-400 rounded-full inline-block" />
          {renderFormattedInline(trimmed.replace(/^###\s+/, ''))}
        </h3>
      );
    }
    if (trimmed.startsWith('## ')) {
      return (
        <h2
          key={i}
          className="text-xl font-bold text-white mt-7 mb-3 tracking-tight border-b border-slate-800 pb-2 flex items-center gap-2"
        >
          <span className="w-2 h-5 bg-gradient-to-b from-cyan-400 to-emerald-400 rounded-full inline-block" />
          {renderFormattedInline(trimmed.replace(/^##\s+/, ''))}
        </h2>
      );
    }
    if (trimmed.startsWith('# ')) {
      return (
        <h1
          key={i}
          className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-300 mt-8 mb-4 tracking-tight"
        >
          {renderFormattedInline(trimmed.replace(/^#\s+/, ''))}
        </h1>
      );
    }

    // Horizontal rule
    if (trimmed === '---' || trimmed === '***') {
      return <hr key={i} className="my-6 border-slate-800" />;
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      const quoteText = trimmed
        .split('\n')
        .map((l) => l.replace(/^>\s?/, ''))
        .join(' ');
      return (
        <blockquote
          key={i}
          className="my-3 pl-4 border-l-4 border-cyan-500/70 bg-cyan-950/20 py-2 pr-4 rounded-r-xl italic text-slate-300 text-sm"
        >
          {renderFormattedInline(quoteText)}
        </blockquote>
      );
    }

    // Markdown Table check
    const lines = trimmed.split('\n');
    if (
      lines.length >= 2 &&
      lines[0].includes('|') &&
      lines[1].includes('|') &&
      lines[1].includes('-')
    ) {
      return <MarkdownTable key={i} lines={lines} />;
    }

    // Lists (unordered or ordered)
    if (
      lines.every(
        (l) =>
          l.trim().startsWith('- ') ||
          l.trim().startsWith('* ') ||
          /^\d+\.\s/.test(l.trim()) ||
          l.trim() === ''
      )
    ) {
      const isOrdered = /^\d+\.\s/.test(lines[0].trim());
      if (isOrdered) {
        return (
          <ol key={i} className="space-y-2 my-3 list-decimal list-inside pl-1 text-slate-300">
            {lines
              .filter((l) => l.trim())
              .map((line, idx) => (
                <li key={idx} className="leading-relaxed">
                  {renderFormattedInline(line.replace(/^\d+\.\s*/, ''))}
                </li>
              ))}
          </ol>
        );
      } else {
        return (
          <ul key={i} className="space-y-2 my-3 pl-1 text-slate-300">
            {lines
              .filter((l) => l.trim())
              .map((line, idx) => (
                <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 shrink-0" />
                  <span>{renderFormattedInline(line.replace(/^[-*]\s*/, ''))}</span>
                </li>
              ))}
          </ul>
        );
      }
    }

    // Standard paragraph with possible single line breaks
    return (
      <p key={i} className="leading-relaxed text-slate-300/95 font-normal">
        {lines.map((l, lIdx) => (
          <React.Fragment key={lIdx}>
            {renderFormattedInline(l)}
            {lIdx < lines.length - 1 && <br />}
          </React.Fragment>
        ))}
      </p>
    );
  });
}

function MarkdownTable({ lines }: { lines: string[] }) {
  const headerCells = lines[0]
    .split('|')
    .map((c) => c.trim())
    .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

  const rowLines = lines.slice(2);

  return (
    <div className="overflow-x-auto my-4 rounded-xl border border-slate-800 bg-slate-900/50 shadow-inner">
      <table className="w-full text-left text-sm border-collapse">
        <thead className="bg-slate-800/80 text-cyan-300 uppercase text-xs tracking-wider">
          <tr>
            {headerCells.map((head, hIdx) => (
              <th key={hIdx} className="px-4 py-3 border-b border-slate-700/80 font-semibold">
                {renderFormattedInline(head)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {rowLines.map((row, rIdx) => {
            const cells = row
              .split('|')
              .map((c) => c.trim())
              .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
            return (
              <tr key={rIdx} className="hover:bg-slate-800/30 transition-colors">
                {cells.map((cell, cIdx) => (
                  <td key={cIdx} className="px-4 py-2.5 text-slate-300">
                    {renderFormattedInline(cell)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function renderFormattedInline(text: string): React.ReactNode {
  // Replace links, inline code, bold, italic
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let partKey = 0;

  // Pattern matches:
  // 1. Links: [text](url)
  // 2. Inline code: `code`
  // 3. Bold: **text**
  // 4. Italic: *text*
  const pattern = /(!?\[([^\]]+)\]\(([^)]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*)/;

  while (remaining) {
    const match = remaining.match(pattern);
    if (!match || match.index === undefined) {
      parts.push(remaining);
      break;
    }

    if (match.index > 0) {
      parts.push(remaining.substring(0, match.index));
    }

    const fullMatch = match[0];

    // Link
    if (fullMatch.startsWith('[') && fullMatch.includes('](')) {
      const linkText = match[2];
      const linkUrl = match[3];
      parts.push(
        <a
          key={`link-${partKey++}`}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 inline-flex items-center gap-1 font-medium"
        >
          {linkText}
          <ExternalLink className="w-3 h-3 inline opacity-70" />
        </a>
      );
    }
    // Inline code
    else if (fullMatch.startsWith('`')) {
      const codeContent = match[4];
      parts.push(
        <code
          key={`code-${partKey++}`}
          className="px-1.5 py-0.5 rounded-md bg-slate-800/90 border border-slate-700/60 font-mono text-cyan-300 text-xs tracking-tight"
        >
          {codeContent}
        </code>
      );
    }
    // Bold
    else if (fullMatch.startsWith('**')) {
      const boldText = match[5];
      parts.push(
        <strong key={`bold-${partKey++}`} className="font-semibold text-white">
          {boldText}
        </strong>
      );
    }
    // Italic
    else if (fullMatch.startsWith('*')) {
      const italicText = match[6];
      parts.push(
        <em key={`italic-${partKey++}`} className="italic text-slate-200">
          {italicText}
        </em>
      );
    }

    remaining = remaining.substring(match.index + fullMatch.length);
  }

  return parts;
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4 rounded-xl overflow-hidden border border-slate-800 bg-slate-950/90 shadow-xl group">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-800/90 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="uppercase text-slate-300 font-semibold">{language || 'code'}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto text-xs sm:text-sm font-mono text-slate-200 leading-relaxed">
        <pre className="selection:bg-cyan-900 selection:text-white">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
