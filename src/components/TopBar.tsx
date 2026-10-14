import React from 'react';
import {
  Volume2,
  VolumeX,
  Smartphone,
  Monitor,
  Map,
  Building2,
  Users,
  Trophy,
  Wrench,
  UserCheck,
} from 'lucide-react';
import { soundFx } from '../audio/soundFx';

export type AppTab = 'battle' | 'gunsmith' | 'tycoon' | 'multiplayer' | 'leaderboard';

interface TopBarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  budget: number;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  onRequestCommander: () => void;
  isCommanderThinking: boolean;
  isMobileMode: boolean;
  setIsMobileMode: (mobile: boolean) => void;
  playerName: string;
  clanTag: string;
  onOpenProfileModal: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  budget,
  isMuted,
  setIsMuted,
  isMobileMode,
  setIsMobileMode,
  playerName,
  clanTag,
  onOpenProfileModal,
}) => {
  const toggleMute = () => {
    const next = soundFx.toggleMute();
    setIsMuted(next);
  };

  const navItems: { id: AppTab; label: string; mobileLabel: string; icon: React.FC<{ className?: string }> }[] = [
    {
      id: 'battle',
      label: isMobileMode ? '3D Stadterkundung' : '3D Battle Royale',
      mobileLabel: '3D-Stadt',
      icon: Map,
    },
    {
      id: 'gunsmith',
      label: 'Waffenschmiede',
      mobileLabel: 'Waffen',
      icon: Wrench,
    },
    {
      id: 'tycoon',
      label: 'Maps & Tycoon',
      mobileLabel: 'Maps',
      icon: Building2,
    },
    {
      id: 'leaderboard',
      label: 'Live-Leaderboard',
      mobileLabel: 'Rangliste',
      icon: Trophy,
    },
    {
      id: 'multiplayer',
      label: 'Freunde-Lobby',
      mobileLabel: 'Freunde',
      icon: Users,
    },
  ];

  return (
    <>
      {/* 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-4 sm:px-6 py-3 bg-slate-950 border-b border-slate-800 z-30 shrink-0">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => setActiveTab('battle')}
          className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 cursor-pointer"
        >
          61267 NEU-ANSPACH ROYALE
        </button>

        {/* Zone 2: 5 clean single-line text navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-400">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 border-b-2 ${
                  isActive
                    ? 'text-white border-amber-400 font-semibold'
                    : 'text-slate-400 border-transparent hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Operator & Mode Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="hidden sm:inline-block text-xs font-mono text-amber-400 font-bold tabular-nums whitespace-nowrap shrink-0">
            {budget.toLocaleString('de-DE')} NAT
          </span>

          <button
            type="button"
            onClick={() => setIsMobileMode(!isMobileMode)}
            title="Zwischen PC Battle Royale und Handy-Modus (ohne Battle Royale) wechseln"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
              isMobileMode
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            {isMobileMode ? (
              <>
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline">Handy-Modus</span>
              </>
            ) : (
              <>
                <Monitor className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">PC-Modus</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={toggleMute}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer shrink-0"
            title={isMuted ? 'Ton aktivieren' : 'Stummschalten'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onOpenProfileModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Benutzername & Clan-Tag ändern"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span className="truncate max-w-[140px]">
              [{clanTag || '61267'}] {playerName}
            </span>
          </button>
        </div>
      </header>

      {/* Mobile Bottom Tab Bar (for screens < lg) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-14 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 flex items-center justify-around px-1 z-40">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-[10px] font-mono transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                isActive ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.mobileLabel}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
