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
  Scale,
  Target,
  Award,
  LogOut,
  Zap,
  Lock,
  Home,
} from 'lucide-react';
import { soundFx } from '../audio/soundFx';

export type AppTab = 'home' | 'battle' | 'gunsmith' | 'skilltree' | 'tycoon' | 'multiplayer' | 'leaderboard' | 'clan';

interface TopBarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  budget: number;
  reputation?: number;
  skillPoints?: number;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  onRequestCommander: () => void;
  isCommanderThinking: boolean;
  isMobileMode: boolean;
  setIsMobileMode: (mobile: boolean) => void;
  isMobileHardware?: boolean;
  playerName: string;
  clanTag: string;
  onOpenHome?: () => void;
  onOpenProfileModal: () => void;
  onOpenLegalModal?: () => void;
  onOpenDailyMissions?: () => void;
  onLogout: () => void;
  unclaimedMissionsCount?: number;
  completedMissionsCount?: number;
  totalMissionsCount?: number;
  navigationDisabled?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  budget,
  reputation = 0,
  skillPoints = 0,
  isMuted,
  setIsMuted,
  isMobileMode,
  setIsMobileMode,
  isMobileHardware = false,
  playerName,
  clanTag,
  onOpenHome,
  onOpenProfileModal,
  onOpenLegalModal,
  onOpenDailyMissions,
  onLogout,
  unclaimedMissionsCount = 0,
  completedMissionsCount = 0,
  totalMissionsCount = 4,
  navigationDisabled = false,
}) => {
  const toggleMute = () => {
    const next = soundFx.toggleMute();
    setIsMuted(next);
  };

  const navItems: {
    id: AppTab;
    label: string;
    mobileLabel: string;
    icon: React.FC<{ className?: string }>;
    badge?: number;
  }[] = [
    {
      id: 'home',
      label: 'Hauptmenü',
      mobileLabel: 'Menü',
      icon: Home,
    },
    {
      id: 'battle',
      label: isMobileMode || isMobileHardware ? 'Taktische Zentrale' : '3D Battle Royale',
      mobileLabel: 'Zentrale',
      icon: Map,
    },
    {
      id: 'gunsmith',
      label: 'Waffenschmiede',
      mobileLabel: 'Waffen',
      icon: Wrench,
    },
    {
      id: 'skilltree',
      label: 'Skilltree',
      mobileLabel: 'Skills',
      icon: Zap,
      badge: skillPoints > 0 ? skillPoints : undefined,
    },
    {
      id: 'clan',
      label: 'Mein Clan',
      mobileLabel: 'Clan',
      icon: Users,
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
      {/* 3-Zone Top Bar Contract - Sticky at Top */}
      <header className="sticky top-0 flex items-center justify-between gap-3 sm:gap-5 px-3 sm:px-6 py-2.5 sm:py-3 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 z-30 shrink-0">
        {/* Zone 1: Wordmark */}
        <button
          type="button"
          onClick={() => (onOpenHome ? onOpenHome() : setActiveTab('home'))}
          aria-label="Hauptmenü öffnen"
          className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
        >
          <span className="text-amber-400 font-mono">61267</span>
          <span className="hidden sm:inline">NEU-ANSPACH</span>
          <span>ROYALE</span>
        </button>
        {/* Zone 2: Desktop navigation links */}
        <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-slate-400">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (!navigationDisabled) setActiveTab(item.id);
                }}
                aria-disabled={navigationDisabled}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 border-b-2 flex items-center gap-1.5 ${
                  isActive
                    ? 'text-white border-amber-400 font-semibold'
                    : 'text-slate-400 border-transparent hover:text-white'
                }`}
              >
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-mono text-[10px] font-black">
                    {item.badge} SP
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Operator & Mode Action (Responsive layout) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Budget Pill */}
          <span className="text-xs font-mono text-amber-400 font-bold tabular-nums whitespace-nowrap shrink-0 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
            {budget.toLocaleString('de-DE')} <span className="text-[10px] text-amber-400/80">NAT</span>
          </span>

          {/* Daily Missions Trigger Button */}
          {onOpenDailyMissions && (
            <button
              type="button"
              onClick={onOpenDailyMissions}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer border ${
                unclaimedMissionsCount > 0
                  ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md animate-pulse'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800 hover:border-slate-700'
              }`}
              title="Tagesbefehle & Operator-Ruf öffnen"
            >
              <Target
                className={`w-3.5 h-3.5 ${
                  unclaimedMissionsCount > 0 ? 'text-slate-950 stroke-[3]' : 'text-amber-400'
                }`}
              />
              <span className="hidden sm:inline">Tagesbefehle</span>
              <span
                className={`px-1 sm:px-1.5 py-0.2 rounded text-[10px] font-black ${
                  unclaimedMissionsCount > 0
                    ? 'bg-slate-950 text-amber-400'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {unclaimedMissionsCount > 0
                  ? `!${unclaimedMissionsCount}`
                  : `${completedMissionsCount}/${totalMissionsCount}`}
              </span>
            </button>
          )}

          {/* Reputation Tag (Desktop only) */}
          {onOpenDailyMissions && (
            <div
              onClick={onOpenDailyMissions}
              className="hidden xl:flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-950/40 border border-purple-500/30 text-purple-300 text-xs font-mono font-bold cursor-pointer hover:border-purple-400/50 transition-colors"
              title="Operator-Ansehen (Ruf-Punkte)"
            >
              <Award className="w-3.5 h-3.5 text-purple-400" />
              <span className="tabular-nums">{reputation} Ruf</span>
            </div>
          )}

          {/* Mode Toggle: Strictly locked on mobile hardware (including landscape!) */}
          {isMobileHardware ? (
            <div
              title="3D Battle Royale ist auf Mobilgeräten (auch im Querformat) deaktiviert"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap shrink-0 bg-red-950/40 text-red-300 border border-red-500/30"
            >
              <Lock className="w-3.5 h-3.5 text-red-400" />
              <span>Handy · Kein 3D-BR</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsMobileMode(!isMobileMode)}
              title="Zwischen 3D-Battle-Royale (PC) und Taktischer Zentrale wechseln"
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                isMobileMode
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              {isMobileMode ? (
                <>
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Zentrale-Ansicht</span>
                </>
              ) : (
                <>
                  <Monitor className="w-3.5 h-3.5 text-amber-400" />
                  <span>PC-Modus (3D)</span>
                </>
              )}
            </button>
          )}

          {/* Sound Mute Button (Desktop) */}
          <button
            type="button"
            onClick={toggleMute}
            className="hidden sm:flex p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer shrink-0"
            title={isMuted ? 'Ton aktivieren' : 'Stummschalten'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Legal / Disclaimer Button (Desktop) */}
          {onOpenLegalModal && (
            <button
              type="button"
              onClick={onOpenLegalModal}
              className="hidden sm:flex p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border border-slate-800 transition-colors cursor-pointer shrink-0"
              title="Rechtliches, Datenschutz & Disclaimer"
            >
              <Scale className="w-4 h-4" />
            </button>
          )}

          {/* Profile / Callsign Button */}
          <button
            type="button"
            onClick={onOpenProfileModal}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs font-mono font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Benutzername & Clan-Tag ändern"
          >
            <UserCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate max-w-[85px] sm:max-w-[130px]">
              [{clanTag || '61267'}] {playerName}
            </span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer text-xs font-mono font-bold"
            title="Vom Konto abmelden"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden xl:inline">Abmelden</span>
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
              onClick={() => {
                if (!navigationDisabled) setActiveTab(item.id);
              }}
              aria-disabled={navigationDisabled}
              className={`relative flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-[10px] font-mono transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                isActive ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.mobileLabel}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute top-1.5 right-2 px-1 py-0.1 rounded-full bg-amber-500 text-slate-950 font-mono text-[8px] font-black">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};
