// =====================================================================
// PHYSICS — OYUN FİZİKASI, KOLLİZİYA, KAMERA
// Hər frame update olunur. Bütün oyun vəziyyətini idarə edir.
// =====================================================================

// physics.js

import * as THREE from 'three';
import { state } from './state.js';
import { p1Char, p2Char } from './characters.js';
import {
    camera,
    camPosMenu, camLookMenu, camPosCustomize, camLookCustomize,
    createImpactParticles, createShockwave, updateParticles, updateShockwaves
} from './world.js';
import { playSound } from './audio.js';
import { incrementIdleTimer } from './ai.js';
import { keys, p1Joystick, p2Joystick } from './input.js';
import {
    ACCEL, FRICTION, DASH_FORCE, DASH_COOLDOWN, GRAVITY,
    arenaRadius, squareSize, playerRadius
} from './config.js';

// =====================================================================
// PLAYER STATE
// =====================================================================

// DOM element references (cached once)
const domRefs = {
    s1: null, s2: null,
    p1Dash: null, p2Dash: null
};

// İlk istifadədə tap
function initDomRefs() {
    if (domRefs.s1) return;
    domRefs.s1 = document.getElementById('s1');
    domRefs.s2 = document.getElementById('s2');
    domRefs.p1Dash = document.getElementById('p1-dash');
    domRefs.p2Dash = document.getElementById('p2-dash');
}
initDomRefs();

export function getScores() { return { s1: score1, s2: score2 }; }

export const p1 = { obj: p1Char, pos: new THREE.Vector3(-3.5, playerRadius, 0), vel: new THREE.Vector3(), fallVel: 0, dashCd: 0, isFalling: false };
export const p2 = { obj: p2Char, pos: new THREE.Vector3(3.5, playerRadius, 0), vel: new THREE.Vector3(), fallVel: 0, dashCd: 0, isFalling: false };

export let score1 = 0;
export let score2 = 0;
export let timeScale = 1.0;
export let shakeIntensity = 0;

let collisionCooldown = 0;

export function getTimeScale() { return timeScale; }



// Kamera state (bu modulun mülkiyyətidir)
const currentCamPos = camPosMenu.clone();
const currentCamLook = camLookMenu.clone();

// Victory callback — main.js tərəfindən təyin olunur
let onVictoryCheck = null;
export function setOnVictoryCheck(fn) { onVictoryCheck = fn; }

// =====================================================================
// RESET
// =====================================================================
export function resetPositions() {
    p1.pos.set(-4, 1.1, 0);
    p2.pos.set(4, 1.1, 0);
    p1.vel.set(0, 0, 0); p2.vel.set(0, 0, 0);
    p1.fallVel = 0; p2.fallVel = 0;
    p1.isFalling = false; p2.isFalling = false;
    p1.obj.bodyMesh.scale.set(1, 1, 1); p2.obj.bodyMesh.scale.set(1, 1, 1);
    p1.obj.headGroup.rotation.set(0, 0, 0); p2.obj.headGroup.rotation.set(0, 0, 0);
    timeScale = 1.0;

    p1.obj.group.position.copy(p1.pos);
    p2.obj.group.position.copy(p2.pos);
}

export function resetFullGame() {
    score1 = 0;
    score2 = 0;
    resetPositions();
}

// =====================================================================
// INPUT HANDLERS (bu fayldadır, çünki p1/p2-yə birbaşa toxunur)
// =====================================================================
export function handlePlayer1Input() {
    if (p1.isFalling) return;

    let inputX = 0;
    let inputZ = 0;
    let inputMag = 1;

    if (keys['KeyW']) inputZ -= 1;
    if (keys['KeyS']) inputZ += 1;
    if (keys['KeyA']) inputX -= 1;
    if (keys['KeyD']) inputX += 1;

    if (inputX === 0 && inputZ === 0 && p1Joystick.active) {
        inputX = p1Joystick.dirX;
        inputZ = p1Joystick.dirZ;
        inputMag = p1Joystick.magnitude;
    }

    if (inputX !== 0 || inputZ !== 0) {
        const length = Math.hypot(inputX, inputZ);
        const dirX = inputX / length;
        const dirZ = inputZ / length;
        p1.vel.x += dirX * ACCEL * timeScale * inputMag;
        p1.vel.z += dirZ * ACCEL * timeScale * inputMag;
    }

    if (keys['Space'] && p1.dashCd <= 0) {
        let dashDirX = p1.vel.x;
        let dashDirZ = p1.vel.z;
        const speed = Math.hypot(dashDirX, dashDirZ);
        if (speed > 0.001) {
            dashDirX /= speed;
            dashDirZ /= speed;
        } else {
            dashDirX = 0;
            dashDirZ = -1;
        }
        p1.vel.x += dashDirX * DASH_FORCE;
        p1.vel.z += dashDirZ * DASH_FORCE;
        p1.dashCd = DASH_COOLDOWN;
        playSound('dash');
    }
}

