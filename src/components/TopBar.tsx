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
      {/* 3-Zone Battle Royale Header - Sticky at Top */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-5 lg:px-6 py-2 sm:py-2.5 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 shadow-[0_4px_30px_rgba(0,0,0,0.7)] shrink-0 relative select-none">
        {/* Subtle Tactical Amber/Cyan Top Accent Line */}
        <div className="tactical-top-accent" aria-hidden="true" />

        {/* Zone 1: Wordmark & Military Badges */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              soundFx.playUiClick();
              if (onOpenHome) onOpenHome();
              else setActiveTab('home');
            }}
            aria-label="Hauptmenü öffnen - Neu-Anspach Royale"
            className="group relative flex items-center gap-2.5 shrink-0 text-left cursor-pointer transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 rounded-lg p-0.5"
          >
            {/* Postal Code Chamfered Badge */}
            <div className="hud-chamfer-sm border border-amber-500/60 bg-gradient-to-br from-amber-500/20 to-amber-950/40 px-2 py-0.5 font-mono text-xs font-black text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.35)] tracking-wider">
              61267
            </div>

            {/* Metallic Font Title & Status */}
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1.5 font-black tracking-wider uppercase text-sm sm:text-base leading-none">
                <span className="metallic-text group-hover:text-white transition-colors">
                  NEU-ANSPACH
                </span>
                <span className="text-amber-400 text-glow-amber">ROYALE</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-[9px] font-mono tracking-widest text-slate-400 uppercase mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-hud-beacon shadow-[0_0_6px_rgba(16,185,129,0.9)]" />
                <span>ONLINE // V3.8</span>
              </div>
            </div>
          </button>
        </div>

        {/* Zone 2: Desktop Navigation Links */}
        <nav
          aria-label="Hauptnavigation"
          className="hidden lg:flex items-center gap-1 xl:gap-1.5 text-xs xl:text-sm font-medium"
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
                aria-disabled={navigationDisabled}
                aria-current={isActive ? 'page' : undefined}
                className={`relative px-2.5 xl:px-3 py-1.5 rounded-md transition-all whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 font-mono tracking-tight ${
                  isActive
                    ? 'text-amber-300 font-bold bg-amber-500/15 border border-amber-400/60 shadow-[0_0_14px_rgba(245,158,11,0.25)]'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 hover:border-slate-700/60 border border-transparent'
                }`}
              >
                <span>{item.label}</span>
                {isActive && (
                  <span
                    className="absolute -bottom-[9px] left-2 right-2 h-[2px] bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.9)] rounded-full"
                    aria-hidden="true"
                  />
                )}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-mono text-[10px] font-black animate-glow-pulse-amber shadow-[0_0_8px_rgba(245,158,11,0.7)]">
                    {item.badge} SP
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Currencies, Status Pills & Tactical Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* NAT Balance Pill */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/90 border border-amber-500/40 text-amber-400 font-mono text-xs font-bold shadow-[0_0_12px_rgba(245,158,11,0.18)] whitespace-nowrap shrink-0"
            title="Aktuelles Guthaben in Neu-Anspach Talern (NAT)"
          >
            <Coins
              className="w-3.5 h-3.5 text-amber-400 shrink-0 drop-shadow-[0_0_4px_rgba(245,158,11,0.7)]"
              aria-hidden="true"
            />
            <span className="tabular-nums tracking-wide">{budget.toLocaleString('de-DE')}</span>
            <span className="text-[10px] font-black text-amber-300 bg-amber-500/20 px-1 py-0.2 rounded border border-amber-500/30">
              NAT
            </span>
          </div>

          {/* Reputation Tag (Desktop only) */}
          {onOpenDailyMissions && (
            <button
              type="button"
              onClick={() => {
                soundFx.playUiClick();
                onOpenDailyMissions();
              }}
              aria-label={`Operator-Ansehen: ${reputation} Ruf-Punkte`}
              className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/40 hover:border-purple-400/60 text-purple-300 hover:text-purple-100 text-xs font-mono font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.2)]"
              title="Operator-Ansehen (Ruf-Punkte) - Klicke für Details"
            >
              <Award
                className="w-3.5 h-3.5 text-purple-400 shrink-0 drop-shadow-[0_0_4px_rgba(168,85,247,0.6)]"
                aria-hidden="true"
              />
              <span className="tabular-nums">{reputation} Ruf</span>
            </button>
          )}

          {/* Daily Missions Trigger Button */}
          {onOpenDailyMissions && (
            <button
              type="button"
              onClick={() => {
                soundFx.playUiClick();
                onOpenDailyMissions();
              }}
              aria-label="Tagesbefehle und Operator-Ruf öffnen"
              className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer border ${
                unclaimedMissionsCount > 0
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.45)] animate-glow-pulse-amber'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-800 hover:border-slate-700'
              }`}
              title="Tagesbefehle & Operator-Ruf öffnen"
            >
              <Target
                className={`w-3.5 h-3.5 shrink-0 ${
                  unclaimedMissionsCount > 0
                    ? 'text-amber-400 stroke-[2.5] drop-shadow-[0_0_6px_rgba(245,158,11,0.8)]'
                    : 'text-amber-400/80'
                }`}
                aria-hidden="true"
              />
              <span className="hidden sm:inline">Tagesbefehle</span>
              {unclaimedMissionsCount > 0 ? (
                <span className="relative flex items-center gap-1 px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 text-[10px] font-black tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                  !{unclaimedMissionsCount}
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-slate-800 text-slate-300 border border-slate-700/60">
                  {completedMissionsCount}/{totalMissionsCount}
                </span>
              )}
            </button>
          )}

          {/* Commander AI Quick Action (Optional high-tier desktop HUD) */}
          {onRequestCommander && (
            <button
              type="button"
              onClick={() => {
                soundFx.playUiClick();
                onRequestCommander();
              }}
              disabled={isCommanderThinking}
              aria-label="Taktische KI-Befehle anfordern"
              className="hidden 2xl:flex items-center gap-1.5 px-2 py-1 rounded-md bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/40 hover:border-cyan-400/60 text-cyan-300 text-xs font-mono font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.15)] disabled:opacity-50"
              title="Taktische Gemini-Befehle für das Match anfordern"
            >
              <Radio
                className={`w-3.5 h-3.5 text-cyan-400 shrink-0 ${
                  isCommanderThinking ? 'animate-spin' : ''
                }`}
                aria-hidden="true"
              />
              <span>{isCommanderThinking ? 'Commander denkt...' : 'HQ Funk'}</span>
            </button>
          )}

          {/* Mode Toggle: Strictly locked on mobile hardware */}
          {isMobileHardware ? (
            <div
              title="3D Battle Royale ist auf Mobilgeräten (auch im Querformat) deaktiviert"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold whitespace-nowrap shrink-0 bg-red-950/40 text-red-300 border border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.15)]"
            >
              <Lock className="w-3.5 h-3.5 text-red-400 shrink-0" aria-hidden="true" />
              <span>Handy · Kein 3D-BR</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                soundFx.playUiClick();
                setIsMobileMode(!isMobileMode);
              }}
              title="Zwischen 3D-Battle-Royale (PC) und Taktischer Zentrale wechseln"
              aria-label="Ansichtsmodus umschalten zwischen 3D-Battle-Royale und Taktischer Zentrale"
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer border ${
                isMobileMode
                  ? 'bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 border-cyan-500/40 hover:border-cyan-400/60 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
              }`}
            >
              {isMobileMode ? (
                <>
                  <Smartphone className="w-3.5 h-3.5 text-cyan-400 shrink-0" aria-hidden="true" />
                  <span>Zentrale</span>
                </>
              ) : (
                <>
                  <Monitor className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
                  <span>PC-Modus (3D)</span>
                </>
              )}
            </button>
          )}

          {/* Sound Mute Button (Desktop) */}
          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? 'Ton aktivieren' : 'Ton stummschalten'}
            className="hidden sm:flex items-center justify-center p-1.5 rounded-md bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition-all cursor-pointer shrink-0"
            title={isMuted ? 'Ton aktivieren' : 'Stummschalten'}
          >
            {isMuted ? (
              <VolumeX
                className="w-4 h-4 text-red-400 drop-shadow-[0_0_4px_rgba(239,68,68,0.5)]"
                aria-hidden="true"
              />
            ) : (
              <Volume2
                className="w-4 h-4 text-amber-400/90 drop-shadow-[0_0_4px_rgba(245,158,11,0.5)]"
                aria-hidden="true"
              />
            )}
          </button>

          {/* Legal / Disclaimer Button (Desktop) */}
          {onOpenLegalModal && (
            <button
              type="button"
              onClick={() => {
                soundFx.playUiClick();
                onOpenLegalModal();
              }}
              aria-label="Rechtliches, Datenschutz und Disclaimer"
              className="hidden sm:flex items-center justify-center p-1.5 rounded-md bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer shrink-0"
              title="Rechtliches, Datenschutz & Disclaimer"
            >
              <Scale className="w-4 h-4" aria-hidden="true" />
            </button>
          )}

          {/* Profile / Callsign Button - Military Badge Styling */}
          <button
            type="button"
            onClick={() => {
              soundFx.playUiClick();
              onOpenProfileModal();
            }}
            aria-label="Operator-Profil und Clan-Tag öffnen"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-black text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-md border border-amber-200/50 shadow-[0_0_12px_rgba(245,158,11,0.35)] transition-all whitespace-nowrap shrink-0 cursor-pointer"
            title="Benutzername & Clan-Tag ändern"
          >
            <UserCheck className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" aria-hidden="true" />
            <span className="truncate max-w-[80px] sm:max-w-[120px] md:max-w-[140px] tracking-tight">
              [{clanTag || '61267'}] {playerName}
            </span>
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={() => {
              soundFx.playUiClick();
              onLogout();
            }}
            aria-label="Vom Konto abmelden"
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-md bg-slate-900/90 hover:bg-red-950/40 text-slate-300 hover:text-red-300 border border-slate-800 hover:border-red-500/40 transition-all cursor-pointer text-xs font-mono font-bold shrink-0"
            title="Vom Konto abmelden"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden xl:inline">Abmelden</span>
          </button>
        </div>
      </header>

      {/* Mobile Bottom Tab Bar (for screens < lg) - Clean, Accessible, Glowing */}
      <nav
        aria-label="Mobile Hauptnavigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 h-14 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 shadow-[0_-4px_25px_rgba(0,0,0,0.7)] flex items-center justify-around px-1 z-40"
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
              className={`relative flex flex-col items-center justify-center flex-1 h-full min-h-[44px] gap-0.5 text-[10px] font-mono transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isActive
                  ? 'text-amber-400 font-bold bg-amber-500/10'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isActive && (
                <span
                  className="absolute top-0 w-8 h-[2px] bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.9)] rounded-full"
                  aria-hidden="true"
                />
              )}
              <Icon
                className={`w-4 h-4 transition-transform ${
                  isActive ? 'scale-110 drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]' : ''
                }`}
                aria-hidden="true"
              />
              <span className="tracking-tight">{item.mobileLabel}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute top-1 right-2 px-1 py-0.2 rounded-full bg-amber-500 text-slate-950 font-mono text-[8px] font-black animate-glow-pulse-amber shadow-[0_0_6px_rgba(245,158,11,0.8)]">
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
