// =====================================================================
// MAIN — GİRİŞ NÖQTƏSİ, HAMISINI BİRLƏŞDİRİR
// =====================================================================

// --- Config & infra ---
import {
    WIN_XP, LOSS_XP_2P, LOSS_XP_AI,
    WIN_GOLD, LOSS_GOLD_2P, LOSS_GOLD_AI,
    goldForLevelUp, getLevelInfo
} from './config.js';

// --- State ---
import { state, setGameState, setOnGameStateChange, saveProgressionData, saveShopData } from './state.js';

// --- i18n ---
import { t } from './i18n.js';

// --- SDK ---
import {
    initCrazySDK, setOnSDKReady, setAdAudioHandlers,
    notifyGameplayStart, notifyGameplayStop, notifyLoadingStop, notifyGameSessionEnded
} from './sdk.js';

// --- Audio ---
import {
    playSound, playBGM, pauseGameAudioForAd, resumeGameAudioAfterAd,
    setupAutoplayUnlock
} from './audio.js';

// --- World (scene, map, particles) ---
import {
    scene, camera, renderer, effectClock,
    buildMap,
} from './world.js';

// --- Characters ---
import { p1Char, p2Char, updateCharacterEffects } from './characters.js';

// --- Input ---
import { updateMobileControlsVisibility,  } from './input.js';

// --- AI ---
import { updateAI } from './ai.js';

// --- Physics ---

import {
    p1, p2, update, updateMenuCamera,
    handlePlayer1Input, handlePlayer2Input,
    resetFullGame, setOnVictoryCheck,
    getTimeScale, getScores
} from './physics.js';

// --- UI ---
import {
    setupUIEventListeners, applyTranslations, refreshLevelUI, refreshGoldUI,
    refreshCosmeticGrids, getAILabel, renderShop,
    refreshWatchAdGoldButton, refreshVictoryAdButtons
} from './ui.js';


// =====================================================================
// GAME STATE CHANGE
// =====================================================================
setOnGameStateChange((wasPlaying, isPlaying) => {
    try {
        if (isPlaying && !wasPlaying) notifyGameplayStart();
        else if (!isPlaying && wasPlaying) notifyGameplayStop();
    } catch (e) {
        console.warn('[state change] SDK error:', e);
    }
    try {
        updateMobileControlsVisibility();
    } catch (e) {
        console.warn('[state change] UI error:', e);
    }
});

// =====================================================================
// SDK HOOK-UP
// =====================================================================
setOnSDKReady(() => {
    refreshWatchAdGoldButton();
    refreshVictoryAdButtons();
});
setAdAudioHandlers(pauseGameAudioForAd, resumeGameAudioAfterAd);

// =====================================================================
// VICTORY HANDLER (physics-dən çağırılır)
// =====================================================================
function handleVictory() {
    const { s1, s2 } = getScores();

    if (s1 < state.MAX_SCORE && s2 < state.MAX_SCORE) return;

    setGameState('VICTORY');
    const p1Won = s1 >= state.MAX_SCORE;
    const winnerName = p1Won ? t('custom.player1') : (state.gameMode === 'ai' ? getAILabel() : t('custom.player2'));
    const winnerColor = p1Won ? '#60a5fa' : (state.gameMode === 'ai' ? '#c084fc' : '#f87171');
    const winnerElem = document.getElementById('winner-text');
    winnerElem.dataset.p1Won = String(p1Won);
    winnerElem.innerText = `${winnerName} ${t('victory.wins')}`;
    winnerElem.style.color = winnerColor;
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('victory-screen').classList.remove('hidden');
    playBGM('over');

    let xpGained, goldGained;
    if (p1Won) {
        xpGained = WIN_XP;
        goldGained = WIN_GOLD;
    } else if (state.gameMode === 'ai') {
        xpGained = LOSS_XP_AI;
        goldGained = LOSS_GOLD_AI;
    } else {
        xpGained = LOSS_XP_2P;
        goldGained = LOSS_GOLD_2P;
    }

    const beforeLevel = getLevelInfo(state.totalXp).level;
    state.totalXp += xpGained;
    state.playerCoins += goldGained;

    const afterInfo = getLevelInfo(state.totalXp);
    const leveledUp = afterInfo.level > beforeLevel;
    let levelUpGold = 0;
    if (leveledUp) {
        for (let lvl = beforeLevel + 1; lvl <= afterInfo.level; lvl++) {
            levelUpGold += goldForLevelUp(lvl);
        }
        state.playerCoins += levelUpGold;
    }

    saveProgressionData();
    saveShopData();

    document.getElementById('victory-xp-gained').innerText = xpGained;
    document.getElementById('victory-gold-gained').innerText = leveledUp ? `${goldGained} +${levelUpGold} bonus` : `${goldGained}`;
    document.getElementById('victory-level-fill').style.width = `${Math.min(afterInfo.progress * 100, 100)}%`;
    document.getElementById('victory-level-text').innerText = `LVL ${afterInfo.level} · ${afterInfo.xpIntoLevel} / ${afterInfo.xpNeeded} XP`;

    const banner = document.getElementById('victory-levelup-banner');
    if (leveledUp) {
        banner.innerHTML = `${t('victory.levelUp')} <span id="victory-new-level">${afterInfo.level}</span>!`;
        banner.style.display = 'block';
        playSound('levelup');
    } else {
        banner.style.display = 'none';
    }

    refreshLevelUI();
    refreshGoldUI();
    refreshCosmeticGrids();

    state.lastMatchXpGained = xpGained;
    state.lastMatchGoldGained = goldGained;
    state.lastMatchLeveledUp = leveledUp;
    state.lastMatchLevelUpGold = levelUpGold;
    state.goldDoubleUsed = false;
    state.xpDoubleUsed = false;
    refreshVictoryAdButtons();

    notifyGameSessionEnded();
}
setOnVictoryCheck(handleVictory);

// =====================================================================
// ANIMATE LOOP
// =====================================================================
function animate() {
    requestAnimationFrame(animate);

    if (state.gameState === 'PLAYING') {
        handlePlayer1Input();
        if (state.gameMode === '2p') handlePlayer2Input();
        else if (state.gameMode === 'ai') updateAI();
        update();
    } else {
        updateMenuCamera();
    }

    const elapsed = effectClock.getElapsedTime();
    updateCharacterEffects(elapsed);

    renderer.render(scene, camera);
}

// =====================================================================
// BOOTSTRAP
// =====================================================================

// 1. İlk map qur
buildMap(state.currentMapType);

// 2. UI listener-ləri qur
setupUIEventListeners();

// 3. Autoplay unlock
setupAutoplayUnlock();

// 4. BGM başlat (cəhd)
playBGM('menu');

// 5. SDK init
initCrazySDK();

// 6. Tərcümələri tətbiq et
applyTranslations();

// 7. Loading bitdi
state.gameSetupComplete = true;
notifyLoadingStop();

// 8. Animasiyanı başlat
animate();