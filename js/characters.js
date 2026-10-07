// =====================================================================
// CHARACTERS — KARAKTER MODELLƏRİ, HAT/GLASSES/EFFECT SİSTEMİ
// Ən böyük fayl: bütün vizual xüsusiyyətlər buradadır.
// =====================================================================

import * as THREE from 'three';
import { scene } from './world.js';
import { playerRadius, EFFECT_CATALOG, getRandomCosmetics } from './config.js';
import { state } from './state.js';

// =====================================================================
// GLOW TEXTURE (bütün particle effektləri bunu istifadə edir)
// =====================================================================

// Köməkçi: qrupdakı bütün mesh-ləri dispose et
function clearGroup(group) {
    const geos = new Set();
    const mats = new Set();
    group.traverse(obj => {
        if (obj.geometry) geos.add(obj.geometry);
        if (obj.material) {
            if (Array.isArray(obj.material)) obj.material.forEach(m => mats.add(m));
            else mats.add(obj.material);
        }
    });
    while (group.children.length > 0) group.remove(group.children[0]);
    geos.forEach(g => g.dispose());
    mats.forEach(m => m.dispose());
}

function createGlowTexture() {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.35, 'rgba(255,255,255,0.85)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(canvas);
}
const glowParticleTexture = createGlowTexture();

// =====================================================================
// EFFECT MAKERS
// =====================================================================

function makeOrbitParticles({ count, radius, height, speed, size, color, rainbow }) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    let colorAttr = null;
    if (rainbow) {
        colorAttr = new Float32Array(count * 3);
        geo.setAttribute('color', new THREE.BufferAttribute(colorAttr, 3));
    }
    const mat = new THREE.PointsMaterial({
        color: rainbow ? 0xffffff : color, size, sizeAttenuation: true,
        map: glowParticleTexture, alphaTest: 0.01,
        transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending,
        depthWrite: false, vertexColors: !!rainbow
    });
    const points = new THREE.Points(geo, mat);
    const baseAngles = [], heightJitter = [], radiusJitter = [];
    for (let i = 0; i < count; i++) {
        baseAngles.push((i / count) * Math.PI * 2);
        heightJitter.push((Math.random() - 0.5) * 0.25);
        radiusJitter.push((Math.random() - 0.5) * 0.12);
    }
    points.userData.update = (elapsed) => {
        const pos = geo.attributes.position.array;
        for (let i = 0; i < count; i++) {
            const a = baseAngles[i] + elapsed * speed;
            const r = radius + radiusJitter[i];
            pos[i * 3] = Math.cos(a) * r;
            pos[i * 3 + 1] = height + heightJitter[i] + Math.sin(elapsed * 2.2 + i) * 0.06;
            pos[i * 3 + 2] = Math.sin(a) * r;
            if (rainbow) {
                const hue = ((elapsed * 0.15) + i / count) % 1;
                const c = new THREE.Color().setHSL(hue, 0.9, 0.65);
                colorAttr[i * 3] = c.r; colorAttr[i * 3 + 1] = c.g; colorAttr[i * 3 + 2] = c.b;
            }
        }
        geo.attributes.position.needsUpdate = true;
        if (rainbow) geo.attributes.color.needsUpdate = true;
    };
    return points;
}

function makeCometHead(color) {
    const geo = new THREE.SphereGeometry(0.24, 14, 14);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.65, blending: THREE.AdditiveBlending, depthWrite: false });
    const mesh = new THREE.Mesh(geo, mat);
    const ringGeo = new THREE.RingGeometry(0.3, 0.42, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    mesh.add(ring);
    mesh.userData.update = (elapsed) => {
        mesh.scale.setScalar(1 + Math.sin(elapsed * 6) * 0.15);
        ring.rotation.z = elapsed * 1.4;
        ring.rotation.x = Math.PI / 2 + Math.sin(elapsed * 0.8) * 0.3;
    };
    return mesh;
}

function makeCometTrail(char, { color, size = 0.28, poolSize = 24, spawnInterval = 0.032, fadeTime = 0.7 }) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(poolSize * 3);
    const colorArr = new Float32Array(poolSize * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colorArr, 3));
    const mat = new THREE.PointsMaterial({
        size, sizeAttenuation: true, map: glowParticleTexture, alphaTest: 0.01,
        transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending,
        depthWrite: false, depthTest: false, vertexColors: true
    });
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    points.renderOrder = 999;
    scene.add(points);

    const coolColor = new THREE.Color(color);
    const hotColor = new THREE.Color(0xffffff);
    const ages = new Array(poolSize).fill(999);
    let nextSlot = 0;
    let sinceSpawn = 999;
    let lastElapsed = 0;

    return {
        update(elapsed) {
            const dt = Math.min(Math.max(elapsed - lastElapsed, 0), 0.1);
            lastElapsed = elapsed;
            sinceSpawn += dt;
            if (sinceSpawn > spawnInterval) {
                const p = char.group.position;
                positions[nextSlot * 3] = p.x + (Math.random() - 0.5) * 0.28;
                positions[nextSlot * 3 + 1] = p.y - playerRadius * 0.65 + (Math.random() - 0.5) * 0.18;
                positions[nextSlot * 3 + 2] = p.z + (Math.random() - 0.5) * 0.28;
                ages[nextSlot] = 0;
                nextSlot = (nextSlot + 1) % poolSize;
                sinceSpawn = 0;
            }
            for (let i = 0; i < poolSize; i++) {
                if (ages[i] > fadeTime) {
                    colorArr[i * 3] = colorArr[i * 3 + 1] = colorArr[i * 3 + 2] = 0;
                    continue;
                }
                ages[i] += dt;
                const p = Math.min(ages[i] / fadeTime, 1);
                const fade = 1 - p;
                const mixed = hotColor.clone().lerp(coolColor, Math.min(p * 2.2, 1)).multiplyScalar(fade);
                colorArr[i * 3] = mixed.r;
                colorArr[i * 3 + 1] = mixed.g;
                colorArr[i * 3 + 2] = mixed.b;
            }
            geo.attributes.position.needsUpdate = true;
            geo.attributes.color.needsUpdate = true;
        },
        dispose() {
            scene.remove(points);
            geo.dispose();
            mat.dispose();
        }
    };
}

