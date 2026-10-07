// =====================================================================
// AI — CPU RƏQİBİN DÜŞÜNCƏ MƏNTİQİ
// AI oyunçuların state-ini (p1, p2) oxuyur, öz state-ini saxlayır.
// =====================================================================

import * as THREE from 'three';
import { AI_PROFILES, ACCEL, DASH_FORCE, DASH_COOLDOWN, arenaRadius, squareSize } from './config.js';
import { state } from './state.js';
import { playSound } from './audio.js';
import { p1, p2, getTimeScale } from './physics.js';

// --- AI daxili state ---
let idleTimer = 0;
let aiComboState = 'APPROACH';
let aiStateTimer = 0;
let aiMistakeDir = new THREE.Vector3(1, 0, 0);

export function incrementIdleTimer() { idleTimer += 0.03; }

export function resetAIState() {
    idleTimer = 0;
    aiComboState = 'APPROACH';
    aiStateTimer = 0;
    aiMistakeDir.set(1, 0, 0);
}

export function updateAI() {
    if (p2.isFalling) return;

    const profile = AI_PROFILES[state.aiDifficulty] || AI_PROFILES.hard;
    const timeScale = getTimeScale();

    const distFromCenter = Math.hypot(p2.pos.x, p2.pos.z);
    const maxDist = state.currentMapType === 'square' ? (squareSize / 2) : arenaRadius;
    const edgeMargin = (state.currentMapType === 'bowl' ? 0.4 : 1.8) * profile.edgeAwareness;
    const edgeDangerZone = maxDist - edgeMargin;
    const isNearEdge = distFromCenter > edgeDangerZone;

    const targetPos = p1.pos.clone().addScaledVector(p1.vel, 0.4 * 10 * profile.predictLead);
    const toPlayer = new THREE.Vector3().subVectors(targetPos, p2.pos);
    toPlayer.y = 0;
    const distToP1 = toPlayer.length();
    const dirToPlayer = toPlayer.clone().normalize();

    const perpRight = new THREE.Vector3(-dirToPlayer.z, 0, dirToPlayer.x);
    const perpLeft = new THREE.Vector3(dirToPlayer.z, 0, -dirToPlayer.x);

    const moveDir = new THREE.Vector3(0, 0, 0);

    aiStateTimer -= 0.016 * timeScale;
    if (aiStateTimer <= 0) {
        const p1DistFromCenter = Math.hypot(p1.pos.x, p1.pos.z);
        const p1NearEdge = p1DistFromCenter > (maxDist - 2.5);
        const rand = Math.random();

        if (Math.random() < profile.mistakeChance) {
            aiComboState = 'CONFUSED';
            aiMistakeDir.set(Math.random() * 2 - 1, 0, Math.random() * 2 - 1).normalize();
            aiStateTimer = 0.4 + Math.random() * 0.5;
        } else if (p1NearEdge && distToP1 < 6.5) {
            aiComboState = 'CHARGING_COMBO';
            aiStateTimer = 1.0;
        } else if (distToP1 < 4.0 && rand < 0.45) {
            aiComboState = 'FEINT_DASH';
            aiStateTimer = 0.85;
        } else {
            if (rand < 0.35) {
                aiComboState = 'APPROACH';
                aiStateTimer = 1.0 + Math.random() * 0.8;
            } else if (rand < 0.65) {
                aiComboState = 'FLANK_CIRCLE';
                aiStateTimer = 1.2 + Math.random() * 0.6;
            } else if (rand < 0.85) {
                aiComboState = 'FEINT_DASH';
                aiStateTimer = 0.85;
            } else {
                aiComboState = 'RETREAT_TACTICAL';
                aiStateTimer = 0.7;
            }
        }
        aiStateTimer *= profile.reactionMultiplier;
    }

    if (isNearEdge) {
        const centerDir = new THREE.Vector3(-p2.pos.x, 0, -p2.pos.z).normalize();
        moveDir.addScaledVector(centerDir, 2.2 * profile.edgeAwareness);
    } else {
        switch (aiComboState) {
            case 'APPROACH':
                moveDir.add(dirToPlayer);
                const zigzag = Math.sin(idleTimer * 7) * 0.35;
                moveDir.addScaledVector(perpRight, zigzag);
                break;
            case 'FLANK_CIRCLE':
                moveDir.addScaledVector(dirToPlayer, 0.45);
                moveDir.addScaledVector(perpRight, 0.85);
                break;
            case 'FEINT_DASH':
                if (aiStateTimer > 0.4) {
                    moveDir.addScaledVector(perpLeft, 1.1);
                } else {
                    moveDir.add(dirToPlayer);
                    if (p2.dashCd <= 0 && distToP1 < 5.0 && Math.random() < profile.dashUseChance) {
                        p2.vel.addScaledVector(dirToPlayer, DASH_FORCE * 1.05);
                        p2.dashCd = DASH_COOLDOWN;
                        playSound('dash');
                    }
                }
                break;
            case 'CHARGING_COMBO':
                moveDir.add(dirToPlayer);
                if (p2.dashCd <= 0 && distToP1 < 4.8 && Math.random() < profile.dashUseChance) {
                    p2.vel.addScaledVector(dirToPlayer, DASH_FORCE * 1.1);
                    p2.dashCd = DASH_COOLDOWN;
                    playSound('dash');
                }
                break;
            case 'RETREAT_TACTICAL':
                moveDir.addScaledVector(dirToPlayer, -0.65);
                moveDir.addScaledVector(perpRight, 0.3);
                break;
            case 'CONFUSED':
                moveDir.add(aiMistakeDir);
                break;
            default:
                moveDir.add(dirToPlayer);
        }
    }

    if (p2.dashCd <= 0 && !isNearEdge && distToP1 < 3.5 && Math.random() < profile.dashChanceRandom) {
        p2.vel.addScaledVector(dirToPlayer, DASH_FORCE);
        p2.dashCd = DASH_COOLDOWN;
        playSound('dash');
    }

    if (moveDir.lengthSq() > 0) {
        moveDir.normalize();
        const speedMult = profile.speedMult;
        p2.vel.x += moveDir.x * ACCEL * speedMult;
        p2.vel.z += moveDir.z * ACCEL * speedMult;
    }
}