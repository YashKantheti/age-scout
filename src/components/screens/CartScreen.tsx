'use client';

import { Msi } from '../Msi';
import { useAppStore } from '@/store/appStore';

interface Props {
  onToast: (msg: string) => void;
}

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
    <div className="flex flex-col h-full relative">
      <header className="shrink-0 bg-surface border-b border-border-light z-20 flex items-center px-4 h-14">
        <h1 className="text-base font-bold uppercase tracking-tight">Supply Cart</h1>
      </header>

      <main className="flex-1 overflow-y-auto hide-scroll pb-36">
        {/* Location selector */}
        <section className="p-4 bg-surface border-b border-border-light">
          <label className="block">
            <span className="block text-[10px] font-bold uppercase tracking-wider mb-2">Flightline Location / Spot</span>
            <div className="relative">
              <select
                id="location-select"
                className="block w-full pl-4 pr-10 py-3 text-sm border border-border-light rounded bg-surface text-text-main focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
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

        <section className="p-4">
          {cart.length === 0 ? (
            <div className="text-center py-10">
              <Msi icon="shopping_cart" className="text-4xl text-text-muted block mb-2" />
              <p className="text-xs text-text-muted">Cart is empty. Add parts from the scanner.</p>
            </div>
          ) : (
            cart.map(item => {
              const inStock = item.stockStatus?.toLowerCase().includes('in stock');
              return (
                <div key={item.id} className="bg-surface border border-border-light rounded shadow-sm overflow-hidden mb-2.5">
                  <div className="flex items-center p-3.5 gap-3">
                    <div className="w-11 h-11 bg-bg-light rounded flex items-center justify-center text-primary shrink-0">
                      <Msi icon={item.icon || 'settings'} className="text-[22px]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h3 className="text-sm font-bold truncate max-w-[160px]">{item.name}</h3>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 border rounded uppercase tracking-tighter ${inStock ? 'bg-success/10 text-success border-success/20' : 'bg-error/10 text-error border-error/20'}`}>
                          {inStock ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </div>
                      <p className="text-[10px] font-semibold text-text-muted font-mono">NSN: {item.nsn || 'N/A'}</p>
                    </div>
                    <div className="flex items-center gap-0.5 bg-bg-light rounded border border-border-light p-0.5 shrink-0">
                      <button onClick={() => changeQty(item.id, -1)} className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 transition-colors">
                        <Msi icon="remove" className="text-[18px]" />
                      </button>
                      <span className="w-7 text-center text-sm font-bold">{item.qty}</span>
                      <button onClick={() => changeQty(item.id, 1)} className="w-8 h-8 flex items-center justify-center rounded text-primary hover:bg-primary/10 transition-colors">
                        <Msi icon="add" className="text-[18px]" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </main>

      <footer className="absolute bottom-16 left-0 right-0 bg-surface border-t border-border-light px-4 pt-3 pb-4 z-30 shadow-lg">
        <div className="flex justify-between items-center mb-3 px-1">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Total Items</span>
          <span className="text-lg font-bold">{total}</span>
        </div>
        <button
          onClick={() => {
            const loc = (document.getElementById('location-select') as HTMLSelectElement)?.value || '';
            transmit(loc);
          }}
          className="w-full h-14 bg-primary text-white font-bold text-sm uppercase tracking-widest rounded flex items-center justify-center gap-2"
        >
          Transmit to Prod Shop
          <Msi icon="send" className="text-[20px]" />
        </button>
      </footer>
    </div>
  );
}
