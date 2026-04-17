'use client';

import { Msi } from '../Msi';
import { useAppStore } from '@/store/appStore';

interface Props { onToast: (msg: string) => void; }

export function PartDetailsScreen({ onToast }: Props) {
  const { navigate, prevScreen, currentPart, operationMode, addToCart } = useAppStore();

  if (!currentPart) return null;
  const p = currentPart;
  const inStock = p.stockStatus?.toLowerCase().includes('in stock');

  function goBack() {
    navigate(prevScreen === 'part-details' ? 'equipment' : prevScreen);
  }

  function handleAddToCart() {
    addToCart({ name: p.partName, nsn: p.nsn, stockStatus: p.stockStatus, icon: 'settings' });
    onToast('Added to cart');
  }

  function addAltToCart(idx: number) {
    const ap = p.alternativeParts?.[idx];
    if (!ap) return;
    addToCart({ name: ap.name, nsn: ap.nsn, stockStatus: 'Unknown', icon: 'swap_horiz' });
    onToast('Added to cart');
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="shrink-0 bg-surface border-b border-border-light z-40 flex items-center px-4 md:px-8 h-14">
        <button onClick={goBack} className="p-2 -ml-2 text-text-main hover:bg-bg-light rounded transition-colors">
          <Msi icon="arrow_back" />
        </button>
        <h1 className="ml-2 text-base font-bold uppercase tracking-tight">Part Details</h1>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => navigate('chat')}
            className="flex items-center gap-2 text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
          >
            <Msi icon="chat" className="text-[16px]" />
            <span className="hidden sm:inline">AI Advisor</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto hide-scroll">
        {/* Title block — full width */}
        <section className="bg-surface px-4 md:px-8 py-5 border-b border-border-light">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-extrabold leading-tight mb-3 tracking-tight">{p.partName}</h2>
            <div className="flex flex-wrap gap-2.5 items-center">
              <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${p.confirmedFromImage?.includes('nsn') ? 'bg-success/5 border-success/30' : 'bg-gray-100 border-gray-200'}`}>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                  {operationMode === 'civilian' ? 'ATA / P/N' : 'NSN'}
                </span>
                <span className="font-mono text-sm font-medium">{p.nsn || 'N/A'}</span>
                {p.confirmedFromImage?.includes('nsn') && <Msi icon="verified" className="text-success text-[14px]" />}
              </div>
              {p.modelNumber && (
                <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${p.confirmedFromImage?.includes('modelNumber') ? 'bg-success/5 border-success/30' : 'bg-gray-100 border-gray-200'}`}>
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Model No.</span>
                  <span className="font-mono text-sm font-medium">{p.modelNumber}</span>
                  {p.confirmedFromImage?.includes('modelNumber') && <Msi icon="verified" className="text-success text-[14px]" />}
                </div>
              )}
              <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${inStock ? 'bg-green-50 border-success/20' : 'bg-red-50 border-error/20'}`}>
                <span className={`w-2 h-2 rounded-full animate-pulse ${inStock ? 'bg-success' : 'bg-error'}`} />
                <span className={`text-xs font-bold uppercase tracking-widest ${inStock ? 'text-success' : 'text-error'}`}>{p.stockStatus || 'Unknown'}</span>
              </div>
              <div className="bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 flex items-center gap-2">
                <Msi icon="auto_awesome" className="text-primary text-[14px]" />
                <span className="text-xs font-bold text-primary">{Math.round((p.confidence || 0) * 100)}% confidence</span>
              </div>
            </div>

            {/* Parent assembly context */}
            {p.parentAssembly && (
              <div className="mt-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <Msi icon="account_tree" className="text-amber-600 text-[18px] shrink-0" />
                <div>
                  <p className="text-[9px] font-bold text-amber-600 uppercase tracking-wider">Assembly Context</p>
                  <p className="text-sm font-semibold text-amber-900">{p.parentAssembly}</p>
                </div>
              </div>
            )}

            {/* Data warnings */}
            {p.dataWarnings && p.dataWarnings.length > 0 && (
              <div className="mt-3 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Msi icon="warning" className="text-orange-500 text-[15px]" />
                  <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest">Verify Before Ordering</span>
                </div>
                <ul className="space-y-0.5">
                  {p.dataWarnings.map((w, i) => (
                    <li key={i} className="text-[11px] text-orange-800 flex items-start gap-1.5">
                      <span className="mt-1 w-1 h-1 rounded-full bg-orange-400 shrink-0" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* 2-column content on desktop */}
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-5 md:grid md:grid-cols-[1.1fr_1fr] md:gap-6 space-y-4 md:space-y-0">

          {/* LEFT: Analysis + Specs */}
          <div className="space-y-4">
            {/* AI Analysis */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Msi icon="auto_awesome" className="text-primary text-[18px]" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">AI Analysis</span>
              </div>
              <p className="text-sm text-text-main leading-relaxed">{p.description}</p>
            </div>

            {/* Specs grid */}
            <div>
              <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-3">Specifications</h3>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-surface p-3.5 rounded-lg border border-border-light shadow-sm">
                  <p className="text-[10px] text-text-muted mb-1 font-medium">
                    {operationMode === 'civilian' ? 'Manufacturer' : 'CAGE Code'}
                  </p>
                  <p className="font-bold font-mono text-sm">{p.cageCode || 'N/A'}</p>
                </div>
                <div className="bg-surface p-3.5 rounded-lg border border-border-light shadow-sm">
                  <p className="text-[10px] text-text-muted mb-1 font-medium">Bin Location</p>
                  <p className="font-bold text-sm">{p.location || 'N/A'}</p>
                </div>
                <div className="bg-surface p-3.5 rounded-lg border border-border-light shadow-sm">
                  <p className="text-[10px] text-text-muted mb-1 font-medium">Unit Price</p>
                  <p className="font-bold text-sm">{p.unitPrice || 'N/A'}</p>
                </div>
                <div className="bg-surface p-3.5 rounded-lg border border-border-light shadow-sm">
                  <p className="text-[10px] text-text-muted mb-1 font-medium">Stock Status</p>
                  <p className={`font-bold text-sm ${inStock ? 'text-success' : 'text-error'}`}>{p.stockStatus || 'N/A'}</p>
                </div>
                {p.elmsNotes && (
                  <div className="col-span-2 bg-surface p-3.5 rounded-lg border border-border-light shadow-sm">
                    <p className="text-[10px] text-text-muted mb-1 font-medium">
                      {operationMode === 'civilian' ? 'AMM / Maintenance Notes' : 'ELMS / Maintenance Notes'}
                    </p>
                    <p className="font-semibold text-sm leading-relaxed">{p.elmsNotes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: IPB + Tech Orders + Alt Parts */}
          <div className="space-y-4">
            {/* IPB Reference */}
            {p.ipbReference?.toNumber && (
              <div className="bg-[#0a1628] text-white rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Msi icon="menu_book" className="text-primary text-[20px]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                    {operationMode === 'civilian' ? 'Illustrated Parts Catalog (IPC)' : 'Illustrated Parts Breakdown (IPB)'}
                  </span>
                </div>
                <p className="font-bold text-base leading-tight mb-1">{p.ipbReference.toNumber}</p>
                <p className="text-sm text-white/70 mb-3">{p.ipbReference.title}</p>
                <div className="flex gap-3">
                  <div className="flex-1 bg-white/10 rounded-lg px-3 py-2 text-center">
                    <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest mb-0.5">Figure</p>
                    <p className="font-black text-lg">{p.ipbReference.figure}</p>
                  </div>
                  <div className="flex-1 bg-primary/40 rounded-lg px-3 py-2 text-center border border-primary/50">
                    <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest mb-0.5">Item</p>
                    <p className="font-black text-lg">{p.ipbReference.item}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Technical Orders */}
            <div>
              <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-3">
                {operationMode === 'civilian' ? 'Manuals & Directives' : 'Technical Orders'}
              </h3>
              {p.technicalOrders?.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {p.technicalOrders.map((to, i) => (
                    <div key={i} className={`group flex items-center p-4 rounded-lg border shadow-sm cursor-pointer transition-colors ${to.verified ? 'bg-surface border-border-light hover:border-primary' : 'bg-orange-50 border-orange-200 hover:border-orange-400'}`}>
                      <div className={`p-2 rounded-lg shrink-0 ${to.type === 'warning' ? 'bg-amber-100 text-amber-600' : to.verified ? 'bg-primary/10 text-primary' : 'bg-orange-100 text-orange-600'}`}>
                        <Msi icon={to.type === 'warning' ? 'warning' : 'picture_as_pdf'} />
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-sm group-hover:text-primary transition-colors">{to.number}</p>
                          {to.verified
                            ? <span className="text-[8px] font-black px-1.5 py-0.5 bg-success/10 text-success border border-success/20 rounded uppercase tracking-wide">Verified</span>
                            : <span className="text-[8px] font-black px-1.5 py-0.5 bg-orange-100 text-orange-700 border border-orange-200 rounded uppercase tracking-wide">Verify Required</span>
                          }
                        </div>
                        <p className="text-xs text-text-muted mt-0.5 truncate">{to.title}</p>
                      </div>
                      <Msi icon="chevron_right" className="text-text-muted group-hover:text-primary transition-colors shrink-0" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-muted text-center py-4 bg-surface border border-border-light rounded-lg">
                  {operationMode === 'civilian' ? 'No manuals identified.' : 'No technical orders identified.'}
                </p>
              )}
            </div>

            {/* Alternative Parts */}
            <div>
              <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-3">Alternative Parts</h3>
              {p.alternativeParts?.length > 0 ? (
                <div className="flex flex-col gap-2.5">
                  {p.alternativeParts.map((ap, i) => (
                    <div key={i} className="bg-surface p-4 rounded-lg border border-border-light shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0 pr-2">
                          <h4 className="font-bold text-sm">{ap.name}</h4>
                          <p className="font-mono text-xs text-text-muted mt-0.5">{ap.nsn}</p>
                        </div>
                        <button onClick={() => addAltToCart(i)} className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors shrink-0">
                          <Msi icon="add_shopping_cart" className="text-[20px]" />
                        </button>
                      </div>
                      <div className="inline-flex items-center gap-1.5 py-1 px-2.5 bg-blue-50 rounded-lg">
                        <Msi icon="check_circle" className="text-[13px] text-primary" />
                        <span className="text-[10px] font-bold text-primary uppercase tracking-tight">{ap.compatibility}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-muted text-center py-4 bg-surface border border-border-light rounded-lg">No alternative parts identified.</p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom action bar */}
        <div className="max-w-5xl mx-auto px-4 md:px-8 pb-8">
          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-primary text-white py-3.5 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
            >
              <Msi icon="add_shopping_cart" className="text-[18px]" />
              Add to Cart
            </button>
            <button
              onClick={() => navigate('chat')}
              className="flex items-center gap-2 bg-surface border border-border-light text-primary py-3.5 px-5 rounded-xl font-bold text-sm shadow-lg hover:border-primary transition-colors"
            >
              <Msi icon="chat" className="text-[20px]" />
              <span className="hidden sm:inline">AI Advisor</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
