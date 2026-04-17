'use client';

import { Msi } from './Msi';
import { useAppStore } from '@/store/appStore';
import type { Screen } from '@/types';

const NAV_ITEMS: { screen: Screen; icon: string; label: string }[] = [
  { screen: 'dashboard',  icon: 'dashboard',               label: 'Dashboard'   },
  { screen: 'scanner',    icon: 'barcode_scanner',          label: 'Scanner'     },
  { screen: 'equipment',  icon: 'precision_manufacturing',  label: 'Equipment'   },
  { screen: 'cart',       icon: 'inventory_2',              label: 'Supply Cart' },
  { screen: 'notes',      icon: 'history_edu',              label: 'The Line'    },
];

interface Props { onOpenSettings: () => void; }

export function SideNav({ onOpenSettings }: Props) {
  const { screen, navigate } = useAppStore();

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 bg-[#0a1628] text-white border-r border-white/5">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/10 shrink-0">
        <div className="w-8 h-8 bg-primary rounded flex items-center justify-center shrink-0">
          <Msi icon="flight_takeoff" className="text-white text-[18px]" />
        </div>
        <span className="text-sm font-black uppercase tracking-[0.15em]" style={{ fontFamily: 'var(--font-headline)' }}>
          AGE Scout
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 flex flex-col gap-0.5 overflow-y-auto">
        <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] px-3 mb-2">Navigation</p>
        {NAV_ITEMS.map(item => {
          const active = screen === item.screen || (screen === 'part-details' && item.screen === 'equipment');
          return (
            <button
              key={item.screen}
              onClick={() => navigate(item.screen)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                active
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-white/55 hover:bg-white/8 hover:text-white'
              }`}
            >
              <Msi icon={item.icon} fill={active} className="text-[20px] shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-5 pt-3 border-t border-white/10 shrink-0">
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-white/55 hover:bg-white/8 hover:text-white transition-all w-full"
        >
          <Msi icon="settings" className="text-[20px] shrink-0" />
          Settings
        </button>
      </div>
    </aside>
  );
}