export function handlePlayer2Input() {
    if (p2.isFalling) return;

    let p2InputX = 0, p2InputZ = 0, p2Mag = 1;
    if (keys['ArrowUp']) p2InputZ -= 1;
    if (keys['ArrowDown']) p2InputZ += 1;
    if (keys['ArrowLeft']) p2InputX -= 1;
    if (keys['ArrowRight']) p2InputX += 1;

    if (p2InputX === 0 && p2InputZ === 0 && p2Joystick.active) {
        p2InputX = p2Joystick.dirX;
        p2InputZ = p2Joystick.dirZ;
        p2Mag = p2Joystick.magnitude;
    }
    p2.vel.x += p2InputX * ACCEL * p2Mag;
    p2.vel.z += p2InputZ * ACCEL * p2Mag;

    if (keys['Enter'] && p2.dashCd <= 0) {
        const dir = new THREE.Vector3(p2.vel.x, 0, p2.vel.z).normalize();
        if (dir.lengthSq() === 0) dir.set(0, 0, -1);
        p2.vel.addScaledVector(dir, DASH_FORCE);
        p2.dashCd = DASH_COOLDOWN;
        playSound('dash');
    }
}

// =====================================================================
// UPDATE — HƏR FRAME
// =====================================================================
export function update() {
    incrementIdleTimer();

    // Propeller
    [p1Char, p2Char].forEach(c => {
        if (c.propellerBlade) {
            c.propellerBlade.rotation.y += 0.22 * timeScale;
        }
    });

    // Dash cooldown
    if (collisionCooldown > 0) collisionCooldown -= timeScale;
    [p1, p2].forEach((p, idx) => {
        if (p.dashCd > 0) p.dashCd -= 0.57 * timeScale;
        const cdBar = idx === 0 ? domRefs.p1Dash : domRefs.p2Dash;
        if (cdBar) {
            const pct = Math.max(0, 100 - (p.dashCd / DASH_COOLDOWN) * 100);
            cdBar.style.width = pct + '%';
        }
    });

    // Out of bounds / fall
    [p1, p2].forEach((p) => {
        const distFromCenter = Math.hypot(p.pos.x, p.pos.z);

        let out = false;
        if (state.currentMapType === 'square') {
            if (Math.abs(p.pos.x) > squareSize / 2 || Math.abs(p.pos.z) > squareSize / 2) out = true;
        } else {
            if (distFromCenter > arenaRadius) out = true;
        }

        if (out) p.isFalling = true;

        if (p.isFalling) {
            p.fallVel += GRAVITY * 2.5 * timeScale;
            p.pos.y -= p.fallVel * timeScale;
            p.pos.x += p.vel.x * timeScale;
            p.pos.z += p.vel.z * timeScale;
            p.vel.x *= 0.92;
            p.vel.z *= 0.92;

            if (p.pos.y < -8) {
                playSound('fall');
                if (p === p1) {
                    score2++;
                    domRefs.s2.innerText = score2;
                } else {
                    score1++;
                    domRefs.s1.innerText = score1;
                }
                if (onVictoryCheck) onVictoryCheck();
                if (state.gameState === 'PLAYING') resetPositions();
            }
        } else {
            p.fallVel = 0;
            const dist = Math.hypot(p.pos.x, p.pos.z);
            const maxLimit = (state.currentMapType === 'bowl') ? arenaRadius : (arenaRadius - playerRadius * 0.5);
            if (state.currentMapType === 'bowl') {
                const factor = distFromCenter / arenaRadius;
                p.pos.y = playerRadius + Math.pow(factor, 2) * 1.5;
                if (dist > maxLimit) {
                    p.isFalling = true;
                }
                if (distFromCenter > 1) {
                    p.vel.x -= (p.pos.x / distFromCenter) * 0.01 * timeScale;
                    p.vel.z -= (p.pos.z / distFromCenter) * 0.01 * timeScale;
                }
            } else {
                p.pos.y = playerRadius;
                const edgeGuard = 1.4;
                if (state.currentMapType === 'square') {
                    const half = squareSize / 2;
                    if (Math.abs(p.pos.x) > half - edgeGuard) p.vel.x -= Math.sign(p.pos.x) * 0.012 * timeScale;
                    if (Math.abs(p.pos.z) > half - edgeGuard) p.vel.z -= Math.sign(p.pos.z) * 0.012 * timeScale;
                } else {
                    if (distFromCenter > arenaRadius - edgeGuard && distFromCenter > 0) {
                        p.vel.x -= (p.pos.x / distFromCenter) * 0.012 * timeScale;
                        p.vel.z -= (p.pos.z / distFromCenter) * 0.012 * timeScale;
                    }
                }
            }
            if (state.currentMapType === 'bowl' && !p.isFalling) {
                const r = Math.hypot(p.pos.x, p.pos.z);
                if (r <= arenaRadius) {
                    const bowlSurfaceY = 2.8 - 0.35 * Math.sqrt(Math.max(0, arenaRadius * arenaRadius - r * r));
                    p.pos.y = bowlSurfaceY + playerRadius;
                }
            }
            p.pos.x += p.vel.x * timeScale;
            p.pos.z += p.vel.z * timeScale;
            p.vel.x *= Math.pow(FRICTION, timeScale);
            p.vel.z *= Math.pow(FRICTION, timeScale);
        }
        p.obj.group.position.copy(p.pos);
    });

    // Player-player collision
    resolvePlayerCollision();

    p1.obj.group.position.copy(p1.pos);
    p2.obj.group.position.copy(p2.pos);

    if (p1.vel.lengthSq() > 0.001) p1.obj.headGroup.rotation.y = Math.atan2(p1.vel.x, p1.vel.z);
    if (p2.vel.lengthSq() > 0.001) p2.obj.headGroup.rotation.y = Math.atan2(p2.vel.x, p2.vel.z);

    // Particles & shockwaves
    updateParticles(timeScale);
    updateShockwaves(timeScale);

    // Camera (in-game)
    updateInGameCamera();
}

