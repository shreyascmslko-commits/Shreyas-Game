/**
 * Types for Cosmic Gem Rush
 */

export type GameState = 'TITLE' | 'COUNTDOWN' | 'PLAYING' | 'PAUSED' | 'VICTORY' | 'GAME_OVER';

export type WorldId = 'crystal-valley' | 'neon-galaxy' | 'rainbow-nebula' | 'golden-temple' | 'cosmic-dimension';

export interface WorldConfig {
  id: WorldId;
  name: string;
  subtitle: string;
  description: string;
  unlockScoreRequired: number; // overall score or prior level clear to unlock
  targetScore: number; // score needed in this run to reach the portal / clear level
  baseSpeed: number;
  bgGradient: [string, string, string]; // Top, middle, bottom colors
  nebulaColors: string[];
  themeColor: string; // Primary accent (e.g. #06b6d4)
  accentColor: string; // Secondary accent (e.g. #a855f7)
  hazardTypes: ('asteroid' | 'laser-gate' | 'quantum-mine' | 'solar-flare' | 'void-singularity')[];
  specialFeature: string;
}

export type GemType = 'sapphire' | 'amethyst' | 'emerald' | 'ruby' | 'prismatic-star';

export interface GemConfig {
  type: GemType;
  name: string;
  points: number;
  color: string;
  glowColor: string;
  radius: number;
  weight: number; // spawn probability weight
}

export type PowerUpType = 'magnet' | 'shield' | 'speed-boost' | 'multiplier' | 'time-freeze';

export interface PowerUpConfig {
  type: PowerUpType;
  name: string;
  duration: number; // seconds (0 for instantaneous/stacking shield)
  color: string;
  glowColor: string;
  icon: string;
  description: string;
}

export interface ActivePowerUp {
  type: PowerUpType;
  remainingTime: number; // seconds
  totalTime: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface PlayerStats {
  highScore: number;
  worldHighScores: Record<WorldId, number>;
  unlockedWorlds: WorldId[];
  totalGemsCollected: number;
  gamesPlayed: number;
  maxCombo: number;
  achievements: Record<string, boolean>;
  settings: {
    sfxEnabled: boolean;
    musicEnabled: boolean;
    sfxVolume: number;
    musicVolume: number;
    reducedMotion: boolean;
    highContrast: boolean;
    controlMode: 'follow' | 'keys';
  };
}

export interface RunResults {
  score: number;
  isNewBest: boolean;
  gemsCollected: number;
  gemCounts: Record<GemType, number>;
  maxCombo: number;
  worldId: WorldId;
  timeSurvived: number; // seconds
  clearedLevel: boolean;
  achievementsUnlocked: string[];
}
