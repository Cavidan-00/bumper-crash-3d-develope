// =====================================================================
// UI — BÜTÜN MENYULAR, SHOP, DÜYMƏLƏR
// Bütün DOM manipulyasiyası burada cəmlənib.
// =====================================================================

import { clearCosmeticPreviews } from './state.js';
import { buildMap } from './world.js';
import {
    t, setLanguage, applyDataI18n, setOnLanguageChanged, getCurrentLang, getLangFlag
} from './i18n.js';
import {
    state, saveShopData, saveProgressionData, clearAllProgress,
    setGameState
} from './state.js';
import {
    HAT_CATALOG, GLASSES_CATALOG, EFFECT_CATALOG,
    getLevelInfo, goldForLevelUp,
    WATCH_AD_GOLD_AMOUNT, WATCH_AD_GOLD_COOLDOWN_MS
} from './config.js';
import {
    playSound, playBGM, applyMusicMuteState, setBGMVolume
} from './audio.js';
import {
    isCrazySDKReady, requestCrazyAd, notifyGameSessionEnded
} from './sdk.js';
import { refreshAccessories, randomizeAICosmetics } from './characters.js';
import { resetFullGame } from './physics.js';

import { updateMobileControlsVisibility } from './input.js';

// AI rejiminə keçəndə P2-nin əvvəlki config-ini saxlayırıq
let savedP2ConfigBeforeAI = null;

// =====================================================================
// GOLD & LEVEL UI
// =====================================================================
export function refreshGoldUI() {
    const goldText = document.getElementById('player-gold-text');
    if (goldText) goldText.innerText = `🪙 ${state.playerCoins}`;
    const customGoldText = document.getElementById('custom-gold-text');
    if (customGoldText) customGoldText.innerText = `🪙 ${state.playerCoins}`;
}

export function refreshLevelUI() {
    const info = getLevelInfo(state.totalXp);
    const levelText = document.getElementById('player-level-text');
    const levelFill = document.getElementById('player-level-fill');
    const levelXpText = document.getElementById('player-level-xp-text');
    if (levelText) levelText.innerText = `LVL ${info.level}`;
    if (levelFill) levelFill.style.width = `${Math.min(info.progress * 100, 100)}%`;
    if (levelXpText) levelXpText.innerText = `${info.xpIntoLevel} / ${info.xpNeeded} XP`;
}

// =====================================================================
// COSMETIC GRIDS (Customize screen)
// =====================================================================
function renderCosmeticGrid(gridId, catalog, currentValue, onSelect, previewKey) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = '';
    const currentLevel = getLevelInfo(state.totalXp).level;
    const previewedId = state.previewState[previewKey];

    catalog.forEach(item => {
        const isFree = item.id === 'none';
        const owned = isFree || state.ownedItems.includes(item.id);
        const locked = !isFree && currentLevel < item.level;
        const previewing = !owned && previewedId === item.id;
        const displayedId = previewedId || currentValue;

        const card = document.createElement('div');
        card.className = 'icon-card shop-item cosmetic-card'
            + (locked ? ' cosmetic-locked' : '')
            + (previewing ? ' cosmetic-previewing' : '')
            + (!previewing && item.id === displayedId ? ' active' : '');
        card.style.height = '64px';

        let badgeHtml = '';
        if (locked) {
            badgeHtml = `<span class="lock-tag">🔒 ${t('shop.lvAbbr')} ${item.level}</span>`;
        } else if (!owned) {
            badgeHtml = previewing
                ? `<span class="preview-tag">${t('shop.tapToBuy')}</span>`
                : `<span class="price-tag">🪙 ${item.price}</span>`;
        }
        card.innerHTML = `<span class="emoji">${item.emoji}</span><span class="label">${item.name}</span>${badgeHtml}`;

        card.addEventListener('click', () => {
            if (locked) { playSound('denied'); return; }
            if (!owned) {
                if (previewing) {
                    if (state.playerCoins >= item.price) {
                        state.playerCoins -= item.price;
                        state.ownedItems.push(item.id);
                        saveShopData();
                        refreshGoldUI();
                        playSound('buy');
                        state.previewState[previewKey] = null;
                        onSelect(item.id);
                        refreshCosmeticGrids();
                    } else {
                        playSound('denied');
                    }
                } else {
                    state.previewState[previewKey] = item.id;
                    playSound('click');
                    refreshAccessories();
                    refreshCosmeticGrids();
                }
                return;
            }
            state.previewState[previewKey] = null;
            playSound('click');
            onSelect(item.id);
            refreshCosmeticGrids();
        });

        grid.appendChild(card);
    });
}

