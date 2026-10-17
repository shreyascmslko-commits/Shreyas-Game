import React from 'react';
import { X, Lock, CheckCircle2, Play, Trophy } from 'lucide-react';
import { WorldId } from '../game/types';
import { WORLDS, WORLD_ORDER } from '../game/constants';
import { sound } from '../game/audio';

interface WorldSelectModalProps {
  currentWorldId: WorldId;
  unlockedWorlds: WorldId[];
  worldHighScores: Record<WorldId, number>;
  onSelectWorld: (worldId: WorldId) => void;
  onClose: () => void;
}

export const WorldSelectModal: React.FC<WorldSelectModalProps> = ({
  currentWorldId,
  unlockedWorlds,
  worldHighScores,
  onSelectWorld,
  onClose,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none pointer-events-auto">
      <div className="w-full max-w-lg max-h-[90vh] rounded-2xl bg-slate-900 border border-slate-700/80 p-5 sm:p-6 flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-display tracking-wide uppercase">
              SELECT COSMIC REALM
            </h2>
            <p className="text-xs text-slate-400">Unlock worlds by reaching score milestones</p>
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

        {/* Worlds List */}
        <div className="flex flex-col gap-3 overflow-y-auto pr-1">
          {WORLD_ORDER.map((wId) => {
            const world = WORLDS[wId];
            const isUnlocked = unlockedWorlds.includes(wId);
            const isSelected = currentWorldId === wId;
            const highScore = worldHighScores[wId] || 0;

            return (
              <div
                key={wId}
                onClick={() => {
                  if (isUnlocked) {
                    sound.playClick();
                    onSelectWorld(wId);
                  }
                }}
                className={`relative rounded-xl p-4 border transition-all text-left ${
                  isUnlocked
                    ? isSelected
                      ? 'bg-slate-800/90 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-600 hover:bg-slate-850 cursor-pointer'
                    : 'bg-slate-950/40 border-slate-800/40 opacity-60 cursor-not-allowed'
                }`}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: world.themeColor,
                        boxShadow: isUnlocked ? `0 0 10px ${world.themeColor}` : 'none',
                      }}
                    />
                    <h3 className="font-bold text-white text-base font-display">{world.name}</h3>
                    {isSelected && (
                      <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold px-2 py-0.5 rounded-full">
                        ACTIVE
                      </span>
                    )}
                  </div>

                  {isUnlocked ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        sound.playClick();
                        onSelectWorld(wId);
                      }}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-cyan-300" />
                      <span>START</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 text-slate-500 text-xs font-semibold">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Unlock at {world.unlockScoreRequired.toLocaleString()} pts</span>
                    </div>
                  )}
                </div>

                {/* Subtitle & Description */}
                <p className="text-xs text-slate-300 font-medium mb-1">{world.subtitle}</p>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-3">{world.description}</p>

                {/* Footer details */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/70 pt-2 font-mono">
                  <div className="flex items-center gap-1 text-amber-300">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>Best: {highScore.toLocaleString()}</span>
                  </div>
                  <div>
                    <span>Portal at: </span>
                    <span className="text-slate-200 font-semibold">{world.targetScore.toLocaleString()} pts</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
