import React from 'react';
import { Play, RotateCcw, Globe, Home, Volume2, VolumeX } from 'lucide-react';
import { sound } from '../game/audio';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onOpenWorlds: () => void;
  onHome: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onOpenWorlds,
  onHome,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none pointer-events-auto">
      <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700/80 p-6 flex flex-col items-center text-center shadow-2xl">
        <h2 className="text-2xl font-black tracking-wider text-white font-display mb-1 uppercase">
          GAME PAUSED
        </h2>
        <p className="text-xs text-slate-400 mb-6">Take a cosmic breath and jump back in</p>

        {/* Buttons List */}
        <div className="w-full flex flex-col gap-2.5">
          {/* Primary Resume */}
          <button
            onClick={() => {
              sound.playClick();
              onResume();
            }}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/20 active:scale-98 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>RESUME (ESC / SPACE)</span>
          </button>

          {/* Restart */}
          <button
            onClick={() => {
              sound.playClick();
              onRestart();
            }}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-white font-semibold text-sm transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>RESTART VOYAGE</span>
          </button>

          {/* Change World */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenWorlds();
            }}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-white font-semibold text-sm transition-all cursor-pointer"
          >
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>CHANGE WORLD</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              sound.playClick();
              onToggleMute();
            }}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-white font-semibold text-sm transition-all cursor-pointer"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-rose-400" />
                <span>SOUND MUTED</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>SOUND ON</span>
              </>
            )}
          </button>

          {/* Home */}
          <button
            onClick={() => {
              sound.playClick();
              onHome();
            }}
            className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-xl bg-transparent hover:bg-slate-800/60 text-slate-400 hover:text-white font-medium text-xs transition-all cursor-pointer mt-1"
          >
            <Home className="w-4 h-4" />
            <span>RETURN TO MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
