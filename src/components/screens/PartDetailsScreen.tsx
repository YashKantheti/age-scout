'use client';

import { Msi } from '../Msi';
import { useAppStore } from '@/store/appStore';

interface Props {
  onToast: (msg: string) => void;
}

export function PartDetailsScreen({ onToast }: Props) {
  const { navigate, prevScreen, currentPart, addToCart } = useAppStore();

  if (!currentPart) return null;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const p = currentPart!

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
    <div className="flex flex-col h-full relative">
      <header className="shrink-0 bg-surface border-b border-border-light z-40 flex items-center px-4 h-14 shadow-sm">
        <button onClick={goBack} className="p-2 -ml-2 text-text-main hover:bg-bg-light rounded transition-colors">
          <Msi icon="arrow_back" />
        </button>
        <h1 className="ml-2 text-base font-bold uppercase tracking-tight">Part Details</h1>
      </header>

      <main className="flex-1 overflow-y-auto hide-scroll pb-28">
        {/* Title block */}
        <section className="bg-surface p-5 mb-2 border-b border-border-light">
          <h2 className="text-2xl font-extrabold leading-tight mb-3 tracking-tight">{p.partName}</h2>
          <div className="flex flex-wrap gap-2.5 items-center">
            <div className="bg-gray-100 px-3 py-1.5 rounded border border-gray-200 flex items-center gap-2">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">NSN</span>
              <span className="font-mono text-sm font-medium">{p.nsn || 'N/A'}</span>
            </div>
            <div className={`px-3 py-1.5 rounded border flex items-center gap-2 ${inStock ? 'bg-green-50 border-success/20' : 'bg-red-50 border-error/20'}`}>
              <span className={`w-2 h-2 rounded-full animate-pulse ${inStock ? 'bg-success' : 'bg-error'}`} />
              <span className={`text-xs font-bold uppercase tracking-widest ${inStock ? 'text-success' : 'text-error'}`}>{p.stockStatus || 'Unknown'}</span>
            </div>
          </div>
        </section>

        {/* AI Summary */}
        <section className="p-4 mb-2">
          <div className="bg-primary/5 border border-primary/20 rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <Msi icon="auto_awesome" className="text-primary text-[18px]" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">AI Analysis</span>
            </div>
            <p className="text-sm text-text-main leading-relaxed">{p.description}</p>
          </div>
        </section>

        {/* Specs */}
        <section className="p-4 mb-2">
          <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-3 px-1">Specifications</h3>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-surface p-3.5 rounded border border-border-light shadow-sm">
              <p className="text-[10px] text-text-muted mb-1 font-medium">CAGE Code</p>
              <p className="font-bold font-mono text-sm">{p.cageCode || 'N/A'}</p>
            </div>
            <div className="bg-surface p-3.5 rounded border border-border-light shadow-sm">
              <p className="text-[10px] text-text-muted mb-1 font-medium">Part Number</p>
              <p className="font-bold font-mono text-sm">{p.partNumber || 'N/A'}</p>
            </div>
            <div className="bg-surface p-3.5 rounded border border-border-light shadow-sm">
              <p className="text-[10px] text-text-muted mb-1 font-medium">Bin Location</p>
              <p className="font-bold text-sm">{p.location || 'N/A'}</p>
            </div>
            <div className="bg-surface p-3.5 rounded border border-border-light shadow-sm">
              <p className="text-[10px] text-text-muted mb-1 font-medium">Unit Price</p>
              <p className="font-bold text-sm">{p.unitPrice || 'N/A'}</p>
            </div>
            {p.elmsNotes && (
              <div className="col-span-2 bg-surface p-3.5 rounded border border-border-light shadow-sm">
                <p className="text-[10px] text-text-muted mb-1 font-medium">ELMS / Maintenance Notes</p>
                <p className="font-semibold text-sm leading-relaxed">{p.elmsNotes}</p>
              </div>
            )}
          </div>
        </section>

        {/* Alt Parts */}
        <section className="p-4 mb-2">
          <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-3 px-1">Alternative Parts</h3>
          {p.alternativeParts?.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {p.alternativeParts.map((ap, i) => (
                <div key={i} className="bg-surface p-4 rounded border border-border-light shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0 pr-2">
                      <h4 className="font-bold text-sm">{ap.name}</h4>
                      <p className="font-mono text-xs text-text-muted mt-0.5">{ap.nsn}</p>
                    </div>
                    <button onClick={() => addAltToCart(i)} className="p-2 text-primary hover:bg-primary/10 rounded transition-colors shrink-0">
                      <Msi icon="add_shopping_cart" className="text-[20px]" />
                    </button>
                  </div>
                  <div className="inline-flex items-center gap-1.5 py-1 px-2.5 bg-blue-50 rounded">
                    <Msi icon="check_circle" className="text-[13px] text-primary" />
                    <span className="text-[10px] font-bold text-primary uppercase tracking-tight">{ap.compatibility}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-muted text-center py-2">No alternative parts identified.</p>
          )}
        </section>

        {/* Tech Orders */}
        <section className="p-4 mb-4">
          <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-3 px-1">Technical Orders</h3>
          {p.technicalOrders?.length > 0 ? (
            <div className="flex flex-col gap-2">
              {p.technicalOrders.map((to, i) => (
                <div key={i} className="group flex items-center bg-surface p-4 rounded border border-border-light shadow-sm hover:border-primary transition-colors cursor-pointer">
                  <div className="bg-primary/10 p-2 rounded text-primary shrink-0">
                    <Msi icon={to.type === 'warning' ? 'warning' : 'picture_as_pdf'} />
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="font-bold text-sm group-hover:text-primary transition-colors">{to.number}</p>
                    <p className="text-xs text-text-muted mt-0.5 truncate">{to.title}</p>
                  </div>
                  <Msi icon="chevron_right" className="text-text-muted group-hover:text-primary transition-colors" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-muted text-center py-2">No technical orders identified.</p>
          )}
        </section>
      </main>

      {/* Add to cart bar */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 z-40 bg-gradient-to-t from-bg-light to-transparent pt-6">
        <button
          onClick={handleAddToCart}
          className="w-full bg-primary text-white py-3.5 rounded font-bold text-sm shadow-lg flex items-center justify-center gap-2"
        >
          <Msi icon="add_shopping_cart" className="text-[18px]" />
          Add to Supply Cart
        </button>
      </div>
    </div>
  );
}
