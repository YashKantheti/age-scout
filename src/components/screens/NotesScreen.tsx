'use client';

import { useState } from 'react';
import { Msi } from '../Msi';
import { AddNoteModal } from '../AddNoteModal';
import { useAppStore } from '@/store/appStore';
import type { NoteFilter, Note } from '@/types';

const FILTERS: { value: NoteFilter; label: string }[] = [
  { value: 'all',       label: 'All'       },
  { value: 'hazard',    label: 'Hazards'   },
  { value: 'general',   label: 'General'   },
  { value: 'pass-down', label: 'Pass-down' },
];

const BADGE_CONFIG: Record<string, { bg: string; text: string; border: string; icon: string; label: string }> = {
  hazard:      { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  icon: 'warning',   label: 'Hazard'    },
  'pass-down': { bg: 'bg-gray-100',  text: 'text-gray-600',   border: 'border-gray-200',   icon: 'sync_alt',  label: 'Pass-down' },
  general:     { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   icon: 'info',      label: 'General'   },
};

function NoteCard({ note }: { note: Note }) {
  const { likeNote } = useAppStore();
  const badge = BADGE_CONFIG[note.type];
  return (
    <article className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col gap-3 break-inside-avoid">
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
            {note.initials}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm">{note.author}</p>
            <p className="text-[10px] text-text-muted">{note.time} · {note.unit}</p>
          </div>
        </div>
        {badge && (
          <div className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold uppercase border ${badge.bg} ${badge.text} ${badge.border}`}>
            <Msi icon={badge.icon} className="text-[13px]" />{badge.label}
          </div>
        )}
      </div>
      <div className="text-sm leading-relaxed">
        {note.title && <p className="font-semibold mb-1">{note.title}</p>}
        <p className="text-text-main">{note.body}</p>
        {note.nsn && (
          <div className="mt-2 text-xs font-mono text-text-muted bg-gray-100 inline-block px-2 py-1 rounded-lg">
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

interface Props { onToast: (msg: string) => void; }

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
      <div className="shrink-0 bg-white border-b border-gray-200 z-10 px-4 md:px-8">
        <div className="flex items-center justify-between pt-4 pb-2">
          <h1 className="text-xl font-bold tracking-tight">The Line</h1>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors"
          >
            <Msi icon="add" className="text-[18px]" />
            <span className="hidden sm:inline">Add Note</span>
          </button>
        </div>
        <div className="pb-2">
          <div className="flex items-center bg-gray-100 rounded-xl h-11 px-3 gap-2 border border-transparent focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
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
        <div className="pb-3 flex gap-2 overflow-x-auto hide-scroll">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setNoteFilter(f.value)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide border transition-colors ${noteFilter === f.value ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600 bg-white hover:border-primary/40'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 overflow-y-auto hide-scroll p-4 md:p-8 pb-28 md:pb-8">
        {filtered.length === 0 ? (
          <p className="text-xs text-text-muted text-center py-10">No notes found.</p>
        ) : (
          <div className="columns-1 md:columns-2 xl:columns-3 gap-4 space-y-4">
            {filtered.map(n => <NoteCard key={n.id} note={n} />)}
          </div>
        )}
      </main>

      {/* Mobile FAB */}
      <button
        onClick={() => setAddOpen(true)}
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-primary text-white rounded-full shadow-xl flex items-center justify-center z-30"
      >
        <Msi icon="add" className="text-3xl" />
      </button>

      <AddNoteModal open={addOpen} onClose={() => setAddOpen(false)} onToast={onToast} />
    </div>
  );
}