function makeOrbitingShapes({ count, color, radius, height, speed, shapeSize = 0.24 }) {
    const group = new THREE.Group();
    const geo = new THREE.IcosahedronGeometry(1, 0);
    const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6, roughness: 0.65, metalness: 0.2 });
    const shapes = [];
    for (let i = 0; i < count; i++) {
        const mesh = new THREE.Mesh(geo, mat);
        mesh.scale.setScalar(shapeSize * (0.75 + Math.random() * 0.6));
        group.add(mesh);
        shapes.push({
            mesh, baseAngle: (i / count) * Math.PI * 2,
            radiusOffset: (Math.random() - 0.5) * 0.35,
            heightOffset: (Math.random() - 0.5) * 0.35,
            spinAxis: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
            spinSpeed: 1.5 + Math.random() * 2.5
        });
    }
    group.userData.update = (elapsed) => {
        shapes.forEach(s => {
            const a = s.baseAngle + elapsed * speed;
            const r = radius + s.radiusOffset;
            const bob = Math.sin(elapsed * 1.3 + s.baseAngle) * 0.14;
            s.mesh.position.set(Math.cos(a) * r, height + s.heightOffset + bob, Math.sin(a) * r);
            s.mesh.rotateOnAxis(s.spinAxis, 0.05 * s.spinSpeed);
        });
    };
    return group;
}

function makeHaloRings({ colors, radius = 0.98, tubeRadius = 0.026, speed = 0.5, opacity = 0.7 }) {
    const group = new THREE.Group();
    const tilts = [{ x: 0.35, z: 0 }, { x: -0.5, z: 1.1 }, { x: 1.4, z: -0.3 }];
    const ringsData = [];
    tilts.forEach((tilt, i) => {
        const geo = new THREE.TorusGeometry(radius, tubeRadius, 8, 56);
        const mat = new THREE.MeshBasicMaterial({ color: colors[i % colors.length], transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = tilt.x;
        mesh.rotation.z = tilt.z;
        group.add(mesh);
        ringsData.push({ mesh, spinSpeed: speed * (i % 2 === 0 ? 1 : -1.4) });
    });
    group.userData.update = (elapsed) => {
        ringsData.forEach(r => { r.mesh.rotation.y = elapsed * r.spinSpeed; });
    };
    return group;
}

function makeVoltCage({ count, radius, color }) {
    const group = new THREE.Group();
    const anchorCount = 6;
    const anchors = [];
    for (let i = 0; i < anchorCount; i++) {
        const theta = (i / anchorCount) * Math.PI * 2 + Math.random() * 0.6;
        const phi = Math.PI * 0.28 + Math.random() * Math.PI * 0.44;
        anchors.push(new THREE.Vector3(
            Math.sin(phi) * Math.cos(theta), Math.cos(phi) * 0.7, Math.sin(phi) * Math.sin(theta)
        ).multiplyScalar(radius));
    }

    const hazeCount = 16;
    const hazeGeo = new THREE.BufferGeometry();
    hazeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(hazeCount * 3), 3));
    const hazeMat = new THREE.PointsMaterial({
        color, size: 0.07, sizeAttenuation: true, map: glowParticleTexture, alphaTest: 0.01,
        transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false
    });
    const haze = new THREE.Points(hazeGeo, hazeMat);
    const hazeAngle = [], hazeRadius = [], hazeHeight = [];
    for (let i = 0; i < hazeCount; i++) {
        hazeAngle.push(Math.random() * Math.PI * 2);
        hazeRadius.push(radius * (0.45 + Math.random() * 0.55));
        hazeHeight.push((Math.random() - 0.5) * 1.3);
    }
    group.add(haze);

    const SEGMENTS = 7;
    const bolts = [];
    for (let i = 0; i < count; i++) {
        const coreGeo = new THREE.BufferGeometry();
        const glowGeo = new THREE.BufferGeometry();
        coreGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SEGMENTS * 3), 3));
        glowGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SEGMENTS * 3), 3));

        const coreLine = new THREE.Line(coreGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false }));
        const glowLine = new THREE.Line(glowGeo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
        const glowDots = new THREE.Points(coreGeo, new THREE.PointsMaterial({
            color, size: 0.16, sizeAttenuation: true, map: glowParticleTexture, alphaTest: 0.01,
            transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false
        }));
        coreLine.visible = false; glowLine.visible = false; glowDots.visible = false;
        group.add(coreLine, glowLine, glowDots);
        bolts.push({ coreGeo, glowGeo, coreLine, glowLine, glowDots, timer: Math.random() * 0.5, on: false });
    }

    let lastElapsed = 0;
    group.userData.update = (elapsed) => {
        const dt = Math.min(Math.max(elapsed - lastElapsed, 0), 0.1);
        lastElapsed = elapsed;
        group.rotation.y = elapsed * 0.2;

        const hp = hazeGeo.attributes.position.array;
        for (let i = 0; i < hazeCount; i++) {
            const a = hazeAngle[i] + elapsed * 0.35;
            hp[i * 3] = Math.cos(a) * hazeRadius[i];
            hp[i * 3 + 1] = hazeHeight[i] + Math.sin(elapsed * 1.6 + i) * 0.06;
            hp[i * 3 + 2] = Math.sin(a) * hazeRadius[i];
        }
        hazeGeo.attributes.position.needsUpdate = true;

        bolts.forEach(b => {
            b.timer -= dt;
            if (b.timer <= 0) {
                if (!b.on) {
                    const a = anchors[Math.floor(Math.random() * anchors.length)];
                    let bIdx = Math.floor(Math.random() * anchors.length);
                    if (anchors[bIdx] === a && anchors.length > 1) bIdx = (bIdx + 1) % anchors.length;
                    const bnd = anchors[bIdx];
                    const core = b.coreGeo.attributes.position.array;
                    const glow = b.glowGeo.attributes.position.array;
                    for (let p = 0; p < SEGMENTS; p++) {
                        const t = p / (SEGMENTS - 1);
                        const endpoint = (p === 0 || p === SEGMENTS - 1);
                        const jCore = endpoint ? 0 : 0.14;
                        const jGlow = endpoint ? 0 : 0.24;
                        const bx = a.x + (bnd.x - a.x) * t, by = a.y + (bnd.y - a.y) * t, bz = a.z + (bnd.z - a.z) * t;
                        core[p * 3] = bx + (Math.random() - 0.5) * jCore;
                        core[p * 3 + 1] = by + (Math.random() - 0.5) * jCore;
                        core[p * 3 + 2] = bz + (Math.random() - 0.5) * jCore;
                        glow[p * 3] = bx + (Math.random() - 0.5) * jGlow;
                        glow[p * 3 + 1] = by + (Math.random() - 0.5) * jGlow;
                        glow[p * 3 + 2] = bz + (Math.random() - 0.5) * jGlow;
                    }
                    b.coreGeo.attributes.position.needsUpdate = true;
                    b.glowGeo.attributes.position.needsUpdate = true;
                    b.coreLine.visible = true;
                    b.glowLine.visible = true;
                    b.glowDots.visible = true;
                    b.on = true;
                    b.timer = 0.12;
                } else {
                    b.coreLine.visible = false;
                    b.glowLine.visible = false;
                    b.glowDots.visible = false;
                    b.on = false;
                    b.timer = 0.12 + Math.random() * 0.4;
                }
            }
        });
    };
    return group;
}

