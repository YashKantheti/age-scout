'use client';

import { useState, useEffect } from 'react';
import { Msi } from './Msi';
import { useAppStore } from '@/store/appStore';
import type { OperationMode } from '@/types';

const VISION_MODELS = [
  { value: 'openai/gpt-4o', label: 'GPT-4o' },
  { value: 'google/gemini-2.5-pro-preview', label: 'Gemini 2.5 Pro' },
  { value: 'anthropic/claude-opus-4-7', label: 'Claude Opus 4.7' },
  { value: 'anthropic/claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
  { value: 'meta-llama/llama-3.2-90b-vision-instruct', label: 'Llama 3.2 90B Vision' },
];

const CHAT_MODELS = [
  { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'google/gemini-2.0-flash-001', label: 'Gemini 2.0 Flash' },
  { value: 'anthropic/claude-haiku-4-5', label: 'Claude Haiku 4.5' },
  { value: 'meta-llama/llama-3.1-8b-instruct', label: 'Llama 3.1 8B' },
  { value: 'openai/gpt-4o', label: 'GPT-4o (same as scan)' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function SettingsModal({ open, onClose, onSave }: Props) {
  const { apiKey, model, chatModel, operationMode, setApiKey, setModel, setChatModel, setOperationMode } = useAppStore();
  const [keyInput, setKeyInput] = useState(apiKey);
  const [modelInput, setModelInput] = useState(model);
  const [chatModelInput, setChatModelInput] = useState(chatModel);
  const [modeInput, setModeInput] = useState<OperationMode>(operationMode);

  useEffect(() => {
    if (open) {
      setKeyInput(apiKey);
      setModelInput(model);
      setChatModelInput(chatModel);
      setModeInput(operationMode);
    }
  }, [open, apiKey, model, operationMode]);

  function save() {
    setApiKey(keyInput.trim());
    setModel(modelInput);
    setChatModel(chatModelInput);
    setOperationMode(modeInput);
    onSave();
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/70 flex items-end md:items-center md:justify-center">
      <div className="bg-white w-full rounded-t-2xl md:rounded-2xl p-6 max-w-md mx-auto slide-up md:shadow-2xl">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-bold">Configure</h2>
          <button onClick={onClose} className="p-2 text-text-muted hover:text-text-main">
            <Msi icon="close" />
          </button>
        </div>
        <p className="text-sm text-text-muted mb-5">
          Enter your{' '}
          <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-primary underline">
            OpenRouter API key
          </a>{' '}
          to enable AI part identification.
        </p>

        {/* Operation Mode */}
        <div className="mb-4">
          <span className="text-xs font-bold uppercase tracking-wide text-text-muted block mb-2">Operation Mode</span>
          <div className="grid grid-cols-2 gap-2">
            {(['military', 'civilian'] as OperationMode[]).map(m => (
              <button
                key={m}
                onClick={() => setModeInput(m)}
                className={`flex items-center gap-2 px-4 py-3 rounded border font-bold text-sm transition-colors ${
                  modeInput === m
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-text-main border-border-light hover:border-primary'
                }`}
              >
                <Msi icon={m === 'military' ? 'military_tech' : 'flight'} className="text-[18px]" />
                {m === 'military' ? 'Military' : 'Civilian'}
              </button>
            ))}
          </div>
        </div>

        <label className="block mb-3">
          <span className="text-xs font-bold uppercase tracking-wide text-text-muted block mb-1">API Key</span>
          <input
            type="password"
            value={keyInput}
            onChange={e => setKeyInput(e.target.value)}
            placeholder="sk-or-v1-..."
            className="block w-full border border-border-light rounded px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none font-mono"
          />
        </label>
        <label className="block mb-3">
          <span className="text-xs font-bold uppercase tracking-wide text-text-muted block mb-1">Scan Model <span className="normal-case font-normal">(vision)</span></span>
          <div className="relative">
            <select
              value={modelInput}
              onChange={e => setModelInput(e.target.value)}
              className="block w-full border border-border-light rounded px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none bg-white appearance-none pr-8"
            >
              {VISION_MODELS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <Msi icon="expand_more" className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none text-[20px]" />
          </div>
        </label>

        <label className="block mb-5">
          <span className="text-xs font-bold uppercase tracking-wide text-text-muted block mb-1">Chat Model <span className="normal-case font-normal">(text only)</span></span>
          <div className="relative">
            <select
              value={chatModelInput}
              onChange={e => setChatModelInput(e.target.value)}
              className="block w-full border border-border-light rounded px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none bg-white appearance-none pr-8"
            >
              {CHAT_MODELS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <Msi icon="expand_more" className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none text-[20px]" />
          </div>
        </label>
        <button onClick={save} className="w-full bg-primary text-white font-bold py-3 rounded text-sm tracking-wide">
          Save &amp; Continue
        </button>
      </div>
    </div>
  );
}
