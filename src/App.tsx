import { useState } from 'react';
import DashboardView from './components/DashboardView';
import LogView from './components/LogView';
import SettingsView from './components/SettingsView';
import ShareView from './components/ShareView';
import { useAppState } from './lib/store';

const TABS = [
  { id: 'log', label: '기록' },
  { id: 'dash', label: '대시보드' },
  { id: 'share', label: '자랑' },
  { id: 'settings', label: '설정' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function App() {
  const store = useAppState();
  const [tab, setTab] = useState<TabId>('log');

  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col px-4">
      <header className="flex items-center justify-between py-5">
        <h1 className="text-base font-bold tracking-tight">
          KMLE <span className="text-violet-400">자랑</span>
        </h1>
        <p className="text-[11px] text-white/30">기록은 이 기기에만 저장됩니다</p>
      </header>

      <nav className="sticky top-0 z-10 -mx-4 mb-4 border-b border-white/10 bg-[#0b0b10]/85 px-4 backdrop-blur">
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`relative px-3 py-2.5 text-sm font-medium transition ${
                tab === t.id ? 'text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {t.label}
              {tab === t.id ? <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-violet-400" /> : null}
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-1">
        {tab === 'log' ? <LogView store={store} /> : null}
        {tab === 'dash' ? <DashboardView store={store} /> : null}
        {tab === 'share' ? <ShareView store={store} /> : null}
        {tab === 'settings' ? <SettingsView store={store} /> : null}
      </main>
    </div>
  );
}