function makePrismVeil({ radius = 1.35 }) {
    const group = new THREE.Group();
    const outerGeo = new THREE.RingGeometry(radius * 0.62, radius, 64);
    const outerMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
    const outer = new THREE.Mesh(outerGeo, outerMat);
    outer.rotation.x = Math.PI / 2.4;
    group.add(outer);

    const innerGeo = new THREE.RingGeometry(radius * 0.32, radius * 0.4, 48);
    const innerMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    inner.rotation.x = -Math.PI / 3;
    group.add(inner);

    group.userData.update = (elapsed) => {
        const hue = (elapsed * 0.16) % 1;
        outerMat.color.setHSL(hue, 0.85, 0.65);
        innerMat.color.setHSL((hue + 0.5) % 1, 0.85, 0.65);
        outer.rotation.z = elapsed * 0.55;
        inner.rotation.z = -elapsed * 0.85;
    };
    return group;
}

function makeGhostRim(color) {
    const geo = new THREE.SphereGeometry(playerRadius * 1.06, 24, 24);
    const mat = new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0.4, side: THREE.BackSide,
        blending: THREE.AdditiveBlending, depthWrite: false
    });
    return new THREE.Mesh(geo, mat);
}

// =====================================================================
// CHARACTER CREATION
// =====================================================================
export function createCharacter(color) {
    const group = new THREE.Group();
    const bodyGeo = new THREE.SphereGeometry(playerRadius, 32, 32);
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.1, metalness: 0.1 });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.castShadow = true;
    group.add(bodyMesh);

    const headGroup = new THREE.Group();
    const eyeGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const pupilGeo = new THREE.SphereGeometry(0.09, 16, 16);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

    const leftEye = new THREE.Mesh(eyeGeo, eyeMat); leftEye.position.set(-0.3, 0.2, 0.65);
    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat); leftPupil.position.set(-0.3, 0.2, 0.8);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat); rightEye.position.set(0.3, 0.2, 0.65);
    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat); rightPupil.position.set(0.3, 0.2, 0.8);

    headGroup.add(leftEye, leftPupil, rightEye, rightPupil);
    const hatGroup = new THREE.Group();
    const glassesGroup = new THREE.Group();
    headGroup.add(hatGroup, glassesGroup);
    group.add(headGroup);

    const effectGroup = new THREE.Group();
    group.add(effectGroup);

    scene.add(group);
    return {
        group, bodyMesh, headGroup, hatGroup, glassesGroup, effectGroup,
        baseColor: color, effectType: 'none', worldEffect: null,
        scaleVec: new THREE.Vector3(1, 1, 1), propellerBlade: null
    };
}

export const p1Char = createCharacter(0x3b82f6);
export const p2Char = createCharacter(0xef4444);

