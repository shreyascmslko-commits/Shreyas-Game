import React from 'react';

interface CreatorBadgeProps {
  compact?: boolean;
  className?: string;
}

export const CreatorBadge: React.FC<CreatorBadgeProps> = ({ compact = false, className = '' }) => {
  if (compact) {
    return (
      <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-sans">Created by</span>
          <span className="font-cinzel font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-amber-200 to-yellow-400 tracking-wider">
            Shreyas Chaturvedi
          </span>
          <span className="text-slate-500 font-serif">·</span>
          <span className="text-slate-400 font-sans text-[11px]">Class 9</span>
        </div>
        <div className="text-[10px] text-slate-500 font-sans mt-0.5">
          © 2026 Cosmic Gem Rush · All Rights Reserved
        </div>
      </div>
    );
  }

  return (
    <footer className={`flex flex-col items-center justify-center text-center select-none py-2 px-4 ${className}`}>
      {/* Decorative hairline line */}
      <div className="w-16 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent mb-1.5" />

      {/* Main Author Line */}
      <div className="flex items-center gap-2">
        <span className="text-xs sm:text-sm text-slate-400 font-sans">Created by</span>
        <span className="font-cinzel text-sm sm:text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-amber-200 to-yellow-400 tracking-widest drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]">
          Shreyas Chaturvedi
        </span>
      </div>

      {/* Student credentials */}
      <div className="text-[11px] sm:text-xs font-medium text-cyan-200/80 tracking-wider font-sans mt-0.5">
        Student of Class 9
      </div>

      {/* Copyright */}
      <div className="text-[10px] text-slate-500 font-sans tracking-wide mt-1">
        © 2026 Cosmic Gem Rush · All Rights Reserved
      </div>
    </footer>
  );
};
