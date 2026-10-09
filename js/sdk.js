// =====================================================================
// SDK — CRAZYGAMES İNTEQRASİYASI
// SDK yoxdursa (local test, digər platforma) hər şey graceful fallback edir.
// =====================================================================

import { state, setGameState } from './state.js';

let crazySDK = null;
let crazySDKReady = false;

// Callback-lər — bunlar UI tərəfindən təyin olunur
let onSDKReady = null;
export function setOnSDKReady(fn) { onSDKReady = fn; }

// Audio pause/resume callbacks — audio.js tərəfindən təyin olunur
let pauseAudioFn = () => {};
let resumeAudioFn = () => {};
export function setAdAudioHandlers(pauseFn, resumeFn) {
    pauseAudioFn = pauseFn;
    resumeAudioFn = resumeFn;
}

// Mobile controls visibility callback — input.js tərəfindən təyin olunur
let updateMobileFn = () => {};
export function setMobileUpdateFn(fn) { updateMobileFn = fn; }

export function isCrazySDKReady() { return crazySDKReady; }

// --- SDK init ---
export async function initCrazySDK() {
    try {
        if (!window.CrazyGames || !window.CrazyGames.SDK) return;
        await window.CrazyGames.SDK.init();
        crazySDK = window.CrazyGames.SDK;
        crazySDKReady = true;
        try { crazySDK.game.loadingStart(); } catch (e) { console.warn('[SDK] loadingStart:', e); }
        if (state.gameSetupComplete) {
            try { crazySDK.game.loadingStop(); } catch (e) { console.warn('[SDK] loadingStop:', e); }
        }
        if (typeof onSDKReady === 'function') onSDKReady();
    } catch (e) {
        console.warn('[CrazyGames SDK] not available:', e);
    }
}

// --- State dəyişdikdə çağırılır ---
export function notifyGameplayStart() {
    if (!crazySDKReady) return;
    try { crazySDK.game.gameplayStart(); } catch (e) { console.warn('[SDK] gameplayStart:', e); }
}
export function notifyGameplayStop() {
    if (!crazySDKReady) return;
    try { crazySDK.game.gameplayStop(); } catch (e) { console.warn('[SDK] gameplayStop:', e); }
}
export function notifyLoadingStop() {
    if (!crazySDKReady) return;
    try { crazySDK.game.loadingStop(); } catch (e) { console.warn('[SDK] loadingStop:', e); }
}

// =====================================================================
// AD REQUESTS
// =====================================================================
export function requestCrazyAd(type, onReward) {
    if (!crazySDKReady) return;

    const wasPlaying = state.gameState === 'PLAYING';
    try {
        crazySDK.ad.requestAd(type, {
            adStarted: () => {
                state.adInProgress = true;
                if (wasPlaying) setGameState('PAUSED');
                pauseAudioFn();
            },
            adFinished: () => {
                state.adInProgress = false;
                resumeAudioFn();
                if (wasPlaying) setGameState('PLAYING');
                if (onReward) onReward();
            },
            adError: (error) => {
                state.adInProgress = false;
                resumeAudioFn();
                if (wasPlaying) setGameState('PLAYING');
                console.warn('[CrazyGames Ad] error:', error);
            }
        });
    } catch (e) {
        console.warn('[SDK] requestAd failed:', e);
        if (onReward) onReward();  // ad uğursuz olsa da mükafatı ver
    }
}

// =====================================================================
// MIDGAME AD — session bitdikdə çağırılır (main.js/UI-dən)
// =====================================================================
export function notifyGameSessionEnded() {
    requestCrazyAd('midgame');
}