// =====================================================================
// HAT
// =====================================================================
export function setHat(char, hatType) {
    clearGroup(char.hatGroup);
    char.propellerBlade = null;

    if (hatType === 'horns') {
        const ringMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.3, metalness: 0.8 });
        const hornMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.2, metalness: 0.3 });
        const tipMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.1, metalness: 0.5 });

        const r1 = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.04, 8, 16), ringMat);
        r1.position.set(-0.38, 0.65, 0.1); r1.rotation.x = Math.PI / 2;
        const r2 = r1.clone(); r2.position.set(0.38, 0.65, 0.1);

        const h1 = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.5, 16), hornMat);
        h1.position.set(-0.38, 0.78, 0.1); h1.rotation.set(-0.15, 0, -0.45);
        const h2 = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.5, 16), hornMat);
        h2.position.set(0.38, 0.78, 0.1); h2.rotation.set(-0.15, 0, 0.45);

        const t1 = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.25, 12), tipMat);
        t1.position.set(-0.48, 0.98, 0.06); t1.rotation.set(-0.2, 0, -0.65);
        const t2 = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.25, 12), tipMat);
        t2.position.set(0.48, 0.98, 0.06); t2.rotation.set(-0.2, 0, 0.65);

        char.hatGroup.add(r1, r2, h1, h2, t1, t2);
    } else if (hatType === 'crown') {
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.9, roughness: 0.2 });
        const gemMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.8, roughness: 0.1 });
        const baseRing = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.1, 24), goldMat);
        baseRing.position.set(0, 0.68, 0);
        const crownBody = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.4, 0.28, 6, 1, true), goldMat);
        crownBody.position.set(0, 0.82, 0);
        char.hatGroup.add(baseRing, crownBody);
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const radius = 0.47;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const peak = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 4), goldMat);
            peak.position.set(x, 1.0, z);
            char.hatGroup.add(peak);
            const gem = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), gemMat);
            gem.position.set(x, 1.11, z);
            char.hatGroup.add(gem);
        }
    } else if (hatType === 'wizard') {
        const hatMat = new THREE.MeshStandardMaterial({ color: 0x3b0764, roughness: 0.3 });
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 });
        const ribbonMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.4 });
        const starMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

        const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.04, 24), hatMat);
        brim.position.set(0, 0.68, 0);
        const ribbon = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.48, 0.12, 20), ribbonMat);
        ribbon.position.set(0, 0.75, 0);
        const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.05), goldMat);
        buckle.position.set(0, 0.75, 0.48);
        const cone1 = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.45, 0.5, 20), hatMat);
        cone1.position.set(0, 1.0, 0);
        const cone2 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.32, 0.45, 20), hatMat);
        cone2.position.set(0, 1.4, -0.05);
        cone2.rotation.x = -0.2;
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.35, 16), hatMat);
        tip.position.set(0, 1.7, -0.18);
        tip.rotation.x = -0.5;
        const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), starMat);
        star.position.set(0, 1.88, -0.28);
        char.hatGroup.add(brim, ribbon, buckle, cone1, cone2, tip, star);
    } else if (hatType === 'cap') {
        const mainMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4 });
        const frontMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
        const visorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 });
        const buttonMat = new THREE.MeshStandardMaterial({ color: 0xd97706 });

        const base = new THREE.Mesh(new THREE.SphereGeometry(0.81, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2.2), mainMat);
        base.position.set(0, 0.22, 0);
        const frontPanel = new THREE.Mesh(new THREE.SphereGeometry(0.815, 16, 16, -Math.PI / 3, Math.PI / 1.5, 0, Math.PI / 3), frontMat);
        frontPanel.position.set(0, 0.22, 0);
        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.04, 0.48), visorMat);
        visor.position.set(0, 0.42, 0.74);
        visor.rotation.x = 0.22;
        const button = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), buttonMat);
        button.position.set(0, 0.98, 0);
        const strap = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.03, 8, 16, Math.PI / 2), visorMat);
        strap.position.set(0, 0.26, 0);
        strap.rotation.x = Math.PI / 2;
        strap.rotation.z = Math.PI * 0.75;
        char.hatGroup.add(base, frontPanel, visor, button, strap);
    } else if (hatType === 'halo') {
        const halo = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.05, 16, 32), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
        halo.rotation.x = Math.PI / 2; halo.position.set(0, 1.1, 0);
        char.hatGroup.add(halo);
    } else if (hatType === 'tophat') {
        const hatMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.15, metalness: 0.2 });
        const ribbonMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9, roughness: 0.1 });

        const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 0.04, 32), hatMat);
        brim.position.set(0, 0.68, 0);
        const top = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.42, 0.75, 32), hatMat);
        top.position.set(0, 1.05, 0);
        const ribbon = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.14, 32), ribbonMat);
        ribbon.position.set(0, 0.76, 0);
        const buckle = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 8, 16), goldMat);
        buckle.position.set(0, 0.76, 0.44);
        const featherMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2 });
        const feather = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.45, 8), featherMat);
        feather.position.set(0.38, 0.98, 0.2);
        feather.rotation.set(-0.2, 0, -0.3);
        char.hatGroup.add(brim, top, ribbon, buckle, feather);
    } else if (hatType === 'cat') {
        const bandMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
        const outerEarMat = new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.3 });
        const innerEarMat = new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.2 });
        const whiskerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

        const headband = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.03, 8, 24, Math.PI), bandMat);
        headband.rotation.x = Math.PI / 2; headband.position.set(0, 0.58, 0);
        const e1Outer = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.4, 4), outerEarMat);
        e1Outer.position.set(-0.35, 0.82, 0.05); e1Outer.rotation.set(-0.1, 0, -0.25);
        const e2Outer = e1Outer.clone(); e2Outer.position.set(0.35, 0.82, 0.05); e2Outer.rotation.set(-0.1, 0, 0.25);
        const e1Inner = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.28, 4), innerEarMat);
        e1Inner.position.set(-0.35, 0.82, 0.09); e1Inner.rotation.set(-0.1, 0, -0.25);
        const e2Inner = e1Inner.clone(); e2Inner.position.set(0.35, 0.82, 0.09); e2Inner.rotation.set(-0.1, 0, 0.25);
        const w1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.02, 0.02), whiskerMat);
        w1.position.set(-0.42, 0.05, 0.72); w1.rotation.z = 0.15;
        const w2 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.02, 0.02), whiskerMat);
        w2.position.set(0.42, 0.05, 0.72); w2.rotation.z = -0.15;
        char.hatGroup.add(headband, e1Outer, e2Outer, e1Inner, e2Inner, w1, w2);
    } else if (hatType === 'duck') {
        const duckYellow = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2 });
        const beakOrange = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.3 });
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
        const duckBody = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), duckYellow);
        duckBody.position.set(0, 0.85, 0);
        const duckHead = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), duckYellow);
        duckHead.position.set(0, 1.05, 0.12);
        const duckBeak = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.18), beakOrange);
        duckBeak.position.set(0, 1.02, 0.28);
        const eyeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), eyeMat);
        eyeLeft.position.set(-0.1, 1.09, 0.26);
        const eyeRight = eyeLeft.clone(); eyeRight.position.set(0.1, 1.09, 0.26);
        const wingLeft = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), duckYellow);
        wingLeft.scale.set(0.4, 0.8, 1.2); wingLeft.position.set(-0.26, 0.85, 0);
        const wingRight = wingLeft.clone(); wingRight.position.set(0.26, 0.85, 0);
        char.hatGroup.add(duckBody, duckHead, duckBeak, eyeLeft, eyeRight, wingLeft, wingRight);
    } else if (hatType === 'bunny') {
        const outerMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
        const innerMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.3 });
        const bandMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });

        const headband = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.03, 8, 24, Math.PI), bandMat);
        headband.rotation.x = Math.PI / 2;
        headband.position.set(0, 0.58, 0);

        const createBunnyEar = (xPos, rotZ, isFloppy = false) => {
            const earGroup = new THREE.Group();
            const outer = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.7, 16), outerMat);
            outer.scale.set(1, 1, 0.5);
            const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.62, 16), innerMat);
            inner.scale.set(1, 1, 0.4);
            inner.position.set(0, 0, 0.03);
            earGroup.add(outer, inner);
            if (isFloppy) {
                const tipOuter = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 16), outerMat);
                tipOuter.scale.set(1, 1, 0.5);
                tipOuter.position.set(0, 0.4, -0.08);
                tipOuter.rotation.x = -1.2;
                const tipInner = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.25, 16), innerMat);
                tipInner.scale.set(1, 1, 0.4);
                tipInner.position.set(0, 0.4, -0.06);
                tipInner.rotation.x = -1.2;
                earGroup.add(tipOuter, tipInner);
            }
            earGroup.position.set(xPos, 0.95, 0);
            earGroup.rotation.z = rotZ;
            return earGroup;
        };

        const leftEar = createBunnyEar(-0.28, -0.15, false);
        const rightEar = createBunnyEar(0.28, 0.25, true);
        char.hatGroup.add(headband, leftEar, rightEar);
    } else if (hatType === 'propeller') {
        const capMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 });
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.81, 20, 20, 0, Math.PI * 2, 0, Math.PI / 2.3), capMat);
        cap.position.set(0, 0.2, 0);
        const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.25), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
        stick.position.set(0, 0.92, 0);
        const bladeGroup = new THREE.Group();
        const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.04, 0.16), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
        const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.95), new THREE.MeshStandardMaterial({ color: 0x3b82f6 }));
        const centerCap = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), new THREE.MeshStandardMaterial({ color: 0x22c55e }));
        bladeGroup.add(b1, b2, centerCap);
        bladeGroup.position.set(0, 1.05, 0);
        char.hatGroup.add(cap, stick, bladeGroup);
        char.propellerBlade = bladeGroup;
    } else if (hatType === 'sombrero') {
        const mat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.5 });
        const bandMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
        const brim = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.06, 32), mat);
        brim.position.set(0, 0.72, 0);
        brim.rotation.x = -0.1;
        const top = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.7, 20), mat);
        top.position.set(0, 1.05, -0.05);
        top.rotation.x = -0.1;
        const ribbon = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.1, 20), bandMat);
        ribbon.position.set(0, 0.76, -0.05);
        ribbon.rotation.x = -0.1;
        char.hatGroup.add(brim, top, ribbon);
    } else if (hatType === 'ninja') {
        const bandMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });
        const silverMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.15 });
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.1 });
        const redClothMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });

        const band = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.82, 0.22, 32), bandMat);
        band.position.set(0, 0.52, 0);
        const plate = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.06), silverMat);
        plate.position.set(0, 0.54, 0.81);
        const rivetGeo = new THREE.SphereGeometry(0.025, 8, 8);
        const r1 = new THREE.Mesh(rivetGeo, metalMat); r1.position.set(-0.17, 0.59, 0.84);
        const r2 = new THREE.Mesh(rivetGeo, metalMat); r2.position.set(0.17, 0.59, 0.84);
        const r3 = new THREE.Mesh(rivetGeo, metalMat); r3.position.set(-0.17, 0.49, 0.84);
        const r4 = new THREE.Mesh(rivetGeo, metalMat); r4.position.set(0.17, 0.49, 0.84);
        const emblem = new THREE.Mesh(new THREE.OctahedronGeometry(0.05, 0), redClothMat);
        emblem.position.set(0, 0.54, 0.85); emblem.rotation.z = Math.PI / 4;
        const knot = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), redClothMat);
        knot.position.set(0, 0.54, -0.82);
        const tail1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.6, 0.03), redClothMat);
        tail1.position.set(-0.08, 0.25, -0.88);
        tail1.rotation.set(0.3, 0.1, -0.25);
        const tail2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.75, 0.03), redClothMat);
        tail2.position.set(0.08, 0.18, -0.9);
        tail2.rotation.set(0.4, -0.15, 0.3);
        const bladeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
        const shuriken = new THREE.Group();
        const blade1 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.06, 0.02), bladeMat);
        const blade2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.25, 0.02), bladeMat);
        shuriken.add(blade1, blade2);
        shuriken.position.set(0.55, 0.68, 0.55);
        shuriken.rotation.set(0.4, 0.8, -0.5);
        char.hatGroup.add(band, plate, r1, r2, r3, r4, emblem, knot, tail1, tail2, shuriken);
    } else if (hatType === 'alien') {
        const greenGlow = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x10b981, emissiveIntensity: 0.8, roughness: 0.2 });
        const alienBaseMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.3, metalness: 0.5 });
        const glassDomeMat = new THREE.MeshStandardMaterial({ color: 0x34d399, transparent: true, opacity: 0.55, roughness: 0.1, metalness: 0.2 });

        const baseRing = new THREE.Mesh(new THREE.TorusGeometry(0.81, 0.04, 12, 32), alienBaseMat);
        baseRing.rotation.x = Math.PI / 2;
        baseRing.position.set(0, 0.45, 0);
        const dome = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2), glassDomeMat);
        dome.position.set(0, 0.5, 0);
        const core = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 1), greenGlow);
        core.position.set(0, 0.68, 0);
        const ant1 = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.04, 0.55), alienBaseMat);
        ant1.position.set(-0.35, 0.95, 0);
        ant1.rotation.z = -0.35;
        const ant2 = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.04, 0.55), alienBaseMat);
        ant2.position.set(0.35, 0.95, 0);
        ant2.rotation.z = 0.35;
        const orb1 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), greenGlow);
        orb1.position.set(-0.46, 1.22, 0);
        const orb2 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), greenGlow);
        orb2.position.set(0.46, 1.22, 0);
        const saucerRing = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.03, 12, 32), new THREE.MeshStandardMaterial({ color: 0xa7f3d0, metalness: 0.85, roughness: 0.1 }));
        saucerRing.rotation.x = Math.PI / 2 + 0.2;
        saucerRing.position.set(0, 0.72, 0);
        char.hatGroup.add(baseRing, dome, core, ant1, ant2, orb1, orb2, saucerRing);
    } else if (hatType === 'viking') {
        const helmMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6, roughness: 0.3 });
        const hornMat = new THREE.MeshStandardMaterial({ color: 0xfffbe1, roughness: 0.4 });
        const helm = new THREE.Mesh(new THREE.SphereGeometry(0.82, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2.2), helmMat);
        helm.position.set(0, 0.25, 0);
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.04, 16, 32), helmMat);
        rim.rotation.x = Math.PI / 2;
        rim.position.set(0, 0.25, 0);
        const h1 = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.55, 16), hornMat);
        const h2 = h1.clone();
        h1.position.set(-0.6, 0.72, 0.1);
        h1.rotation.set(-0.2, 0, -0.7);
        h2.position.set(0.6, 0.72, 0.1);
        h2.rotation.set(-0.2, 0, 0.7);
        char.hatGroup.add(helm, rim, h1, h2);
    }
}

