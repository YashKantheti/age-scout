'use client';

import { useState } from 'react';
import { Msi } from '../Msi';
import { AddNoteModal } from '../AddNoteModal';
import { useAppStore } from '@/store/appStore';
import type { NoteFilter, Note } from '@/types';

const FILTERS: { value: NoteFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'hazard', label: 'Hazards' },
  { value: 'general', label: 'General' },
  { value: 'pass-down', label: 'Pass-down' },
];

const BADGE: Record<string, React.ReactNode> = {
  hazard: (
    <div className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold uppercase border bg-amber-100 text-amber-700 border-amber-200">
      <Msi icon="warning" className="text-[13px]" />Hazard
    </div>
  ),
  'pass-down': (
    <div className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold uppercase border bg-gray-100 text-gray-600 border-gray-200">
      <Msi icon="sync_alt" className="text-[13px]" />Pass-down
    </div>
  ),
  general: (
    <div className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold uppercase border bg-blue-50 text-blue-700 border-blue-200">
      <Msi icon="info" className="text-[13px]" />General
    </div>
  ),
};

function NoteCard({ note }: { note: Note }) {
  const { likeNote } = useAppStore();
  return (
    <article className="bg-white rounded border border-gray-200 p-4 shadow-sm flex flex-col gap-3">
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm shrink-0">
            {note.initials}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm">{note.author}</p>
            <p className="text-xs text-text-muted">{note.time} · {note.unit}</p>
          </div>
        </div>
        {BADGE[note.type]}
      </div>
      <div className="text-sm leading-relaxed">
        {note.title && <p className="font-semibold mb-1">{note.title}</p>}
        <p className="text-text-main">{note.body}</p>
        {note.nsn && (
          <div className="mt-2 text-xs font-mono text-text-muted bg-gray-100 inline-block px-2 py-1 rounded">
            NSN: {note.nsn}
          </div>
        )}
      </div>
      <div className="flex items-center gap-5 border-t border-gray-100 pt-3">
        <button
          onClick={() => likeNote(note.id)}
          className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${note.liked ? 'text-primary' : 'text-text-muted'}`}
        >
          <Msi icon="thumb_up" fill={note.liked} className="text-[18px]" />
          <span>{note.likes}</span>
        </button>
        <button className="flex items-center gap-1.5 text-text-muted text-sm font-medium">
          <Msi icon="chat_bubble" className="text-[18px]" />
          <span>{note.comments}</span>
        </button>
      </div>
    </article>
  );
}

interface Props {
  onToast: (msg: string) => void;
}

export function NotesScreen({ onToast }: Props) {
  const { notes, noteFilter, setNoteFilter } = useAppStore();
  const [query, setQuery] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  const filtered = notes
    .filter(n => noteFilter === 'all' || n.type === noteFilter)
    .filter(n => {
      if (!query) return true;
      const q = query.toLowerCase();
      return (n.title + n.body + n.nsn + n.author).toLowerCase().includes(q);
    });

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 bg-white border-b border-gray-200 z-10">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h1 className="text-xl font-bold tracking-tight">The Line</h1>
          <button className="p-2 text-text-muted"><Msi icon="tune" className="text-2xl" /></button>
        </div>
        <div className="px-4 pb-2">
          <div className="flex items-center bg-gray-100 rounded-lg h-11 px-3 gap-2 border border-transparent focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
            <Msi icon="search" className="text-text-muted text-[20px]" />
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search notes, hazards, NSNs..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-text-main placeholder:text-text-muted"
            />
          </div>
        </div>
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto hide-scroll">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setNoteFilter(f.value)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide border transition-colors ${noteFilter === f.value ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600 bg-white'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 overflow-y-auto hide-scroll p-4 flex flex-col gap-4 pb-28">
        {filtered.length === 0 ? (
          <p className="text-xs text-text-muted text-center py-10">No notes found.</p>
        ) : (
          filtered.map(n => <NoteCard key={n.id} note={n} />)
        )}
      </main>

      <button
        onClick={() => setAddOpen(true)}
        className="fixed bottom-20 right-4 w-14 h-14 bg-primary text-white rounded-full shadow-xl flex items-center justify-center z-30"
      >
        <Msi icon="add" className="text-3xl" />
      </button>

      <AddNoteModal open={addOpen} onClose={() => setAddOpen(false)} onToast={onToast} />
    </div>
  );
}
