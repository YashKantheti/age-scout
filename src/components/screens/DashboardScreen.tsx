'use client';

import { Msi } from '../Msi';
import { useAppStore } from '@/store/appStore';
import type { Part } from '@/types';

function PartRow({ part, index }: { part: Part; index: number }) {
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

export function DashboardScreen() {
  const { navigate, history } = useAppStore();

  return (
    <div className="flex flex-col h-full">
      <header className="shrink-0 bg-surface border-b border-border-light z-40">
        <div className="flex items-center px-4 h-14">
          <h1 className="text-base font-bold tracking-tight uppercase">AGE Scout</h1>
          <div className="ml-auto">
            <button className="relative p-2">
              <Msi icon="notifications" className="text-text-muted" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto hide-scroll pb-20 px-4 pt-4 space-y-5">
        {/* Mission Status */}
        <section>
          <div className="bg-surface border-l-4 border-error rounded shadow-sm p-4 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-[11px] uppercase tracking-tight text-text-main">Mission Status</h2>
              <p className="text-xs font-semibold text-error uppercase mt-0.5">3 Priority Alerts Active</p>
            </div>
            <div className="bg-error/10 text-error px-3 py-1.5 rounded flex items-center gap-1">
              <Msi icon="warning" className="text-[16px]" />
              <span className="text-xs font-black">HIGH</span>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="space-y-2.5">
          <h2 className="font-bold text-[11px] uppercase tracking-tight">Quick Actions</h2>
          <button
            onClick={() => navigate('scanner')}
            className="w-full flex items-center p-4 bg-primary text-white rounded shadow-md active:scale-[0.98] transition-transform"
          >
            <div className="w-12 h-12 bg-white/10 rounded flex items-center justify-center mr-4 shrink-0">
              <Msi icon="barcode_scanner" className="text-3xl" />
            </div>
            <div className="text-left flex-1">
              <span className="block text-sm font-black uppercase tracking-widest">Start New Scan</span>
              <span className="block text-[10px] text-white/70 font-medium uppercase tracking-tighter">AI-Powered Part Identification</span>
            </div>
            <Msi icon="chevron_right" className="opacity-40" />
          </button>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => navigate('cart')}
              className="flex flex-col items-center justify-center p-4 bg-surface border border-border-light rounded hover:border-primary transition-colors"
            >
              <Msi icon="inventory_2" className="text-3xl mb-2 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-tight">Supply Cart</span>
            </button>
            <button
              onClick={() => navigate('notes')}
              className="flex flex-col items-center justify-center p-4 bg-surface border border-border-light rounded hover:border-primary transition-colors"
            >
              <Msi icon="history_edu" className="text-3xl mb-2 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-tight">Unit Notes</span>
            </button>
          </div>
        </section>

        {/* Recent Scans */}
        <section className="space-y-2.5 pb-2">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-[11px] uppercase tracking-tight">Recent Scans</h2>
            <button onClick={() => navigate('equipment')} className="text-[10px] font-bold text-primary uppercase tracking-widest">
              View All
            </button>
          </div>
          {history.length === 0 ? (
            <div className="text-center py-6">
              <Msi icon="barcode_scanner" className="text-3xl text-text-muted block mb-2" />
              <p className="text-xs text-text-muted">No recent scans yet.</p>
            </div>
          ) : (
            history.slice(0, 5).map((p, i) => <PartRow key={p.scannedAt || i} part={p} index={i} />)
          )}
        </section>
      </main>
    </div>
  );
}