// =====================================================================
// GLASSES
// =====================================================================
export function setGlasses(char, glassesType) {
    clearGroup(char.glassesGroup);
    

    if (glassesType === 'sunglasses') {
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.8 });
        const lensMat = new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.05, metalness: 0.95 });
        const leftLens = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.06), lensMat);
        leftLens.position.set(-0.24, 0.2, 0.82);
        const rightLens = leftLens.clone();
        rightLens.position.set(0.24, 0.2, 0.82);
        const topBar = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.04, 0.07), frameMat);
        topBar.position.set(0, 0.3, 0.82);
        const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.07), frameMat);
        bridge.position.set(0, 0.2, 0.82);
        const armLeft = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.65), frameMat);
        armLeft.position.set(-0.42, 0.26, 0.52);
        armLeft.rotation.y = -0.15;
        const armRight = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.65), frameMat);
        armRight.position.set(0.42, 0.26, 0.52);
        armRight.rotation.y = 0.15;
        char.glassesGroup.add(leftLens, rightLens, topBar, bridge, armLeft, armRight);
    } else if (glassesType === 'nerd') {
        const goldFrame = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.2 });
        const glassMat = new THREE.MeshStandardMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.35, roughness: 0.1 });
        const rimLeft = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 12, 32), goldFrame);
        rimLeft.position.set(-0.28, 0.2, 0.82);
        const rimRight = rimLeft.clone();
        rimRight.position.set(0.28, 0.2, 0.82);
        const glassLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.02, 24), glassMat);
        glassLeft.rotation.x = Math.PI / 2;
        glassLeft.position.set(-0.28, 0.2, 0.82);
        const glassRight = glassLeft.clone();
        glassRight.position.set(0.28, 0.2, 0.82);
        const bridge = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.025, 8, 16, Math.PI), goldFrame);
        bridge.position.set(0, 0.22, 0.82);
        const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.6), goldFrame);
        armL.rotation.x = Math.PI / 2;
        armL.position.set(-0.46, 0.2, 0.52);
        const armR = armL.clone();
        armR.position.set(0.46, 0.2, 0.52);
        char.glassesGroup.add(rimLeft, rimRight, glassLeft, glassRight, bridge, armL, armR);
    } else if (glassesType === 'monocle') {
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.95, roughness: 0.1 });
        const lensMat = new THREE.MeshStandardMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.4, roughness: 0.05 });
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.035, 12, 32), goldMat);
        ring.position.set(0.28, 0.2, 0.83);
        const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 24), lensMat);
        lens.rotation.x = Math.PI / 2;
        lens.position.set(0.28, 0.2, 0.83);
        const galleryTop = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.05), goldMat);
        galleryTop.position.set(0.28, 0.42, 0.82);
        const galleryBottom = galleryTop.clone();
        galleryBottom.position.set(0.28, -0.02, 0.82);
        const chain1 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.25), goldMat);
        chain1.position.set(0.46, 0.08, 0.81);
        chain1.rotation.z = -0.4;
        const chain2 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.35), goldMat);
        chain2.position.set(0.52, -0.18, 0.72);
        chain2.rotation.z = 0.2;
        char.glassesGroup.add(ring, lens, galleryTop, galleryBottom, chain1, chain2);
    } else if (glassesType === 'vr') {
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, metalness: 0.1 });
        const visorMat = new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.05, metalness: 0.8 });
        const strapMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
        const ledMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0ea5e9, emissiveIntensity: 0.9 });
        const mainBox = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.38, 0.28), bodyMat);
        mainBox.position.set(0, 0.18, 0.78);
        const frontVisor = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.32, 0.05), visorMat);
        frontVisor.position.set(0, 0.18, 0.92);
        const ledBar = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.03, 0.06), ledMat);
        ledBar.position.set(0, 0.28, 0.93);
        const sideStrapL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.75), strapMat);
        sideStrapL.position.set(-0.44, 0.18, 0.42);
        const sideStrapR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.75), strapMat);
        sideStrapR.position.set(0.44, 0.18, 0.42);
        const topStrap = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.75), strapMat);
        topStrap.position.set(0, 0.62, 0.38);
        char.glassesGroup.add(mainBox, frontVisor, ledBar, sideStrapL, sideStrapR, topStrap);
    } else if (glassesType === 'td') {
        const frameMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
        const redLensMat = new THREE.MeshStandardMaterial({ color: 0xef4444, transparent: true, opacity: 0.75, roughness: 0.1 });
        const cyanLensMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.75, roughness: 0.1 });
        const frame = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.28, 0.04), frameMat);
        frame.position.set(0, 0.2, 0.81);
        const leftCutout = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.05), redLensMat);
        leftCutout.position.set(-0.22, 0.2, 0.82);
        const rightCutout = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.05), cyanLensMat);
        rightCutout.position.set(0.22, 0.2, 0.82);
        const armL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, 0.65), frameMat);
        armL.position.set(-0.43, 0.2, 0.52);
        armL.rotation.y = -0.12;
        const armR = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, 0.65), frameMat);
        armR.position.set(0.43, 0.2, 0.52);
        armR.rotation.y = 0.12;
        char.glassesGroup.add(frame, leftCutout, rightCutout, armL, armR);
    } else if (glassesType === 'mustache') {
        const stacheMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.8, metalness: 0.1 });
        const stacheGroup = new THREE.Group();
        const centerNode = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), stacheMat);
        centerNode.position.set(0, -0.02, 0.83);
        const leftWing = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.42, 12), stacheMat);
        leftWing.rotation.z = Math.PI / 2 + 0.25;
        leftWing.rotation.x = -0.2;
        leftWing.position.set(-0.18, -0.04, 0.82);
        const rightWing = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.42, 12), stacheMat);
        rightWing.rotation.z = -(Math.PI / 2 + 0.25);
        rightWing.rotation.x = -0.2;
        rightWing.position.set(0.18, -0.04, 0.82);
        const curlL = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.04, 8, 16, Math.PI), stacheMat);
        curlL.position.set(-0.38, -0.01, 0.81);
        curlL.rotation.z = -0.4;
        const curlR = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.04, 8, 16, Math.PI), stacheMat);
        curlR.position.set(0.38, -0.01, 0.81);
        curlR.rotation.z = 0.4;
        curlR.rotation.y = Math.PI;
        stacheGroup.add(centerNode, leftWing, rightWing, curlL, curlR);
        char.glassesGroup.add(stacheGroup);
    } else if (glassesType === 'pirate_patch') {
        const leatherMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 });
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.85, roughness: 0.2 });
        const patch = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.04, 16), leatherMat);
        patch.rotation.x = Math.PI / 2;
        patch.position.set(-0.3, 0.2, 0.82);
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.02, 8, 24), goldMat);
        rim.position.set(-0.3, 0.2, 0.84);
        const skullEmblem = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 10), goldMat);
        skullEmblem.scale.set(1, 1.2, 0.5);
        skullEmblem.position.set(-0.3, 0.2, 0.86);
        const strap1 = new THREE.Mesh(new THREE.TorusGeometry(0.79, 0.02, 8, 32), leatherMat);
        strap1.position.set(0, 0.2, 0.1);
        strap1.rotation.x = 0.35;
        strap1.rotation.y = -0.15;
        const strap2 = new THREE.Mesh(new THREE.TorusGeometry(0.79, 0.02, 8, 32), leatherMat);
        strap2.position.set(0, 0.2, 0.1);
        strap2.rotation.x = -0.25;
        strap2.rotation.y = -0.15;
        char.glassesGroup.add(patch, rim, skullEmblem, strap1, strap2);
    } else if (glassesType === 'mask') {
        const fabricMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.5 });
        const borderMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
        const mainMask = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.36, 0.18), fabricMat);
        mainMask.position.set(0, -0.12, 0.78);
        const topBorder = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.04, 0.2), borderMat);
        topBorder.position.set(0, 0.05, 0.78);
        const bottomBorder = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.04, 0.2), borderMat);
        bottomBorder.position.set(0, -0.29, 0.78);
        const earLoopL = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.02, 8, 20), borderMat);
        earLoopL.position.set(-0.4, -0.12, 0.6);
        earLoopL.rotation.y = Math.PI / 2 + 0.3;
        const earLoopR = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.02, 8, 20), borderMat);
        earLoopR.position.set(0.4, -0.12, 0.6);
        earLoopR.rotation.y = Math.PI / 2 - 0.3;
        char.glassesGroup.add(mainMask, topBorder, bottomBorder, earLoopL, earLoopR);
    } else if (glassesType === 'clown') {
        const noseMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.05, metalness: 0.1, emissive: 0x991b1b, emissiveIntensity: 0.35 });
        const shineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 });
        const strapMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.5 });
        const nose = new THREE.Mesh(new THREE.SphereGeometry(0.25, 24, 24), noseMat);
        nose.position.set(0, 0.05, 0.86);
        const shine = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), shineMat);
        shine.position.set(-0.08, 0.14, 1.05);
        const strap = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.015, 8, 32), strapMat);
        strap.rotation.x = Math.PI / 2 + 0.1;
        strap.position.set(0, 0.05, 0.1);
        char.glassesGroup.add(nose, shine, strap);
    } else if (glassesType === 'goggles') {
        const leatherMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.7 });
        const brassMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.2 });
        const lensMat = new THREE.MeshStandardMaterial({ color: 0xfde047, transparent: true, opacity: 0.65, metalness: 0.5, roughness: 0.1 });
        const g1 = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.25, 0.12, 24), brassMat);
        g1.rotation.x = Math.PI / 2;
        g1.position.set(-0.28, 0.22, 0.82);
        const g2 = g1.clone();
        g2.position.set(0.28, 0.22, 0.82);
        const l1 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.13, 24), lensMat);
        l1.rotation.x = Math.PI / 2;
        l1.position.set(-0.28, 0.22, 0.82);
        const l2 = l1.clone();
        l2.position.set(0.28, 0.22, 0.82);
        const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.08), leatherMat);
        bridge.position.set(0, 0.22, 0.82);
        const strap = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.04, 8, 32), leatherMat);
        strap.rotation.x = Math.PI / 2;
        strap.position.set(0, 0.22, 0.1);
        char.glassesGroup.add(g1, g2, l1, l2, bridge, strap);
    } else if (glassesType === 'star') {
        const frameMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.9, roughness: 0.1 });
        const lensMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, transparent: true, opacity: 0.6, roughness: 0.1 });
        const createStarMesh = (isLens) => {
            const group = new THREE.Group();
            const mat = isLens ? lensMat : frameMat;
            const size = isLens ? 0.32 : 0.36;
            const depth = isLens ? 0.03 : 0.04;
            const b1 = new THREE.Mesh(new THREE.BoxGeometry(size, size, depth), mat);
            b1.rotation.z = Math.PI / 4;
            const b2 = new THREE.Mesh(new THREE.BoxGeometry(size, size, depth), mat);
            group.add(b1, b2);
            return group;
        };
        const s1Frame = createStarMesh(false);
        s1Frame.position.set(-0.28, 0.2, 0.82);
        const s2Frame = createStarMesh(false);
        s2Frame.position.set(0.28, 0.2, 0.82);
        const s1Lens = createStarMesh(true);
        s1Lens.position.set(-0.28, 0.2, 0.83);
        const s2Lens = createStarMesh(true);
        s2Lens.position.set(0.28, 0.2, 0.83);
        const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.04, 0.05), frameMat);
        bridge.position.set(0, 0.2, 0.82);
        const armL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.65), frameMat);
        armL.position.set(-0.44, 0.2, 0.52);
        armL.rotation.y = -0.15;
        const armR = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.65), frameMat);
        armR.position.set(0.44, 0.2, 0.52);
        armR.rotation.y = 0.15;
        char.glassesGroup.add(s1Frame, s2Frame, s1Lens, s2Lens, bridge, armL, armR);
    } else if (glassesType === 'heart') {
        const frameMat = new THREE.MeshStandardMaterial({ color: 0xdb2777, roughness: 0.2 });
        const lensMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.65, roughness: 0.1 });
        const createHeartShape = (mat, scaleZ) => {
            const hGroup = new THREE.Group();
            const b1 = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 16), mat);
            const b2 = b1.clone();
            b1.position.set(-0.08, 0.06, 0);
            b2.position.set(0.08, 0.06, 0);
            const cone = new THREE.Mesh(new THREE.ConeGeometry(0.21, 0.26, 16), mat);
            cone.rotation.z = Math.PI;
            cone.position.set(0, -0.07, 0);
            hGroup.add(b1, b2, cone);
            hGroup.scale.set(1, 1, scaleZ);
            return hGroup;
        };
        const h1Frame = createHeartShape(frameMat, 0.25);
        h1Frame.position.set(-0.28, 0.2, 0.82);
        const h2Frame = createHeartShape(frameMat, 0.25);
        h2Frame.position.set(0.28, 0.2, 0.82);
        const h1Lens = createHeartShape(lensMat, 0.3);
        h1Lens.position.set(-0.28, 0.2, 0.83);
        const h2Lens = createHeartShape(lensMat, 0.3);
        h2Lens.position.set(0.28, 0.2, 0.83);
        const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.05), frameMat);
        bridge.position.set(0, 0.2, 0.82);
        const armL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.65), frameMat);
        armL.position.set(-0.43, 0.2, 0.52);
        armL.rotation.y = -0.15;
        const armR = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.65), frameMat);
        armR.position.set(0.43, 0.2, 0.52);
        armR.rotation.y = 0.15;
        char.glassesGroup.add(h1Frame, h2Frame, h1Lens, h2Lens, bridge, armL, armR);
    }
}

