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
  Coins,
  Radio,
} from 'lucide-react';
import { soundFx } from '../audio/soundFx';

export type AppTab =
  | 'home'
  | 'battle'
  | 'gunsmith'
  | 'skilltree'
  | 'tycoon'
  | 'multiplayer'
  | 'leaderboard'
  | 'clan';

export interface TopBarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  budget: number;
  reputation?: number;
  skillPoints?: number;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  onRequestCommander?: () => void;
  isCommanderThinking?: boolean;
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
  onRequestCommander,
  isCommanderThinking = false,
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
    shortLabel: string;
    mobileLabel: string;
    icon: React.FC<{ className?: string }>;
    badge?: number;
  }[] = [
    {
      id: 'home',
      label: 'Hauptmenü',
      shortLabel: 'Menü',
      mobileLabel: 'Menü',
      icon: Home,
    },
    {
      id: 'battle',
      label: isMobileMode || isMobileHardware ? 'Taktische Zentrale' : '3D Battle Royale',
      shortLabel: 'Einsatz',
      mobileLabel: 'Zentrale',
      icon: Map,
    },
    {
      id: 'gunsmith',
      label: 'Waffenschmiede',
      shortLabel: 'Waffen',
      mobileLabel: 'Waffen',
      icon: Wrench,
    },
    {
      id: 'skilltree',
      label: 'Skilltree',
      shortLabel: 'Skills',
      mobileLabel: 'Skills',
      icon: Zap,
      badge: skillPoints > 0 ? skillPoints : undefined,
    },
    {
      id: 'clan',
      label: 'Mein Clan',
      shortLabel: 'Clan',
      mobileLabel: 'Clan',
      icon: Users,
    },
    {
      id: 'tycoon',
      label: 'Maps & Tycoon',
      shortLabel: 'Tycoon',
      mobileLabel: 'Maps',
      icon: Building2,
    },
    {
      id: 'leaderboard',
      label: 'Live-Leaderboard',
      shortLabel: 'Rangliste',
      mobileLabel: 'Rangliste',
      icon: Trophy,
    },
    {
      id: 'multiplayer',
      label: 'Freunde-Lobby',
      shortLabel: 'Lobby',
      mobileLabel: 'Freunde',
      icon: Users,
    },
  ];

  return (
    <>
      {/* Ultra-Sleek Streamlined Military HUD Header (Compact 48px Height) */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 px-3 sm:px-4 py-1.5 bg-slate-950/90 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.6)] shrink-0 select-none h-11 sm:h-12">
        {/* Subtle Hairline Accent Glow */}
        <div className="tactical-top-accent opacity-75" aria-hidden="true" />

        {/* Zone 1: Brand Wordmark (Compact) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              soundFx.playUiClick();
              if (onOpenHome) onOpenHome();
              else setActiveTab('home');
            }}
            aria-label="Hauptmenü öffnen - Neu-Anspach Royale"
            title="Hauptmenü öffnen"
            className="group flex items-center gap-2 shrink-0 text-left cursor-pointer transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/50 rounded-md p-0.5 hover:bg-white/[0.04]"
          >
            {/* Postal Code Badge */}
            <div className="hud-chamfer-sm border border-amber-500/40 bg-amber-500/15 px-1.5 py-0.5 font-mono text-[10px] font-black text-amber-400 tracking-wider">
              61267
            </div>

            {/* Brand Title */}
            <div className="flex items-center gap-1 font-black tracking-wider uppercase text-xs sm:text-sm leading-none">
              <span className="metallic-text group-hover:text-white transition-colors">
                NEU-ANSPACH
              </span>
              <span className="text-amber-400 text-glow-amber">ROYALE</span>
              <span className="hidden xl:inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1 shadow-[0_0_6px_rgba(16,185,129,0.9)]" title="System Online" />
            </div>
          </button>
        </div>

        {/* Zone 2: Streamlined Center Navigation Tabs (Concise & Compact) */}
        <nav
          aria-label="Hauptnavigation"
          className="hidden lg:flex items-center gap-0.5 xl:gap-1 text-xs font-medium"
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  soundFx.playUiClick();
                  if (!navigationDisabled) setActiveTab(item.id);
                }}
                aria-label={item.label}
                title={item.label}
                aria-disabled={navigationDisabled}
                aria-current={isActive ? 'page' : undefined}
                className={`relative px-2 py-1 rounded-md transition-all duration-150 active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1 font-mono tracking-tight text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/50 border ${
                  isActive
                    ? 'text-amber-300 font-bold bg-amber-500/15 border-amber-400/50 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 hover:border-white/10 border-transparent'
                }`}
              >
                <span>{item.shortLabel}</span>
                {isActive && (
                  <span
                    className="absolute -bottom-[7px] left-1.5 right-1.5 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_6px_rgba(245,158,11,0.9)] rounded-full"
                    aria-hidden="true"
                  />
                )}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-1 py-0.2 rounded bg-amber-500 text-slate-950 font-mono text-[9px] font-black shadow-[0_0_6px_rgba(245,158,11,0.6)]">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Consolidated Telemetry & Streamlined Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Unified Economy Capsule (NAT + Ruf merged into 1 sleek pill) */}
          <div
            className="flex items-center gap-2 px-2 py-1 rounded-md bg-slate-900/90 border border-white/10 font-mono text-xs font-bold shadow-elevation-low whitespace-nowrap shrink-0"
            title={`Guthaben: ${budget.toLocaleString('de-DE')} NAT · Ansehen: ${reputation} Ruf`}
          >
            {/* NAT Currency */}
            <div className="flex items-center gap-1 text-amber-400">
              <Coins
                className="w-3.5 h-3.5 text-amber-400 shrink-0 drop-shadow-[0_0_4px_rgba(245,158,11,0.7)]"
                aria-hidden="true"
              />
              <span className="tabular-nums tracking-wide">{budget.toLocaleString('de-DE')}</span>
              <span className="text-[9px] font-black text-amber-300/80">NAT</span>
            </div>

            {/* Subtle Divider */}
            {onOpenDailyMissions && (
              <>
                <div className="h-3 w-px bg-white/15" aria-hidden="true" />
                {/* Reputation (Ruf) */}
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playUiClick();
                    onOpenDailyMissions();
                  }}
                  aria-label={`Operator-Ansehen: ${reputation} Ruf`}
                  title="Operator-Ansehen (Ruf) - Klicke für Details"
                  className="hidden sm:flex items-center gap-1 text-purple-300 hover:text-purple-200 transition-colors cursor-pointer"
                >
                  <Award
                    className="w-3.5 h-3.5 text-purple-400 shrink-0 drop-shadow-[0_0_4px_rgba(168,85,247,0.5)]"
                    aria-hidden="true"
                  />
                  <span className="tabular-nums">{reputation}</span>
                  <span className="text-[9px] font-black text-purple-400/80">Ruf</span>
                </button>
              </>
            )}
          </div>

          {/* Compact Daily Missions Pill */}
          {onOpenDailyMissions && (
            <button
              type="button"
              onClick={() => {
                soundFx.playUiClick();
                onOpenDailyMissions();
              }}
              aria-label="Tagesbefehle und Operator-Ruf öffnen"
              title="Tagesbefehle & Operator-Ruf öffnen"
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono font-bold transition-all duration-150 active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/50 ${
                unclaimedMissionsCount > 0
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-400/60 shadow-[0_0_10px_rgba(245,158,11,0.3)] animate-glow-pulse-amber'
                  : 'bg-slate-900/90 hover:bg-white/5 text-slate-300 border-white/10'
              }`}
            >
              <Target
                className={`w-3.5 h-3.5 shrink-0 ${
                  unclaimedMissionsCount > 0 ? 'text-amber-400 stroke-[2.5]' : 'text-amber-400/80'
                }`}
                aria-hidden="true"
              />
              <span className="hidden xl:inline">Befehle</span>
              {unclaimedMissionsCount > 0 ? (
                <span className="px-1 py-0.2 rounded bg-amber-500 text-slate-950 text-[9px] font-black">
                  !{unclaimedMissionsCount}
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 tabular-nums">
                  {completedMissionsCount}/{totalMissionsCount}
                </span>
              )}
            </button>
          )}

          {/* Consolidated Micro-Toolbar for Secondary Utilities */}
          <div className="hidden sm:flex items-center gap-0.5 p-0.5 rounded-md bg-slate-900/70 border border-white/10 shrink-0">
            {/* Mode Switcher Toggle (3D Battle Royale vs Mobile Zentrale) */}
            {isMobileHardware ? (
              <div
                title="3D Battle Royale auf Mobilgeräten deaktiviert"
                className="p-1 text-red-400"
              >
                <Lock className="w-3.5 h-3.5" aria-hidden="true" />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  soundFx.playUiClick();
                  setIsMobileMode(!isMobileMode);
                }}
                title={isMobileMode ? 'Zu 3D Battle Royale (PC) wechseln' : 'Zu Taktischer Zentrale (Mobile) wechseln'}
                aria-label={isMobileMode ? 'Zu 3D Battle Royale wechseln' : 'Zu Taktischer Zentrale wechseln'}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors active:scale-95 cursor-pointer"
              >
                {isMobileMode ? (
                  <Smartphone className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
                ) : (
                  <Monitor className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                )}
              </button>
            )}

            {/* HQ Funk (Commander AI Quick Action) */}
            {onRequestCommander && (
              <button
                type="button"
                onClick={() => {
                  soundFx.playUiClick();
                  onRequestCommander();
                }}
                disabled={isCommanderThinking}
                title="HQ Funk: Taktische KI-Befehle anfordern"
                aria-label="HQ Funk"
                className="p-1 rounded text-cyan-400 hover:text-cyan-200 hover:bg-cyan-500/15 transition-colors active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Radio
                  className={`w-3.5 h-3.5 ${isCommanderThinking ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
              </button>
            )}

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={toggleMute}
              aria-label={isMuted ? 'Ton aktivieren' : 'Ton stummschalten'}
              title={isMuted ? 'Ton aktivieren' : 'Ton stummschalten'}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors active:scale-95 cursor-pointer"
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-red-400" aria-hidden="true" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-amber-400/90" aria-hidden="true" />
              )}
            </button>

            {/* Legal / Disclaimer */}
            {onOpenLegalModal && (
              <button
                type="button"
                onClick={() => {
                  soundFx.playUiClick();
                  onOpenLegalModal();
                }}
                aria-label="Rechtliches & Disclaimer"
                title="Rechtliches, Datenschutz & Disclaimer"
                className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-white/10 transition-colors active:scale-95 cursor-pointer"
              >
                <Scale className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Profile Callsign & Logout Group */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                soundFx.playUiClick();
                onOpenProfileModal();
              }}
              aria-label="Operator-Profil und Clan-Tag öffnen"
              title="Benutzername & Clan-Tag ändern"
              className="flex items-center gap-1.5 px-2 py-1 text-xs font-mono font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded-md border border-amber-400/30 transition-all duration-150 active:scale-[0.98] cursor-pointer"
            >
              <UserCheck className="w-3 h-3 text-amber-400 shrink-0 stroke-[2.5]" aria-hidden="true" />
              <span className="truncate max-w-[80px] sm:max-w-[110px] tracking-tight">
                [{clanTag || '61267'}] {playerName}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundFx.playUiClick();
                onLogout();
              }}
              aria-label="Vom Konto abmelden"
              title="Vom Konto abmelden"
              className="p-1.5 rounded-md bg-slate-900/90 hover:bg-red-950/40 text-slate-400 hover:text-red-300 border border-white/10 hover:border-red-500/30 transition-all duration-150 active:scale-95 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Tab Bar (for screens < lg) - 44x44px minimum touch targets, accessible, glowing */}
      <nav
        aria-label="Mobile Hauptnavigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 h-14 bg-slate-950/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.7)] flex items-center justify-around px-1 z-40 pb-[env(safe-area-inset-bottom,0px)] select-none"
      >
        <div
          className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent pointer-events-none"
          aria-hidden="true"
        />
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                soundFx.playUiClick();
                if (!navigationDisabled) setActiveTab(item.id);
              }}
              aria-label={item.label}
              aria-disabled={navigationDisabled}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center flex-1 h-full min-h-[44px] min-w-[44px] gap-0.5 text-[10px] font-mono transition-all duration-150 active:scale-[0.96] cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/50 rounded-md ${
                isActive
                  ? 'text-amber-400 font-bold bg-amber-500/10'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-gradient-to-r from-amber-500 via-amber-300 to-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.9)] rounded-full"
                  aria-hidden="true"
                />
              )}
              <Icon
                className={`w-3.5 h-3.5 transition-transform duration-150 ${
                  isActive ? 'scale-110 drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]' : ''
                }`}
                aria-hidden="true"
              />
              <span className="tracking-tight text-[9px]">{item.mobileLabel}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute top-1 right-2 px-1 py-0.2 rounded-full bg-amber-500 text-slate-950 font-mono text-[8px] font-black shadow-[0_0_6px_rgba(245,158,11,0.8)]">
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
