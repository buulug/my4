import React from 'react';
import {
  Menu,
  Plus,
  Download,
  Trash2,
  Sparkles,
  Globe,
  Share2,
} from 'lucide-react';
import { PersonaMode } from '../types';

interface HeaderProps {
  onToggleSidebar: () => void;
  onNewChat: () => void;
  onClearCurrentChat: () => void;
  onExportChat: (format: 'markdown' | 'json') => void;
  hasMessages: boolean;
  activeMode: PersonaMode;
  enableSearch: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onNewChat,
  onClearCurrentChat,
  onExportChat,
  hasMessages,
  activeMode,
  enableSearch,
}) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-30 sticky top-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
          title="Toggle chat sessions history"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-400 flex items-center justify-center text-slate-950 font-black text-xs shadow-md shadow-cyan-500/25">
            4L
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-base tracking-tight">
                4life
              </span>
              <span className="px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono uppercase tracking-wider">
                AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block leading-none">
              The Universal Intelligence Engine
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Status badges */}
        <div className="hidden md:flex items-center gap-2 text-xs font-mono mr-2">
          {enableSearch && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
              <Globe className="w-3 h-3 text-cyan-400" />
              <span>Live Web Grounded</span>
            </div>
          )}
        </div>

        {/* New chat action */}
        <button
          onClick={onNewChat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-cyan-400/50 text-xs font-semibold transition-all shadow-sm cursor-pointer"
          title="Start fresh inquiry"
        >
          <Plus className="w-4 h-4 text-cyan-400" />
          <span className="hidden sm:inline">New Question</span>
        </button>

        {/* Export / Clear dropdown if chat has messages */}
        {hasMessages && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onExportChat('markdown')}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
              title="Export chat as Markdown"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClearCurrentChat}
              className="p-2 rounded-xl bg-slate-900 hover:bg-red-950/40 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/40 transition-colors cursor-pointer"
              title="Clear current dialogue"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