// =====================================================================
// EFFECTS
// =====================================================================
export function setEffect(char, effectId) {
    clearGroup(char.effectGroup);
    if (char.worldEffect) { char.worldEffect.dispose(); char.worldEffect = null; }

    char.bodyMesh.material.color.setHex(char.baseColor);
    char.bodyMesh.material.metalness = 0.1;
    char.bodyMesh.material.roughness = 0.1;
    char.bodyMesh.material.transparent = false;
    char.bodyMesh.material.opacity = 1;
    char.bodyMesh.material.depthWrite = true;
    char.bodyMesh.material.side = THREE.FrontSide;
    char.bodyMesh.material.emissive.setHex(0x000000);
    char.bodyMesh.material.emissiveIntensity = 1;
    char.effectType = effectId || 'none';

    if (!effectId || effectId === 'none') return;
    const cfg = EFFECT_CATALOG.find(e => e.id === effectId);
    if (!cfg) return;
    const v = cfg.visual;

    if (v.type === 'trail') {
        char.worldEffect = makeCometTrail(char, v);
        char.effectGroup.add(makeCometHead(v.color));
    } else if (v.type === 'shapes') {
        char.effectGroup.add(makeOrbitingShapes(v));
    } else if (v.type === 'rings') {
        char.effectGroup.add(makeHaloRings(v));
    } else if (v.type === 'cage') {
        char.effectGroup.add(makeVoltCage(v));
    } else if (v.type === 'veil') {
        char.effectGroup.add(makePrismVeil(v));
    } else if (v.type === 'orbit') {
        char.effectGroup.add(makeOrbitParticles(v));
    } else if (v.type === 'material') {
        if (v.opacity !== undefined) {
            char.bodyMesh.material.transparent = true;
            char.bodyMesh.material.opacity = v.opacity;
            char.bodyMesh.material.depthWrite = false;
            char.bodyMesh.material.side = THREE.DoubleSide;
            char.effectGroup.add(makeGhostRim(char.baseColor));
        }
    }
}

