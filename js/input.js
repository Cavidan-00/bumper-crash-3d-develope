// =====================================================================
// INPUT — KLAVİATURA VƏ MOBİL TOXUN İDARƏETMƏ
// Bütün input toplanması burada. `keys` obyekti export olunur.
// =====================================================================

import { state } from './state.js';

// =====================================================================
// KLAVİATURA
// =====================================================================
export const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
});
window.addEventListener('keyup', (e) => keys[e.code] = false);

// =====================================================================
// MOBİL
// =====================================================================
export const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

export const p1Joystick = { active: false, dirX: 0, dirZ: 0, magnitude: 0 };
export const p2Joystick = { active: false, dirX: 0, dirZ: 0, magnitude: 0 };

function setupJoystick(zoneEl, jsState) {
    if (!zoneEl) return;
    const thumbEl = zoneEl.querySelector('.joystick-thumb');
    const MAX_DRAG = 42;
    let touchId = null;

    function moveThumb(clientX, clientY) {
        const rect = zoneEl.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = clientX - cx;
        const dy = clientY - cy;
        const dist = Math.hypot(dx, dy);
        const clampedDist = Math.min(dist, MAX_DRAG);
        const angle = Math.atan2(dy, dx);
        const tx = Math.cos(angle) * clampedDist;
        const ty = Math.sin(angle) * clampedDist;
        thumbEl.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px))`;

        jsState.active = true;
        jsState.magnitude = clampedDist / MAX_DRAG;
        if (dist > 0.001) {
            jsState.dirX = dx / dist;
            jsState.dirZ = dy / dist;
        }
    }

    function reset() {
        touchId = null;
        jsState.active = false;
        jsState.magnitude = 0;
        thumbEl.style.transform = 'translate(-50%, -50%)';
    }

    zoneEl.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (touchId !== null) return;
        const t = e.changedTouches[0];
        touchId = t.identifier;
        moveThumb(t.clientX, t.clientY);
    }, { passive: false });

    zoneEl.addEventListener('touchmove', (e) => {
        e.preventDefault();
        for (const t of e.changedTouches) {
            if (t.identifier === touchId) { moveThumb(t.clientX, t.clientY); break; }
        }
    }, { passive: false });

    function onTouchEnd(e) {
        for (const t of e.changedTouches) {
            if (t.identifier === touchId) { reset(); break; }
        }
    }
    zoneEl.addEventListener('touchend', onTouchEnd);
    zoneEl.addEventListener('touchcancel', onTouchEnd);
}

function setupDashButton(btnEl, keyCode) {
    if (!btnEl) return;
    btnEl.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keys[keyCode] = true;
        requestAnimationFrame(() => { keys[keyCode] = false; });
    }, { passive: false });
}

// Yalnız touch device-də başlat
if (isTouchDevice) {
    setupJoystick(document.getElementById('joystick-p1'), p1Joystick);
    setupJoystick(document.getElementById('joystick-p2'), p2Joystick);
    setupDashButton(document.getElementById('dash-btn-p1'), 'Space');
    setupDashButton(document.getElementById('dash-btn-p2'), 'Enter');
}

// =====================================================================
// MOBİL KONTROL GÖRÜNÜRLÜYÜ
// =====================================================================
export function updateMobileControlsVisibility() {
    const controls = document.getElementById('mobile-controls');
    const pauseBtn = document.getElementById('btn-mobile-pause');
    if (pauseBtn) pauseBtn.style.display = (isTouchDevice && state.gameState === 'PLAYING') ? 'flex' : 'none';
    if (!controls) return;
    if (!isTouchDevice || state.gameState !== 'PLAYING') {
        controls.style.display = 'none';
        return;
    }
    controls.style.display = 'block';
    document.getElementById('joystick-p1').style.display = 'block';
    document.getElementById('dash-btn-p1').style.display = 'flex';
    const showP2 = state.gameMode !== 'ai';
    document.getElementById('joystick-p2').style.display = showP2 ? 'block' : 'none';
    document.getElementById('dash-btn-p2').style.display = showP2 ? 'flex' : 'none';
}

// =====================================================================
// ORIENTATION
// =====================================================================
export function checkOrientation() {
    const prompt = document.getElementById('rotate-prompt');
    if (!prompt) return;
    const isPortrait = window.innerHeight > window.innerWidth;
    prompt.style.display = (isTouchDevice && isPortrait) ? 'flex' : 'none';
}
window.addEventListener('resize', checkOrientation);
window.addEventListener('orientationchange', checkOrientation);
checkOrientation();

// Landscape lock cəhdi (yalnız fullscreen-də işləyir)
export function tryLockLandscape() {
    try {
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(() => {});
        }
    } catch (e) { /* not supported - rotate-prompt covers this */ }
}
if (isTouchDevice) {
    tryLockLandscape();
    window.addEventListener('touchstart', tryLockLandscape, { once: true });
}

// Orientation dəyişəndə bir neçə dəfə resize çağır (mobile brauzerlər üçün)
window.addEventListener('orientationchange', () => {
    setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
    setTimeout(() => window.dispatchEvent(new Event('resize')), 400);
});