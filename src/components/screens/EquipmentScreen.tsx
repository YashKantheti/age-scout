'use client';

import { Msi } from '../Msi';
import { useAppStore } from '@/store/appStore';
import type { Part } from '@/types';

function PartRow({ part }: { part: Part }) {
  const { navigate, setCurrentPart } = useAppStore();
  const inStock = part.stockStatus?.toLowerCase().includes('in stock');
  const date = part.scannedAt ? new Date(part.scannedAt).toLocaleDateString() : '';

  function open() {
    setCurrentPart(part);
    navigate('part-details');
  }

  return (
    <div
      onClick={open}
      className="bg-surface border border-border-light rounded p-3 flex items-center shadow-sm cursor-pointer hover:border-primary transition-colors group mb-2"
    >
      <div className={`w-10 h-10 bg-bg-light rounded flex items-center justify-center mr-3 shrink-0 ${inStock ? 'text-primary' : 'text-error'}`}>
        <Msi icon="settings" className="text-[20px]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <h3 className="text-sm font-bold truncate max-w-[200px]">{part.partName}</h3>
          <span className={`text-[8px] font-bold px-1 py-0.5 border rounded uppercase ${inStock ? 'bg-success/10 text-success border-success/20' : 'bg-error/10 text-error border-error/20'}`}>
            {inStock ? 'Ready' : 'OOS'}
          </span>
        </div>
        <p className="text-[10px] font-semibold text-text-muted font-mono">
          NSN: {part.nsn || 'N/A'}{date ? ` · ${date}` : ''}
        </p>
      </div>
      <Msi icon="chevron_right" className="text-text-muted group-hover:text-primary text-[20px]" />
    </div>
  );
}

export function EquipmentScreen() {
  const { history } = useAppStore();

  return (
    <div className="flex flex-col h-full">
      <header className="shrink-0 bg-surface border-b border-border-light z-40 flex items-center px-4 h-14">
        <h1 className="text-base font-bold uppercase tracking-tight">Equipment History</h1>
      </header>
      <main className="flex-1 overflow-y-auto hide-scroll pb-20 px-4 pt-4">
        {history.length === 0 ? (
          <div className="text-center py-10">
            <Msi icon="precision_manufacturing" className="text-4xl text-text-muted block mb-2" />
            <p className="text-xs text-text-muted">No scanned parts yet.</p>
          </div>
        ) : (
          history.map((p, i) => <PartRow key={p.scannedAt || i} part={p} />)
        )}
      </main>
    </div>
  );
}
