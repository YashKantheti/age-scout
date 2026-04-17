'use client';

import { useEffect, useState } from 'react';
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
      className="bg-surface border border-border-light rounded-lg p-3 flex items-center shadow-sm cursor-pointer hover:border-primary hover:shadow-md transition-all group"
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 shrink-0 ${inStock ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'}`}>
        <Msi icon="settings" className="text-[20px]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="text-sm font-bold truncate">{part.partName}</h3>
          <span className={`shrink-0 text-[8px] font-bold px-1.5 py-0.5 border rounded uppercase ${inStock ? 'bg-success/10 text-success border-success/20' : 'bg-error/10 text-error border-error/20'}`}>
            {inStock ? 'Ready' : 'OOS'}
          </span>
        </div>
        <p className="text-[10px] font-semibold text-text-muted font-mono">
          {part.nsn || 'N/A'}{date ? ` · ${date}` : ''}
        </p>
      </div>
      <Msi icon="chevron_right" className="text-text-muted group-hover:text-primary text-[20px] shrink-0" />
    </div>
  );
}

interface Props { onOpenSettings: () => void; }

export function DashboardScreen({ onOpenSettings }: Props) {
  const { navigate, history } = useAppStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="flex flex-col h-full">
      {/* Mobile header (desktop nav is in sidebar) */}
      <header className="md:hidden shrink-0 bg-surface border-b border-border-light flex items-center px-4 h-14">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-primary rounded flex items-center justify-center">
            <Msi icon="flight_takeoff" className="text-white text-[16px]" />
          </div>
          <h1 className="text-base font-black uppercase tracking-[0.12em]">AGE Scout</h1>
        </div>
        <button onClick={onOpenSettings} className="ml-auto p-2 text-text-muted hover:text-text-main transition-colors">
          <Msi icon="settings" />
        </button>
      </header>

      {/* Desktop page title */}
      <div className="hidden md:flex items-center justify-between px-8 pt-8 pb-2 shrink-0">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Dashboard</h1>
          <p className="text-xs text-text-muted font-semibold mt-0.5 uppercase tracking-widest">AGE Scout — Maintenance Operations</p>
        </div>
        <button
          onClick={() => navigate('scanner')}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow hover:bg-primary/90 transition-colors"
        >
          <Msi icon="barcode_scanner" className="text-[18px]" />
          New Scan
        </button>
      </div>

      <main className="flex-1 overflow-y-auto hide-scroll px-4 md:px-8 pt-4 pb-24 md:pb-8">
        {/* Desktop 2-column grid */}
        <div className="md:grid md:grid-cols-[1fr_1.4fr] md:gap-6 space-y-5 md:space-y-0">

          {/* LEFT COLUMN */}
          <div className="space-y-4">
            {/* Mission Status */}
            <div className="bg-surface border-l-4 border-error rounded-lg shadow-sm p-4 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-[11px] uppercase tracking-tight text-text-main">Mission Status</h2>
                <p className="text-xs font-semibold text-error uppercase mt-0.5">3 Priority Alerts Active</p>
              </div>
              <div className="bg-error/10 text-error px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <Msi icon="warning" className="text-[16px]" />
                <span className="text-xs font-black">HIGH</span>
              </div>
            </div>

            {/* Scan CTA — mobile only (desktop has it in header) */}
            <button
              onClick={() => navigate('scanner')}
              className="md:hidden w-full flex items-center p-4 bg-primary text-white rounded-lg shadow-md active:scale-[0.98] transition-transform"
            >
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mr-4 shrink-0">
                <Msi icon="barcode_scanner" className="text-3xl" />
              </div>
              <div className="text-left flex-1">
                <span className="block text-sm font-black uppercase tracking-widest">Start New Scan</span>
                <span className="block text-[10px] text-white/70 font-medium">AI-Powered Part Identification</span>
              </div>
              <Msi icon="chevron_right" className="opacity-40" />
            </button>

            {/* Quick Actions */}
            <div>
              <h2 className="font-bold text-[11px] uppercase tracking-tight text-text-muted mb-3">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { screen: 'cart',      icon: 'inventory_2',             label: 'Supply Cart'   },
                  { screen: 'notes',     icon: 'history_edu',             label: 'The Line'      },
                  { screen: 'equipment', icon: 'precision_manufacturing',  label: 'Equipment Log' },
                  { screen: 'scanner',   icon: 'photo_camera',            label: 'Upload Image'  },
                ].map(a => (
                  <button
                    key={a.screen}
                    onClick={() => navigate(a.screen as never)}
                    className="flex flex-col items-center justify-center p-4 bg-surface border border-border-light rounded-lg hover:border-primary hover:shadow-sm transition-all"
                  >
                    <Msi icon={a.icon} className="text-3xl mb-2 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-tight">{a.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { label: 'Scanned',   value: mounted ? String(history.length) : '—', icon: 'barcode_scanner' },
                { label: 'In Stock',  value: mounted ? String(history.filter(p => p.stockStatus?.toLowerCase().includes('in stock')).length) : '—', icon: 'check_circle' },
                { label: 'Alerts',    value: '3', icon: 'warning' },
              ].map(s => (
                <div key={s.label} className="bg-surface border border-border-light rounded-lg p-3 text-center">
                  <Msi icon={s.icon} className="text-primary text-[20px] block mx-auto mb-1" />
                  <p className="text-xl font-black">{s.value}</p>
                  <p className="text-[9px] font-bold text-text-muted uppercase tracking-wide">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN — Recent Scans */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-[11px] uppercase tracking-tight text-text-muted">Recent Scans</h2>
              <button onClick={() => navigate('equipment')} className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">
                View All
              </button>
            </div>
            {!mounted ? null : history.length === 0 ? (
              <div className="text-center py-12 bg-surface border border-border-light rounded-lg">
                <Msi icon="barcode_scanner" className="text-4xl text-text-muted block mb-2" />
                <p className="text-sm font-semibold text-text-muted">No scans yet</p>
                <p className="text-xs text-text-muted mt-1">Use the scanner to identify parts</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {history.slice(0, 10).map((p, i) => <PartRow key={p.scannedAt || i} part={p} />)}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="shrink-0 text-center py-2 border-t border-border-light bg-surface">
        <p className="text-[10px] text-text-muted font-semibold tracking-wide">
          Built by <span className="text-primary font-bold">Team Falcon</span> · Virginia Tech · Spring 2026
        </p>
      </footer>
    </div>
  );
}
