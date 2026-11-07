import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Square,
  Mic,
  MicOff,
  Globe,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { PersonaMode } from '../types';
import { createSpeechRecognizer } from '../utils/speech';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onStopGeneration?: () => void;
  enableSearch: boolean;
  onToggleSearch: () => void;
  activeMode: PersonaMode;
  onChangeMode: (mode: PersonaMode) => void;
}

const MODES: { id: PersonaMode; name: string; icon: string }[] = [
  { id: 'omni', name: 'Universal Omniscient', icon: '🌐' },
  { id: 'philosophical', name: 'Deep Philosopher', icon: '📜' },
  { id: 'code_architect', name: 'Code Architect', icon: '💻' },
  { id: 'life_coach', name: 'Life & Mind Coach', icon: '🌱' },
  { id: 'explain_like_5', name: 'ELI5 Simplifier', icon: '🎈' },
];

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  onStopGeneration,
  enableSearch,
  onToggleSearch,
  activeMode,
  onChangeMode,
}) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSendMessage(trimmed);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleVoiceRecording = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      const recognizer = createSpeechRecognizer(
        (transcript) => {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        },
        (err) => {
          console.warn('Speech recognition error:', err);
          setIsListening(false);
        },
        () => {
          setIsListening(false);
        }
      );

      if (recognizer) {
        try {
          recognizer.start();
          recognitionRef.current = recognizer;
          setIsListening(true);
        } catch (e) {
          console.error('Failed to start speech recognition', e);
          setIsListening(false);
        }
      } else {
        alert('Speech recognition is not supported in this browser.');
      }
    }
  };

  const activeModeObj = MODES.find((m) => m.id === activeMode) || MODES[0];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4 pt-2">
      <div className="relative rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-md focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all">
        {/* Top Control Bar inside Input */}
        <div className="flex items-center justify-between px-3.5 pt-2.5 pb-1 text-xs border-b border-slate-800/80">
          {/* Mode Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowModeDropdown(!showModeDropdown)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/60 transition-colors cursor-pointer"
            >
              <span>{activeModeObj.icon}</span>
              <span className="font-medium">{activeModeObj.name}</span>
              <SlidersHorizontal className="w-3 h-3 text-slate-400 ml-1" />
            </button>

            {showModeDropdown && (
              <div className="absolute left-0 bottom-full mb-2 w-64 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="text-[10px] font-mono uppercase text-slate-400 px-2 py-1">
                  Choose 4life Intelligence Mode
                </div>
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      onChangeMode(m.id);
                      setShowModeDropdown(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                      activeMode === m.id
                        ? 'bg-cyan-950/70 text-cyan-300 font-semibold border border-cyan-500/30'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{m.icon}</span>
                    <span>{m.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Live Search Grounding Toggle */}
          <button
            type="button"
            onClick={onToggleSearch}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
              enableSearch
                ? 'bg-cyan-500/15 border-cyan-400/70 text-cyan-300'
                : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-slate-300'
            }`}
            title="Toggle Live Web Grounding for real-time information"
          >
            <Globe className={`w-3.5 h-3.5 ${enableSearch ? 'text-cyan-400 animate-spin' : ''}`} style={enableSearch ? { animationDuration: '12s' } : undefined} />
            <span className="font-medium text-[11px]">
              {enableSearch ? 'Live Web ON' : 'Live Web OFF'}
            </span>
          </button>
        </div>

        {/* Text Area */}
        <div className="flex items-end px-3.5 py-2 gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask 4life anything... (e.g., 'What is time dilation?', 'How do I build self-discipline?')"
            rows={1}
            className="w-full resize-none bg-transparent text-slate-100 placeholder-slate-500 text-sm sm:text-base focus:outline-none max-h-44 py-1.5 leading-relaxed"
          />

          {/* Action buttons: Voice & Send */}
          <div className="flex items-center gap-1.5 pb-1 shrink-0">
            {/* Voice Dictation Button */}
            <button
              type="button"
              onClick={toggleVoiceRecording}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                isListening
                  ? 'bg-red-500/20 text-red-400 border border-red-500/60 animate-pulse'
                  : 'bg-slate-800/80 hover:bg-slate-750 text-slate-400 hover:text-slate-200 border border-slate-700/60'
              }`}
              title={isListening ? 'Stop listening' : 'Dictate question with voice'}
            >
              {isListening ? (
                <MicOff className="w-4 h-4 text-red-400" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>

            {/* Send or Stop */}
            {isLoading ? (
              <button
                type="button"
                onClick={onStopGeneration}
                className="p-2 rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-900/30 transition-transform active:scale-95 cursor-pointer"
                title="Stop response generation"
              >
                <Square className="w-4 h-4 fill-white" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim()}
                className={`p-2 rounded-xl transition-all ${
                  input.trim()
                    ? 'bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 text-slate-950 shadow-md shadow-cyan-500/20 hover:opacity-95 active:scale-95 cursor-pointer font-bold'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                }`}
                title="Send question to 4life"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-cyan-500" />
          <span>4life can answer any question across science, life, philosophy, and code.</span>
        </div>
        <div className="hidden sm:block font-mono">
          Shift + Enter for new line
        </div>
      </div>
    </div>
  );
};
