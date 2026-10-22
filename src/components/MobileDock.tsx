import React from 'react';
import {
  Home,
  Target,
  Wrench,
  Zap,
  Grid,
} from 'lucide-react';
import { soundFx } from '../audio/soundFx';

export type MobileTab =
  | 'home'
  | 'battle'
  | 'gunsmith'
  | 'skilltree'
  | 'hub'
  | 'clan'
  | 'tycoon'
  | 'leaderboard'
  | 'multiplayer';

export interface MobileDockProps {
  activeTab: MobileTab;
  onSelectTab: (tab: MobileTab) => void;
  skillPoints?: number;
  unclaimedMissionsCount?: number;
}

export const MobileDock: React.FC<MobileDockProps> = ({
  activeTab,
  onSelectTab,
  skillPoints = 0,
  unclaimedMissionsCount = 0,
}) => {
  // Hub sub-tabs map to 'hub' in the bottom dock
  const isHubActive =
    activeTab === 'hub' ||
    activeTab === 'clan' ||
    activeTab === 'tycoon' ||
    activeTab === 'leaderboard' ||
    activeTab === 'multiplayer';

  const dockItems = [
    {
      id: 'home' as const,
      label: 'Zentrale',
      icon: Home,
      isActive: activeTab === 'home',
    },
    {
      id: 'battle' as const,
      label: 'Einsatz',
      icon: Target,
      badge: unclaimedMissionsCount > 0 ? unclaimedMissionsCount : undefined,
      badgeType: 'amber',
      isActive: activeTab === 'battle',
    },
    {
      id: 'gunsmith' as const,
      label: 'Arsenal',
      icon: Wrench,
      isActive: activeTab === 'gunsmith',
    },
    {
      id: 'skilltree' as const,
      label: 'Skills',
      icon: Zap,
      badge: skillPoints > 0 ? skillPoints : undefined,
      badgeType: 'amber',
      isActive: activeTab === 'skilltree',
    },
    {
      id: 'hub' as const,
      label: 'Mehr',
      icon: Grid,
      isActive: isHubActive,
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="sticky bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-2xl border-t border-white/10 shadow-[0_-8px_32px_rgba(0,0,0,0.8)] select-none shrink-0"
    >
      <div className="flex items-center justify-around px-1 py-1 sm:py-1.5 h-16 pb-[calc(0.25rem+env(safe-area-inset-bottom,0px))]">
        {dockItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.isActive;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                soundFx.playUiClick();
                onSelectTab(item.id);
              }}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center flex-1 h-full min-h-[44px] min-w-[44px] py-1 transition-all duration-150 active:scale-[0.94] cursor-pointer rounded-2xl group ${
                isActive
                  ? 'text-amber-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Luminous Active Glow Capsule */}
              {isActive && (
                <div
                  className="absolute inset-x-2 inset-y-1 bg-amber-500/10 border border-amber-500/30 rounded-xl shadow-[0_0_16px_rgba(245,158,11,0.2)] -z-10"
                  aria-hidden="true"
                />
              )}

              {/* Glowing Top Indicator Line */}
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2.5px] bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_8px_rgba(245,158,11,0.9)] rounded-full"
                  aria-hidden="true"
                />
              )}

              {/* Icon Container with Badge */}
              <div className="relative mb-0.5">
                <Icon
                  className={`w-5 h-5 transition-transform duration-150 ${
                    isActive
                      ? 'scale-110 drop-shadow-[0_0_8px_rgba(245,158,11,0.7)] text-amber-400 stroke-[2.3]'
                      : 'text-slate-400 group-hover:text-slate-200 stroke-[1.8]'
                  }`}
                  aria-hidden="true"
                />

                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 px-1 min-w-[15px] h-[15px] rounded-full bg-amber-500 text-slate-950 font-mono font-black text-[9px] flex items-center justify-center shadow-[0_0_6px_rgba(245,158,11,0.9)] leading-none">
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[10px] font-mono tracking-tight leading-none ${
                  isActive ? 'text-amber-300 font-bold' : 'text-slate-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
