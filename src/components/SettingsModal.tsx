import React from 'react';
import { X, Volume2, VolumeX, Eye, Sparkles, Navigation } from 'lucide-react';
import { PlayerStats } from '../game/types';
import { sound } from '../game/audio';

interface SettingsModalProps {
  settings: PlayerStats['settings'];
  onUpdateSettings: (newSettings: Partial<PlayerStats['settings']>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none pointer-events-auto">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700/80 p-5 sm:p-6 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-display tracking-wide uppercase">
              SETTINGS
            </h2>
            <p className="text-xs text-slate-400">Audio, controls, and accessibility options</p>
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

        {/* Settings Body */}
        <div className="flex flex-col gap-4 text-left">
          {/* Audio Section */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Volume2 className="w-4 h-4" />
              <span>AUDIO CONTROLS</span>
            </h3>

            {/* Mute Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium">Mute All Audio</span>
              <button
                onClick={() => {
                  const newMuted = settings.sfxEnabled;
                  onUpdateSettings({ sfxEnabled: !newMuted, musicEnabled: !newMuted });
                  sound.setMuted(!newMuted);
                  sound.playClick();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  !settings.sfxEnabled
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                }`}
              >
                {!settings.sfxEnabled ? 'MUTED' : 'UNMUTED'}
              </button>
            </div>

            {/* SFX Volume */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Sound Effects (SFX)</span>
                <span className="font-mono text-cyan-300 font-bold">{Math.round(settings.sfxVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.sfxVolume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdateSettings({ sfxVolume: val });
                  sound.setVolumes(val, settings.musicVolume);
                }}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Music Volume */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Procedural Cosmic Music</span>
                <span className="font-mono text-purple-300 font-bold">{Math.round(settings.musicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.musicVolume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdateSettings({ musicVolume: val });
                  sound.setVolumes(settings.sfxVolume, val);
                }}
                className="w-full accent-purple-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Accessibility & Visuals */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              <span>VISUALS & ACCESSIBILITY</span>
            </h3>

            {/* High Contrast */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-300 font-medium block">High Contrast Mode</span>
                <span className="text-[10px] text-slate-400">Boosts brightness & entity edges</span>
              </div>
              <button
                onClick={() => {
                  sound.playClick();
                  onUpdateSettings({ highContrast: !settings.highContrast });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  settings.highContrast
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                }`}
              >
                {settings.highContrast ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Reduced Motion */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-300 font-medium block">Reduced Motion</span>
                <span className="text-[10px] text-slate-400">Softens screen shakes & camera warp</span>
              </div>
              <button
                onClick={() => {
                  sound.playClick();
                  onUpdateSettings({ reducedMotion: !settings.reducedMotion });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  settings.reducedMotion
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                }`}
              >
                {settings.reducedMotion ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
