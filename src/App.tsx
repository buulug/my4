import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { PromptSuggestions } from './components/PromptSuggestions';
import { ChatSession, Message, PersonaMode } from './types';

const STORAGE_KEY = '4life_ai_sessions_v1';
const ACTIVE_SESSION_KEY = '4life_ai_active_session_id';

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    return localStorage.getItem(ACTIVE_SESSION_KEY) || null;
  });

  const [activeMode, setActiveMode] = useState<PersonaMode>('omni');
  const [enableSearch, setEnableSearch] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save sessions to localStorage:', e);
    }
  }, [sessions]);

  // Sync activeSessionId
  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem(ACTIVE_SESSION_KEY, activeSessionId);
    }
  }, [activeSessionId]);

  // Current session messages
  const currentSession = sessions.find((s) => s.id === activeSessionId);
  const currentMessages = currentSession ? currentSession.messages : [];

  // Scroll to bottom smoothly when messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages.length, isLoading]);

  // Create a new session
  const handleNewChat = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newSession: ChatSession = {
      id: newSessionId,
      title: 'New Inquiry',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      mode: activeMode,
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSessionId);
  };

  // Delete session
  const handleDeleteSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      const remaining = sessions.filter((s) => s.id !== sessionId);
      setActiveSessionId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Clear current chat
  const handleClearCurrentChat = () => {
    if (!activeSessionId) return;
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? { ...s, messages: [], updatedAt: Date.now() }
          : s
      )
    );
  };

  // Stop generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);

    // Turn off streaming flag on the last message
    if (activeSessionId) {
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== activeSessionId) return s;
          const updated = [...s.messages];
          if (updated.length > 0 && updated[updated.length - 1].isStreaming) {
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              isStreaming: false,
            };
          }
          return { ...s, messages: updated };
        })
      );
    }
  };

  // Send message
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    let targetSessionId = activeSessionId;
    let isBrandNewSession = false;

    // If no active session or current session is deleted, create one
    if (!targetSessionId || !sessions.some((s) => s.id === targetSessionId)) {
      targetSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newSession: ChatSession = {
        id: targetSessionId,
        title: text.length > 35 ? text.substring(0, 35) + '...' : text,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
        mode: activeMode,
      };
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(targetSessionId);
      isBrandNewSession = true;
    }

    const userMessage: Message = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      mode: activeMode,
    };

    const modelMessageId = `msg_model_${Date.now()}`;
    const initialModelMessage: Message = {
      id: modelMessageId,
      role: 'model',
      content: '',
      timestamp: Date.now(),
      mode: activeMode,
      isStreaming: true,
    };

    // Update session with user message and empty model message
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== targetSessionId) return s;
        const newTitle =
          s.messages.length === 0 || isBrandNewSession
            ? text.length > 35
              ? text.substring(0, 35) + '...'
              : text
            : s.title;

        return {
          ...s,
          title: newTitle,
          updatedAt: Date.now(),
          messages: [...s.messages, userMessage, initialModelMessage],
        };
      })
    );

    setIsLoading(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // Gather multi-turn context (filtering out failed messages or empty drafts)
      const existingSession = sessions.find((s) => s.id === targetSessionId);
      const conversationHistory = existingSession
        ? existingSession.messages
            .filter((m) => !m.error && typeof m.content === 'string' && m.content.trim().length > 0)
            .map((m) => ({
              role: m.role,
              text: m.content,
            }))
        : [];
      conversationHistory.push({ role: 'user', text });

      // Try streaming endpoint
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationHistory,
          mode: activeMode,
          enableSearch,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        let serverErrMessage = `Server returned status ${response.status}`;
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            serverErrMessage = errData.error;
          }
        } catch {
          // ignore json parse error
        }
        throw new Error(serverErrMessage);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Streaming body could not be initialized.');
      }

      const decoder = new TextDecoder();
      let accumulatedText = '';
      let extractedSources: any[] = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunkStr = decoder.decode(value, { stream: true });
        const lines = chunkStr.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));

              if (data.error) {
                throw new Error(data.error);
              }

              if (data.text) {
                accumulatedText += data.text;
                // Update message in real time
                setSessions((prev) =>
                  prev.map((s) => {
                    if (s.id !== targetSessionId) return s;
                    return {
                      ...s,
                      messages: s.messages.map((m) =>
                        m.id === modelMessageId
                          ? { ...m, content: accumulatedText }
                          : m
                      ),
                    };
                  })
                );
              }

              if (data.done) {
                if (data.fullText) accumulatedText = data.fullText;
                if (data.sources) extractedSources = data.sources;
              }
            } catch (parseErr) {
              // Ignore partial JSON chunks
            }
          }
        }
      }

      // Finish streaming
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== targetSessionId) return s;
          return {
            ...s,
            messages: s.messages.map((m) =>
              m.id === modelMessageId
                ? {
                    ...m,
                    content: accumulatedText || 'I am ready to answer your next question.',
                    sources: extractedSources,
                    isStreaming: false,
                  }
                : m
            ),
          };
        })
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Generation aborted by user.');
        return;
      }

      console.error('Error receiving 4life answer:', err);

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== targetSessionId) return s;
          return {
            ...s,
            messages: s.messages.map((m) =>
              m.id === modelMessageId
                ? {
                    ...m,
                    content:
                      err.message ||
                      'Could not reach 4life intelligence. Please verify network or try again.',
                    isStreaming: false,
                    error: true,
                  }
                : m
            ),
          };
        })
      );
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Export chat
  const handleExportChat = (format: 'markdown' | 'json') => {
    if (!currentSession || currentMessages.length === 0) return;

    let content = '';
    let filename = `4life-dialogue-${Date.now()}`;
    let mimeType = 'text/plain';

    if (format === 'markdown') {
      filename += '.md';
      mimeType = 'text/markdown';
      content = `# 4life AI Inquiry: ${currentSession.title}\n\n`;
      content += `Date: ${new Date(currentSession.createdAt).toLocaleString()}\n`;
      content += `Mode: ${currentSession.mode}\n\n---\n\n`;

      currentMessages.forEach((m) => {
        const sender = m.role === 'user' ? '### 👤 User' : '### 🔮 4life AI';
        content += `${sender} (${new Date(m.timestamp).toLocaleTimeString()})\n\n`;
        content += `${m.content}\n\n---\n\n`;
      });
    } else {
      filename += '.json';
      mimeType = 'application/json';
      content = JSON.stringify(currentSession, null, 2);
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Session Archive Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => setActiveSessionId(id)}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        activeMode={activeMode}
        onChangeMode={(mode) => setActiveMode(mode)}
      />

      {/* Main App Container */}
      <div className="flex flex-col flex-1 h-full min-w-0 relative">
        {/* Header */}
        <Header
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onNewChat={handleNewChat}
          onClearCurrentChat={handleClearCurrentChat}
          onExportChat={handleExportChat}
          hasMessages={currentMessages.length > 0}
          activeMode={activeMode}
          enableSearch={enableSearch}
        />

        {/* Scrollable Conversation Viewport */}
        <main className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth">
          {currentMessages.length === 0 ? (
            <PromptSuggestions onSelectPrompt={handleSendMessage} />
          ) : (
            <div className="max-w-4xl mx-auto space-y-2">
              {currentMessages.map((msg, idx) => (
                <ChatMessage
                  key={msg.id || idx}
                  message={msg}
                  onSelectPrompt={handleSendMessage}
                  onRetry={() => {
                    const prevUserMsg = currentMessages[idx - 1];
                    if (prevUserMsg && prevUserMsg.role === 'user') {
                      if (enableSearch) setEnableSearch(false);
                      handleSendMessage(prevUserMsg.content);
                    }
                  }}
                />
              ))}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </main>

        {/* Floating Input Dock */}
        <footer className="w-full bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent pt-4">
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            onStopGeneration={handleStopGeneration}
            enableSearch={enableSearch}
            onToggleSearch={() => setEnableSearch(!enableSearch)}
            activeMode={activeMode}
            onChangeMode={(mode) => setActiveMode(mode)}
          />
        </footer>
      </div>
    </div>
  );
}
