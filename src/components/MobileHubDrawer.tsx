import React from 'react';
import {
  Users,
  Building2,
  Trophy,
  UserCheck,
  Target,
  Scale,
  LogOut,
  ChevronRight,
  Shield,
  Coins,
  Award,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { soundFx } from '../audio/soundFx';
import { MobileTab } from './MobileDock';

export interface MobileHubDrawerProps {
  playerName: string;
  clanTag: string;
  operatorLevel?: number;
  budget: number;
  reputation: number;
  totalIncomePerSec: number;
  totalWins: number;
  onNavigateTab: (tab: MobileTab) => void;
  onOpenProfileModal: () => void;
  onOpenDailyMissions: () => void;
  onOpenLegalModal: () => void;
  onLogout: () => void;
}

export const MobileHubDrawer: React.FC<MobileHubDrawerProps> = ({
  playerName,
  clanTag,
  operatorLevel = 1,
  budget,
  reputation,
  totalIncomePerSec,
  totalWins,
  onNavigateTab,
  onOpenProfileModal,
  onOpenDailyMissions,
  onOpenLegalModal,
  onLogout,
}) => {
  const hubSections = [
    {
      id: 'clan' as const,
      title: 'Mein Clan',
      subtitle: 'Squad, Clan-Tag & Team-Chat',
      badge: `[${clanTag || '61267'}]`,
      icon: Users,
      color: 'from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/30',
      iconBg: 'bg-amber-500/20 text-amber-400',
    },
    {
      id: 'tycoon' as const,
      title: 'Maps & Tycoon',
      subtitle: `+${totalIncomePerSec} NAT/s · 7 Maps im Taunus`,
      badge: 'Infrastruktur',
      icon: Building2,
      color: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/30',
      iconBg: 'bg-emerald-500/20 text-emerald-400',
    },
    {
      id: 'leaderboard' as const,
      title: 'Live-Bestenliste',
      subtitle: 'Echtzeit-Rangliste & Top-Operators',
      badge: `${totalWins} Siege`,
      icon: Trophy,
      color: 'from-purple-500/20 to-purple-500/5 text-purple-400 border-purple-500/30',
      iconBg: 'bg-purple-500/20 text-purple-400',
    },
    {
      id: 'multiplayer' as const,
      title: 'Freunde-Lobby',
      subtitle: 'Raum erstellen & Co-op beitreten',
      badge: 'Online',
      icon: Users,
      color: 'from-cyan-500/20 to-cyan-500/5 text-cyan-400 border-cyan-500/30',
      iconBg: 'bg-cyan-500/20 text-cyan-400',
    },
  ];

  return (
    <div className="w-full h-full p-4 space-y-5 animate-in fade-in duration-200 text-slate-100 select-none pb-24">
      {/* Top Breadcrumb & Title */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-black block">
            KOMMANDO-HUB
          </span>
          <h1 className="text-xl font-black text-white tracking-tight">
            Weitere Bereiche
          </h1>
        </div>

        <button
          type="button"
          onClick={() => {
            soundFx.playUiClick();
            onNavigateTab('home');
          }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 hover:border-amber-500/30 text-xs font-mono text-slate-300 hover:text-white transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
          <span>Zentrale</span>
        </button>
      </div>

      {/* Operator Quick Status Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-900/60 border border-white/10 shadow-lg flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center font-mono font-black text-amber-400 text-sm shrink-0">
            {operatorLevel}
          </div>
          <div className="truncate">
            <div className="text-xs font-bold text-white truncate">
              {playerName}
            </div>
            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
              <span className="text-amber-400">[{clanTag || '61267'}]</span>
              <span>·</span>
              <span>{reputation} Ruf</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            soundFx.playUiClick();
            onOpenProfileModal();
          }}
          className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold shrink-0 transition-all active:scale-95 cursor-pointer"
        >
          Profil
        </button>
      </div>

      {/* Main 4 Navigation Hub Cards */}
      <div className="space-y-2.5">
        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold px-1">
          Hauptsysteme
        </div>

        {hubSections.map((section) => {
          const Icon = section.icon;

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => {
                soundFx.playUiClick();
                onNavigateTab(section.id);
              }}
              className={`w-full p-4 rounded-2xl bg-gradient-to-r ${section.color} border shadow-md flex items-center justify-between gap-3.5 text-left transition-all duration-150 active:scale-[0.98] cursor-pointer hover:shadow-lg`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`w-11 h-11 rounded-xl ${section.iconBg} border border-current/30 flex items-center justify-center shrink-0 shadow-sm`}
                >
                  <Icon className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-white truncate">
                      {section.title}
                    </h2>
                    {section.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black uppercase tracking-wider bg-white/10 text-white border border-white/10">
                        {section.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300/90 truncate mt-0.5">
                    {section.subtitle}
                  </p>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
            </button>
          );
        })}
      </div>

      {/* Utility Actions Section */}
      <div className="space-y-2 pt-2">
        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold px-1">
          Dienste & Verwaltung
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              soundFx.playUiClick();
              onOpenDailyMissions();
            }}
            className="p-3 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-white/10 text-left transition-all active:scale-[0.97] cursor-pointer flex items-center gap-2.5"
          >
            <Target className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="truncate">
              <span className="text-xs font-bold text-white block truncate">Tagesbefehle</span>
              <span className="text-[10px] text-slate-400 block truncate">Missionen & Belohnung</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFx.playUiClick();
              onOpenLegalModal();
            }}
            className="p-3 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-white/10 text-left transition-all active:scale-[0.97] cursor-pointer flex items-center gap-2.5"
          >
            <Scale className="w-4 h-4 text-slate-300 shrink-0" />
            <div className="truncate">
              <span className="text-xs font-bold text-white block truncate">Rechtliches</span>
              <span className="text-[10px] text-slate-400 block truncate">DSGVO & Impressum</span>
            </div>
          </button>
        </div>

        {/* Logout Button */}
        <button
          type="button"
          onClick={() => {
            soundFx.playUiClick();
            onLogout();
          }}
          className="w-full p-3 rounded-xl bg-red-950/30 hover:bg-red-950/60 border border-red-500/30 text-red-300 font-mono text-xs font-bold transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 mt-2"
        >
          <LogOut className="w-4 h-4 text-red-400" />
          <span>Abmelden & Sitzung beenden</span>
        </button>
      </div>
    </div>
  );
};
