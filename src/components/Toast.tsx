import React, { useEffect, useState } from 'react';
import { Trophy, Sparkles } from 'lucide-react';
import { ACHIEVEMENTS } from '../game/constants';

interface ToastProps {
  achievementId: string | null;
  onClear: () => void;
}

export const Toast: React.FC<ToastProps> = ({ achievementId, onClear }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (achievementId) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClear, 300);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [achievementId, onClear]);

  if (!achievementId) return null;

  const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
  if (!achievement) return null;

  return (
    <div
      className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/95 border border-amber-400/60 shadow-[0_0_25px_rgba(245,158,11,0.4)] backdrop-blur-md transition-all duration-300 pointer-events-none ${
        visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95'
      }`}
    >
      <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
        <Trophy className="w-5 h-5" />
      </div>
      <div className="flex flex-col text-left">
        <span className="text-[10px] font-bold text-amber-300 tracking-wider uppercase flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          TROPHY UNLOCKED!
        </span>
        <span className="text-sm font-extrabold text-white">{achievement.title}</span>
        <span className="text-[11px] text-slate-300">{achievement.description}</span>
      </div>
    </div>
  );
};
