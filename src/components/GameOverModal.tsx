import React, { useEffect, useState } from 'react';
import { RotateCcw, Home, Globe, Trophy, Sparkles, Award } from 'lucide-react';
import { RunResults, WorldId } from '../game/types';
import { WORLDS } from '../game/constants';
import { sound } from '../game/audio';
import { CreatorBadge } from './CreatorBadge';

interface GameOverModalProps {
  results: RunResults;
  highScore: number;
  onPlayAgain: () => void;
  onOpenWorlds: () => void;
  onOpenCertificate: () => void;
  onHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  results,
  highScore,
  onPlayAgain,
  onOpenWorlds,
  onOpenCertificate,
  onHome,
}) => {
  const world = WORLDS[results.worldId];
  const [animatedScore, setAnimatedScore] = useState(0);

  // Animated count-up for score
  useEffect(() => {
    let start = 0;
    const target = results.score;
    const duration = 1000;
    const startTime = performance.now();

    const frame = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // ease-out expo
      const current = Math.floor(target * (1 - Math.pow(2, -10 * progress)));
      setAnimatedScore(current);

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        setAnimatedScore(target);
      }
    };

    requestAnimationFrame(frame);
  }, [results.score]);

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-between p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md select-none pointer-events-auto overflow-y-auto">
      <div className="w-full max-w-md my-auto py-2 flex flex-col items-center text-center">
        {/* Victory or Game Over Title */}
        <div className="mb-3 shrink-0">
          {results.clearedLevel ? (
            <div className="flex flex-col items-center">
              <div className="inline-flex p-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mb-2 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                <Award className="w-7 h-7" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 font-display tracking-wider uppercase">
                PORTAL CONQUERED!
              </h2>
              <p className="text-xs text-emerald-300/80 mt-0.5">
                You harnessed the power of {world.name}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-fuchsia-400 to-indigo-300 font-display tracking-wider uppercase">
                VOYAGE COMPLETE
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Your journey through {world.name} has concluded
              </p>
            </div>
          )}
        </div>

        {/* Results Card */}
        <div className="w-full bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-2xl mb-4 flex flex-col gap-3.5 shrink-0">
          {/* Main Score Display */}
          <div className="flex flex-col items-center border-b border-slate-800 pb-3">
            <span className="text-[11px] text-slate-400 uppercase tracking-widest font-semibold">
              FINAL SCORE
            </span>
            <div className="text-3xl sm:text-4xl font-black text-white font-mono tabular-nums tracking-wide my-1">
              {animatedScore.toLocaleString()}
            </div>

            {results.isNewBest && (
              <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold animate-pulse">
                <Trophy className="w-3.5 h-3.5" />
                <span>NEW PERSONAL BEST!</span>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2.5 text-left">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5">
              <span className="text-[10px] text-slate-400 block font-medium">All-Time Best</span>
              <span className="text-base font-bold text-amber-300 font-mono tabular-nums">
                {Math.max(highScore, results.score).toLocaleString()}
              </span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5">
              <span className="text-[10px] text-slate-400 block font-medium">Gems Collected</span>
              <span className="text-base font-bold text-cyan-300 font-mono tabular-nums">
                {results.gemsCollected.toLocaleString()}
              </span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5">
              <span className="text-[10px] text-slate-400 block font-medium">Highest Combo</span>
              <span className="text-base font-bold text-fuchsia-300 font-mono tabular-nums">
                {results.maxCombo}x
              </span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5">
              <span className="text-[10px] text-slate-400 block font-medium">Flight Time</span>
              <span className="text-base font-bold text-emerald-300 font-mono tabular-nums">
                {Math.floor(results.timeSurvived)}s
              </span>
            </div>
          </div>

          {/* Unlocked Achievements in this run if any */}
          {results.achievementsUnlocked.length > 0 && (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-purple-950/50 border border-purple-500/40 text-left">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
              <div className="text-xs text-purple-200">
                <span className="font-bold">
                  {results.achievementsUnlocked.length} New Trophy Unlocked!
                </span>
              </div>
            </div>
          )}

          {/* Direct Certificate Launcher Banner */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenCertificate();
            }}
            className="flex items-center justify-between w-full p-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-amber-600/20 hover:from-amber-500/25 hover:to-amber-600/30 border border-amber-500/40 text-amber-200 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-left">
              <Award className="w-4 h-4 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-amber-300">Official Galactic Certificate</span>
                <span className="text-[10px] text-amber-200/70">Personalize with your name & download</span>
              </div>
            </div>
            <span className="text-xs font-bold bg-amber-500/30 px-2.5 py-1 rounded-lg text-amber-200">
              CLAIM &rarr;
            </span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2 shrink-0">
          {/* Play Again (Primary CTA) */}
          <button
            onClick={() => {
              sound.playClick();
              onPlayAgain();
            }}
            className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-indigo-500 hover:from-cyan-400 hover:via-fuchsia-400 hover:to-indigo-400 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-cyan-500/25 active:scale-98 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>PLAY AGAIN</span>
          </button>

          {/* Secondary Buttons Row */}
          <div className="flex items-center gap-2 w-full">
            <button
              onClick={() => {
                sound.playClick();
                onOpenWorlds();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-white font-semibold text-xs transition-all cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Select Realm</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onHome();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white font-semibold text-xs transition-all cursor-pointer"
            >
              <Home className="w-3.5 h-3.5 text-slate-400" />
              <span>Main Menu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Exquisite Creator Signature Lockup */}
      <div className="w-full shrink-0 pt-2">
        <CreatorBadge compact />
      </div>
    </div>
  );
};