export function refreshCosmeticGrids() {
    const sc = state.selectedConfig;
    renderCosmeticGrid('p1-hat-grid', HAT_CATALOG, sc.p1.hat, v => { sc.p1.hat = v; refreshAccessories(); }, 'p1Hat');
    renderCosmeticGrid('p1-glasses-grid', GLASSES_CATALOG, sc.p1.glasses, v => { sc.p1.glasses = v; refreshAccessories(); }, 'p1Glasses');
    renderCosmeticGrid('p2-hat-grid', HAT_CATALOG, sc.p2.hat, v => { sc.p2.hat = v; refreshAccessories(); }, 'p2Hat');
    renderCosmeticGrid('p2-glasses-grid', GLASSES_CATALOG, sc.p2.glasses, v => { sc.p2.glasses = v; refreshAccessories(); }, 'p2Glasses');
}

// =====================================================================
// SHOP
// =====================================================================
export function renderShop() {
    document.getElementById('shop-coin-balance').innerText = `🪙 ${state.playerCoins}`;
    renderShopEffectGrid('shop-grid-p1', 'p1');
    renderShopEffectGrid('shop-grid-p2', 'p2');
    renderShopCosmeticGrid('shop-hat-grid', HAT_CATALOG);
    renderShopCosmeticGrid('shop-glasses-grid', GLASSES_CATALOG);
}

function renderShopEffectGrid(gridId, player) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = '';
    const previewKey = player + 'Effect';
    const items = [{ id: 'none', emoji: '❌', name: 'None' }, ...EFFECT_CATALOG];

    items.forEach(item => {
        const isFree = item.id === 'none';
        const owned = isFree || state.ownedItems.includes(item.id);
        const previewing = !owned && state.previewState[previewKey] === item.id;
        const equipped = !state.previewState[previewKey] && state.selectedConfig[player].effect === item.id;

        const card = document.createElement('div');
        card.className = 'icon-card shop-item cosmetic-card'
            + (previewing ? ' cosmetic-previewing' : '')
            + (equipped ? ' active' : '');
        card.style.height = '80px';

        let badgeHtml = '';
        if (!owned) {
            badgeHtml = previewing
                ? `<span class="preview-tag">${t('shop.tapToBuy')}</span>`
                : `<span class="price-tag">🪙 ${item.price}</span>`;
        }
        card.innerHTML = `<span class="emoji">${item.emoji}</span><span class="label">${item.name}</span>${badgeHtml}`;

        card.addEventListener('click', () => {
            if (owned) {
                state.previewState[previewKey] = null;
                state.selectedConfig[player].effect = item.id;
                playSound('click');
                refreshAccessories();
                renderShop();
                return;
            }
            if (previewing) {
                if (state.playerCoins >= item.price) {
                    state.playerCoins -= item.price;
                    state.ownedItems.push(item.id);
                    saveShopData();
                    refreshGoldUI();
                    playSound('buy');
                    state.previewState[previewKey] = null;
                    state.selectedConfig[player].effect = item.id;
                    refreshAccessories();
                    renderShop();
                } else {
                    playSound('denied');
                }
            } else {
                state.previewState[previewKey] = item.id;
                playSound('click');
                refreshAccessories();
                renderShop();
            }
        });

        grid.appendChild(card);
    });
}

