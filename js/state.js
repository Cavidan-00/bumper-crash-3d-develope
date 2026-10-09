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
            if (Array.isArray(data.owned)) {
                // Köhnə effekt ID-lərini yenilərinə çevir
                const EFFECT_MIGRATION = {
                    'comet_trail': 'inferno_trail',
                    'meteor_shell': 'frost_crown',
                    'halo_rings': 'celestial_halo',
                    'prism_veil': 'nebula_veil',
                    'rainbow_ring': 'nebula_veil',
                    'phantom_shift': 'shadow_form'
                };
                state.ownedItems = [...new Set(data.owned.map(id => EFFECT_MIGRATION[id] || id))];
            }
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
    try {
        onGameStateChange(wasPlaying, isPlaying);
    } catch (e) {
        console.warn('[setGameState] callback error:', e);
    }
}
// =====================================================================
// DEV CHEATS — yalnız localhost / 127.0.0.1 üçün
// =====================================================================
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.cheat = {
        gold(n = 999999) {
            state.playerCoins = n;
            saveShopData();
            console.log(`💰 Gold: ${n}`);
            if (typeof window.__refreshGoldUI === 'function') window.__refreshGoldUI();
        },
        xp(n = 999999) {
            state.totalXp = n;
            saveProgressionData();
            console.log(`⭐ XP: ${n}`);
            if (typeof window.__refreshLevelUI === 'function') window.__refreshLevelUI();
        },
        level(n = 20) {
            let xp = 0;
            for (let i = 1; i < n; i++) xp += 50 + 25 * (i - 1);
            state.totalXp = xp;
            saveProgressionData();
            console.log(`⭐ Level ${n} (XP: ${xp})`);
            if (typeof window.__refreshLevelUI === 'function') window.__refreshLevelUI();
        },
        unlockAll() {
            const allHats = ['cap','horns','duck','cat','bunny','sombrero','halo','ninja','viking','tophat','alien','wizard','crown','propeller'];
            const allGlasses = ['sunglasses','nerd','mustache','mask','goggles','pirate_patch','monocle','clown','star','heart','vr','td'];
            const allEffects = ['plasma_aura','inferno_trail','frost_crown','celestial_halo','volt_cage','nebula_veil','shadow_form'];
            state.ownedItems = [...allHats, ...allGlasses, ...allEffects];
            saveShopData();
            console.log(`🎁 Unlocked ${state.ownedItems.length} items`);
            if (typeof window.__refreshCosmeticGrids === 'function') window.__refreshCosmeticGrids();
        },
        reset() {
            localStorage.clear();
            location.reload();
        },
        help() {
            console.log(`
╔════════════════════════════════════════╗
║         🎮 BUMPER CRASH CHEATS         ║
╠════════════════════════════════════════╣
║ cheat.gold()       → 999,999 gold      ║
║ cheat.gold(500)    → 500 gold          ║
║ cheat.xp()         → 999,999 XP        ║
║ cheat.level(20)    → Level 20-ə çat   ║
║ cheat.unlockAll()  → bütün kosmetikalar║
║ cheat.reset()      → hər şeyi sıfırla  ║
╚════════════════════════════════════════╝
            `);
        }
    };
    console.log('[DEV] Cheats aktivdir. Console-da `cheat.help()` yaz.');
}

// Nəzarətçi funksiyaları qeydə al (UI-də set olunacaq)
window.__refreshGoldUI = null;
window.__refreshLevelUI = null;
window.__refreshCosmeticGrids = null;