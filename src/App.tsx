/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/engine';
import { WorldId, RunResults, PlayerStats } from './game/types';
import { StorageManager } from './game/storage';
import { sound } from './game/audio';
import { TitleScreen } from './components/TitleScreen';
import { HUD } from './components/HUD';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { WorldSelectModal } from './components/WorldSelectModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { AchievementsModal } from './components/AchievementsModal';
import { CertificateModal } from './components/CertificateModal';
import { SettingsModal } from './components/SettingsModal';
import { Toast } from './components/Toast';

type ModalType = 'NONE' | 'WORLDS' | 'HOW_TO_PLAY' | 'ACHIEVEMENTS' | 'SETTINGS' | 'CERTIFICATE';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Stats & Settings
  const [stats, setStats] = useState<PlayerStats>(() => StorageManager.getStats());
  const [currentWorldId, setCurrentWorldId] = useState<WorldId>('crystal-valley');

  // Game UI State
  const [gameState, setGameState] = useState<'TITLE' | 'PLAYING' | 'PAUSED' | 'VICTORY' | 'GAME_OVER'>('TITLE');
  const [activeModal, setActiveModal] = useState<ModalType>('NONE');
  const [runResults, setRunResults] = useState<RunResults | null>(null);
  const [toastAchievement, setToastAchievement] = useState<string | null>(null);

  // HUD Real-time Values
  const [hudData, setHudData] = useState({
    score: 0,
    combo: 0,
    comboTimer: 0,
    comboDuration: 2.8,
    lives: 3,
    maxLives: 3,
    progressDistance: 0,
    activePowerUps: [] as any[],
    shieldActive: false,
  });

  // Audio state
  const [isMuted, setIsMuted] = useState(!stats.settings.sfxEnabled && !stats.settings.musicEnabled);

  // Sync HUD from engine
  const updateHUD = useCallback(() => {
    if (!engineRef.current) return;
    const eng = engineRef.current;
    setHudData({
      score: eng.score,
      combo: eng.combo,
      comboTimer: eng.comboTimer,
      comboDuration: eng.COMBO_DURATION,
      lives: eng.lives,
      maxLives: eng.maxLives,
      progressDistance: eng.progressDistance,
      activePowerUps: Array.from(eng.activePowerUps.values()),
      shieldActive: eng.shieldActive,
    });
  }, []);

  // Initialize engine
  useEffect(() => {
    if (!canvasRef.current) return;

    sound.setVolumes(stats.settings.sfxVolume, stats.settings.musicVolume);
    sound.setMuted(isMuted);

    const engine = new GameEngine(canvasRef.current, {
      onStateChange: (state, results) => {
        if (state === 'PLAYING') setGameState('PLAYING');
        if (state === 'PAUSED') setGameState('PAUSED');
        if (state === 'VICTORY' || state === 'GAME_OVER') {
          setGameState(state);
          if (results) {
            setRunResults(results);
            setStats(StorageManager.getStats());
          }
        }
      },
      onHUDUpdate: updateHUD,
      onAchievementUnlock: (id) => {
        setToastAchievement(id);
      },
    });

    engineRef.current = engine;

    return () => {
      engine.destroy();
      sound.stopMusic();
    };
  }, []);

  // Update settings helper
  const handleUpdateSettings = (newSettings: Partial<PlayerStats['settings']>) => {
    const updated = StorageManager.updateSettings(newSettings);
    setStats({ ...updated });
    if (newSettings.sfxEnabled !== undefined || newSettings.musicEnabled !== undefined) {
      const muted = !updated.settings.sfxEnabled && !updated.settings.musicEnabled;
      setIsMuted(muted);
      sound.setMuted(muted);
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sound.setMuted(nextMuted);
    handleUpdateSettings({
      sfxEnabled: !nextMuted,
      musicEnabled: !nextMuted,
    });
  };

  // Game Control actions
  const startGame = (worldId?: WorldId) => {
    const targetWorld = worldId || currentWorldId;
    setCurrentWorldId(targetWorld);
    setActiveModal('NONE');
    setRunResults(null);
    if (engineRef.current) {
      engineRef.current.startRun(targetWorld);
      updateHUD();
    }
  };

  const resumeGame = () => {
    engineRef.current?.resume();
  };

  const pauseGame = () => {
    engineRef.current?.pause();
  };

  const restartGame = () => {
    setActiveModal('NONE');
    setRunResults(null);
    engineRef.current?.restart();
    updateHUD();
  };

  const returnToTitle = () => {
    sound.stopMusic();
    setActiveModal('NONE');
    setGameState('TITLE');
    setRunResults(null);
    if (engineRef.current) {
      engineRef.current.state = 'READY';
      engineRef.current.handleResize();
    }
  };

  // Keyboard Shortcuts for quick instant play / restart
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (activeModal !== 'NONE') {
        if (e.key === 'Escape') {
          setActiveModal('NONE');
        }
        return;
      }

      if (gameState === 'TITLE') {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          startGame();
        }
      } else if (gameState === 'VICTORY' || gameState === 'GAME_OVER') {
        if (e.code === 'Space' || e.code === 'Enter' || e.key.toLowerCase() === 'r') {
          e.preventDefault();
          restartGame();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [gameState, activeModal, currentWorldId]);

  return (
    <div
      className={`relative w-screen h-screen overflow-hidden bg-[#050510] flex items-center justify-center ${
        stats.settings.highContrast ? 'high-contrast' : ''
      }`}
    >
      {/* 60FPS Game Canvas Viewport */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair touch-none"
      />

      {/* Real-time Achievement Toast */}
      <Toast
        achievementId={toastAchievement}
        onClear={() => setToastAchievement(null)}
      />

      {/* Screen Overlays State Machine */}
      {gameState === 'TITLE' && (
        <TitleScreen
          onPlay={() => startGame()}
          onOpenWorlds={() => setActiveModal('WORLDS')}
          onOpenHowToPlay={() => setActiveModal('HOW_TO_PLAY')}
          onOpenAchievements={() => setActiveModal('ACHIEVEMENTS')}
          onOpenCertificate={() => setActiveModal('CERTIFICATE')}
          onOpenSettings={() => setActiveModal('SETTINGS')}
          currentWorldId={currentWorldId}
          highScore={stats.highScore}
          totalGems={stats.totalGemsCollected}
          isMuted={isMuted}
          onToggleMute={toggleMute}
        />
      )}

      {gameState === 'PLAYING' && (
        <HUD
          score={hudData.score}
          combo={hudData.combo}
          comboTimer={hudData.comboTimer}
          comboDuration={hudData.comboDuration}
          lives={hudData.lives}
          maxLives={hudData.maxLives}
          progressDistance={hudData.progressDistance}
          worldId={currentWorldId}
          activePowerUps={hudData.activePowerUps}
          shieldActive={hudData.shieldActive}
          isMuted={isMuted}
          onToggleMute={toggleMute}
          onPause={pauseGame}
        />
      )}

      {gameState === 'PAUSED' && (
        <PauseModal
          onResume={resumeGame}
          onRestart={restartGame}
          onOpenWorlds={() => setActiveModal('WORLDS')}
          onHome={returnToTitle}
          isMuted={isMuted}
          onToggleMute={toggleMute}
        />
      )}

      {(gameState === 'VICTORY' || gameState === 'GAME_OVER') && runResults && (
        <GameOverModal
          results={runResults}
          highScore={stats.highScore}
          onPlayAgain={restartGame}
          onOpenWorlds={() => setActiveModal('WORLDS')}
          onOpenCertificate={() => setActiveModal('CERTIFICATE')}
          onHome={returnToTitle}
        />
      )}

      {/* Modals */}
      {activeModal === 'WORLDS' && (
        <WorldSelectModal
          currentWorldId={currentWorldId}
          unlockedWorlds={stats.unlockedWorlds}
          worldHighScores={stats.worldHighScores}
          onSelectWorld={(wId) => {
            setCurrentWorldId(wId);
            setActiveModal('NONE');
            if (gameState === 'PLAYING' || gameState === 'PAUSED') {
              startGame(wId);
            }
          }}
          onClose={() => setActiveModal('NONE')}
        />
      )}

      {activeModal === 'HOW_TO_PLAY' && (
        <HowToPlayModal onClose={() => setActiveModal('NONE')} />
      )}

      {activeModal === 'ACHIEVEMENTS' && (
        <AchievementsModal
          onClose={() => setActiveModal('NONE')}
          onOpenCertificate={() => setActiveModal('CERTIFICATE')}
        />
      )}

      {activeModal === 'CERTIFICATE' && (
        <CertificateModal
          highScore={stats.highScore}
          totalGems={stats.totalGemsCollected}
          highestWorldId={currentWorldId}
          onClose={() => setActiveModal('NONE')}
        />
      )}

      {activeModal === 'SETTINGS' && (
        <SettingsModal
          settings={stats.settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setActiveModal('NONE')}
        />
      )}
    </div>
  );
}
