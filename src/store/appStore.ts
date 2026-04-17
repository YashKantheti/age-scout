'use client';

import { create } from 'zustand';
import type { Screen, NoteFilter, OperationMode, Part, CartItem, Note, ChatMessage } from '@/types';

const LEGACY_MODEL = 'google/gemini-2.0-flash-exp:free';
const FALLBACK_MODEL = 'openai/gpt-4o';

function defaultNotes(): Note[] {
  return [
    {
      id: 1, type: 'hazard', author: 'TSgt Miller', initials: 'TM', unit: 'AGE Flight',
      time: '2 hours ago', title: 'Exposed wiring on Generator Unit #44-12B',
      body: 'Discovered chafed insulation on the main power harness near the chassis ground. Do not operate until CE replaces the harness assembly. Tagged out locally.',
      nsn: '6115-01-493-4122', likes: 12, comments: 3, liked: false,
    },
    {
      id: 2, type: 'pass-down', author: 'SSgt Davis', initials: 'SD', unit: 'Swing Shift',
      time: '5 hours ago', title: '',
      body: 'Awaiting parts delivery from Prod Shop for the Light Cart line. ETA is 0800 tomorrow. Left required TOs pulled up on the shop toughbook. Incoming day shift to verify inventory upon arrival.',
      nsn: '', likes: 4, comments: 0, liked: true,
    },
    {
      id: 3, type: 'general', author: 'A1C Jones', initials: 'RJ', unit: 'AGE Flight',
      time: 'Yesterday', title: '',
      body: 'New supply bins have been organized in the back cage. Please ensure labels face outward when returning stock to prevent scanner misreads.',
      nsn: '', likes: 22, comments: 0, liked: false,
    },
  ];
}

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

const STALE_MODELS: Record<string, string> = {
  'google/gemini-2.5-pro-preview-03-25': 'google/gemini-2.5-pro-preview',
};

function normalizeModel(model: string): string {
  if (model === LEGACY_MODEL) return FALLBACK_MODEL;
  return STALE_MODELS[model] ?? model;
}

interface AppState {
  screen: Screen;
  prevScreen: Screen;
  currentPart: Part | null;
  cart: CartItem[];
  history: Part[];
  notes: Note[];
  noteFilter: NoteFilter;
  apiKey: string;
  model: string;
  chatModel: string;
  operationMode: OperationMode;
  chatMessages: ChatMessage[];

  navigate: (screen: Screen) => void;
  setCurrentPart: (part: Part) => void;
  addToCart: (item: Omit<CartItem, 'id' | 'qty'>) => void;
  changeQty: (id: number, delta: number) => void;
  clearCart: () => void;
  addToHistory: (part: Part) => void;
  likeNote: (id: number) => void;
  addNote: (note: Omit<Note, 'id' | 'likes' | 'comments' | 'liked'>) => void;
  setNoteFilter: (filter: NoteFilter) => void;
  setApiKey: (key: string) => void;
  setModel: (model: string) => void;
  setChatModel: (model: string) => void;
  setOperationMode: (mode: OperationMode) => void;
  addChatMessage: (msg: Omit<ChatMessage, 'id'>) => void;
  clearChat: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  screen: 'dashboard',
  prevScreen: 'dashboard',
  currentPart: null,
  cart: loadFromStorage<CartItem[]>('age_cart', []),
  history: loadFromStorage<Part[]>('age_history', []),
  notes: loadFromStorage<Note[]>('age_notes', null as unknown as Note[]) ?? defaultNotes(),
  noteFilter: 'all',
  apiKey: loadFromStorage<string>('age_api_key', ''),
  model: normalizeModel(loadFromStorage<string>('age_model', FALLBACK_MODEL)),
  chatModel: loadFromStorage<string>('age_chat_model', 'openai/gpt-4o-mini'),
  operationMode: loadFromStorage<OperationMode>('age_op_mode', 'military'),
  chatMessages: [],

  navigate(screen) {
    set(s => ({ prevScreen: s.screen, screen }));
  },

  setCurrentPart(part) {
    set({ currentPart: part, chatMessages: [] });
  },

  addToCart(item) {
    const cart = get().cart;
    const existing = cart.find(c => c.nsn && c.nsn === item.nsn);
    let next: CartItem[];
    if (existing) {
      next = cart.map(c => c.nsn === item.nsn ? { ...c, qty: c.qty + 1 } : c);
    } else {
      next = [...cart, { ...item, qty: 1, id: Date.now() }];
    }
    saveToStorage('age_cart', next);
    set({ cart: next });
  },

  changeQty(id, delta) {
    const cart = get().cart
      .map(i => i.id === id ? { ...i, qty: i.qty + delta } : i)
      .filter(i => i.qty > 0);
    saveToStorage('age_cart', cart);
    set({ cart });
  },

  clearCart() {
    saveToStorage('age_cart', []);
    set({ cart: [] });
  },

  addToHistory(part) {
    const history = [part, ...get().history].slice(0, 100);
    saveToStorage('age_history', history);
    set({ history });
  },

  likeNote(id) {
    const notes = get().notes.map(n =>
      n.id === id ? { ...n, liked: !n.liked, likes: n.liked ? n.likes - 1 : n.likes + 1 } : n
    );
    saveToStorage('age_notes', notes);
    set({ notes });
  },

  addNote(note) {
    const notes = [{ ...note, id: Date.now(), likes: 0, comments: 0, liked: false }, ...get().notes];
    saveToStorage('age_notes', notes);
    set({ notes });
  },

  setNoteFilter(noteFilter) {
    set({ noteFilter });
  },

  setApiKey(apiKey) {
    saveToStorage('age_api_key', apiKey);
    set({ apiKey });
  },

  setModel(model) {
    const nextModel = normalizeModel(model);
    saveToStorage('age_model', nextModel);
    set({ model: nextModel });
  },

  setChatModel(chatModel) {
    saveToStorage('age_chat_model', chatModel);
    set({ chatModel });
  },

  setOperationMode(operationMode) {
    saveToStorage('age_op_mode', operationMode);
    set({ operationMode });
  },

  addChatMessage(msg) {
    set(s => ({ chatMessages: [...s.chatMessages, { ...msg, id: Date.now() }] }));
  },

  clearChat() {
    set({ chatMessages: [] });
  },
}));
