import { Msi } from './Msi';
import { useAppStore } from '@/store/appStore';
import type { Screen } from '@/types';

const NAV_ITEMS: { screen: Screen; icon: string; label: string }[] = [
  { screen: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
  { screen: 'scanner', icon: 'barcode_scanner', label: 'Scanner' },
  { screen: 'equipment', icon: 'precision_manufacturing', label: 'Equipment' },
  { screen: 'cart', icon: 'inventory_2', label: 'Cart' },
  { screen: 'notes', icon: 'history_edu', label: 'Notes' },
];

export function BottomNav() {
  const { screen, navigate } = useAppStore();

  return (
    <nav
      className="shrink-0 flex justify-around items-center px-2 py-2 bg-surface border-t border-border-light z-50"
      style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
    >
      {NAV_ITEMS.map(item => {
        const active = screen === item.screen;
        return (
          <button
            key={item.screen}
            onClick={() => navigate(item.screen)}
            className={`flex flex-col items-center justify-center px-3 py-1 transition-colors ${active ? 'text-primary' : 'text-text-muted'}`}
          >
            <Msi icon={item.icon} fill={active} className="text-[22px]" />
            <span className="text-[8px] font-bold uppercase tracking-widest mt-0.5">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
