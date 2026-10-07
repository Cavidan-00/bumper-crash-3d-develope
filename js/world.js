// =====================================================================
// WORLD — THREE.JS SCENE, CAMERA, RENDERER, MAP
// Scene qrafikası və ətraf mühitin bütün vizual komponentləri.
// =====================================================================

import * as THREE from 'three';
import { arenaRadius, squareSize } from './config.js';

// --- Scene ---
export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x090d16);
scene.fog = new THREE.FogExp2(0x090d16, 0.02);

// --- Camera ---
export const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);

export const camPosMenu = new THREE.Vector3(0, 10, 22);
export const camPosCustomize = new THREE.Vector3(0, 2.2, 7.5);
export const camLookMenu = new THREE.Vector3(0, 0, 0);
export const camLookCustomize = new THREE.Vector3(0, 1.0, 0);

export let currentCamPos = camPosMenu.clone();
export let currentCamLook = camLookMenu.clone();
camera.position.copy(currentCamPos);
camera.lookAt(currentCamLook);

// --- Renderer ---
export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// --- Clocks ---
export const effectClock = new THREE.Clock();

// --- Lights ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 1.6);
dirLight.position.set(10, 20, 10);
dirLight.castShadow = true;
scene.add(dirLight);

// --- Map ---
export const mapGroup = new THREE.Group();
scene.add(mapGroup);

export function buildMap(type) {
    while (mapGroup.children.length > 0) {
        const child = mapGroup.children[0];
        mapGroup.remove(child);
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
    }

    const platformMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.2, metalness: 0.5 });
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x6366f1 });

    if (type === 'circle') {
        const geo = new THREE.CylinderGeometry(arenaRadius, arenaRadius + 0.5, 1, 64);
        const mesh = new THREE.Mesh(geo, platformMat);
        mesh.position.y = -0.5; mesh.receiveShadow = true;
        mapGroup.add(mesh);
        const ringGeo = new THREE.TorusGeometry(arenaRadius, 0.15, 16, 100);
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2; ring.position.y = 0.01;
        mapGroup.add(ring);
    }
    else if (type === 'square') {
        const geo = new THREE.BoxGeometry(squareSize, 1, squareSize);
        const mesh = new THREE.Mesh(geo, platformMat);
        mesh.position.y = -0.5; mesh.receiveShadow = true;
        mapGroup.add(mesh);
        const edgeGeo = new THREE.BoxGeometry(squareSize + 0.1, 0.1, squareSize + 0.1);
        const edgeMat = new THREE.MeshBasicMaterial({ color: 0x6366f1, wireframe: true });
        const edge = new THREE.Mesh(edgeGeo, edgeMat);
        edge.position.y = 0.01;
        mapGroup.add(edge);
    }
    else if (type === 'bowl') {
        const bowlGeo = new THREE.SphereGeometry(arenaRadius, 40, 20, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
        const bowlMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.2, metalness: 0.4, side: THREE.DoubleSide });
        const bowlMesh = new THREE.Mesh(bowlGeo, bowlMat);
        bowlMesh.scale.set(1, 0.35, 1); bowlMesh.position.y = 2.8; bowlMesh.receiveShadow = true;
        mapGroup.add(bowlMesh);
        const ringGeo = new THREE.TorusGeometry(arenaRadius, 0.18, 16, 100);
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2; ring.position.y = 2.8;
        mapGroup.add(ring);
    }
}

// =====================================================================
// IMPACT FX — Particle & Shockwave
// =====================================================================
const particles = [];
const particleGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);

const sharedParticleMaterial = new THREE.MeshBasicMaterial({ color: 0xfbcb24 });

export function createImpactParticles(pos, intensity) {
    const count = Math.floor(12 + intensity * 25);
    const MAX_PARTICLES = 400;
    while (particles.length + count > MAX_PARTICLES && particles.length > 0) {
        const old = particles.shift();
        scene.remove(old);
        // material shared olduğu üçün dispose etmirik
    }
    for (let i = 0; i < count; i++) {
        const p = new THREE.Mesh(particleGeo, sharedParticleMaterial);
        p.position.copy(pos); p.position.y += 0.2;
        const speed = 0.08 + Math.random() * (0.15 + intensity * 0.1);
        const angle = Math.random() * Math.PI * 2;
        const vY = 0.08 + Math.random() * 0.15;
        p.userData = { vel: new THREE.Vector3(Math.cos(angle) * speed, vY, Math.sin(angle) * speed), life: 1.0, decay: 0.03 + Math.random() * 0.03 };
        scene.add(p); particles.push(p);
    }
}

export function updateParticles(timeScale) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.position.addScaledVector(pt.userData.vel, timeScale);
        pt.userData.vel.y -= 0.008 * timeScale;
        pt.userData.life -= pt.userData.decay * timeScale;
        pt.scale.setScalar(Math.max(0.01, pt.userData.life));
        if (pt.userData.life <= 0) {
            scene.remove(pt);
            particles.splice(i, 1);
        }
    }
}

const shockwaves = [];

export function createShockwave(pos, intensity) {
    const geo = new THREE.RingGeometry(0.1, 0.35, 32);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = Math.PI / 2; mesh.position.copy(pos);
    mesh.userData = { scaleSpeed: 0.22 + intensity * 0.18, opacityDecay: 0.045 };
    scene.add(mesh); shockwaves.push(mesh);
}

export function updateShockwaves(timeScale) {
    for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        sw.scale.addScalar(sw.userData.scaleSpeed * timeScale);
        sw.material.opacity -= sw.userData.opacityDecay * timeScale;
        if (sw.material.opacity <= 0) {
            scene.remove(sw);
            if (sw.geometry) sw.geometry.dispose();
            if (sw.material) sw.material.dispose();
            shockwaves.splice(i, 1);
        }
    }
}

// =====================================================================
// RESIZE HANDLER
// =====================================================================
export function onViewportResize() {
    const w = window.visualViewport ? window.visualViewport.width : window.innerWidth;
    const h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
}
window.addEventListener('resize', onViewportResize);
window.addEventListener('orientationchange', () => setTimeout(onViewportResize, 200));