function renderShopCosmeticGrid(gridId, catalog) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = '';
    const currentLevel = getLevelInfo(state.totalXp).level;

    catalog.filter(item => item.id !== 'none').forEach(item => {
        const owned = state.ownedItems.includes(item.id);
        const locked = currentLevel < item.level;
        const affordable = state.playerCoins >= item.price;

        const card = document.createElement('div');
        card.className = 'icon-card shop-item' + (owned ? ' owned' : (locked ? ' cosmetic-locked' : (!affordable ? ' unaffordable' : '')));
        card.style.height = '76px';

        let badgeHtml;
        if (owned) badgeHtml = t('shop.owned');
        else if (locked) badgeHtml = `🔒 ${t('shop.lvAbbr')} ${item.level}`;
        else badgeHtml = `🪙 ${item.price}`;

        card.innerHTML = `
            <span class="emoji">${item.emoji}</span>
            <span class="label">${item.name}</span>
            <span class="${locked ? 'lock-tag' : 'price-tag'}">${badgeHtml}</span>
        `;

        if (!owned) {
            card.addEventListener('click', () => {
                if (locked) { playSound('denied'); return; }
                if (state.playerCoins >= item.price) {
                    state.playerCoins -= item.price;
                    state.ownedItems.push(item.id);
                    saveShopData();
                    refreshGoldUI();
                    playSound('buy');
                    renderShop();
                    refreshCosmeticGrids();
                } else {
                    playSound('denied');
                }
            });
        }

        grid.appendChild(card);
    });
}

// =====================================================================
// AI LABELS
// =====================================================================
export function getAILabel() {
    return t('setup.diff' + state.aiDifficulty.charAt(0).toUpperCase() + state.aiDifficulty.slice(1)).toUpperCase() + ' ' + t('ai.bot');
}

export function refreshAILabels() {
    if (state.gameMode !== 'ai') return;
    const p2Title = document.getElementById('p2-title');
    const p2HudName = document.getElementById('p2-hud-name');
    const p2ControlsText = document.getElementById('p2-controls-text');
    const diffLabel = t('setup.diff' + state.aiDifficulty.charAt(0).toUpperCase() + state.aiDifficulty.slice(1));

    p2Title.innerText = getAILabel();
    p2HudName.innerText = t('ai.bot');
    p2ControlsText.innerText = `${diffLabel}`;
}

// =====================================================================
// WATCH AD GOLD BUTTON
// =====================================================================
export function refreshWatchAdGoldButton() {
    const btn = document.getElementById('btn-watch-ad-gold');
    if (!isCrazySDKReady()) {
        btn.style.display = 'none';
        return;
    }
    btn.style.display = 'block';
    const remainingMs = state.watchAdGoldCooldownUntil - Date.now();
    if (remainingMs > 0) {
        btn.disabled = true;
        btn.innerText = t('menu.watchAdCooldown', Math.ceil(remainingMs / 1000));
    } else {
        btn.disabled = false;
        btn.innerText = t('menu.watchAdGold', WATCH_AD_GOLD_AMOUNT);
    }
}

// =====================================================================
// VICTORY AD BUTTONS
// =====================================================================
export function refreshVictoryAdButtons() {
    const container = document.getElementById('victory-ad-options');
    if (!isCrazySDKReady()) {
        container.style.display = 'none';
        return;
    }
    container.style.display = 'flex';

    const goldBtn = document.getElementById('btn-double-gold');
    goldBtn.disabled = state.goldDoubleUsed;
    goldBtn.innerText = state.goldDoubleUsed ? t('victory.doubled') : t('victory.doubleGold');
    goldBtn.style.opacity = state.goldDoubleUsed ? '0.5' : '1';

    const xpBtn = document.getElementById('btn-double-xp');
    xpBtn.disabled = state.xpDoubleUsed;
    xpBtn.innerText = state.xpDoubleUsed ? t('victory.doubled') : t('victory.doubleXp');
    xpBtn.style.opacity = state.xpDoubleUsed ? '0.5' : '1';
}

