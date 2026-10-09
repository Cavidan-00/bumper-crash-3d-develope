// =====================================================================
// CONFIG — SABİTLƏR VƏ KATALOQLAR
// Bütün statik data buradadır. Heç bir oyun məntiqi yoxdur.
// =====================================================================

// --- Fizika / ölçü sabitləri ---
export const ACCEL = 0.024;
export const FRICTION = 0.94;
export const DASH_FORCE = 0.48;
export const DASH_COOLDOWN = 120;
export const GRAVITY = 0.045;

export const arenaRadius = 8;
export const squareSize = 14;
export const playerRadius = 0.8;

// --- Progressiya balansı ---
export const WIN_XP = 80;
export const LOSS_XP_2P = 80;
export const LOSS_XP_AI = 8;

export const WIN_GOLD = 50;
export const LOSS_GOLD_2P = 50;
export const LOSS_GOLD_AI = 5;

export const WATCH_AD_GOLD_COOLDOWN_MS = 60000;
export const WATCH_AD_GOLD_AMOUNT = 30;

// --- Storage açarları ---
export const LANG_STORAGE_KEY = 'bumperArena_language';
export const SHOP_STORAGE_KEY = 'bumperArena_shopData';
export const PROGRESSION_STORAGE_KEY = 'bumperArena_progressionData';

// --- HAT CATALOG ---
export const HAT_CATALOG = [
    { id: 'none', emoji: '❌', name: 'None' },
    { id: 'cap', emoji: '🧢', name: 'Cap', level: 1, price: 40 },
    { id: 'horns', emoji: '😈', name: 'Horns', level: 2, price: 55 },
    { id: 'duck', emoji: '🦆', name: 'Duck', level: 3, price: 70 },
    { id: 'cat', emoji: '🐱', name: 'Cat', level: 4, price: 85 },
    { id: 'bunny', emoji: '🐰', name: 'Bunny', level: 5, price: 100 },
    { id: 'sombrero', emoji: '🌮', name: 'Sombrero', level: 6, price: 115 },
    { id: 'halo', emoji: '😇', name: 'Halo', level: 7, price: 130 },
    { id: 'ninja', emoji: '🥷', name: 'Ninja', level: 8, price: 145 },
    { id: 'viking', emoji: '🪖', name: 'Viking', level: 9, price: 160 },
    { id: 'tophat', emoji: '🎩', name: 'Top Hat', level: 10, price: 175 },
    { id: 'alien', emoji: '👽', name: 'Alien', level: 11, price: 190 },
    { id: 'wizard', emoji: '🧙‍♂️', name: 'Wizard', level: 12, price: 205 },
    { id: 'crown', emoji: '👑', name: 'Crown', level: 13, price: 220 },
    { id: 'propeller', emoji: '🛸', name: 'Propeller', level: 14, price: 235 }
];

// --- GLASSES CATALOG ---
export const GLASSES_CATALOG = [
    { id: 'none', emoji: '❌', name: 'None' },
    { id: 'sunglasses', emoji: '🕶️', name: 'Shades', level: 1, price: 40 },
    { id: 'nerd', emoji: '🤓', name: 'Round', level: 2, price: 55 },
    { id: 'mustache', emoji: '👨', name: 'Mustache', level: 3, price: 70 },
    { id: 'mask', emoji: '😷', name: 'Mask', level: 4, price: 85 },
    { id: 'goggles', emoji: '🥽', name: 'Goggles', level: 5, price: 100 },
    { id: 'pirate_patch', emoji: '🏴‍☠️', name: 'Eye Patch', level: 6, price: 115 },
    { id: 'monocle', emoji: '🧐', name: 'Monocle', level: 7, price: 130 },
    { id: 'clown', emoji: '🤡', name: 'Clown', level: 8, price: 145 },
    { id: 'star', emoji: '⭐', name: 'Star', level: 9, price: 160 },
    { id: 'heart', emoji: '❤️', name: 'Heart', level: 10, price: 175 },
    { id: 'vr', emoji: '🥽', name: 'VR', level: 11, price: 190 },
    { id: 'td', emoji: '🎬', name: '3D Glass', level: 12, price: 205 }
];

// Convenience: sadece id-lər (random seçim üçün)
export const hatList = HAT_CATALOG.map(item => item.id);
export const glassesList = GLASSES_CATALOG.map(item => item.id);

// --- EFFECT CATALOG ---
export const EFFECT_CATALOG = [
    { id: 'plasma_aura', emoji: '⚡', name: 'Plasma Aura', price: 200,
      visual: { type: 'aura' } },
    { id: 'inferno_trail', emoji: '🔥', name: 'Inferno Trail', price: 220,
      visual: { type: 'trail', poolSize: 36, spawnInterval: 0.022, fadeTime: 0.9 } },
    { id: 'frost_crown', emoji: '❄️', name: 'Frost Crown', price: 240,
      visual: { type: 'shapes' } },
    { id: 'celestial_halo', emoji: '😇', name: 'Celestial Halo', price: 260,
      visual: { type: 'rings' } },
    { id: 'volt_cage', emoji: '🔋', name: 'Volt Cage', price: 290,
      visual: { type: 'cage' } },
    { id: 'nebula_veil', emoji: '🌌', name: 'Nebula Veil', price: 320,
      visual: { type: 'veil' } },
    { id: 'shadow_form', emoji: '👻', name: 'Shadow Form', price: 380,
      visual: { type: 'material' } }
];

// --- AI profilləri ---
export const AI_PROFILES = {
    easy: {
        predictLead: 0,
        speedMult: 0.55,
        dashChanceRandom: 0.01,
        dashUseChance: 0.35,
        reactionMultiplier: 1.9,
        edgeAwareness: 0.55,
        mistakeChance: 0.30
    },
    normal: {
        predictLead: 0.5,
        speedMult: 0.75,
        dashChanceRandom: 0.02,
        dashUseChance: 0.7,
        reactionMultiplier: 1.35,
        edgeAwareness: 0.8,
        mistakeChance: 0.12
    },
    hard: {
        predictLead: 1.0,
        speedMult: 0.92,
        dashChanceRandom: 0.035,
        dashUseChance: 1.0,
        reactionMultiplier: 1.0,
        edgeAwareness: 1.0,
        mistakeChance: 0
    }
};

// --- Köməkçi funksiyalar (saf, bağımsız) ---
export function getRandomCosmetics() {
    return {
        hat: hatList[Math.floor(Math.random() * hatList.length)],
        glasses: glassesList[Math.floor(Math.random() * glassesList.length)]
    };
}

// --- Level / XP düsturu ---
export function xpToNextLevel(level) {
    return 50 + 25 * (level - 1);
}

export function getLevelInfo(xp) {
    let level = 1;
    let remaining = xp;
    while (remaining >= xpToNextLevel(level)) {
        remaining -= xpToNextLevel(level);
        level++;
    }
    const xpNeeded = xpToNextLevel(level);
    return { level, xpIntoLevel: remaining, xpNeeded, progress: remaining / xpNeeded };
}

export function goldForLevelUp(newLevel) {
    return 20 + 10 * (newLevel - 1);
}