// =====================================================================
// PLAYER-PLAYER COLLISION — perfect sphere-based
// - 3D distance (bowl üçün düzgün)
// - Falling player da daxildir (iç-içə keçmir)
// - Tam üst-üstə halı da işlənir
// =====================================================================
function resolvePlayerCollision() {
    // Hər ikisi falling-dirsə, toqquşma yoxdur
    if (p1.isFalling && p2.isFalling) return;

    const minDist = playerRadius * 2;
    const minDistSq = minDist * minDist;
    const oneFalling = p1.isFalling || p2.isFalling;

    // Delta vektoru
    const dx2D = p2.pos.x - p1.pos.x;
    const dz2D = p2.pos.z - p1.pos.z;
    const dy = p2.pos.y - p1.pos.y;

    const dist2D = Math.hypot(dx2D, dz2D);
    const dist3D = Math.hypot(dist2D, dy);
    const dist3DSq = dist3D * dist3D;

    // Toqquşma yoxdur
    if (dist3DSq >= minDistSq) return;

    // Horizontal normal vektoru
    let nx, nz;
    if (dist2D < 0.001) {
        // Tam üst-üstə — təsadüfi istiqamətə ayır
        const angle = Math.random() * Math.PI * 2;
        nx = Math.cos(angle);
        nz = Math.sin(angle);
    } else {
        nx = dx2D / dist2D;
        nz = dz2D / dist2D;
    }

    // Düzgün sferik ayrılma miqdarı:
    // 3D-də minDist qədər ayrılmaq üçün 2D-də nə qədər ayrılmalı?
    const dySq = dy * dy;
    const requiredDist2D = Math.sqrt(Math.max(0, minDistSq - dySq));
    const overlap2D = requiredDist2D - dist2D;

    if (overlap2D <= 0) return;

    const half = overlap2D * 0.5;

    // Pozisiya korreksiyası — yalnız X, Z
    // (Y-ni terrain/surface funksiyası idarə edir, toxunmuruq)
    p1.pos.x -= nx * half;
    p1.pos.z -= nz * half;
    p2.pos.x += nx * half;
    p2.pos.z += nz * half;

    // İmpuls — yalnız hər ikisi yerdədirsə
    if (!oneFalling) {
        const kx = p1.vel.x - p2.vel.x;
        const kz = p1.vel.z - p2.vel.z;
        const approaching = nx * kx + nz * kz;

        if (approaching > 0) {
            const impulse = approaching * 1.25;
            p1.vel.x -= impulse * nx;
            p1.vel.z -= impulse * nz;
            p2.vel.x += impulse * nx;
            p2.vel.z += impulse * nz;

            if (collisionCooldown <= 0) {
                const impactIntensity = Math.min(approaching * 2.5, 2.0);
                playSound('hit', impactIntensity);
                shakeIntensity = Math.min(shakeIntensity + impactIntensity * 0.35, 0.8);

                const impactPos = new THREE.Vector3(
                    (p1.pos.x + p2.pos.x) * 0.5,
                    Math.max(p1.pos.y, p2.pos.y) * 0.6 + playerRadius * 0.4,
                    (p1.pos.z + p2.pos.z) * 0.5
                );
                createImpactParticles(impactPos, impactIntensity);
                createShockwave(impactPos, impactIntensity);

                collisionCooldown = 10;
            }
        }
    }
}

