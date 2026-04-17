'use client';

import { useEffect, useRef, useState } from 'react';
import { Msi } from '../Msi';
import { useAppStore } from '@/store/appStore';
import type { ChatMessage, ResourceLink } from '@/types';

const LINK_ICONS: Record<string, string> = {
  manual: 'picture_as_pdf',
  purchase: 'shopping_cart',
  reference: 'open_in_new',
};

const LINK_COLORS: Record<string, string> = {
  manual:    'bg-blue-50 border-blue-200 text-blue-700',
  purchase:  'bg-green-50 border-green-200 text-green-700',
  reference: 'bg-gray-50 border-gray-200 text-gray-600',
};

function LinkCard({ link }: { link: ResourceLink }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noreferrer"
      className={`flex items-center gap-2 px-3 py-2 rounded border text-xs font-semibold transition-opacity hover:opacity-80 ${LINK_COLORS[link.type] ?? LINK_COLORS.reference}`}
    >
      <Msi icon={LINK_ICONS[link.type] ?? 'open_in_new'} className="text-[15px] shrink-0" />
      <span className="truncate">{link.label}</span>
      <Msi icon="arrow_outward" className="text-[13px] shrink-0 ml-auto" />
    </a>
  );
}

function Bubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-1.5 mb-3`}>
      {!isUser && (
        <div className="flex items-center gap-1.5 ml-1">
          <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center shrink-0">
            <Msi icon="auto_awesome" className="text-white text-[11px]" />
          </div>
          <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">AI Advisor</span>
        </div>
      )}
      <div
        className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-primary text-white rounded-br-sm'
            : 'bg-surface border border-border-light text-text-main rounded-bl-sm shadow-sm'
        }`}
      >
        {msg.content}
      </div>
      {!isUser && msg.links && msg.links.length > 0 && (
        <div className="max-w-[85%] w-full flex flex-col gap-1.5 ml-1">
          {msg.links.map((l, i) => <LinkCard key={i} link={l} />)}
        </div>
      )}
    </div>
  );
}

interface Props {
  onToast: (msg: string) => void;
}

export function ChatScreen({ onToast }: Props) {
  const { navigate, currentPart, apiKey, chatModel, operationMode, chatMessages, addChatMessage, clearChat } = useAppStore();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  // Seed intro message once per part
  useEffect(() => {
    if (chatMessages.length === 0 && currentPart) {
      addChatMessage({
        role: 'assistant',
        content: `I've reviewed the scanned part — **${currentPart.partName}**. Ask me anything: compatibility questions, installation steps, where to source it, or if you think the identification needs refinement.`,
        links: [
          operationMode === 'military'
            ? { label: 'DLA Aviation', url: 'https://www.dla.mil/Aviation/', type: 'reference' }
            : { label: 'Aviall Parts Search', url: 'https://www.aviall.com/', type: 'purchase' },
          operationMode === 'military'
            ? { label: 'USAF e-Publishing (TOs)', url: 'https://www.e-publishing.af.mil/', type: 'manual' }
            : { label: 'FAA Regulatory Guidance', url: 'https://rgl.faa.gov/', type: 'manual' },
        ],
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    if (!apiKey) { onToast('Set your API key in Settings'); return; }

    setInput('');
    addChatMessage({ role: 'user', content: text });
    setLoading(true);

    try {
      const history = [...chatMessages, { role: 'user', content: text }]
        .map(m => ({ role: m.role, content: m.content }));

      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, part: currentPart, apiKey, model: chatModel, operationMode }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || `Error ${resp.status}`);

      addChatMessage({ role: 'assistant', content: data.message, links: data.links });
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <div className="flex flex-col h-full bg-bg-light">
      {/* Header */}
      <header className="shrink-0 bg-surface border-b border-border-light flex items-center px-4 md:px-8 h-14 shadow-sm">
        <button onClick={() => navigate('part-details')} className="p-2 -ml-2 text-text-main hover:bg-bg-light rounded transition-colors">
          <Msi icon="arrow_back" />
        </button>
        <div className="ml-2 flex-1 min-w-0">
          <h1 className="text-sm font-bold uppercase tracking-tight">AI Advisor</h1>
          {currentPart && (
            <p className="text-[10px] text-text-muted truncate">{currentPart.partName}</p>
          )}
        </div>
        <button
          onClick={() => { clearChat(); onToast('Chat cleared'); }}
          className="p-2 text-text-muted hover:text-text-main transition-colors"
          title="Clear chat"
        >
          <Msi icon="delete_sweep" />
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto hide-scroll px-4 md:px-8 pt-4 pb-2 max-w-4xl w-full mx-auto self-stretch">
        {chatMessages.map(msg => <Bubble key={msg.id} msg={msg} />)}

        {loading && (
          <div className="flex items-start gap-2 mb-3">
            <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center shrink-0 mt-1">
              <Msi icon="auto_awesome" className="text-white text-[11px]" />
            </div>
            <div className="bg-surface border border-border-light rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggested prompts (shown when only intro message exists) */}
      {chatMessages.length <= 1 && (
        <div className="px-4 md:px-8 pb-2 flex flex-wrap gap-2 max-w-4xl w-full mx-auto">
          {[
            'Is this compatible with my aircraft?',
            'Where can I buy this?',
            'Show me installation steps',
            'Are there any known issues?',
          ].map(prompt => (
            <button
              key={prompt}
              onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
              className="text-[11px] font-semibold px-3 py-1.5 bg-surface border border-border-light rounded-full text-text-muted hover:border-primary hover:text-primary transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="shrink-0 bg-surface border-t border-border-light px-4 md:px-8 py-3 flex items-center gap-3 max-w-4xl w-full mx-auto self-stretch">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask about this part..."
          className="flex-1 text-sm bg-bg-light border border-border-light rounded-full px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary focus:border-primary"
        />
        <button
          onClick={send}
          disabled={!input.trim() || loading}
          className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center disabled:opacity-40 transition-opacity shrink-0"
        >
          <Msi icon="send" className="text-[18px]" />
        </button>
      </div>
    </div>
  );
}