// =====================================================================
// APPLY TRANSLATIONS (bütün UI)
// =====================================================================
export function applyTranslations() {
    // 1. Bütün data-i18n elementləri
    applyDataI18n();

    // 2. Bayraq ikonunu cari dilə görə yenilə
    const flagBox = document.querySelector('#btn-lang .flag-icon-box');
    if (flagBox) flagBox.textContent = getLangFlag();

    // 3. P2 başlıqlarını cari rejimə görə yenilə
    const p2Title = document.getElementById('p2-title');
    const p2HudName = document.getElementById('p2-hud-name');
    const p2ControlsText = document.getElementById('p2-controls-text');

    if (state.gameMode === 'ai') {
        refreshAILabels();
    } else {
        if (p2Title) p2Title.innerText = t('custom.player2');
        if (p2HudName) p2HudName.innerText = t('hud.player2');
        if (p2ControlsText) p2ControlsText.innerText = t('hud.controlsP2');
    }

    // 4. Reklam düymələri
    refreshWatchAdGoldButton();
    refreshVictoryAdButtons();

    // 5. Kosmetik gridlər
    refreshCosmeticGrids();

    // 6. Shop açıqdırsa yenilə
    const shopMenu = document.getElementById('shop-menu');
    if (shopMenu && !shopMenu.classList.contains('hidden')) renderShop();

    // 7. Victory ekranı açıqdırsa winner mətnini yenilə
    const victoryScreen = document.getElementById('victory-screen');
    if (victoryScreen && !victoryScreen.classList.contains('hidden')) {
        const winnerElem = document.getElementById('winner-text');
        if (winnerElem && winnerElem.dataset.p1Won !== undefined) {
            const p1Won = winnerElem.dataset.p1Won === 'true';
            const winnerName = p1Won
                ? t('custom.player1')
                : (state.gameMode === 'ai' ? getAILabel() : t('custom.player2'));
            winnerElem.innerText = `${winnerName} ${t('victory.wins')}`;
        }
    }
}
setOnLanguageChanged(applyTranslations);

// =====================================================================
// CHECK VICTORY (physics tərəfindən çağırılır)
// =====================================================================


// =====================================================================
// GRID SETUP (mode/map/difficulty/score)
// =====================================================================
function setupGridEvents(gridId, callback) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    const cards = grid.querySelectorAll('.icon-card');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            playSound('click');
            cards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            callback(card.dataset.value);
        });
    });
}

// =====================================================================
// DEV CHEAT HOOKS
// =====================================================================
window.__refreshGoldUI = refreshGoldUI;
window.__refreshLevelUI = refreshLevelUI;
window.__refreshCosmeticGrids = refreshCosmeticGrids;

