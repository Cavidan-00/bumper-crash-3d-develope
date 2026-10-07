// =====================================================================
// STATE — MƏRKƏZLƏŞDİRİLMİŞ OYUN VƏZİYYƏTİ
// Bütün mutable (dəyişən) state burada saxlanılır.
// Digər modullar bunu import edib oxuyur/yazır.
// =====================================================================

// Mərkəzi state obyekti — bütün mutable data burada

import {
    SHOP_STORAGE_KEY,
    PROGRESSION_STORAGE_KEY
} from './config.js';

export const state = {
    // --- Oyun axını ---
    gameState: 'MENU',           // MENU | CUSTOMIZE | PLAYING | PAUSED | VICTORY
    previousMenuState: 'MENU',   // MENU | PAUSED
    gameSetupComplete: false,

    // --- Setup ---
    currentMapType: 'circle',
    gameMode: '2p',              // '2p' | 'ai'
    aiDifficulty: 'hard',
    MAX_SCORE: 10,

    // --- Səs ---
    sfxVolume: 0.8,
    bgmVolume: 0.5,
    sfxMuted: false,
    musicMuted: false,

    // --- Progression ---
    totalXp: 0,
    playerCoins: 0,
    ownedItems: [],

    // --- Kosmetika seçimləri ---
    selectedConfig: {
        p1: { hat: 'none', glasses: 'none', effect: 'none' },
        p2: { hat: 'none', glasses: 'none', effect: 'none' }
    },
    previewState: {
        p1Hat: null, p1Glasses: null, p1Effect: null,
        p2Hat: null, p2Glasses: null, p2Effect: null
    },

    // --- Match nəticəsi (victory screen üçün) ---
    lastMatchXpGained: 0,
    lastMatchGoldGained: 0,
    lastMatchLeveledUp: false,
    lastMatchLevelUpGold: 0,
    goldDoubleUsed: false,
    xpDoubleUsed: false,

    // --- SDK / Ad ---
    adInProgress: false,
    watchAdGoldCooldownUntil: 0
};

// =====================================================================
// LOCALSTORAGE YÜKLƏMƏ / SAXLAMA
// =====================================================================

export function loadShopData() {
    try {
        const raw = localStorage.getItem(SHOP_STORAGE_KEY);
        if (raw) {
            const data = JSON.parse(raw);
            if (typeof data.coins === 'number') state.playerCoins = data.coins;
            if (Array.isArray(data.owned)) state.ownedItems = data.owned;
        }
    } catch (e) {
        // localStorage unavailable (private browsing) or corrupted - use defaults
    }
}

export function saveShopData() {
    try {
        localStorage.setItem(SHOP_STORAGE_KEY, JSON.stringify({
            coins: state.playerCoins,
            owned: state.ownedItems
        }));
    } catch (e) { /* ignore */ }
}

export function loadProgressionData() {
    try {
        const raw = localStorage.getItem(PROGRESSION_STORAGE_KEY);
        if (raw) {
            const data = JSON.parse(raw);
            if (typeof data.totalXp === 'number') state.totalXp = data.totalXp;
        }
    } catch (e) { /* ignore */ }
}

export function saveProgressionData() {
    try {
        localStorage.setItem(PROGRESSION_STORAGE_KEY, JSON.stringify({ totalXp: state.totalXp }));
    } catch (e) { /* ignore */ }
}

export function clearAllProgress() {
    try {
        localStorage.removeItem(PROGRESSION_STORAGE_KEY);
        localStorage.removeItem(SHOP_STORAGE_KEY);
    } catch (e) { /* ignore */ }
}

// =====================================================================
// KOSMETİKA PREVIEW KÖMƏKÇİLƏRİ
// =====================================================================

export function clearCosmeticPreviews() {
    state.previewState.p1Hat = null;
    state.previewState.p1Glasses = null;
    state.previewState.p2Hat = null;
    state.previewState.p2Glasses = null;
    state.previewState.p1Effect = null;
    state.previewState.p2Effect = null;
}

// =====================================================================
// İLK YÜKLƏMƏ
// =====================================================================
loadShopData();
loadProgressionData();

// =====================================================================
// GAME STATE MANAGEMENT
// =====================================================================
let onGameStateChange = () => {};
export function setOnGameStateChange(fn) { onGameStateChange = fn; }

export function setGameState(newState) {
    const wasPlaying = state.gameState === 'PLAYING';
    state.gameState = newState;
    const isPlaying = state.gameState === 'PLAYING';
    onGameStateChange(wasPlaying, isPlaying);
}