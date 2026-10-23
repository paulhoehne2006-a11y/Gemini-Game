import React from 'react';
import {
  Coins,
  Award,
  Target,
  Volume2,
  VolumeX,
  Radio,
  Scale,
  LogOut,
  UserCheck,
  Shield,
  Sparkles,
  Monitor,
} from 'lucide-react';
import { soundFx } from '../audio/soundFx';

export interface MobileHeaderProps {
  playerName: string;
  clanTag: string;
  operatorLevel?: number;
  budget: number;
  reputation?: number;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  unclaimedMissionsCount?: number;
  completedMissionsCount?: number;
  totalMissionsCount?: number;
  onRequestCommander?: () => void;
  isCommanderThinking?: boolean;
  isMobileHardware?: boolean;
  onSwitchToPcMode?: () => void;
  onOpenProfileModal: () => void;
  onOpenDailyMissions?: () => void;
  onOpenLegalModal?: () => void;
  onLogout: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  playerName,
  clanTag,
  operatorLevel = 1,
  budget,
  reputation = 0,
  isMuted,
  setIsMuted,
  unclaimedMissionsCount = 0,
  completedMissionsCount = 0,
  totalMissionsCount = 4,
  onRequestCommander,
  isCommanderThinking = false,
  isMobileHardware = false,
  onSwitchToPcMode,
  onOpenProfileModal,
  onOpenDailyMissions,
  onOpenLegalModal,
  onLogout,
}) => {
  const toggleMute = () => {
    const next = soundFx.toggleMute();
    setIsMuted(next);
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-1.5 px-3 py-2 pt-[calc(0.5rem+env(safe-area-inset-top,0px))] bg-slate-950/95 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.6)] shrink-0 select-none">
      {/* Zone 1: Operator Identity Pill (Touch Target -> Profile Modal) */}
      <button
        type="button"
        onClick={() => {
          soundFx.playUiClick();
          onOpenProfileModal();
        }}
        aria-label={`Operator-Profil öffnen: [${clanTag || '61267'}] ${playerName}, Level ${operatorLevel}`}
        title="Profil & Clan-Tag anpassen"
        className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/90 hover:bg-slate-800/80 border border-white/10 hover:border-amber-500/30 transition-all duration-150 active:scale-[0.97] cursor-pointer min-w-0 max-w-[48%]"
      >
        <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 font-mono font-black text-[11px] shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.2)]">
          {operatorLevel}
        </div>
        <div className="truncate text-left leading-none">
          <div className="flex items-center gap-1 font-mono text-[9px] text-amber-400 font-bold uppercase tracking-wider">
            <span>NEU-ANSPACH</span>
            <span className="text-white">ROYALE</span>
          </div>
          <div className="text-xs font-bold text-white truncate max-w-[100px] tracking-tight mt-0.5">
            {playerName}
          </div>
        </div>
      </button>

      {/* Zone 2: Currency & Actions Capsule */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* NAT Coin Capsule */}
        <div
          onClick={() => {
            if (onOpenDailyMissions) {
              soundFx.playUiClick();
              onOpenDailyMissions();
            }
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/30 font-mono text-xs font-black text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.12)] cursor-pointer transition-transform active:scale-[0.97]"
          title={`Stadtkasse: ${budget.toLocaleString('de-DE')} NAT · Ruf: ${reputation}`}
        >
          <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0 drop-shadow-[0_0_4px_rgba(245,158,11,0.8)]" aria-hidden="true" />
          <span className="tabular-nums tracking-tight">{budget.toLocaleString('de-DE')}</span>
          <span className="text-[9px] font-bold text-amber-300/80">NAT</span>
        </div>

        {/* Daily Mission Quick Indicator Button */}
        {onOpenDailyMissions && (
          <button
            type="button"
            onClick={() => {
              soundFx.playUiClick();
              onOpenDailyMissions();
            }}
            aria-label={`Tagesbefehle öffnen (${completedMissionsCount}/${totalMissionsCount} fertig, ${unclaimedMissionsCount} abholbereit)`}
            title="Tagesbefehle & Belohnungen"
            className={`relative p-2 rounded-xl border transition-all duration-150 active:scale-[0.96] cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center ${
              unclaimedMissionsCount > 0
                ? 'bg-amber-500/20 border-amber-400/60 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.35)] animate-pulse'
                : 'bg-slate-900/90 border-white/10 text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Target className="w-4 h-4 text-amber-400" aria-hidden="true" />
            {unclaimedMissionsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-mono font-black text-[9px] flex items-center justify-center shadow-[0_0_6px_rgba(245,158,11,0.9)]">
                {unclaimedMissionsCount}
              </span>
            )}
          </button>
        )}

        {/* Commander AI Funk Quick Button */}
        {onRequestCommander && (
          <button
            type="button"
            onClick={() => {
              soundFx.playUiClick();
              onRequestCommander();
            }}
            disabled={isCommanderThinking}
            aria-label="Taktischen Funkspruch anfordern"
            title="HQ Funk anfordern"
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-cyan-500/20 text-cyan-400 border border-white/10 hover:border-cyan-400/40 transition-all active:scale-[0.96] disabled:opacity-50 cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <Radio className={`w-4 h-4 ${isCommanderThinking ? 'animate-spin' : ''}`} aria-hidden="true" />
          </button>
        )}

        {/* Mute Audio Button */}
        <button
          type="button"
          onClick={toggleMute}
          aria-label={isMuted ? 'Ton aktivieren' : 'Ton stummschalten'}
          title={isMuted ? 'Ton aktivieren' : 'Ton stummschalten'}
          className="p-2 rounded-xl bg-slate-900/90 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-all active:scale-[0.96] cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-red-400" aria-hidden="true" />
          ) : (
            <Volume2 className="w-4 h-4 text-amber-400/90" aria-hidden="true" />
          )}
        </button>

        {/* Switch back to PC / Desktop view if user is on PC */}
        {!isMobileHardware && onSwitchToPcMode && (
          <button
            type="button"
            onClick={() => {
              soundFx.playUiClick();
              onSwitchToPcMode();
            }}
            aria-label="Zum PC-Modus wechseln"
            title="Desktop-Modus (PC) öffnen"
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-white/10 hover:border-amber-400/40 transition-all active:scale-[0.96] cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <Monitor className="w-4 h-4" aria-hidden="true" />
          </button>
        )}

        {/* Legal Disclaimer Modal */}
        {onOpenLegalModal && (
          <button
            type="button"
            onClick={() => {
              soundFx.playUiClick();
              onOpenLegalModal();
            }}
            aria-label="Rechtliches & Datenschutz"
            title="Rechtliches, Datenschutz & Impressum"
            className="hidden xs:flex p-2 rounded-xl bg-slate-900/90 hover:bg-white/10 text-slate-400 hover:text-amber-400 border border-white/10 transition-all active:scale-[0.96] cursor-pointer min-h-[36px] min-w-[36px] items-center justify-center"
          >
            <Scale className="w-4 h-4" aria-hidden="true" />
          </button>
        )}

        {/* Logout Button */}
        <button
          type="button"
          onClick={() => {
            soundFx.playUiClick();
            onLogout();
          }}
          aria-label="Vom Konto abmelden"
          title="Abmelden"
          className="p-2 rounded-xl bg-slate-900/90 hover:bg-red-950/50 text-slate-400 hover:text-red-300 border border-white/10 hover:border-red-500/30 transition-all active:scale-[0.96] cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
};
