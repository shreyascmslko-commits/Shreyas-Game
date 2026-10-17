import React from 'react';
import { X, Magnet, Shield, Zap, Sparkles, Hourglass, MousePointer, Keyboard, Touchpad, AlertTriangle } from 'lucide-react';
import { GEMS, POWER_UPS } from '../game/constants';
import { sound } from '../game/audio';

interface HowToPlayModalProps {
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none pointer-events-auto">
      <div className="w-full max-w-lg max-h-[90vh] rounded-2xl bg-slate-900 border border-slate-700/80 p-5 sm:p-6 flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-display tracking-wide uppercase">
              HOW TO PLAY
            </h2>
            <p className="text-xs text-slate-400">Master cosmic navigation and collect magical gems</p>
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

        {/* Content Body */}
        <div className="flex flex-col gap-5 overflow-y-auto pr-1 text-left">
          {/* Controls Section */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Touchpad className="w-4 h-4" />
              <span>CONTROLS (DESKTOP & MOBILE)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <MousePointer className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  <strong>Touch & Drag / Mouse:</strong> Astra follows pointer smoothly
                </span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <Keyboard className="w-4 h-4 text-fuchsia-400 shrink-0" />
                <span>
                  <strong>WASD / Arrow Keys:</strong> Direct directional navigation
                </span>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 mt-2 font-mono">
              Press <strong>Esc</strong> or tap <strong>Pause</strong> to freeze time · <strong>Space / Enter</strong> to restart
            </div>
          </div>

          {/* Collectible Gems */}
          <div>
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2.5">
              MAGICAL GEMS & VALUES
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.values(GEMS).map((gem) => (
                <div
                  key={gem.type}
                  className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800"
                >
                  <span
                    className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: gem.color, boxShadow: `0 0 8px ${gem.glowColor}` }}
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white leading-tight">{gem.name}</span>
                    <span className="text-[11px] font-mono font-bold" style={{ color: gem.color }}>
                      +{gem.points} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Power-Ups */}
          <div>
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2.5">
              POWER-UPS
            </h3>
            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                <Magnet className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Cosmic Magnet:</strong> Automatically attracts all nearby gems from a wide radius.
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Astral Shield:</strong> Grants a shimmering protective barrier that absorbs 1 collision safely.
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Hyper Warp:</strong> Blazes across the stars with extreme invincibility, absorbing everything.
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                <Sparkles className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Gem Multiplier 2X:</strong> Doubles all gem points collected while active.
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                <Hourglass className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Chronos Freeze:</strong> Slows down moving obstacles and hazards by 70%.
                </div>
              </div>
            </div>
          </div>

          {/* Hazards & Combos */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-300">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>DODGING & COMBO MULTIPLIER</span>
            </h3>
            <ul className="list-disc pl-4 space-y-1.5 text-slate-300">
              <li>
                <strong>Combos:</strong> Collect gems consecutively without delay to build up to a 5x score multiplier!
              </li>
              <li>
                <strong>Telegraphed Hazards:</strong> Laser gates display warning dashed lines before energizing. Asteroids and mines can cost you a life.
              </li>
              <li>
                <strong>Warp Portal:</strong> Fill the level progress meter to summon the Interstellar Portal and voyage to new realms!
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
