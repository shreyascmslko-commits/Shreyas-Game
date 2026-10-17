import React from 'react';
import { Play, Globe, HelpCircle, Trophy, Settings, Volume2, VolumeX, Award } from 'lucide-react';
import { WorldId } from '../game/types';
import { WORLDS } from '../game/constants';
import { sound } from '../game/audio';
import { CreatorBadge } from './CreatorBadge';

interface TitleScreenProps {
  onPlay: () => void;
  onOpenWorlds: () => void;
  onOpenHowToPlay: () => void;
  onOpenAchievements: () => void;
  onOpenCertificate: () => void;
  onOpenSettings: () => void;
  currentWorldId: WorldId;
  highScore: number;
  totalGems: number;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onPlay,
  onOpenWorlds,
  onOpenHowToPlay,
  onOpenAchievements,
  onOpenCertificate,
  onOpenSettings,
  currentWorldId,
  highScore,
  totalGems,
  isMuted,
  onToggleMute,
}) => {
  const currentWorld = WORLDS[currentWorldId];

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-between p-4 sm:p-6 select-none pointer-events-auto overflow-y-auto">
      {/* Top Bar Utilities */}
      <div className="w-full max-w-4xl flex items-center justify-between text-xs font-medium tracking-wide shrink-0 mb-2">
        {/* World Badge */}
        <button
          onClick={() => {
            sound.playClick();
            onOpenWorlds();
          }}
          className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 hover:border-cyan-400/60 text-slate-200 transition-all cursor-pointer backdrop-blur-sm"
        >
          <span
            className="w-2.5 h-2.5 rounded-full shadow-sm"
            style={{ backgroundColor: currentWorld.themeColor, boxShadow: `0 0 8px ${currentWorld.themeColor}` }}
          />
          <span className="font-semibold">{currentWorld.name}</span>
          <span className="text-slate-400 group-hover:text-cyan-300 transition-colors">Change &rarr;</span>
        </button>

        {/* Top Right Quick Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playClick();
              onOpenCertificate();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 hover:border-amber-400 text-amber-300 transition-all cursor-pointer backdrop-blur-sm font-semibold text-xs"
            title="Official Galactic Certificate"
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Certificate</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onToggleMute();
            }}
            className="p-2 rounded-full bg-slate-900/80 border border-slate-700/60 hover:border-slate-500 text-slate-300 hover:text-white transition-all cursor-pointer backdrop-blur-sm"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenSettings();
            }}
            className="p-2 rounded-full bg-slate-900/80 border border-slate-700/60 hover:border-slate-500 text-slate-300 hover:text-white transition-all cursor-pointer backdrop-blur-sm"
            title="Settings"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero Centerpiece */}
      <div className="flex flex-col items-center text-center my-auto py-2 max-w-xl shrink-0">
        {/* Bespoke Glowing SVG Title Lockup */}
        <div className="relative mb-2 flex flex-col items-center">
          <svg className="w-64 sm:w-80 md:w-[420px] h-auto drop-shadow-[0_0_35px_rgba(6,182,212,0.5)]" viewBox="0 0 500 130" fill="none">
            <defs>
              <linearGradient id="cosmicGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="35%" stopColor="#ec4899" />
                <stop offset="70%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#fef08a" />
              </linearGradient>
              <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Sparkle Stars in Logo */}
            <path d="M 50,25 Q 50,40 35,40 Q 50,40 50,55 Q 50,40 65,40 Q 50,40 50,25" fill="#fef08a" opacity="0.9" />
            <path d="M 445,30 Q 445,42 433,42 Q 445,42 445,54 Q 445,42 457,42 Q 445,42 445,30" fill="#38bdf8" opacity="0.9" />

            {/* Title Text */}
            <text
              x="250"
              y="58"
              textAnchor="middle"
              fill="url(#cosmicGrad)"
              filter="url(#glowFilter)"
              fontFamily="'Outfit', sans-serif"
              fontWeight="900"
              fontSize="48"
              letterSpacing="3"
            >
              COSMIC GEM
            </text>
            <text
              x="250"
              y="112"
              textAnchor="middle"
              fill="#ffffff"
              fontFamily="'Outfit', sans-serif"
              fontWeight="900"
              fontSize="52"
              letterSpacing="6"
              stroke="#0f172a"
              strokeWidth="2"
            >
              RUSH
            </text>
          </svg>

          {/* Subtitle / Atmosphere line */}
          <p className="text-xs sm:text-sm text-cyan-200/90 font-medium tracking-wider mt-0.5">
            Collect Magical Gems · Dodge Cosmic Hazards · Unleash Hyper Warp
          </p>
        </div>

        {/* Stats Pill Bar (Clean unboxed metadata) */}
        <div className="flex items-center gap-3 text-xs text-slate-300 bg-slate-900/70 border border-slate-700/50 rounded-full px-4 sm:px-5 py-1.5 mb-5 backdrop-blur-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">High Score</span>
            <span className="font-bold text-amber-300 font-mono tabular-nums">{highScore.toLocaleString()}</span>
          </div>
          <span className="text-slate-600" aria-hidden="true">·</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Gems Collected</span>
            <span className="font-bold text-cyan-300 font-mono tabular-nums">{totalGems.toLocaleString()}</span>
          </div>
        </div>

        {/* Primary Start CTA Button */}
        <button
          onClick={() => {
            sound.playClick();
            onPlay();
          }}
          className="group relative flex items-center justify-center gap-3 w-52 sm:w-64 py-3.5 sm:py-4 px-8 rounded-2xl bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-indigo-500 hover:from-cyan-400 hover:via-fuchsia-400 hover:to-indigo-400 text-white font-extrabold text-base sm:text-xl shadow-[0_0_35px_rgba(6,182,212,0.4)] hover:shadow-[0_0_50px_rgba(236,72,153,0.6)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
        >
          <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-white" />
          <span>PLAY NOW</span>
          <span className="absolute -inset-0.5 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        {/* Single flat control-hint line */}
        <div className="text-[11px] sm:text-xs text-slate-400 mt-2.5 font-mono">
          Press <span className="text-cyan-300 font-semibold">Space</span> or <span className="text-cyan-300 font-semibold">Enter</span> to Start · <span className="text-slate-300">WASD / Touch & Drag</span>
        </div>

        {/* Secondary Navigation Row */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-5">
          <button
            onClick={() => {
              sound.playClick();
              onOpenWorlds();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/70 border border-slate-700 hover:border-cyan-400 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
          >
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>Worlds</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenHowToPlay();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/70 border border-slate-700 hover:border-fuchsia-400 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-fuchsia-400" />
            <span>How to Play</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenAchievements();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/70 border border-slate-700 hover:border-amber-400 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Awards & Trophies</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenCertificate();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/70 border border-amber-500/50 hover:border-amber-400 hover:bg-slate-800 text-xs font-semibold text-amber-300 transition-all cursor-pointer"
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span>Get Certificate</span>
          </button>
        </div>
      </div>

      {/* Exquisite Creator Signature Lockup */}
      <div className="w-full shrink-0 pt-2">
        <CreatorBadge />
      </div>
    </div>
  );
};
