'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { useToast } from '@/hooks/useToast';
import { BottomNav } from '@/components/BottomNav';
import { Toast } from '@/components/Toast';
import { SettingsModal } from '@/components/SettingsModal';
import { DashboardScreen } from '@/components/screens/DashboardScreen';
import { ScannerScreen } from '@/components/screens/ScannerScreen';
import { PartDetailsScreen } from '@/components/screens/PartDetailsScreen';
import { EquipmentScreen } from '@/components/screens/EquipmentScreen';
import { CartScreen } from '@/components/screens/CartScreen';
import { NotesScreen } from '@/components/screens/NotesScreen';

export default function App() {
  const { screen, apiKey } = useAppStore();
  const { message, visible, toast } = useToast();
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (!apiKey) {
      const t = setTimeout(() => setSettingsOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, [apiKey]);

  const showNav = screen !== 'scanner';

  return (
    <div className="relative max-w-md mx-auto shadow-2xl overflow-hidden bg-bg-light flex flex-col" style={{ height: '100dvh' }}>
      <Toast message={message} visible={visible} />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSave={() => toast('Settings saved')}
      />

      <div className="flex-1 overflow-hidden relative">
        <div className={`absolute inset-0 ${screen === 'dashboard' ? 'block' : 'hidden'}`}>
          <DashboardScreen />
        </div>
        <div className={`absolute inset-0 ${screen === 'scanner' ? 'block' : 'hidden'}`}>
          <ScannerScreen onToast={toast} />
        </div>
        <div className={`absolute inset-0 ${screen === 'part-details' ? 'block' : 'hidden'}`}>
          <PartDetailsScreen onToast={toast} />
        </div>
        <div className={`absolute inset-0 ${screen === 'equipment' ? 'block' : 'hidden'}`}>
          <EquipmentScreen />
        </div>
        <div className={`absolute inset-0 ${screen === 'cart' ? 'block' : 'hidden'}`}>
          <CartScreen onToast={toast} />
        </div>
        <div className={`absolute inset-0 ${screen === 'notes' ? 'block' : 'hidden'}`}>
          <NotesScreen onToast={toast} />
        </div>
      </div>

      {showNav && <BottomNav />}
    </div>
  );
}
