// =====================================================================
// SDK — BOŞ VERSİYA (SDK-sız build)
// Bütün funksiyalar heç nə etmir, amma API eynidir.
// =====================================================================

export function initCrazySDK() {}
export function setOnSDKReady(fn) {}
export function setAdAudioHandlers(pauseFn, resumeFn) {}
export function setMobileUpdateFn(fn) {}
export function isCrazySDKReady() { return false; }
export function notifyGameplayStart() {}
export function notifyGameplayStop() {}
export function notifyLoadingStop() {}
export function notifyGameSessionEnded() {}
export function requestCrazyAd(type, onReward) {}