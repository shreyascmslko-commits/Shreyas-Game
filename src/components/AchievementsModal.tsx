import React from 'react';
import { X, Trophy, CheckCircle2, Lock, Award, Sparkles } from 'lucide-react';
import { StorageManager } from '../game/storage';
import { sound } from '../game/audio';

interface AchievementsModalProps {
  onClose: () => void;
  onOpenCertificate: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({ onClose, onOpenCertificate }) => {
  const stats = StorageManager.getStats();
  const achievements = StorageManager.getAchievementsList();
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const progressPercent = Math.round((unlockedCount / achievements.length) * 100);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none pointer-events-auto">
      <div className="w-full max-w-lg max-h-[90vh] rounded-2xl bg-slate-900 border border-slate-700/80 p-5 sm:p-6 flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-display tracking-wide uppercase flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>COSMIC AWARDS & TROPHIES</span>
            </h2>
            <p className="text-xs text-slate-400">Accomplish stellar feats and claim your official certificate</p>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certificate Feature Banner in Awards Section */}
        <div className="relative rounded-xl p-4 bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-slate-900 border border-amber-500/40 shadow-lg mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">OFFICIAL RECOGNITION</span>
                <Sparkles className="w-3 h-3 text-amber-400" />
              </div>
              <h3 className="text-sm font-extrabold text-white font-display">Galactic Excellence Certificate</h3>
              <p className="text-[11px] text-slate-300">
                Generate and download your custom certificate with record score: {stats.highScore.toLocaleString()} pts
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
              onOpenCertificate();
            }}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs tracking-wider shadow-md active:scale-95 transition-all cursor-pointer whitespace-nowrap text-center"
          >
            CLAIM CERTIFICATE
          </button>
        </div>

        {/* Total Progress */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 mb-3">
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span className="text-slate-300">Trophies Completed</span>
            <span className="text-amber-300 font-mono tabular-nums">
              {unlockedCount} / {achievements.length} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-slate-850 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-cyan-400 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Achievements List */}
        <div className="flex flex-col gap-2.5 overflow-y-auto pr-1 text-left">
          {achievements.map(({ achievement, unlocked }) => (
            <div
              key={achievement.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                unlocked
                  ? 'bg-slate-850 border-amber-500/40 text-white'
                  : 'bg-slate-950/40 border-slate-850 text-slate-500 opacity-60'
              }`}
            >
              <div
                className={`p-2.5 rounded-xl border ${
                  unlocked
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                    : 'bg-slate-900 border-slate-800 text-slate-600'
                }`}
              >
                {unlocked ? <Trophy className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </div>

              <div className="flex flex-col flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold tracking-wide font-display text-white">
                    {achievement.title}
                  </h4>
                  {unlocked && (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      UNLOCKED
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-normal">{achievement.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
