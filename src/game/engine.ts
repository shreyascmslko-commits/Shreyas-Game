import { WorldId, GemType, PowerUpType, ActivePowerUp, RunResults } from './types';
import { WORLDS, GEMS, POWER_UPS, WORLD_ORDER } from './constants';
import { sound } from './audio';
import { StorageManager } from './storage';

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  color: string;
  twinklePhase: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  shape?: 'circle' | 'spark' | 'ring' | 'shard';
  rotation?: number;
  rotSpeed?: number;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  scale: number;
  vy: number;
}

interface GemEntity {
  x: number;
  y: number;
  type: GemType;
  radius: number;
  rotation: number;
  rotSpeed: number;
  bobPhase: number;
  points: number;
  color: string;
  glowColor: string;
  collected: boolean;
}

interface HazardEntity {
  x: number;
  y: number;
  type: 'asteroid' | 'laser-gate' | 'quantum-mine' | 'solar-flare';
  width: number;
  height: number;
  vx: number;
  vy: number;
  rotation: number;
  rotSpeed: number;
  phase: number;
  points?: { x: number; y: number }[]; // For jagged asteroid vertices
  laserActive?: boolean;
  telegraphTimer?: number;
}

interface PowerUpEntity {
  x: number;
  y: number;
  type: PowerUpType;
  radius: number;
  rotation: number;
  bobPhase: number;
  collected: boolean;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animFrameId: number | null = null;
  private isDestroyed = false;

  // Viewport
  public width: number = 800;
  public height: number = 600;
  private dpr: number = 1;

  // Game state
  public state: 'READY' | 'PLAYING' | 'PAUSED' | 'VICTORY' | 'GAME_OVER' = 'READY';
  public currentWorldId: WorldId = 'crystal-valley';
  public score: number = 0;
  public gemsCollected: number = 0;
  public gemCounts: Record<GemType, number> = {
    sapphire: 0,
    amethyst: 0,
    emerald: 0,
    ruby: 0,
    'prismatic-star': 0,
  };
  public combo: number = 0;
  public maxCombo: number = 0;
  public comboTimer: number = 0; // seconds remaining
  public readonly COMBO_DURATION = 2.8;

  public lives: number = 3;
  public maxLives: number = 3;
  public invulnerabilityTimer: number = 0; // seconds

  public runTime: number = 0;
  public progressDistance: number = 0; // 0 to 1 toward world portal

  // Active power-ups
  public activePowerUps: Map<PowerUpType, ActivePowerUp> = new Map();
  public shieldActive: boolean = false;
  private shieldUsedThisRun = false;
  private speedBoostUsedThisRun = false;

  // Player Character ("Astra")
  public player = {
    x: 400,
    y: 450,
    targetX: 400,
    targetY: 450,
    radius: 22,
    vx: 0,
    vy: 0,
    tilt: 0,
    squash: 1,
    stretch: 1,
    eyeBlink: 0,
    isHappy: 0, // timer for happy face after gem
  };