// =====================================================================
// BÜTÜN EVENT LISTENER-LƏR
// =====================================================================
export function setupUIEventListeners() {
    // --- Grid-lər ---
    setupGridEvents('map-grid', val => {
        state.currentMapType = val;
        buildMap(val);
    });
    setupGridEvents('score-grid', val => { state.MAX_SCORE = parseInt(val, 10); });
    setupGridEvents('difficulty-grid', val => { state.aiDifficulty = val; refreshAILabels(); });

    setupGridEvents('mode-grid', val => {
        state.gameMode = val;
        const p2Box = document.getElementById('p2-box');
        const p2Title = document.getElementById('p2-title');
        const p2HudName = document.getElementById('p2-hud-name');
        const p2ControlsText = document.getElementById('p2-controls-text');
        const p2Controls = document.getElementById('p2-custom-controls');
        const aiRandomBox = document.getElementById('ai-random-box');
        const difficultySection = document.getElementById('difficulty-section');

        if (state.gameMode === 'ai') {
            // P2-nin əvvəlki (oyunçunun öz) config-ini yadda saxla
            if (!savedP2ConfigBeforeAI) {
                savedP2ConfigBeforeAI = {
                    hat: state.selectedConfig.p2.hat,
                    glasses: state.selectedConfig.p2.glasses,
                    effect: state.selectedConfig.p2.effect
                };
            }

            p2Box.style.borderColor = '#a855f7';
            p2Title.style.color = '#c084fc';
            p2HudName.style.color = '#c084fc';
            refreshAILabels();

            difficultySection.style.display = 'block';
            p2Controls.style.display = 'none';
            aiRandomBox.style.display = 'block';
            randomizeAICosmetics();
        } else {
            // AI-dən gəlmişiksə — əvvəlki config-i geri qaytar
            if (savedP2ConfigBeforeAI) {
                state.selectedConfig.p2.hat = savedP2ConfigBeforeAI.hat;
                state.selectedConfig.p2.glasses = savedP2ConfigBeforeAI.glasses;
                state.selectedConfig.p2.effect = savedP2ConfigBeforeAI.effect;
                savedP2ConfigBeforeAI = null;
            }
            // AI-nin random preview-lərini də təmizlə
            state.previewState.p2Hat = null;
            state.previewState.p2Glasses = null;
            state.previewState.p2Effect = null;

            p2Box.style.borderColor = '#ef4444';
            p2Title.innerText = t('custom.player2');
            p2Title.style.color = '#f87171';
            p2HudName.innerText = t('hud.player2');
            p2HudName.style.color = '#f87171';
            p2ControlsText.innerText = t('hud.controlsP2');

            difficultySection.style.display = 'none';
            p2Controls.style.display = 'block';
            aiRandomBox.style.display = 'none';
            refreshAccessories();
            refreshCosmeticGrids();  // grid-i də yenilə (köhnə "TAP TO BUY" getsin)
        }
    });

    // --- Menyu düymələri ---
    document.getElementById('btn-play').addEventListener('click', () => {
        playSound('click'); playBGM('menu');
        setGameState('CUSTOMIZE');
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('setup-menu').classList.remove('hidden');
    });

    document.getElementById('btn-next').addEventListener('click', () => {
        playSound('click');
        document.getElementById('setup-menu').classList.add('hidden');
        document.getElementById('custom-menu').classList.remove('hidden');
    });

    document.getElementById('btn-back').addEventListener('click', () => {
        playSound('click');
        document.getElementById('custom-menu').classList.add('hidden');
        document.getElementById('setup-menu').classList.remove('hidden');
        clearCosmeticPreviews();
        refreshAccessories();          // ← ƏLAVƏ ET
        refreshCosmeticGrids();        // ← ƏLAVƏ ET (grid-də "TAP TO BUY" getsin)
    });

    document.getElementById('btn-back-main').addEventListener('click', () => {
        playSound('click');
        document.getElementById('setup-menu').classList.add('hidden');
        document.getElementById('main-menu').classList.remove('hidden');
    });

    document.getElementById('btn-start').addEventListener('click', () => {
        playSound('click'); playBGM('game');
        clearCosmeticPreviews();
        refreshAccessories();          // ← ƏLAVƏ ET (xarakter dərhal düzəlsin)
        setGameState('PLAYING');
        document.getElementById('custom-menu').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        resetFullGame();
        document.getElementById('s1').innerText = '0';
        document.getElementById('s2').innerText = '0';
        setTimeout(() => {
            if (state.gameState === 'PLAYING') notifyGameSessionEnded();
        }, 3200);
    });

    // --- Pause ---
    document.getElementById('btn-mobile-pause').addEventListener('click', () => {
        if (state.gameState !== 'PLAYING') return;
        playSound('click');
        setGameState('PAUSED');
        document.getElementById('pause-menu').classList.remove('hidden');
    });

    document.getElementById('btn-resume').addEventListener('click', () => {
        playSound('click');
        setGameState('PLAYING');
        document.getElementById('pause-menu').classList.add('hidden');
    });

    document.getElementById('btn-pause-main-menu').addEventListener('click', () => {
        playSound('click'); playBGM('menu');
        setGameState('MENU');
        document.getElementById('pause-menu').classList.add('hidden');
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('main-menu').classList.remove('hidden');
        resetFullGame();
        notifyGameSessionEnded();
    });

    // --- Settings ---
    document.getElementById('btn-settings').addEventListener('click', () => {
        playSound('click');
        state.previousMenuState = 'MENU';
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('settings-menu').classList.remove('hidden');
    });

    document.getElementById('btn-pause-settings').addEventListener('click', () => {
        playSound('click');
        state.previousMenuState = 'PAUSED';
        document.getElementById('pause-menu').classList.add('hidden');
        document.getElementById('settings-menu').classList.remove('hidden');
    });

    document.getElementById('btn-settings-back').addEventListener('click', () => {
        playSound('click');
        document.getElementById('settings-menu').classList.add('hidden');
        if (state.previousMenuState === 'MENU') {
            document.getElementById('main-menu').classList.remove('hidden');
        } else if (state.previousMenuState === 'PAUSED') {
            document.getElementById('pause-menu').classList.remove('hidden');
        }
    });

    document.getElementById('slider-bgm').addEventListener('input', (e) => {
        state.bgmVolume = e.target.value / 100;
        setBGMVolume(state.bgmVolume);
    });

    document.getElementById('slider-sfx').addEventListener('input', (e) => {
        state.sfxVolume = e.target.value / 100;
    });

    document.getElementById('btn-reset-progress').addEventListener('click', () => {
        const confirmed = window.confirm(t('settings.resetConfirm'));
        if (!confirmed) return;

        clearAllProgress();
        state.totalXp = 0;
        state.playerCoins = 0;
        state.ownedItems = [];

        ['p1', 'p2'].forEach(p => {
            state.selectedConfig[p].hat = 'none';
            state.selectedConfig[p].glasses = 'none';
            state.selectedConfig[p].effect = 'none';
        });
        ['p1Hat', 'p1Glasses', 'p2Hat', 'p2Glasses', 'p1Effect', 'p2Effect'].forEach(k => {
            state.previewState[k] = null;
        });
        refreshAccessories();

        refreshLevelUI();
        refreshGoldUI();
        refreshCosmeticGrids();
        renderShop();
        playSound('click');
    });

    // --- Lang ---
    document.getElementById('btn-lang').addEventListener('click', () => {
        playSound('click');
        document.getElementById('lang-picker').classList.remove('hidden');
    });

    document.querySelectorAll('.lang-option').forEach(btn => {
        btn.addEventListener('click', () => {
            playSound('click');
            setLanguage(btn.getAttribute('data-lang'));
            document.getElementById('lang-picker').classList.add('hidden');
        });
    });

    document.getElementById('btn-lang-close').addEventListener('click', () => {
        playSound('click');
        document.getElementById('lang-picker').classList.add('hidden');
    });

    // --- Shop ---
    document.getElementById('btn-shop').addEventListener('click', () => {
        playSound('click');
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('shop-menu').classList.remove('hidden');
        renderShop();
    });

    document.getElementById('btn-shop-back').addEventListener('click', () => {
        playSound('click');
        document.getElementById('shop-menu').classList.add('hidden');
        document.getElementById('main-menu').classList.remove('hidden');
        state.previewState.p1Effect = null;
        state.previewState.p2Effect = null;
        refreshAccessories();
    });

    // --- Audio toggles ---
    document.getElementById('btn-toggle-sfx').addEventListener('click', () => {
        state.sfxMuted = !state.sfxMuted;
        const btn = document.getElementById('btn-toggle-sfx');
        btn.classList.toggle('muted', state.sfxMuted);
        btn.innerText = state.sfxMuted ? '🔇' : '🔊';
        if (!state.sfxMuted) playSound('click');
    });

    document.getElementById('btn-toggle-music').addEventListener('click', () => {
        state.musicMuted = !state.musicMuted;
        applyMusicMuteState();
        const btn = document.getElementById('btn-toggle-music');
        btn.classList.toggle('muted', state.musicMuted);
        btn.innerText = state.musicMuted ? '🔇' : '🎵';
        playSound('click');
    });

    // --- Watch ad gold ---
    document.getElementById('btn-watch-ad-gold').addEventListener('click', () => {
        if (Date.now() < state.watchAdGoldCooldownUntil) return;
        requestCrazyAd('rewarded', () => {
            state.playerCoins += WATCH_AD_GOLD_AMOUNT;
            saveShopData();
            refreshGoldUI();
            playSound('buy');
            state.watchAdGoldCooldownUntil = Date.now() + WATCH_AD_GOLD_COOLDOWN_MS;
            refreshWatchAdGoldButton();
        });
    });

    // --- Victory ---
    document.getElementById('btn-rematch').addEventListener('click', () => {
        playSound('click'); playBGM('game');
        setGameState('PLAYING');
        document.getElementById('victory-screen').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        resetFullGame();
        document.getElementById('s1').innerText = '0';
        document.getElementById('s2').innerText = '0';
        // Rematch-da da midgame ad
        setTimeout(() => {
            if (state.gameState === 'PLAYING') notifyGameSessionEnded();
        }, 2000);
    });

    document.getElementById('btn-main-menu').addEventListener('click', () => {
        playSound('click'); playBGM('menu');
        setGameState('MENU');
        document.getElementById('victory-screen').classList.add('hidden');
        document.getElementById('main-menu').classList.remove('hidden');
        resetFullGame();
        notifyGameSessionEnded();   // ← bu sətri əlavə et
    });

    document.getElementById('btn-double-gold').addEventListener('click', () => {
        if (state.goldDoubleUsed) return;
        requestCrazyAd('rewarded', () => {
            state.playerCoins += state.lastMatchGoldGained;
            state.goldDoubleUsed = true;
            saveShopData();
            refreshGoldUI();
            document.getElementById('victory-gold-gained').innerText = state.lastMatchLeveledUp
                ? `${state.lastMatchGoldGained * 2} +${state.lastMatchLevelUpGold} bonus (2x!)`
                : `${state.lastMatchGoldGained * 2} (2x!)`;
            refreshVictoryAdButtons();
            playSound('buy');
        });
    });

    document.getElementById('btn-double-xp').addEventListener('click', () => {
        if (state.xpDoubleUsed) return;
        requestCrazyAd('rewarded', () => {
            const beforeLevel = getLevelInfo(state.totalXp).level;
            state.totalXp += state.lastMatchXpGained;
            state.xpDoubleUsed = true;
            const afterInfo = getLevelInfo(state.totalXp);
            const leveledUpAgain = afterInfo.level > beforeLevel;
            if (leveledUpAgain) {
                let bonusGold = 0;
                for (let lvl = beforeLevel + 1; lvl <= afterInfo.level; lvl++) bonusGold += goldForLevelUp(lvl);
                state.playerCoins += bonusGold;
                saveShopData();
                refreshGoldUI();
                document.getElementById('victory-levelup-banner').innerHTML = `${t('victory.levelUp')} <span id="victory-new-level">${afterInfo.level}</span>!`;
                document.getElementById('victory-levelup-banner').style.display = 'block';
                playSound('levelup');
            }
            saveProgressionData();
            refreshLevelUI();
            refreshCosmeticGrids();
            document.getElementById('victory-xp-gained').innerText = `${state.lastMatchXpGained * 2} (2x!)`;
            document.getElementById('victory-level-fill').style.width = `${Math.min(afterInfo.progress * 100, 100)}%`;
            document.getElementById('victory-level-text').innerText = `LVL ${afterInfo.level} · ${afterInfo.xpIntoLevel} / ${afterInfo.xpNeeded} XP`;
            refreshVictoryAdButtons();
            playSound('buy');
        });
    });

    // --- Klaviatura Escape ---
    window.addEventListener('keydown', (e) => {
        if (e.code !== 'Escape') return;
        const shopMenu = document.getElementById('shop-menu');
        if (!shopMenu.classList.contains('hidden')) {
            shopMenu.classList.add('hidden');
            document.getElementById('main-menu').classList.remove('hidden');
            state.previewState.p1Effect = null;
            state.previewState.p2Effect = null;
            refreshAccessories();
            return;
        }
        const settingsMenu = document.getElementById('settings-menu');
        if (!settingsMenu.classList.contains('hidden')) {
            settingsMenu.classList.add('hidden');
            if (state.previousMenuState === 'MENU') {
                document.getElementById('main-menu').classList.remove('hidden');
            } else if (state.previousMenuState === 'PAUSED') {
                document.getElementById('pause-menu').classList.remove('hidden');
            }
            return;
        }
        if (state.gameState === 'PLAYING') {
            setGameState('PAUSED');
            document.getElementById('pause-menu').classList.remove('hidden');
        } else if (state.gameState === 'PAUSED') {
            setGameState('PLAYING');
            document.getElementById('pause-menu').classList.add('hidden');
        }
    });

    // Watch ad gold cooldown tick
    setInterval(() => {
        const menu = document.getElementById('main-menu');
        if (menu && !menu.classList.contains('hidden')) refreshWatchAdGoldButton();
    }, 1000);
}

// =====================================================================
// İLK UI RENDER
// =====================================================================
refreshLevelUI();
refreshGoldUI();
refreshCosmeticGrids();