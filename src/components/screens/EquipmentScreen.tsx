'use client';

import { useEffect, useState } from 'react';
import { Msi } from '../Msi';
import { useAppStore } from '@/store/appStore';
import type { Part } from '@/types';

function PartCard({ part }: { part: Part }) {
  const { navigate, setCurrentPart } = useAppStore();
  const inStock = part.stockStatus?.toLowerCase().includes('in stock');
  const date = part.scannedAt ? new Date(part.scannedAt).toLocaleDateString() : '';
  const confPct = part.confidence ? Math.round(part.confidence * 100) : null;

  function open() {
    setCurrentPart(part);
    navigate('part-details');
  }

  return (
    <div
      onClick={open}
      className="bg-surface border border-border-light rounded-xl p-4 flex flex-col gap-3 shadow-sm cursor-pointer hover:border-primary hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${inStock ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'}`}>
          <Msi icon="settings" className="text-[20px]" />
        </div>
        <span className={`text-[8px] font-bold px-2 py-1 border rounded-full uppercase ${inStock ? 'bg-success/10 text-success border-success/20' : 'bg-error/10 text-error border-error/20'}`}>
          {inStock ? 'In Stock' : 'Out of Stock'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold leading-tight group-hover:text-primary transition-colors">{part.partName}</h3>
        <p className="text-[10px] font-semibold text-text-muted font-mono mt-1">{part.nsn || 'N/A'}</p>
        {part.modelNumber && (
          <p className="text-[10px] text-text-muted mt-0.5">Model: {part.modelNumber}</p>
        )}
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-border-light">
        {confPct !== null && (
          <span className="text-[10px] font-bold text-text-muted">{confPct}% match</span>
        )}
        {date && <span className="text-[10px] text-text-muted ml-auto">{date}</span>}
      </div>
    </div>
  );
}

export function EquipmentScreen() {
  const { history } = useAppStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="flex flex-col h-full">
      <header className="shrink-0 bg-surface border-b border-border-light z-40 flex items-center px-4 md:px-8 h-14">
        <h1 className="text-base font-bold uppercase tracking-tight">Equipment History</h1>
        <span className="ml-3 text-xs font-bold text-text-muted bg-bg-light border border-border-light px-2 py-0.5 rounded-full">
          {mounted ? history.length : 0} parts
        </span>
      </header>
      <main className="flex-1 overflow-y-auto hide-scroll pb-20 md:pb-8 px-4 md:px-8 pt-4">
        {history.length === 0 ? (
          <div className="text-center py-16">
            <Msi icon="precision_manufacturing" className="text-5xl text-text-muted block mb-3" />
            <p className="text-sm font-semibold text-text-muted">No scanned parts yet.</p>
            <p className="text-xs text-text-muted mt-1">Use the scanner to identify parts</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {history.map((p, i) => <PartCard key={`${p.scannedAt ?? ''}-${i}`} part={p} />)}
          </div>
        )}
      </main>
    </div>
  );
}
