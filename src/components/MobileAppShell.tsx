import React from 'react';

export interface MobileAppShellProps {
  children: React.ReactNode;
}

export const MobileAppShell: React.FC<MobileAppShellProps> = ({ children }) => {
  return (
    <div className="min-h-[100dvh] w-full bg-slate-950 flex flex-col items-center justify-center sm:py-6 sm:px-4 selection:bg-amber-500/30 selection:text-white overflow-x-hidden relative">
      {/* Ambient Radial Cyber Backlight on Desktop */}
      <div
        className="fixed inset-0 pointer-events-none hidden sm:block overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[900px] bg-gradient-to-b from-amber-500/10 via-cyan-500/5 to-transparent blur-3xl opacity-60 rounded-full" />
        <div className="tactical-grid absolute inset-0 opacity-20" />
      </div>

      {/* Smartphone Device Frame (Full width on mobile, sleek phone frame on desktop) */}
      <div className="w-full sm:max-w-[430px] h-[100dvh] sm:h-[880px] sm:max-h-[96vh] sm:rounded-[40px] sm:border-[8px] sm:border-slate-800/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(245,158,11,0.06)] bg-slate-950 overflow-hidden flex flex-col relative z-10 sm:ring-1 sm:ring-white/10">
        {/* Inner Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {children}
        </div>
      </div>
    </div>
  );
};
