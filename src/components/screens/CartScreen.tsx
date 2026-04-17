'use client';

import { Msi } from '../Msi';
import { useAppStore } from '@/store/appStore';

interface Props { onToast: (msg: string) => void; }

export function CartScreen({ onToast }: Props) {
  const { cart, changeQty, clearCart } = useAppStore();
  const total = cart.reduce((s, i) => s + i.qty, 0);

  function transmit(loc: string) {
    if (!loc) { onToast('Select a flightline spot first'); return; }
    if (cart.length === 0) { onToast('Cart is empty'); return; }
    onToast(`Cart transmitted to Prod Shop · Spot ${loc}`);
    clearCart();
  }

  return (
    <div className="flex flex-col h-full">
      <header className="shrink-0 bg-surface border-b border-border-light z-20 flex items-center px-4 md:px-8 h-14">
        <h1 className="text-base font-bold uppercase tracking-tight">Supply Cart</h1>
        {total > 0 && (
          <span className="ml-3 text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
            {total} items
          </span>
        )}
      </header>

      <div className="flex-1 overflow-y-auto hide-scroll md:grid md:grid-cols-[1fr_360px] md:divide-x md:divide-border-light">
        {/* Cart items */}
        <div className="overflow-y-auto hide-scroll">
          {/* Location selector */}
          <section className="p-4 md:p-6 bg-surface border-b border-border-light">
            <label className="block">
              <span className="block text-[10px] font-bold uppercase tracking-wider mb-2 text-text-muted">Flightline Location / Spot</span>
              <div className="relative max-w-sm">
                <select
                  id="location-select"
                  className="block w-full pl-4 pr-10 py-3 text-sm border border-border-light rounded-lg bg-surface text-text-main focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                  defaultValue=""
                >
                  <option value="">Select Spot...</option>
                  <option value="A-1">Spot A-1 (North Ramp)</option>
                  <option value="B-4">Spot B-4 (Hangar 2)</option>
                  <option value="C-9">Spot C-9 (South Pad)</option>
                </select>
                <Msi icon="expand_more" className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none text-[20px]" />
              </div>
            </label>
          </section>

          <section className="p-4 md:p-6">
            {cart.length === 0 ? (
              <div className="text-center py-16">
                <Msi icon="shopping_cart" className="text-5xl text-text-muted block mb-3" />
                <p className="text-sm font-semibold text-text-muted">Cart is empty</p>
                <p className="text-xs text-text-muted mt-1">Add parts from the scanner.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {cart.map(item => {
                  const inStock = item.stockStatus?.toLowerCase().includes('in stock');
                  return (
                    <div key={item.id} className="bg-surface border border-border-light rounded-xl shadow-sm overflow-hidden">
                      <div className="flex items-center p-4 gap-3">
                        <div className="w-11 h-11 bg-bg-light rounded-lg flex items-center justify-center text-primary shrink-0">
                          <Msi icon={item.icon || 'settings'} className="text-[22px]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <h3 className="text-sm font-bold truncate">{item.name}</h3>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 border rounded-full uppercase ${inStock ? 'bg-success/10 text-success border-success/20' : 'bg-error/10 text-error border-error/20'}`}>
                              {inStock ? 'In Stock' : 'OOS'}
                            </span>
                          </div>
                          <p className="text-[10px] font-semibold text-text-muted font-mono">NSN: {item.nsn || 'N/A'}</p>
                        </div>
                        <div className="flex items-center gap-0.5 bg-bg-light rounded-lg border border-border-light p-0.5 shrink-0">
                          <button onClick={() => changeQty(item.id, -1)} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-200 transition-colors">
                            <Msi icon="remove" className="text-[18px]" />
                          </button>
                          <span className="w-7 text-center text-sm font-bold">{item.qty}</span>
                          <button onClick={() => changeQty(item.id, 1)} className="w-8 h-8 flex items-center justify-center rounded-md text-primary hover:bg-primary/10 transition-colors">
                            <Msi icon="add" className="text-[18px]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Order summary sidebar (desktop) / footer (mobile) */}
        <div className="hidden md:flex flex-col p-6 bg-surface">
          <h2 className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-4">Order Summary</h2>
          <div className="flex-1 space-y-3">
            {cart.length === 0 ? (
              <p className="text-sm text-text-muted">No items yet.</p>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="truncate mr-2 text-text-main">{item.name}</span>
                  <span className="font-bold shrink-0">×{item.qty}</span>
                </div>
              ))
            )}
          </div>
          <div className="border-t border-border-light pt-4 mt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Total Items</span>
              <span className="text-2xl font-black">{total}</span>
            </div>
            <button
              onClick={() => {
                const loc = (document.getElementById('location-select') as HTMLSelectElement)?.value || '';
                transmit(loc);
              }}
              className="w-full h-14 bg-primary text-white font-bold text-sm uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-lg"
            >
              Transmit to Prod Shop
              <Msi icon="send" className="text-[20px]" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile footer */}
      <footer className="md:hidden bg-surface border-t border-border-light px-4 pt-3 pb-20 shadow-lg">
        <div className="flex justify-between items-center mb-3 px-1">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Total Items</span>
          <span className="text-lg font-bold">{total}</span>
        </div>
        <button
          onClick={() => {
            const loc = (document.getElementById('location-select') as HTMLSelectElement)?.value || '';
            transmit(loc);
          }}
          className="w-full h-14 bg-primary text-white font-bold text-sm uppercase tracking-widest rounded-xl flex items-center justify-center gap-2"
        >
          Transmit to Prod Shop
          <Msi icon="send" className="text-[20px]" />
        </button>
      </footer>
    </div>
  );
}
