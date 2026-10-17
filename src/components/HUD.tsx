import React from 'react';
import { Pause, Heart, Volume2, VolumeX, Magnet, Shield, Zap, Sparkles, Hourglass } from 'lucide-react';
import { WorldId, ActivePowerUp, PowerUpType } from '../game/types';
import { WORLDS, POWER_UPS } from '../game/constants';
import { sound } from '../game/audio';
import { CreatorBadge } from './CreatorBadge';

interface HUDProps {
  score: number;
  combo: number;
  comboTimer: number;
  comboDuration: number;
  lives: number;
  maxLives: number;
  progressDistance: number;
  worldId: WorldId;
  activePowerUps: ActivePowerUp[];
  shieldActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  score,
  combo,
  comboTimer,
  comboDuration,
  lives,
  maxLives,
  progressDistance,
  worldId,
  activePowerUps,
  shieldActive,
  isMuted,
  onToggleMute,
  onPause,
}) => {
  const world = WORLDS[worldId];
  const comboPercent = combo > 0 ? Math.max(0, Math.min(100, (comboTimer / comboDuration) * 100)) : 0;
  const progressPercent = Math.min(100, Math.round(progressDistance * 100));

  const renderPowerUpIcon = (type: PowerUpType) => {
    switch (type) {
      case 'magnet':
        return <Magnet className="w-3.5 h-3.5 text-sky-400" />;
      case 'shield':
        return <Shield className="w-3.5 h-3.5 text-emerald-400" />;
      case 'speed-boost':
        return <Zap className="w-3.5 h-3.5 text-amber-400" />;
      case 'multiplier':
        return <Sparkles className="w-3.5 h-3.5 text-rose-400" />;
      case 'time-freeze':
        return <Hourglass className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col justify-between p-3 sm:p-5">
      {/* Top Perimeter Cluster */}
      <div className="w-full flex items-start justify-between gap-3">
        {/* Left: World Info & Warp Progress */}
        <div className="flex flex-col gap-1 pointer-events-auto">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: world.themeColor, boxShadow: `0 0 8px ${world.themeColor}` }}
            />
            <span className="text-xs sm:text-sm font-bold text-white tracking-wide uppercase font-display drop-shadow">
              {world.name}
            </span>
          </div>

          {/* Warp Portal Distance Progress Bar */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800/80 px-2 py-1 rounded-lg w-28 sm:w-36">
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-200"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: world.themeColor,
                  boxShadow: `0 0 6px ${world.themeColor}`,
                }}
              />
            </div>
            <span className="text-[10px] font-mono text-slate-300 tabular-nums font-bold">
              {progressPercent}%
            </span>
          </div>
        </div>

        {/* Center: Score & Dynamic Combo Meter */}
        <div className="flex flex-col items-center">
          <div className="text-2xl sm:text-3xl font-black text-white font-mono tabular-nums tracking-wider drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
            {score.toLocaleString()}
          </div>

          {/* Combo Badge & Timer Line */}
          {combo > 1 && (
            <div className="flex flex-col items-center mt-0.5 animate-bounce">
              <span className="text-xs sm:text-sm font-black font-display tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-400 to-cyan-400 drop-shadow">
                {combo}X COMBO
              </span>
              <div className="w-20 sm:w-24 bg-slate-900/80 border border-slate-700/60 h-1.5 rounded-full overflow-hidden mt-0.5">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-rose-400 rounded-full transition-all duration-75"
                  style={{ width: `${comboPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right: Lives & Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Hearts */}
          <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800/80 px-2.5 py-1.5 rounded-lg">
            {Array.from({ length: maxLives }).map((_, i) => (
              <Heart
                key={i}
                className={`w-4 h-4 transition-all ${
                  i < lives
                    ? 'text-rose-500 fill-rose-500 drop-shadow-[0_0_6px_rgba(244,63,94,0.7)]'
                    : 'text-slate-700 fill-slate-900'
                }`}
              />
            ))}
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              sound.playClick();
              onToggleMute();
            }}
            className="p-1.5 sm:p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 hover:border-slate-600 text-slate-300 hover:text-white transition-all cursor-pointer"
            title={isMuted ? 'Unmute' : 'Mute'}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* Pause Button */}
          <button
            onClick={() => {
              sound.playClick();
              onPause();
            }}
            className="p-1.5 sm:p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 hover:border-slate-600 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Pause (Esc)"
            aria-label="Pause"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active Power-Ups Row (Below Top Bar) */}
      <div className="flex items-center justify-center gap-2 mt-2">
        {shieldActive && (
          <div className="flex items-center gap-1.5 bg-slate-950/85 border border-emerald-500/50 px-2.5 py-1 rounded-full text-xs text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
            <Shield className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="font-semibold text-[11px]">SHIELD ACTIVE</span>
          </div>
        )}

        {activePowerUps.map((p) => {
          const config = POWER_UPS[p.type];
          const remaining = Math.max(0, p.remainingTime).toFixed(1);
          return (
            <div
              key={p.type}
              className="flex items-center gap-1.5 bg-slate-950/85 border px-2.5 py-1 rounded-full text-xs shadow-md"
              style={{ borderColor: `${config.color}80` }}
            >
              {renderPowerUpIcon(p.type)}
              <span className="font-bold text-[11px] text-white uppercase">{config.name}</span>
              <span className="font-mono text-[10px] text-slate-300 tabular-nums font-semibold">{remaining}s</span>
            </div>
          );
        })}
      </div>

      {/* Bottom Area - Unobtrusive & Clean */}
      <div className="w-full flex flex-col items-center justify-center pb-1 gap-0.5 pointer-events-none">
        <span className="text-[10px] text-slate-500/70 tracking-widest font-mono">
          DRAG / WASD TO NAVIGATE
        </span>
        <CreatorBadge compact className="opacity-75" />
      </div>
    </div>
  );
};
