import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Loader2,
  Minimize2,
  RefreshCw,
} from 'lucide-react';
import { sendChatMessage, QUICK_ACTIONS } from '../lib/chatbot';
import { campusStore } from '../lib/store';
import type { ChatMessage, Incident } from '../types/incident';

export default function ChatbotDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hello! 👋 I am CampusPulse AI, your operational copilot for Wales University. How can I help you track issues or report a problem today?',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [incidents, setIncidents] = useState<Incident[]>(() => campusStore.getIncidents());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = campusStore.subscribe(() => {
      setIncidents(campusStore.getIncidents());
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const messageContent = (textToSend || input).trim();
    if (!messageContent || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: messageContent,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await sendChatMessage(messageContent, [...messages, userMsg], incidents);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content:
          'I encountered a brief issue connecting to the AI model. For immediate emergencies, contact Campus Operations at ext 4400.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setIsOpen(true)}
            className="group relative w-16 h-16 bg-black text-white rounded-full flex items-center justify-center brutal-shadow border-2 border-white hover:scale-110 active:scale-95 transition-all"
            title="Open CampusPulse AI Assistant"
          >
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#C8E64D] rounded-full border-2 border-black animate-ping" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#C8E64D] rounded-full border-2 border-black" />
            <MessageSquare className="w-7 h-7 group-hover:rotate-6 transition-transform" />
          </button>
        </div>
      )}

      {/* Slide-in Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-md bg-white border-4 border-black rounded-3xl brutal-shadow overflow-hidden flex flex-col h-[580px] animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-[#DCE8D4] border-b-4 border-black p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-black text-[#C8E64D] flex items-center justify-center font-bold text-lg">
                <Sparkles className="w-5 h-5 text-[#C8E64D]" />
              </div>
              <div>
                <h3 className="font-bold text-base text-black" style={{ fontFamily: 'Lexend' }}>
                  CampusPulse AI
                </h3>
                <span className="text-[10px] font-bold text-green-800 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Online • Operations Copilot
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  setMessages([
                    {
                      id: 'welcome',
                      role: 'assistant',
                      content:
                        'Hello! 👋 I am CampusPulse AI, your operational copilot for Wales University. How can I help you track issues or report a problem today?',
                      timestamp: new Date().toISOString(),
                    },
                  ])
                }
                title="Clear Chat"
                className="w-8 h-8 rounded-full border border-black/30 hover:border-black flex items-center justify-center transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full border border-black/30 hover:border-black flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Action Chips */}
          <div className="p-3 bg-[#F7F6F2] border-b border-black/10 flex gap-2 overflow-x-auto no-scrollbar">
            {QUICK_ACTIONS.map((qa, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(qa.message)}
                className="text-[11px] font-semibold bg-white hover:bg-[#C8E64D] border border-black/20 hover:border-black rounded-lg px-2.5 py-1 flex-shrink-0 transition-colors"
              >
                {qa.label}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FAFAF8]">
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div key={m.id} className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 border border-black ${
                      isUser ? 'bg-[#C8E64D] text-black' : 'bg-black text-[#C8E64D]'
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div
                    className={`max-w-[78%] rounded-2xl p-3 text-xs leading-relaxed border-2 border-black ${
                      isUser
                        ? 'bg-black text-white rounded-tr-none shadow-[2px_2px_0px_#C8E64D]'
                        : 'bg-white text-gray-900 rounded-tl-none shadow-[2px_2px_0px_#000]'
                    }`}
                  >
                    <p className="whitespace-pre-line">{m.content}</p>
                    <span className="text-[9px] opacity-60 block mt-1 text-right font-mono">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-gray-500 italic p-2">
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>CampusPulse AI is researching live tickets...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t-2 border-black flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about campus issues, SLAs, or reports..."
              className="flex-1 text-xs border-2 border-black rounded-xl px-3 py-2.5 bg-[#F7F6F2] focus:outline-none focus:ring-2 focus:ring-[#C8E64D]"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl bg-black text-white hover:bg-[#C8E64D] hover:text-black flex items-center justify-center border-2 border-black transition-colors disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
