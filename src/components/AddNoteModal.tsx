'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import type { NoteType } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export function AddNoteModal({ open, onClose, onToast }: Props) {
  const { addNote } = useAppStore();
  const [type, setType] = useState<NoteType>('general');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  function submit() {
    if (!body.trim()) { onToast('Note body is required'); return; }
    addNote({
      type, title: title.trim(), body: body.trim(),
      author: 'You', initials: 'ME', unit: 'AGE Flight', time: 'Just now', nsn: '',
    });
    setTitle(''); setBody(''); setType('general');
    onClose();
    onToast('Note posted');
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 flex items-end">
      <div className="bg-white w-full max-w-md mx-auto rounded-t-2xl p-5 slide-up">
        <h2 className="text-lg font-bold mb-4">Add Note to The Line</h2>
        <select
          value={type}
          onChange={e => setType(e.target.value as NoteType)}
          className="block w-full border border-border-light rounded px-3 py-2.5 text-sm mb-3 focus:ring-2 focus:ring-primary outline-none bg-white"
        >
          <option value="general">General</option>
          <option value="hazard">Hazard</option>
          <option value="pass-down">Pass-down</option>
        </select>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Title (optional)"
          className="block w-full border border-border-light rounded px-3 py-2.5 text-sm mb-3 focus:ring-2 focus:ring-primary outline-none"
        />
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Write your note..."
          rows={4}
          className="block w-full border border-border-light rounded px-3 py-2.5 text-sm mb-4 focus:ring-2 focus:ring-primary outline-none resize-none"
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-border-light py-2.5 rounded font-bold text-sm">
            Cancel
          </button>
          <button onClick={submit} className="flex-1 bg-primary text-white py-2.5 rounded font-bold text-sm">
            Post Note
          </button>
        </div>
      </div>
    </div>
  );
}
