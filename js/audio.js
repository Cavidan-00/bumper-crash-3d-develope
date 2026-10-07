// =====================================================================
// AUDIO — BGM VƏ SFX İDARƏETMƏ
// Bütün səslər Web Audio API ilə proqramlı şəkildə generasiya olunur.
// BGM faylları <audio> teqlərindən istifadə edir.
// =====================================================================

import { state } from './state.js';

// --- DOM audio elementləri ---
const audioMenu = document.getElementById('bgm-menu');
const audioGame = document.getElementById('bgm-game');
const audioOver = document.getElementById('bgm-over');

audioMenu.volume = 0.5;
audioGame.volume = 0.4;
audioOver.volume = 0.6;

let currentTrack = null;

// =====================================================================
// BGM
// =====================================================================
export function playBGM(track) {
    const active = track === 'menu' ? audioMenu : (track === 'game' ? audioGame : audioOver);

    if (track === currentTrack) {
        if (active.paused) active.play().catch(() => {});
        return;
    }

    currentTrack = track;
    audioMenu.pause();
    audioGame.pause();
    audioOver.pause();

    if (track === 'menu') {
        audioMenu.play().catch(() => {});
    } else if (track === 'game') {
        audioGame.currentTime = 0;
        audioGame.play().catch(() => {});
    } else if (track === 'over') {
        audioOver.currentTime = 0;
        audioOver.play().catch(() => {});
    }
}

export function pauseGameAudioForAd() {
    [audioMenu, audioGame, audioOver].forEach(a => { if (!a.paused) a.pause(); });
}

export function resumeGameAudioAfterAd() {
    if (currentTrack === 'menu') audioMenu.play().catch(() => {});
    else if (currentTrack === 'game') audioGame.play().catch(() => {});
    else if (currentTrack === 'over') audioOver.play().catch(() => {});
}

export function applyMusicMuteState() {
    [audioMenu, audioGame, audioOver].forEach(a => { a.muted = state.musicMuted; });
}

export function setBGMVolume(v) {
    audioMenu.volume = v;
    audioGame.volume = v * 0.8;
    audioOver.volume = v;
}

// İlk istifadəçi klikində BGM-i başlatmaq üçün
export function setupAutoplayUnlock() {
    function handleFirstInteraction() {
        if (audioMenu.paused && state.gameState === 'MENU') {
            playBGM('menu');
        }
        window.removeEventListener('click', handleFirstInteraction);
        window.removeEventListener('keydown', handleFirstInteraction);
    }
    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);
}

// =====================================================================
// SFX (Web Audio API synthesis)
// =====================================================================
let audioCtx = null;

function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

export function playSound(type, intensity = 1.0) {
    if (state.adInProgress || state.sfxMuted) return;
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    if (type === 'click') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);
        gain.gain.setValueAtTime(0.15 * state.sfxVolume, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.04);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(now); osc.stop(now + 0.04);
    }
    else if (type === 'hit') {
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const baseFreq = 140 + Math.min(intensity * 120, 180);
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(baseFreq, now);
        osc1.frequency.exponentialRampToValueAtTime(25, now + 0.2);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(baseFreq * 0.5, now);
        osc2.frequency.exponentialRampToValueAtTime(20, now + 0.25);
        const volume = Math.min((0.3 + intensity * 0.5) * state.sfxVolume, 0.9);
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
        osc1.connect(gain); osc2.connect(gain); gain.connect(audioCtx.destination);
        osc1.start(now); osc2.start(now);
        osc1.stop(now + 0.22); osc2.stop(now + 0.22);
    }
    else if (type === 'dash') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
        gain.gain.setValueAtTime(0.2 * state.sfxVolume, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(now); osc.stop(now + 0.1);
    }
    else if (type === 'fall') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.5);
        gain.gain.setValueAtTime(0.2 * state.sfxVolume, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(now); osc.stop(now + 0.5);
    }
    else if (type === 'buy') {
        [523, 784].forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + i * 0.07);
            gain.gain.setValueAtTime(0.18 * state.sfxVolume, now + i * 0.07);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.07 + 0.18);
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.start(now + i * 0.07); osc.stop(now + i * 0.07 + 0.18);
        });
    }
    else if (type === 'denied') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(140, now);
        gain.gain.setValueAtTime(0.12 * state.sfxVolume, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(now); osc.stop(now + 0.15);
    }
    else if (type === 'levelup') {
        [523, 659, 880].forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + i * 0.09);
            gain.gain.setValueAtTime(0.2 * state.sfxVolume, now + i * 0.09);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.09 + 0.25);
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.start(now + i * 0.09); osc.stop(now + i * 0.09 + 0.25);
        });
    }
}