// =====================================================================
// REFRESH
// =====================================================================
export function refreshAccessories() {
    const ps = state.previewState;
    const sc = state.selectedConfig;

    setHat(p1Char, ps.p1Hat || sc.p1.hat);
    setGlasses(p1Char, ps.p1Glasses || sc.p1.glasses);
    setEffect(p1Char, ps.p1Effect || sc.p1.effect);
    setHat(p2Char, ps.p2Hat || sc.p2.hat);
    setGlasses(p2Char, ps.p2Glasses || sc.p2.glasses);
    setEffect(p2Char, ps.p2Effect || sc.p2.effect);
}

export function randomizeAICosmetics() {
    const randomConfig = getRandomCosmetics();
    state.selectedConfig.p2.hat = randomConfig.hat;
    state.selectedConfig.p2.glasses = randomConfig.glasses;
    const effectRoll = Math.floor(Math.random() * (EFFECT_CATALOG.length + 1));
    state.selectedConfig.p2.effect = effectRoll === EFFECT_CATALOG.length ? 'none' : EFFECT_CATALOG[effectRoll].id;
    refreshAccessories();
}

// İlk yükləmə
refreshAccessories();

// =====================================================================
// ANIMATION LOOP HELPER — bütün effektləri hər frame yeniləyir
// =====================================================================
export function updateCharacterEffects(elapsed) {
    [p1Char, p2Char].forEach(char => {
        char.effectGroup.children.forEach(obj => {
            if (obj.userData && typeof obj.userData.update === 'function') obj.userData.update(elapsed);
        });
        if (char.worldEffect) char.worldEffect.update(elapsed);
    });
}