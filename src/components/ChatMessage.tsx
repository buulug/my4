import React, { useState } from 'react';
import {
  Sparkles,
  User,
  Copy,
  Check,
  Volume2,
  VolumeX,
  ExternalLink,
  Globe,
  Share2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Message, PersonaMode } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { SpeechController } from '../utils/speech';

interface ChatMessageProps {
  message: Message;
  onSelectPrompt?: (prompt: string) => void;
  onRetry?: () => void;
}

const MODE_LABELS: Record<PersonaMode, { name: string; color: string }> = {
  omni: { name: 'Omniscient', color: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' },
  philosophical: { name: 'Philosophical', color: 'bg-purple-500/10 text-purple-300 border-purple-500/30' },
  code_architect: { name: 'Architect', color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' },
  life_coach: { name: 'Life Coach', color: 'bg-pink-500/10 text-pink-300 border-pink-500/30' },
  explain_like_5: { name: 'ELI5 Simplifier', color: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
};

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onSelectPrompt,
  onRetry,
}) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSources, setShowSources] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeechToggle = () => {
    if (isSpeaking) {
      SpeechController.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      SpeechController.speak(
        message.content,
        () => setIsSpeaking(false),
        () => setIsSpeaking(false)
      );
    }
  };

  const handleCelebrate = () => {
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#06b6d4', '#10b981', '#8b5cf6'],
    });
  };

  if (isUser) {
    return (
      <div className="flex justify-end mb-6 group">
        <div className="flex items-start gap-3 max-w-2xl sm:max-w-3xl">
          <div className="rounded-2xl rounded-tr-sm bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 px-5 py-3.5 text-white shadow-lg shadow-cyan-950/20">
            <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-medium">
              {message.content}
            </p>
            <div className="flex items-center justify-end gap-2 mt-1.5 text-[11px] text-cyan-100/70 font-mono">
              <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-cyan-400">
            <User className="w-4 h-4" />
          </div>
        </div>
      </div>
    );
  }

  const modeInfo = message.mode ? MODE_LABELS[message.mode] : MODE_LABELS.omni;

  return (
    <div className="flex items-start gap-3.5 mb-8 group max-w-4xl">
      {/* 4life AI glowing orb avatar */}
      <div className="relative shrink-0 mt-0.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 via-teal-400 to-emerald-500 flex items-center justify-center text-slate-950 shadow-md shadow-cyan-500/20 font-black text-xs">
          4L
        </div>
        {message.isStreaming && (
          <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />
          </span>
        )}
      </div>

      {/* Message content container */}
      <div className="flex-1 min-w-0 bg-slate-900/80 border border-slate-800 rounded-2xl rounded-tl-sm p-4 sm:p-6 shadow-xl backdrop-blur-sm">
        {/* Header bar: Model name, mode, timestamp */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white text-sm tracking-tight flex items-center gap-1.5">
              4life AI
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            </span>
            <span
              className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${modeInfo.color}`}
            >
              {modeInfo.name}
            </span>
            {message.sources && message.sources.length > 0 && (
              <button
                onClick={() => setShowSources(!showSources)}
                className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 px-2 py-0.5 rounded-full bg-cyan-950/40 border border-cyan-500/30 transition-colors cursor-pointer"
              >
                <Globe className="w-3 h-3" />
                <span>{message.sources.length} Live Sources</span>
              </button>
            )}
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Live Search Grounding Sources Drawer */}
        {showSources && message.sources && message.sources.length > 0 && (
          <div className="mb-4 p-3 rounded-xl bg-slate-950/60 border border-cyan-500/20 text-xs">
            <div className="font-semibold text-cyan-300 mb-2 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Verified Search Grounding Citations:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {message.sources.map((src, sIdx) => (
                <a
                  key={sIdx}
                  href={src.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-900 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-200 transition-colors"
                >
                  <span className="truncate">{src.title}</span>
                  <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Body content */}
        {message.error ? (
          (() => {
            const isQuotaError =
              message.content.includes('429') ||
              message.content.includes('quota') ||
              message.content.includes('RESOURCE_EXHAUSTED') ||
              message.content.includes('high demand');

            if (isQuotaError) {
              return (
                <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-200 text-sm space-y-3">
                  <div className="flex items-center gap-2 text-amber-300 font-semibold">
                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                    <span>Gemini API Quota Notice (Rate Limit)</span>
                  </div>
                  <p className="text-xs text-amber-100/90 leading-relaxed">
                    {message.content}
                  </p>
                  <div className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-500/20 text-xs text-amber-200/90 space-y-1">
                    <p className="font-semibold text-amber-300">💡 How to resolve:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-200/80">
                      <li>Wait a few seconds for the free-tier rate limit window to refresh, then click <strong>Retry Question</strong>.</li>
                      <li>To avoid limits permanently, select a billing-enabled API key in the <strong>Settings &gt; Secrets</strong> panel.</li>
                    </ul>
                  </div>
                  {onRetry && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={onRetry}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Retry Question Now</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/40 text-red-300 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="font-medium">4life encountered an interruption.</p>
                  <p className="text-xs text-red-200/80">{message.content}</p>
                  {onRetry && (
                    <button
                      onClick={onRetry}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/50 hover:bg-red-800/60 text-xs font-semibold text-white transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Question</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })()
        ) : (
          <MarkdownRenderer
            content={message.content}
            onSelectPrompt={onSelectPrompt}
          />
        )}

        {/* Streaming pulse indicator */}
        {message.isStreaming && (
          <div className="flex items-center gap-2 mt-4 text-xs font-mono text-cyan-400">
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>4life is synthesizing response...</span>
          </div>
        )}

        {/* Bottom actions bar */}
        {!message.isStreaming && !message.error && (
          <div className="flex items-center justify-between pt-4 mt-5 border-t border-slate-800/80 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              {/* Voice TTS button */}
              <button
                onClick={handleSpeechToggle}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                  isSpeaking
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-900/30'
                    : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-700 hover:text-white'
                }`}
                title={isSpeaking ? 'Stop reading' : 'Read answer aloud'}
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    <span>Stop Voice</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Read Aloud</span>
                  </>
                )}
              </button>

              {/* Copy button */}
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
                title="Copy response"
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

              {/* Celebrate / Sparkle */}
              <button
                onClick={handleCelebrate}
                className="p-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 hover:bg-slate-700 hover:text-cyan-300 transition-all cursor-pointer"
                title="Celebrate insight"
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-[11px] font-mono text-slate-500 hidden sm:block">
              Answered by 4life
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