  // Entities
  private stars: Star[] = [];
  private gems: GemEntity[] = [];
  private hazards: HazardEntity[] = [];
  private powerUps: PowerUpEntity[] = [];
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];

  // Spawners & Timers
  private gemSpawnTimer: number = 0;
  private hazardSpawnTimer: number = 0;
  private powerUpSpawnTimer: number = 0;
  private portalEntity: { x: number; y: number; active: boolean; radius: number } = {
    x: 400,
    y: -100,
    active: false,
    radius: 70,
  };

  // Feedback & Juice
  private cameraShake: number = 0;
  private hitstopTimer: number = 0;
  private bannerText: { text: string; subtext: string; alpha: number; scale: number } | null = null;

  // Controls
  private keys: Record<string, boolean> = {};
  private inputMode: 'follow' | 'keys' = 'follow';
  private touchActive: boolean = false;

  // Callbacks
  private onStateChange?: (state: GameEngine['state'], results?: RunResults) => void;
  private onHUDUpdate?: () => void;
  private onAchievementUnlock?: (achievementId: string) => void;

  constructor(
    canvas: HTMLCanvasElement,
    callbacks?: {
      onStateChange?: (state: GameEngine['state'], results?: RunResults) => void;
      onHUDUpdate?: () => void;
      onAchievementUnlock?: (achievementId: string) => void;
    }
  ) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D canvas context');
    this.ctx = context;

    this.onStateChange = callbacks?.onStateChange;
    this.onHUDUpdate = callbacks?.onHUDUpdate;
    this.onAchievementUnlock = callbacks?.onAchievementUnlock;

    this.handleResize();
    this.initStars();
    this.setupListeners();
  }

  // --- RESIZE & SETUP ---

  public handleResize = () => {
    const rect = this.canvas.parentElement?.getBoundingClientRect() || this.canvas.getBoundingClientRect();
    this.width = Math.max(320, Math.floor(rect.width));
    this.height = Math.max(480, Math.floor(rect.height));
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.resetTransform?.();
    this.ctx.scale(this.dpr, this.dpr);

    if (this.state === 'READY') {
      this.player.x = this.width / 2;
      this.player.y = this.height * 0.72;
      this.player.targetX = this.player.x;
      this.player.targetY = this.player.y;
    }
  };

  private initStars() {
    this.stars = [];
    const count = 120;
    const colors = ['#ffffff', '#bae6fd', '#fbcfe8', '#fef08a', '#c7d2fe'];

    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() < 0.7 ? Math.random() * 1.5 + 0.5 : Math.random() * 2.8 + 1.2,
        speed: Math.random() * 45 + 15,
        color: colors[Math.floor(Math.random() * colors.length)],
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }
  }

  private setupListeners() {
    window.addEventListener('resize', this.handleResize);

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    this.canvas.addEventListener('pointerup', this.handlePointerUp);
    this.canvas.addEventListener('pointercancel', this.handlePointerUp);

    // Prevent scrolling / gesture interference
    this.canvas.addEventListener(
      'touchstart',
      (e) => {
        if (e.cancelable) e.preventDefault();
      },
      { passive: false }
    );
    this.canvas.addEventListener(
      'touchmove',
      (e) => {
        if (e.cancelable) e.preventDefault();
      },
      { passive: false }
    );
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  // --- INPUT HANDLING ---

  private handleKeyDown = (e: KeyboardEvent) => {
    sound.ensureAudio();
    this.keys[e.key.toLowerCase()] = true;
    this.keys[e.code] = true;

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
      this.inputMode = 'keys';
    }

    if (e.code === 'Escape' || e.key === 'p' || e.key === 'P') {
      if (this.state === 'PLAYING') {
        this.pause();
      } else if (this.state === 'PAUSED') {
        this.resume();
      }
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.key.toLowerCase()] = false;
    this.keys[e.code] = false;
  };

  private handlePointerDown = (e: PointerEvent) => {
    sound.ensureAudio();
    this.touchActive = true;
    this.inputMode = 'follow';
    this.updatePointerTarget(e);
  };

  private handlePointerMove = (e: PointerEvent) => {
    if (this.inputMode === 'follow' || this.touchActive) {
      this.updatePointerTarget(e);
    }
  };

  private handlePointerUp = () => {
    this.touchActive = false;
  };

  private updatePointerTarget(e: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Constrain within playfield padding
    this.player.targetX = Math.max(30, Math.min(this.width - 30, x));
    this.player.targetY = Math.max(40, Math.min(this.height - 40, y));
  }

  // --- GAME LIFECYCLE ---

  public startRun(worldId: WorldId) {
    sound.ensureAudio();
    this.currentWorldId = worldId;
    this.state = 'PLAYING';

    this.score = 0;
    this.gemsCollected = 0;
    this.gemCounts = {
      sapphire: 0,
      amethyst: 0,
      emerald: 0,
      ruby: 0,
      'prismatic-star': 0,
    };
    this.combo = 0;
    this.maxCombo = 0;
    this.comboTimer = 0;
    this.lives = this.maxLives;
    this.invulnerabilityTimer = 0;
    this.runTime = 0;
    this.progressDistance = 0;

    this.activePowerUps.clear();
    this.shieldActive = false;
    this.shieldUsedThisRun = false;
    this.speedBoostUsedThisRun = false;

    this.player.x = this.width / 2;
    this.player.y = this.height * 0.75;
    this.player.targetX = this.player.x;
    this.player.targetY = this.player.y;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.tilt = 0;
    this.player.squash = 1;
    this.player.stretch = 1;

    this.gems = [];
    this.hazards = [];
    this.powerUps = [];
    this.particles = [];
    this.floatingTexts = [];
    this.cameraShake = 0;
    this.hitstopTimer = 0;
    this.portalEntity = { x: this.width / 2, y: -120, active: false, radius: 75 };

    this.gemSpawnTimer = 0.4;
    this.hazardSpawnTimer = 1.2;
    this.powerUpSpawnTimer = 6.0;

    this.bannerText = {
      text: WORLDS[worldId].name.toUpperCase(),
      subtext: WORLDS[worldId].subtitle,
      alpha: 1,
      scale: 1,
    };

    sound.startMusic(worldId);
    this.onStateChange?.('PLAYING');
    this.onHUDUpdate?.();

    if (!this.animFrameId) {
      this.lastTime = performance.now();
      this.loop(this.lastTime);
    }
  }

  public pause() {
    if (this.state !== 'PLAYING') return;
    this.state = 'PAUSED';
    this.onStateChange?.('PAUSED');
  }

  public resume() {
    if (this.state !== 'PAUSED') return;
    this.state = 'PLAYING';
    this.lastTime = performance.now();
    this.onStateChange?.('PLAYING');
  }

  public restart() {
    this.startRun(this.currentWorldId);
  }

  private triggerGameOver(cleared: boolean) {
    this.state = cleared ? 'VICTORY' : 'GAME_OVER';

    if (cleared) {
      sound.playLevelComplete();
    } else {
      sound.playGameOver();
    }

    // Persist stats and check achievements
    const resultsData = {
      score: this.score,
      worldId: this.currentWorldId,
      gemsCollected: this.gemsCollected,
      gemCounts: this.gemCounts,
      maxCombo: this.maxCombo,
      shieldUsed: this.shieldUsedThisRun,
      speedBoostUsed: this.speedBoostUsedThisRun,
    };

    const record = StorageManager.recordRun(resultsData);

    const finalResults: RunResults = {
      score: this.score,
      isNewBest: record.isNewBest,
      gemsCollected: this.gemsCollected,
      gemCounts: this.gemCounts,
      maxCombo: this.maxCombo,
      worldId: this.currentWorldId,
      timeSurvived: this.runTime,
      clearedLevel: cleared,
      achievementsUnlocked: record.newAchievements,
    };

    record.newAchievements.forEach((id) => {
      this.onAchievementUnlock?.(id);
    });

    this.onStateChange?.(this.state, finalResults);
  }

  // --- MAIN LOOP ---

  private lastTime: number = 0;

  private loop = (now: number) => {
    if (this.isDestroyed) return;

    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    const dt = Math.min(rawDt, 0.05); // Clamp dt to prevent tunneling on frame hitch

    if (this.state === 'PLAYING') {
      if (this.hitstopTimer > 0) {
        this.hitstopTimer -= dt;
      } else {
        this.update(dt);
      }
    } else {
      // Idle starfield and background animations even when paused or in menu
      this.updateBackgroundOnly(dt);
    }

    this.render();

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  // --- UPDATE LOGIC ---

  private updateBackgroundOnly(dt: number) {
    const world = WORLDS[this.currentWorldId];
    const speed = world.baseSpeed * 0.3;

    this.stars.forEach((star) => {
      star.y += star.speed * (speed / 100) * dt;
      if (star.y > this.height) {
        star.y = 0;
        star.x = Math.random() * this.width;
      }
      star.twinklePhase += dt * 3;
    });
  }

  private update(dt: number) {
    const world = WORLDS[this.currentWorldId];
    const isSpeedBoost = this.activePowerUps.has('speed-boost');
    const isTimeFreeze = this.activePowerUps.has('time-freeze');
    const speedFactor = isSpeedBoost ? 2.2 : 1.0;
    const hazardSpeedFactor = isTimeFreeze ? 0.3 : speedFactor;

    this.runTime += dt;

    // Progress towards world target score
    this.progressDistance = Math.min(1, this.score / world.targetScore);

    // If portal reached, spawn portal entity
    if (this.progressDistance >= 1 && !this.portalEntity.active) {
      this.portalEntity.active = true;
      this.portalEntity.x = this.width / 2;
      this.portalEntity.y = -80;
      this.spawnBanner('PORTAL REACHED!', 'Fly into the cosmic rift!');
    }

    // Portal entry movement
    if (this.portalEntity.active) {
      this.portalEntity.y += world.baseSpeed * speedFactor * 0.7 * dt;

      // Check collision with portal
      const dist = Math.hypot(this.player.x - this.portalEntity.x, this.player.y - this.portalEntity.y);
      if (dist < this.portalEntity.radius + this.player.radius) {
        this.triggerGameOver(true);
        return;
      }

      // If portal sailed past without entry, loop it back
      if (this.portalEntity.y > this.height + 150) {
        this.portalEntity.y = -100;
      }
    }

    // Update power-up timers
    this.activePowerUps.forEach((active, key) => {
      active.remainingTime -= dt;
      if (active.remainingTime <= 0) {
        this.activePowerUps.delete(key);
      }
    });

    // Update combo timer
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
        this.onHUDUpdate?.();
      }
    }

    // Update invulnerability
    if (this.invulnerabilityTimer > 0) {
      this.invulnerabilityTimer -= dt;
    }

    // Camera shake decay
    if (this.cameraShake > 0) {
      this.cameraShake = Math.max(0, this.cameraShake - dt * 25);
    }

    // Player squash-stretch decay
    this.player.squash += (1 - this.player.squash) * 10 * dt;
    this.player.stretch += (1 - this.player.stretch) * 10 * dt;
    if (this.player.isHappy > 0) this.player.isHappy -= dt;

    // Player eyes blinking random
    this.player.eyeBlink -= dt;
    if (this.player.eyeBlink <= -0.15) {
      this.player.eyeBlink = Math.random() * 3 + 2;
    }

    // Banner fade
    if (this.bannerText) {
      this.bannerText.alpha -= dt * 0.45;
      this.bannerText.scale += dt * 0.1;
      if (this.bannerText.alpha <= 0) {
        this.bannerText = null;
      }
    }

    // --- PLAYER MOVEMENT ---
    if (this.inputMode === 'keys') {
      const moveSpeed = 380 * (isSpeedBoost ? 1.4 : 1);
      let dx = 0;
      let dy = 0;

      if (this.keys['arrowleft'] || this.keys['a']) dx -= 1;
      if (this.keys['arrowright'] || this.keys['d']) dx += 1;
      if (this.keys['arrowup'] || this.keys['w']) dy -= 1;
      if (this.keys['arrowdown'] || this.keys['s']) dy += 1;

      if (dx !== 0 && dy !== 0) {
        const invLen = 1 / Math.SQRT2;
        dx *= invLen;
        dy *= invLen;
      }

      this.player.targetX += dx * moveSpeed * dt;
      this.player.targetY += dy * moveSpeed * dt;

      this.player.targetX = Math.max(26, Math.min(this.width - 26, this.player.targetX));
      this.player.targetY = Math.max(35, Math.min(this.height - 35, this.player.targetY));
    }

    // Smooth lerp to target
    const prevX = this.player.x;
    const lerpSpeed = this.inputMode === 'follow' ? 18 : 22;
    this.player.x += (this.player.targetX - this.player.x) * lerpSpeed * dt;
    this.player.y += (this.player.targetY - this.player.y) * lerpSpeed * dt;

    this.player.vx = (this.player.x - prevX) / dt;
    this.player.tilt = Math.max(-0.4, Math.min(0.4, (this.player.vx / 450) * 0.35));

    // Player thruster particles
    const thrustCount = isSpeedBoost ? 3 : 1;
    for (let i = 0; i < thrustCount; i++) {
      this.particles.push({
        x: this.player.x + (Math.random() - 0.5) * 14,
        y: this.player.y + 18,
        vx: (Math.random() - 0.5) * 40 - this.player.tilt * 50,
        vy: Math.random() * 80 + 120 + (isSpeedBoost ? 160 : 0),
        size: Math.random() * 4 + 2,
        color: isSpeedBoost ? '#fef08a' : Math.random() < 0.5 ? '#38bdf8' : '#ec4899',
        alpha: 0.9,
        decay: 3.2,
      });
    }

    // --- STARS PARALLAX ---
    this.stars.forEach((star) => {
      star.y += star.speed * (world.baseSpeed / 130) * speedFactor * dt;
      if (star.y > this.height) {
        star.y = 0;
        star.x = Math.random() * this.width;
      }
      star.twinklePhase += dt * 3.5;
    });

    // --- GEM SPAWNING & UPDATE ---
    this.gemSpawnTimer -= dt;
    if (this.gemSpawnTimer <= 0) {
      this.spawnGemWave();
      this.gemSpawnTimer = Math.max(0.35, 0.85 - this.progressDistance * 0.3);
    }

    const hasMagnet = this.activePowerUps.has('magnet');
    const magnetRadius = hasMagnet ? 240 : 65;

    for (let i = this.gems.length - 1; i >= 0; i--) {
      const gem = this.gems[i];
      gem.y += world.baseSpeed * speedFactor * dt;
      gem.rotation += gem.rotSpeed * dt;
      gem.bobPhase += dt * 4;

      // Magnet attraction
      const dx = this.player.x - gem.x;
      const dy = this.player.y - gem.y;
      const dist = Math.hypot(dx, dy);

      if (dist < magnetRadius) {
        const pull = (1 - dist / magnetRadius) * 620 * (hasMagnet ? 1.4 : 1.0);
        gem.x += (dx / dist) * pull * dt;
        gem.y += (dy / dist) * pull * dt;
      }

      // Check collection by player
      const collectDist = gem.radius + this.player.radius + (isSpeedBoost ? 20 : 4);
      if (dist < collectDist) {
        this.collectGem(gem);
        this.gems.splice(i, 1);
        continue;
      }

      // Remove out of bounds
      if (gem.y > this.height + 40) {
        this.gems.splice(i, 1);
      }
    }

    // --- HAZARDS SPAWNING & UPDATE ---
    this.hazardSpawnTimer -= dt;
    if (this.hazardSpawnTimer <= 0) {
      this.spawnHazard();
      this.hazardSpawnTimer = Math.max(0.7, 1.8 - this.progressDistance * 0.6);
    }

    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const h = this.hazards[i];
      h.y += h.vy * hazardSpeedFactor * dt;
      h.x += h.vx * hazardSpeedFactor * dt;
      h.rotation += h.rotSpeed * hazardSpeedFactor * dt;
      h.phase += dt * 3;

      // Laser gate behavior
      if (h.type === 'laser-gate' && h.telegraphTimer !== undefined) {
        h.telegraphTimer -= dt;
        if (h.telegraphTimer <= 0) {
          h.laserActive = Math.sin(h.phase) > -0.2;
        }
      }

      // Collision check with player
      if (this.invulnerabilityTimer <= 0 && !isSpeedBoost) {
        const collides = this.checkHazardCollision(h);
        if (collides) {
          this.handlePlayerHit(h);
          this.hazards.splice(i, 1);
          continue;
        }
      }

      // Remove out of bounds
      if (h.y > this.height + 80 || h.x < -100 || h.x > this.width + 100) {
        this.hazards.splice(i, 1);
      }
    }

    // --- POWER-UPS SPAWNING & UPDATE ---
    this.powerUpSpawnTimer -= dt;
    if (this.powerUpSpawnTimer <= 0) {
      this.spawnPowerUp();
      this.powerUpSpawnTimer = Math.random() * 5 + 9;
    }

    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const p = this.powerUps[i];
      p.y += world.baseSpeed * 0.8 * speedFactor * dt;
      p.rotation += 1.8 * dt;
      p.bobPhase += dt * 3;

      const dist = Math.hypot(this.player.x - p.x, this.player.y - p.y);
      if (dist < p.radius + this.player.radius) {
        this.collectPowerUp(p);
        this.powerUps.splice(i, 1);
        continue;
      }

      if (p.y > this.height + 40) {
        this.powerUps.splice(i, 1);
      }
    }

    // --- PARTICLES UPDATE ---
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= p.decay * dt;
      if (p.rotSpeed) p.rotation = (p.rotation || 0) + p.rotSpeed * dt;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // --- FLOATING TEXTS UPDATE ---
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.alpha -= dt * 1.5;
      ft.scale = Math.min(1.4, ft.scale + dt * 0.5);

      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  // --- SPAWNING HELPERS ---

  private spawnGemWave() {
    // Choose formation: single, horizontal row, sine wave, or star constellation
    const formation = Math.random();
    const gemType = this.selectGemType();
    const config = GEMS[gemType];

    if (formation < 0.45) {
      // Single random gem
      this.gems.push({
        x: Math.random() * (this.width - 80) + 40,
        y: -30,
        type: gemType,
        radius: config.radius,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 4,
        bobPhase: Math.random() * Math.PI * 2,
        points: config.points,
        color: config.color,
        glowColor: config.glowColor,
        collected: false,
      });
    } else if (formation < 0.75) {
      // Stream arc / column of 3 to 5 gems
      const count = Math.floor(Math.random() * 3) + 3;
      const startX = Math.random() * (this.width - 160) + 80;
      const spacingY = 42;

      for (let j = 0; j < count; j++) {
        this.gems.push({
          x: startX + Math.sin(j * 0.6) * 35,
          y: -30 - j * spacingY,
          type: gemType,
          radius: config.radius,
          rotation: j * 0.4,
          rotSpeed: 2.5,
          bobPhase: j * 0.5,
          points: config.points,
          color: config.color,
          glowColor: config.glowColor,
          collected: false,
        });
      }
    } else {
      // Diamond / Cluster formation
      const centerX = Math.random() * (this.width - 140) + 70;
      const offsets = [
        { x: 0, y: 0 },
        { x: -30, y: -25 },
        { x: 30, y: -25 },
        { x: 0, y: -50 },
      ];

      offsets.forEach((off) => {
        this.gems.push({
          x: centerX + off.x,
          y: -30 + off.y,
          type: gemType,
          radius: config.radius,
          rotation: 0,
          rotSpeed: 2,
          bobPhase: 0,
          points: config.points,
          color: config.color,
          glowColor: config.glowColor,
          collected: false,
        });
      });
    }
  }

  private selectGemType(): GemType {
    const totalWeight = Object.values(GEMS).reduce((sum, g) => sum + g.weight, 0);
    let rand = Math.random() * totalWeight;

    for (const g of Object.values(GEMS)) {
      if (rand <= g.weight) {
        return g.type;
      }
      rand -= g.weight;
    }
    return 'sapphire';
  }

  private spawnHazard() {
    const world = WORLDS[this.currentWorldId];
    const allowed = world.hazardTypes;
    const type = allowed[Math.floor(Math.random() * allowed.length)];

    const x = Math.random() * (this.width - 100) + 50;
    const y = -60;

    if (type === 'asteroid') {
      const radius = Math.random() * 16 + 22;
      const numPts = 8;
      const pts: { x: number; y: number }[] = [];

      for (let i = 0; i < numPts; i++) {
        const angle = (i / numPts) * Math.PI * 2;
        const r = radius * (0.75 + Math.random() * 0.45);
        pts.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
      }

      this.hazards.push({
        x,
        y,
        type: 'asteroid',
        width: radius * 2,
        height: radius * 2,
        vx: (Math.random() - 0.5) * 50,
        vy: world.baseSpeed * (0.85 + Math.random() * 0.3),
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 3,
        phase: 0,
        points: pts,
      });
    } else if (type === 'laser-gate') {
      this.hazards.push({
        x: this.width / 2,
        y,
        type: 'laser-gate',
        width: this.width * 0.8,
        height: 18,
        vx: 0,
        vy: world.baseSpeed * 0.75,
        rotation: 0,
        rotSpeed: 0,
        phase: 0,
        laserActive: false,
        telegraphTimer: 0.8,
      });
    } else if (type === 'quantum-mine') {
      this.hazards.push({
        x,
        y,
        type: 'quantum-mine',
        width: 38,
        height: 38,
        vx: (Math.random() - 0.5) * 40,
        vy: world.baseSpeed * 0.9,
        rotation: 0,
        rotSpeed: 1.5,
        phase: Math.random() * Math.PI * 2,
      });
    } else if (type === 'solar-flare') {
      this.hazards.push({
        x,
        y,
        type: 'solar-flare',
        width: 50,
        height: 50,
        vx: (Math.random() - 0.5) * 70,
        vy: world.baseSpeed * 1.1,
        rotation: 0,
        rotSpeed: 4,
        phase: 0,
      });
    }
  }

  private spawnPowerUp() {
    const types: PowerUpType[] = ['magnet', 'shield', 'speed-boost', 'multiplier', 'time-freeze'];
    const type = types[Math.floor(Math.random() * types.length)];

    this.powerUps.push({
      x: Math.random() * (this.width - 100) + 50,
      y: -40,
      type,
      radius: 22,
      rotation: 0,
      bobPhase: 0,
      collected: false,
    });
  }

  // --- COLLISION CHECKS ---

  private checkHazardCollision(h: HazardEntity): boolean {
    const px = this.player.x;
    const py = this.player.y;
    const pr = this.player.radius * 0.75; // Forgiving player hitbox

    if (h.type === 'asteroid') {
      const hr = h.width * 0.42;
      return Math.hypot(px - h.x, py - h.y) < pr + hr;
    }

    if (h.type === 'laser-gate') {
      if (!h.laserActive) return false;
      const left = h.x - h.width / 2;
      const right = h.x + h.width / 2;
      return px >= left && px <= right && Math.abs(py - h.y) < pr + 10;
    }

    if (h.type === 'quantum-mine') {
      return Math.hypot(px - h.x, py - h.y) < pr + 16;
    }

    if (h.type === 'solar-flare') {
      return Math.hypot(px - h.x, py - h.y) < pr + 22;
    }

    return false;
  }

  // --- INTERACTIONS & EFFECTS ---

  private collectGem(gem: GemEntity) {
    this.gemsCollected++;
    this.gemCounts[gem.type] = (this.gemCounts[gem.type] || 0) + 1;
    this.player.isHappy = 0.35;
    this.player.squash = 0.85;
    this.player.stretch = 1.25;

    // Combo system
    this.combo++;
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }
    this.comboTimer = this.COMBO_DURATION;

    // Calculate score
    const hasMultiplier = this.activePowerUps.has('multiplier');
    const comboMult = Math.min(5, 1 + Math.floor(this.combo / 5) * 0.5);
    const powerMult = hasMultiplier ? 2 : 1;
    const earnedPoints = Math.round(gem.points * comboMult * powerMult);
    this.score += earnedPoints;

    sound.playGem(this.combo, gem.type);

    // Burst particles
    const particleCount = gem.type === 'prismatic-star' ? 24 : 12;
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.4;
      const speed = Math.random() * 120 + 70;
      this.particles.push({
        x: gem.x,
        y: gem.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 1.5,
        color: gem.type === 'prismatic-star' ? ['#f43f5e', '#fbbf24', '#34d399', '#38bdf8', '#c084fc'][i % 5] : gem.color,
        alpha: 1,
        decay: Math.random() * 2 + 2,
        shape: 'spark',
      });
    }

    // Floating score text
    const textStr = comboMult > 1 ? `+${earnedPoints} (${comboMult}x)` : `+${earnedPoints}`;
    this.floatingTexts.push({
      x: gem.x,
      y: gem.y - 10,
      text: textStr,
      color: gem.color,
      alpha: 1,
      scale: 1,
      vy: -55,
    });

    // Milestone combo celebrations
    if (this.combo === 5 || this.combo === 10 || this.combo === 20 || this.combo === 30) {
      const title = this.combo >= 30 ? 'COSMIC FRENZY!' : this.combo >= 20 ? 'ULTRA RUSH!' : this.combo >= 10 ? 'MEGA COMBO!' : 'SUPER COMBO!';
      this.spawnBanner(`${this.combo}X COMBO`, title);
    }

    this.onHUDUpdate?.();
  }

  private collectPowerUp(p: PowerUpEntity) {
    const config = POWER_UPS[p.type];
    sound.playPowerUp(p.type);

    if (p.type === 'shield') {
      this.shieldActive = true;
      this.shieldUsedThisRun = true;
    } else {
      this.activePowerUps.set(p.type, {
        type: p.type,
        remainingTime: config.duration,
        totalTime: config.duration,
      });

      if (p.type === 'speed-boost') {
        this.speedBoostUsedThisRun = true;
      }
    }

    // Sparkle shockwave ring
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      this.particles.push({
        x: p.x,
        y: p.y,
        vx: Math.cos(angle) * 160,
        vy: Math.sin(angle) * 160,
        size: 3.5,
        color: config.color,
        alpha: 1,
        decay: 2.2,
      });
    }

    this.spawnBanner(config.name.toUpperCase(), config.description);
    this.onHUDUpdate?.();
  }

  private handlePlayerHit(h: HazardEntity) {
    // If shield active, deflect
    if (this.shieldActive) {
      this.shieldActive = false;
      this.invulnerabilityTimer = 1.0;
      this.cameraShake = 12;
      this.hitstopTimer = 0.04;
      sound.playShieldDeflect();

      this.spawnBanner('SHIELD DEFLECTED!', 'Danger absorbed');

      // Explode hazard in defensive sparkles
      for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        this.particles.push({
          x: h.x,
          y: h.y,
          vx: Math.cos(angle) * 140,
          vy: Math.sin(angle) * 140,
          size: 3.5,
          color: '#4ade80',
          alpha: 1,
          decay: 2.5,
        });
      }

      this.onHUDUpdate?.();
      return;
    }

    // Genuine damage
    this.lives -= 1;
    this.combo = 0;
    this.invulnerabilityTimer = 1.8;
    this.cameraShake = 22;
    this.hitstopTimer = 0.06;
    this.player.squash = 1.35;
    this.player.stretch = 0.7;

    sound.playHit();

    // Red damage shockwave & debris
    for (let i = 0; i < 25; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 160 + 40;
      this.particles.push({
        x: this.player.x,
        y: this.player.y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: Math.random() * 4 + 2,
        color: Math.random() < 0.6 ? '#f43f5e' : '#fb923c',
        alpha: 1,
        decay: 2.5,
        shape: 'shard',
      });
    }

    this.floatingTexts.push({
      x: this.player.x,
      y: this.player.y - 30,
      text: '-1 LIFE!',
      color: '#f43f5e',
      alpha: 1,
      scale: 1.2,
      vy: -60,
    });

    this.onHUDUpdate?.();

    if (this.lives <= 0) {
      this.triggerGameOver(false);
    }
  }

  private spawnBanner(text: string, subtext: string) {
    this.bannerText = {
      text,
      subtext,
      alpha: 1,
      scale: 0.9,
    };
  }

  // --- RENDERING ---

  private render() {
    const ctx = this.ctx;
    const world = WORLDS[this.currentWorldId];

    ctx.save();

    // Camera shake translation
    if (this.cameraShake > 0) {
      const offsetX = (Math.random() - 0.5) * this.cameraShake;
      const offsetY = (Math.random() - 0.5) * this.cameraShake;
      ctx.translate(offsetX, offsetY);
    }

    // 1. Clear & Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    bgGrad.addColorStop(0, world.bgGradient[0]);
    bgGrad.addColorStop(0.5, world.bgGradient[1]);
    bgGrad.addColorStop(1, world.bgGradient[2]);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Cosmic Nebulae Clouds
    this.renderNebulae(ctx, world);

    // 3. Stars
    this.renderStars(ctx);

    // 4. Portal Entity if active
    if (this.portalEntity.active) {
      this.renderPortal(ctx, world);
    }

    // 5. Gems
    this.renderGems(ctx);

    // 6. Hazards
    this.renderHazards(ctx);

    // 7. Power-Ups
    this.renderPowerUps(ctx);

    // 8. Player Character
    this.renderPlayer(ctx);

    // 9. Particles
    this.renderParticles(ctx);

    // 10. Floating Scores
    this.renderFloatingTexts(ctx);

    // 11. Milestone Banner Text
    if (this.bannerText) {
      this.renderBanner(ctx);
    }

    // 12. Active Time Freeze cyan border vignette
    if (this.activePowerUps.has('time-freeze')) {
      this.renderFreezeVignette(ctx);
    }

    ctx.restore();
  }

  private renderNebulae(ctx: CanvasRenderingContext2D, world: (typeof WORLDS)[WorldId]) {
    const t = this.runTime * 0.4;
    world.nebulaColors.forEach((color, idx) => {
      ctx.save();
      const cx = this.width * (0.3 + 0.4 * Math.sin(t + idx * 2));
      const cy = this.height * (0.35 + 0.3 * Math.cos(t * 0.7 + idx));
      const radius = Math.min(this.width, this.height) * 0.65;

      const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius);
      grad.addColorStop(0, color);
      grad.addColorStop(1, 'transparent');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
    });
  }

  private renderStars(ctx: CanvasRenderingContext2D) {
    this.stars.forEach((s) => {
      const alpha = 0.4 + 0.6 * Math.sin(s.twinklePhase);
      ctx.save();
      ctx.globalAlpha = Math.max(0.1, Math.min(1, alpha));
      ctx.fillStyle = s.color;

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();

      // Shimmer flare on large stars
      if (s.size > 2.5) {
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 0.75;
        ctx.beginPath();
        ctx.moveTo(s.x - s.size * 2, s.y);
        ctx.lineTo(s.x + s.size * 2, s.y);
        ctx.moveTo(s.x, s.y - s.size * 2);
        ctx.lineTo(s.x, s.y + s.size * 2);
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  private renderPortal(ctx: CanvasRenderingContext2D, world: (typeof WORLDS)[WorldId]) {
    const p = this.portalEntity;
    ctx.save();
    ctx.translate(p.x, p.y);

    const time = this.runTime * 3;
    const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, p.radius);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, world.themeColor);
    grad.addColorStop(0.7, world.accentColor);
    grad.addColorStop(1, 'transparent');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
    ctx.fill();

    // Rotating radiant swirl arms
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.rotate(time + (i * Math.PI) / 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius * 0.6, 0, Math.PI * 0.8);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  private renderGems(ctx: CanvasRenderingContext2D) {
    this.gems.forEach((gem) => {
      ctx.save();
      const bob = Math.sin(gem.bobPhase) * 3;
      ctx.translate(gem.x, gem.y + bob);
      ctx.rotate(gem.rotation);

      // Outer glow
      const glowGrad = ctx.createRadialGradient(0, 0, gem.radius * 0.3, 0, 0, gem.radius * 2);
      glowGrad.addColorStop(0, gem.glowColor);
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(0, 0, gem.radius * 2, 0, Math.PI * 2);
      ctx.fill();

      // Shape drawing based on gem type
      ctx.fillStyle = gem.color;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;

      if (gem.type === 'sapphire') {
        // Octagon cut
        ctx.beginPath();
        const r = gem.radius;
        const pts = 8;
        for (let i = 0; i < pts; i++) {
          const a = (i / pts) * Math.PI * 2;
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner facet highlights
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.beginPath();
        ctx.arc(-r * 0.3, -r * 0.3, r * 0.35, 0, Math.PI * 2);
        ctx.fill();
      } else if (gem.type === 'amethyst') {
        // Rhombus diamond
        const r = gem.radius;
        ctx.beginPath();
        ctx.moveTo(0, -r * 1.2);
        ctx.lineTo(r, 0);
        ctx.moveTo(r, 0);
        ctx.lineTo(0, r * 1.2);
        ctx.lineTo(-r, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Facet lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.moveTo(0, -r * 1.2);
        ctx.lineTo(0, r * 1.2);
        ctx.moveTo(-r, 0);
        ctx.lineTo(r, 0);
        ctx.stroke();
      } else if (gem.type === 'emerald') {
        // Hexagon
        const r = gem.radius;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (gem.type === 'ruby') {
        // Heart facet
        const r = gem.radius;
        ctx.beginPath();
        ctx.moveTo(0, r * 0.7);
        ctx.bezierCurveTo(-r * 1.2, 0, -r, -r, 0, -r * 0.4);
        ctx.bezierCurveTo(r, -r, r * 1.2, 0, 0, r * 0.7);
        ctx.fill();
        ctx.stroke();
      } else if (gem.type === 'prismatic-star') {
        // 5-pointed rainbow star
        const r = gem.radius;
        const inner = r * 0.45;
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const rad = i % 2 === 0 ? r : inner;
          const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
          const px = Math.cos(a) * rad;
          const py = Math.sin(a) * rad;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Star core sparkle
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  private renderHazards(ctx: CanvasRenderingContext2D) {
    this.hazards.forEach((h) => {
      ctx.save();
      ctx.translate(h.x, h.y);
      ctx.rotate(h.rotation);

      if (h.type === 'asteroid') {
        // Jagged rock polygon
        ctx.fillStyle = '#334155';
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2.5;

        if (h.points && h.points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(h.points[0].x, h.points[0].y);
          for (let i = 1; i < h.points.length; i++) {
            ctx.lineTo(h.points[i].x, h.points[i].y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Glowing molten cracks
          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(h.points[0].x * 0.5, h.points[0].y * 0.5);
          ctx.lineTo(h.points[3].x * 0.5, h.points[3].y * 0.5);
          ctx.stroke();
        }
      } else if (h.type === 'laser-gate') {
        // Laser barrier
        const halfW = h.width / 2;

        // Emitter nodes
        ctx.fillStyle = '#ec4899';
        ctx.beginPath();
        ctx.arc(-halfW, 0, 10, 0, Math.PI * 2);
        ctx.arc(halfW, 0, 10, 0, Math.PI * 2);
        ctx.fill();

        if (h.laserActive) {
          // Blazing active laser beam
          const laserGrad = ctx.createLinearGradient(0, -6, 0, 6);
          laserGrad.addColorStop(0, 'rgba(244, 63, 94, 0.2)');
          laserGrad.addColorStop(0.5, '#ffffff');
          laserGrad.addColorStop(1, 'rgba(244, 63, 94, 0.2)');

          ctx.fillStyle = laserGrad;
          ctx.fillRect(-halfW, -5, h.width, 10);

          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 2;
          ctx.strokeRect(-halfW, -5, h.width, 10);
        } else {
          // Warning dashed telegraph beam
          ctx.strokeStyle = 'rgba(244, 63, 94, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([8, 8]);
          ctx.beginPath();
          ctx.moveTo(-halfW, 0);
          ctx.lineTo(halfW, 0);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      } else if (h.type === 'quantum-mine') {
        // Spiky space mine
        const r = 18;
        ctx.fillStyle = '#dc2626';
        ctx.strokeStyle = '#fca5a5';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 8 spikes
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          ctx.lineTo(Math.cos(a) * (r + 8), Math.sin(a) * (r + 8));
          ctx.stroke();
        }

        // Blinking hazard core
        const pulse = (Math.sin(h.phase * 5) + 1) * 0.5;
        ctx.fillStyle = pulse > 0.5 ? '#ffffff' : '#f87171';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (h.type === 'solar-flare') {
        // Golden rotating solar blade
        ctx.fillStyle = '#f59e0b';
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2;

        for (let i = 0; i < 4; i++) {
          ctx.save();
          ctx.rotate((i * Math.PI) / 2);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(8, 25);
          ctx.lineTo(0, 32);
          ctx.lineTo(-8, 25);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      }

      ctx.restore();
    });
  }

  private renderPowerUps(ctx: CanvasRenderingContext2D) {
    this.powerUps.forEach((p) => {
      const config = POWER_UPS[p.type];
      ctx.save();
      const bob = Math.sin(p.bobPhase) * 4;
      ctx.translate(p.x, p.y + bob);

      // Glowing power-up bubble
      const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, p.radius * 1.5);
      grad.addColorStop(0, config.glowColor);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Outer glass ring
      ctx.strokeStyle = config.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Inner icon symbol
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      let symbol = '★';
      if (p.type === 'magnet') symbol = '🧲';
      if (p.type === 'shield') symbol = '🛡️';
      if (p.type === 'speed-boost') symbol = '⚡';
      if (p.type === 'multiplier') symbol = '2×';
      if (p.type === 'time-freeze') symbol = '❄️';

      ctx.fillText(symbol, 0, 0);

      ctx.restore();
    });
  }

  private renderPlayer(ctx: CanvasRenderingContext2D) {
    const p = this.player;
    const isInvulnerable = this.invulnerabilityTimer > 0;
    const isSpeedBoost = this.activePowerUps.has('speed-boost');

    // Flashing during invulnerability
    if (isInvulnerable && Math.floor(this.runTime * 20) % 2 === 0) {
      return;
    }

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.tilt);
    ctx.scale(p.squash, p.stretch);

    // 1. Magnetic Aura if Magnet active
    if (this.activePowerUps.has('magnet')) {
      ctx.save();
      const magnetGrad = ctx.createRadialGradient(0, 0, p.radius, 0, 0, p.radius * 3.5);
      magnetGrad.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
      magnetGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = magnetGrad;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius * 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2. Astral Shield Bubble
    if (this.shieldActive) {
      ctx.save();
      const shieldPulse = Math.sin(this.runTime * 6) * 2;
      const sr = p.radius + 12 + shieldPulse;

      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#4ade80';
      ctx.shadowBlur = 14;

      ctx.beginPath();
      ctx.arc(0, 0, sr, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(74, 222, 128, 0.15)';
      ctx.fill();
      ctx.restore();
    }

    // 3. Hyper Warp trail aura
    if (isSpeedBoost) {
      ctx.save();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 4. Character Body ("Astra")
    // Main star orb body with vibrant iridescent shading
    const bodyGrad = ctx.createRadialGradient(-p.radius * 0.3, -p.radius * 0.3, 3, 0, 0, p.radius);
    bodyGrad.addColorStop(0, '#ffffff');
    bodyGrad.addColorStop(0.4, '#38bdf8');
    bodyGrad.addColorStop(0.85, '#a855f7');
    bodyGrad.addColorStop(1, '#4f46e5');

    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
    ctx.fill();

    // Cosmic ear crests / antennae
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(-12, -p.radius + 2);
    ctx.lineTo(-18, -p.radius - 12);
    ctx.lineTo(-6, -p.radius);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(12, -p.radius + 2);
    ctx.lineTo(18, -p.radius - 12);
    ctx.lineTo(6, -p.radius);
    ctx.closePath();
    ctx.fill();

    // Antenna star tips
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-18, -p.radius - 12, 3, 0, Math.PI * 2);
    ctx.arc(18, -p.radius - 12, 3, 0, Math.PI * 2);
    ctx.fill();

    // Expressive Eyes
    const eyeOffsetX = Math.max(-4, Math.min(4, p.vx / 80));
    const eyeBlinking = p.eyeBlink <= 0;

    if (p.isHappy > 0) {
      // Happy curved arcs (^ ^)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(-7 + eyeOffsetX, -2, 4, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(7 + eyeOffsetX, -2, 4, Math.PI, 0);
      ctx.stroke();
    } else if (eyeBlinking) {
      // Blink line
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-11 + eyeOffsetX, -2);
      ctx.lineTo(-3 + eyeOffsetX, -2);
      ctx.moveTo(3 + eyeOffsetX, -2);
      ctx.lineTo(11 + eyeOffsetX, -2);
      ctx.stroke();
    } else {
      // Open cute expressive eyes
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(-7 + eyeOffsetX, -2, 3.5, 5, 0, 0, Math.PI * 2);
      ctx.ellipse(7 + eyeOffsetX, -2, 3.5, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Specular eye catchlights
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-8 + eyeOffsetX, -4, 1.5, 0, Math.PI * 2);
      ctx.arc(6 + eyeOffsetX, -4, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Rosy cosmic cheeks
    ctx.fillStyle = 'rgba(244, 63, 94, 0.45)';
    ctx.beginPath();
    ctx.arc(-13, 3, 3.5, 0, Math.PI * 2);
    ctx.arc(13, 3, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderParticles(ctx: CanvasRenderingContext2D) {
    this.particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;

      if (p.shape === 'spark') {
        ctx.translate(p.x, p.y);
        ctx.beginPath();
        ctx.moveTo(0, -p.size * 2);
        ctx.lineTo(p.size * 0.6, 0);
        ctx.lineTo(0, p.size * 2);
        ctx.lineTo(-p.size * 0.6, 0);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  private renderFloatingTexts(ctx: CanvasRenderingContext2D) {
    this.floatingTexts.forEach((ft) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.translate(ft.x, ft.y);
      ctx.scale(ft.scale, ft.scale);

      ctx.font = 'bold 15px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = ft.color;
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 6;
      ctx.fillText(ft.text, 0, 0);

      ctx.restore();
    });
  }

  private renderBanner(ctx: CanvasRenderingContext2D) {
    if (!this.bannerText) return;
    const b = this.bannerText;

    ctx.save();
    ctx.globalAlpha = Math.max(0, b.alpha);
    ctx.translate(this.width / 2, this.height * 0.35);
    ctx.scale(b.scale, b.scale);

    ctx.textAlign = 'center';

    // Title
    ctx.font = '900 32px "Outfit", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(6, 182, 212, 0.8)';
    ctx.shadowBlur = 18;
    ctx.fillText(b.text, 0, 0);

    // Subtext
    ctx.font = '500 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#bae6fd';
    ctx.shadowBlur = 10;
    ctx.fillText(b.subtext, 0, 26);

    ctx.restore();
  }

  private renderFreezeVignette(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const grad = ctx.createRadialGradient(
      this.width / 2,
      this.height / 2,
      this.height * 0.35,
      this.width / 2,
      this.height / 2,
      this.height * 0.75
    );
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(1, 'rgba(56, 189, 248, 0.3)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.restore();
  }
}
