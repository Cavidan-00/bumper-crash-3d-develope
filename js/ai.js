// =====================================================================
// AI — CPU RƏQİBİN MƏNTİQİ
// 3 fərqli şəxsiyyət + rubber-banding + proqnoz + taktika
// =====================================================================

import * as THREE from 'three';
import {
    AI_PROFILES,
    ACCEL, DASH_FORCE, DASH_COOLDOWN,
    arenaRadius, squareSize, playerRadius,
    MOBILE_SPEED_FACTOR
} from './config.js';
import { state } from './state.js';
import { p1, p2, getTimeScale, getScores } from './physics.js';
import { isTouchDevice } from './input.js';

// Mobil-də AI sürətini azalt — player ilə balans
const AI_MOBILE_FACTOR = isTouchDevice ? MOBILE_SPEED_FACTOR : 1.0;

// =====================================================================
// DAXILI STATE
// =====================================================================
let idleTimer = 0;
let comboState = 'IDLE';
let stateTimer = 0;
let reactionTimer = 0;
let mistakeDir = new THREE.Vector3(1, 0, 0);
let playerVelBuffer = new THREE.Vector3();
let predictionActive = false;
let restingTimer = 0;
let rubberBandFactor = 1.0;

// =====================================================================
// YARDIMÇI
// =====================================================================
function randomRange(min, max) {
    return min + Math.random() * (max - min);
}

// Rubber-banding — oyun marağını qoruyur
function computeRubberBand() {
    const { s1, s2 } = getScores();
    const diff = s1 - s2;   // + = player irəlidə, - = AI irəlidə
    if (diff <= -3) return 0.70;   // AI çox irəlidə → yumşal
    if (diff <= -1) return 0.85;
    if (diff >= 3)  return 1.15;   // player irəlidə → AI çalışsın
    if (diff >= 1)  return 1.05;
    return 1.0;
}

// Player kənara yaxındır? (vulnerable)
function isPlayerVulnerable() {
    const distFromCenter = Math.hypot(p1.pos.x, p1.pos.z);
    const maxDist = state.currentMapType === 'square' ? squareSize / 2 : arenaRadius;
    return (maxDist - distFromCenter) < 2.0;
}

// =====================================================================
// PUBLIC API
// =====================================================================
export function incrementIdleTimer() {
    idleTimer += 0.03;
    if (reactionTimer > 0) reactionTimer -= 0.016;
    if (restingTimer > 0) restingTimer -= 0.016;
}

export function resetAIState() {
    idleTimer = 0;
    comboState = 'IDLE';
    stateTimer = 0;
    reactionTimer = 0;
    mistakeDir.set(1, 0, 0);
    predictionActive = false;
    restingTimer = 0;
    rubberBandFactor = 1.0;
}

// =====================================================================
// ƏSAS UPDATE
// =====================================================================
export function updateAI() {
    if (p2.isFalling) return;

    const profile = AI_PROFILES[state.aiDifficulty] || AI_PROFILES.normal;
    const timeScale = getTimeScale();

    // Rubber-banding (yumşaq interpolasiya)
    const targetRB = computeRubberBand();
    rubberBandFactor += (targetRB - rubberBandFactor) * 0.02;

    // Effektiv dəyərlər
    const speedMult = profile.speedMult * AI_MOBILE_FACTOR * rubberBandFactor;
    const dashChance = profile.dashChance * rubberBandFactor;
    const mistakeChance = profile.mistakeChance * (2 - rubberBandFactor);

    // Player məlumatı
    const playerDist = Math.hypot(p1.pos.x - p2.pos.x, p1.pos.z - p2.pos.z);
    const playerVulnerable = isPlayerVulnerable();

    // Proqnozlaşdırma — reaksiya gecikməsindən sonra
    if (reactionTimer <= 0) {
        playerVelBuffer.copy(p1.vel);
        predictionActive = true;
    }
    const predictedPos = predictionActive
        ? p1.pos.clone().addScaledVector(playerVelBuffer, profile.predictLead * 15)
        : p1.pos.clone();

    // Hədəf vektorları
    const toTarget = new THREE.Vector3().subVectors(predictedPos, p2.pos);
    toTarget.y = 0;
    const distToTarget = toTarget.length();
    const dirToTarget = distToTarget > 0.01
        ? toTarget.clone().normalize()
        : new THREE.Vector3(0, 0, 1);
    const perpRight = new THREE.Vector3(-dirToTarget.z, 0, dirToTarget.x);
    const perpLeft  = new THREE.Vector3( dirToTarget.z, 0, -dirToTarget.x);

    // Kənar təhlükəsi
    const distFromCenter = Math.hypot(p2.pos.x, p2.pos.z);
    const maxDist = state.currentMapType === 'square' ? squareSize / 2 : arenaRadius;
    const edgeMargin = profile.edgeAwareness * 2.0;
    const edgeDistance = maxDist - distFromCenter;
    const isNearEdge = edgeDistance < edgeMargin;

    // ============================================================
    // VƏZİYYƏT MAŞINI
    // ============================================================
    stateTimer -= 0.016 * timeScale;
    if (stateTimer <= 0) {
        comboState = decideNextState(profile, {
            playerDist, playerVulnerable, isNearEdge, mistakeChance
        });
        stateTimer = pickStateDuration(comboState, profile);
        if (Math.random() < profile.reactionChance) {
            reactionTimer = randomRange(profile.reactionMin, profile.reactionMax);
        }
    }

    // ============================================================
    // HƏRƏKƏT
    // ============================================================
    const moveDir = new THREE.Vector3(0, 0, 0);

    // Kritik: kənardan qaç
    if (isNearEdge && comboState !== 'CONFUSED') {
        const centerDir = new THREE.Vector3(-p2.pos.x, 0, -p2.pos.z).normalize();
        const urgency = 1 - (edgeDistance / edgeMargin);
        moveDir.addScaledVector(centerDir, 1.5 + urgency * 2.0);
    } else {
        moveDir.copy(applyStateMovement(comboState, {
            dirToTarget, perpRight, perpLeft, playerDist, idleTimer, mistakeDir
        }));
    }

    // Dash
    tryDash(comboState, profile, {
        playerDist, playerVulnerable, isNearEdge, dirToTarget, dashChance
    });

    // Tətbiq
    if (moveDir.lengthSq() > 0.001) {
        moveDir.normalize();
        p2.vel.x += moveDir.x * ACCEL * speedMult;
        p2.vel.z += moveDir.z * ACCEL * speedMult;
    }
}