function updateInGameCamera() {
    let targetPos = camPosMenu;
    let targetLook = camLookMenu;

    const fallingPlayer = p1.isFalling ? p1 : (p2.isFalling ? p2 : null);

    // Aspect ratio kompensasiyası — geniş ekranlarda (mobil yatay) kamera yaxınlaşsın
    const aspect = window.innerWidth / window.innerHeight;
    const zoomFactor = aspect > 1.8 ? Math.max(0.65, 1.8 / aspect) : 1.0;

    if (fallingPlayer) {
        timeScale = 0.2;
        targetPos = new THREE.Vector3(fallingPlayer.pos.x * 0.7, fallingPlayer.pos.y + 4.0, fallingPlayer.pos.z + 6.0);
        targetLook = fallingPlayer.pos.clone();
    } else {
        timeScale = 1.0;
        const midPoint = new THREE.Vector3().addVectors(p1.pos, p2.pos).multiplyScalar(0.5);
        const dist = p1.pos.distanceTo(p2.pos);
        const maxPlayerY = Math.max(p1.pos.y, p2.pos.y);
        const camY = (13 + (dist * 0.35) + (maxPlayerY * 0.6)) * zoomFactor;
        const camZ = (15 + (dist * 0.45)) * zoomFactor;

        targetPos = new THREE.Vector3(midPoint.x * 0.35, camY, camZ + (midPoint.z * 0.35));
        targetLook = new THREE.Vector3(midPoint.x * 0.6, maxPlayerY * 0.4, midPoint.z * 0.6);
    }

    const lerpSpeed = (p1.isFalling || p2.isFalling) ? 0.12 : 0.05;
    currentCamPos.lerp(targetPos, lerpSpeed);
    currentCamLook.lerp(targetLook, lerpSpeed);

    const cameraFinalPos = currentCamPos.clone();
    if (shakeIntensity > 0) {
        cameraFinalPos.x += (Math.random() - 0.5) * shakeIntensity;
        cameraFinalPos.y += (Math.random() - 0.5) * shakeIntensity;
        shakeIntensity *= 0.9;
    }

    camera.position.copy(cameraFinalPos);
    camera.lookAt(currentCamLook);
}

// Menu / Customize / Shop camera
export function updateMenuCamera() {
    let targetPos = camPosMenu;
    let targetLook = camLookMenu;

    const shopMenuEl = document.getElementById('shop-menu');
    if (state.gameState === 'CUSTOMIZE' || (shopMenuEl && !shopMenuEl.classList.contains('hidden'))) {
        targetPos = camPosCustomize;
        targetLook = camLookCustomize;
    }

    currentCamPos.lerp(targetPos, 0.05);
    currentCamLook.lerp(targetLook, 0.05);
    camera.position.copy(currentCamPos);
    camera.lookAt(currentCamLook);

    p1.obj.group.position.copy(p1.pos);
    p2.obj.group.position.copy(p2.pos);
}

// İlk yükləmə
resetPositions();