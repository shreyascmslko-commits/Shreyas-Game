import { PlayerStats, WorldId, GemType } from './types';
import { ACHIEVEMENTS, WORLDS, WORLD_ORDER } from './constants';

const STORAGE_KEY = 'cosmic_gem_rush_save_v1';

const DEFAULT_STATS: PlayerStats = {
  highScore: 0,
  worldHighScores: {
    'crystal-valley': 0,
    'neon-galaxy': 0,
    'rainbow-nebula': 0,
    'golden-temple': 0,
    'cosmic-dimension': 0,
  },
  unlockedWorlds: ['crystal-valley'],
  totalGemsCollected: 0,
  gamesPlayed: 0,
  maxCombo: 0,
  achievements: {},
  settings: {
    sfxEnabled: true,
    musicEnabled: true,
    sfxVolume: 0.75,
    musicVolume: 0.5,
    reducedMotion: false,
    highContrast: false,
    controlMode: 'follow',
  },
};

export class StorageManager {
  private static cachedStats: PlayerStats | null = null;

  public static getStats(): PlayerStats {
    if (this.cachedStats) return this.cachedStats;

    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        const loadedStats: PlayerStats = {
          ...DEFAULT_STATS,
          ...parsed,
          worldHighScores: {
            ...DEFAULT_STATS.worldHighScores,
            ...(parsed.worldHighScores || {}),
          },
          settings: {
            ...DEFAULT_STATS.settings,
            ...(parsed.settings || {}),
          },
          achievements: {
            ...(parsed.achievements || {}),
          },
        };
        this.cachedStats = loadedStats;
        return loadedStats;
      }
    } catch {
      // Fallback if localStorage is disabled or throws
    }

    const defaultStats: PlayerStats = { ...DEFAULT_STATS };
    this.cachedStats = defaultStats;
    return defaultStats;
  }

  public static saveStats(stats: PlayerStats): void {
    this.cachedStats = stats;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch {
      // Ignore write errors in sandboxed storage
    }
  }

  public static updateSettings(newSettings: Partial<PlayerStats['settings']>): PlayerStats {
    const stats = this.getStats();
    stats.settings = { ...stats.settings, ...newSettings };
    this.saveStats(stats);
    return stats;
  }

  public static recordRun(results: {
    score: number;
    worldId: WorldId;
    gemsCollected: number;
    gemCounts: Record<GemType, number>;
    maxCombo: number;
    shieldUsed: boolean;
    speedBoostUsed: boolean;
  }): {
    isNewBest: boolean;
    newAchievements: string[];
    newUnlockedWorlds: WorldId[];
  } {
    const stats = this.getStats();
    const isNewBest = results.score > stats.highScore;

    if (results.score > stats.highScore) {
      stats.highScore = results.score;
    }

    if (results.score > (stats.worldHighScores[results.worldId] || 0)) {
      stats.worldHighScores[results.worldId] = results.score;
    }

    stats.totalGemsCollected += results.gemsCollected;
    stats.gamesPlayed += 1;
    if (results.maxCombo > stats.maxCombo) {
      stats.maxCombo = results.maxCombo;
    }

    // Check world unlocks based on score
    const newUnlockedWorlds: WorldId[] = [];
    WORLD_ORDER.forEach((wId) => {
      const world = WORLDS[wId];
      if (!stats.unlockedWorlds.includes(wId)) {
        if (stats.highScore >= world.unlockScoreRequired) {
          stats.unlockedWorlds.push(wId);
          newUnlockedWorlds.push(wId);
        }
      }
    });

    // Check achievements
    const newAchievements: string[] = [];
    const checkUnlock = (id: string, condition: boolean) => {
      if (condition && !stats.achievements[id]) {
        stats.achievements[id] = true;
        newAchievements.push(id);
      }
    };

    checkUnlock('first_gem', results.gemsCollected >= 1);
    checkUnlock('gem_100', stats.totalGemsCollected >= 100);
    checkUnlock('gem_500', stats.totalGemsCollected >= 500);
    checkUnlock('combo_5', results.maxCombo >= 5);
    checkUnlock('combo_15', results.maxCombo >= 15);
    checkUnlock('combo_30', results.maxCombo >= 30);
    checkUnlock('shield_save', results.shieldUsed);
    checkUnlock('hyper_warp', results.speedBoostUsed);
    checkUnlock('unlock_neon', stats.unlockedWorlds.includes('neon-galaxy'));
    checkUnlock('unlock_rainbow', stats.unlockedWorlds.includes('rainbow-nebula'));
    checkUnlock('unlock_golden', stats.unlockedWorlds.includes('golden-temple'));
    checkUnlock('unlock_dimension', stats.unlockedWorlds.includes('cosmic-dimension'));
    checkUnlock('score_2500', results.score >= 2500);
    checkUnlock('score_5000', results.score >= 5000);

    this.saveStats(stats);

    return {
      isNewBest,
      newAchievements,
      newUnlockedWorlds,
    };
  }

  public static getAchievementsList(): { achievement: (typeof ACHIEVEMENTS)[0]; unlocked: boolean }[] {
    const stats = this.getStats();
    return ACHIEVEMENTS.map((a) => ({
      achievement: a,
      unlocked: !!stats.achievements[a.id],
    }));
  }
}