// =====================================================================
// VƏZİYYƏT SEÇİMİ
// =====================================================================
function decideNextState(profile, info) {
    const { playerDist, playerVulnerable, isNearEdge, mistakeChance } = info;

    // Səhv — yalnız easy/normal
    if (Math.random() < mistakeChance) {
        mistakeDir.set(Math.random() * 2 - 1, 0, Math.random() * 2 - 1).normalize();
        return 'CONFUSED';
    }

    // Player fall-dadır, kənara yaxındır → tamam!
    if (playerVulnerable && profile.chaseVulnerable && playerDist < 8) {
        return 'FINISHER';
    }

    // Özü kənardadır → retreat
    if (isNearEdge) return 'RETREAT';

    // Çox yaxın → yan tərəfə
    if (playerDist < 1.8) return 'CIRCLE';

    // Uzaq → yaxınlaş
    if (playerDist > 5) return 'APPROACH';

    // Orta məsafə — taktiki
    const r = Math.random();
    if (profile.useBait && r < 0.30) return 'BAIT';
    if (profile.useCombos && r < 0.55) return 'COMBO_SETUP';
    if (r < 0.75) return 'CIRCLE';
    return 'APPROACH';
}

function pickStateDuration(stateName, profile) {
    const base = {
        IDLE: 0.5,
        APPROACH: 1.2,
        CIRCLE: 1.5,
        FINISHER: 1.0,
        RETREAT: 0.8,
        BAIT: 0.9,
        COMBO_SETUP: 1.1,
        CONFUSED: randomRange(0.4, 1.0)
    };
    return (base[stateName] || 1.0) * profile.reactionMultiplier;
}

// =====================================================================
// VƏZİYYƏTƏ UYĞUN HƏRƏKƏT
// =====================================================================
function applyStateMovement(stateName, ctx) {
    const { dirToTarget, perpRight, playerDist, idleTimer } = ctx;
    const moveDir = new THREE.Vector3(0, 0, 0);

    switch (stateName) {
        case 'IDLE':
            moveDir.addScaledVector(perpRight, Math.sin(idleTimer) * 0.3);
            break;

        case 'APPROACH':
            moveDir.add(dirToTarget);
            moveDir.addScaledVector(perpRight, Math.sin(idleTimer * 5) * 0.25);
            break;

        case 'CIRCLE':
            moveDir.addScaledVector(perpRight, 1.0);
            moveDir.addScaledVector(dirToTarget, 0.25);
            break;

        case 'FINISHER':
            moveDir.add(dirToTarget);
            if (playerDist > 3) {
                moveDir.addScaledVector(perpRight, Math.sin(idleTimer * 3) * 0.4);
            }
            break;

        case 'RETREAT':
            moveDir.addScaledVector(dirToTarget, -0.7);
            moveDir.addScaledVector(perpRight, 0.3);
            break;

        case 'BAIT': {
            const phase = Math.sin(idleTimer * 2.5);
            moveDir.addScaledVector(dirToTarget, phase > 0 ? 0.5 : -0.9);
            moveDir.addScaledVector(perpRight, 0.4);
            break;
        }

        case 'COMBO_SETUP':
            moveDir.addScaledVector(perpRight, 1.2);
            moveDir.addScaledVector(dirToTarget, 0.3);
            break;

        case 'CONFUSED':
            moveDir.add(ctx.mistakeDir);
            break;

        default:
            moveDir.add(dirToTarget);
    }

    return moveDir;
}

// =====================================================================
// DASH MƏNTİQİ
// =====================================================================
function tryDash(stateName, profile, ctx) {
    if (p2.dashCd > 0 || restingTimer > 0) return;

    const { playerDist, playerVulnerable, isNearEdge, dirToTarget, dashChance } = ctx;
    const inRange = playerDist < profile.dashRange;

    let shouldDash = false;

    if (stateName === 'FINISHER' && inRange && playerVulnerable) {
        shouldDash = Math.random() < dashChance * 1.5;
    } else if (stateName === 'COMBO_SETUP' && inRange) {
        shouldDash = Math.random() < dashChance * 1.2;
    } else if (stateName === 'APPROACH' && inRange && playerDist > 2.5) {
        shouldDash = Math.random() < dashChance * 0.6;
    } else if (stateName === 'CIRCLE' && playerDist < 3.0) {
        shouldDash = Math.random() < dashChance * 0.8;
    } else if (inRange && playerDist < 4.0) {
        shouldDash = Math.random() < dashChance * 0.4;
    }

    if (!shouldDash || isNearEdge) return;

    p2.vel.addScaledVector(dirToTarget, DASH_FORCE * profile.dashPower);
    p2.dashCd = DASH_COOLDOWN * profile.dashCooldownMult;
    restingTimer = profile.restingAfterDash;
}