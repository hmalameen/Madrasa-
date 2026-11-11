import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { Language } from '../../types/madrasa';

interface QuranRehalScene3DProps {
  language?: Language;
  className?: string;
}

/**
 * Generates a high-resolution procedural Islamic Illuminated Manuscript (Tazhib)
 * canvas texture for the open Quran page spread.
 */
function createQuranManuscriptPageTexture(side: 'left' | 'right'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 768;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // 1. Warm Royal Ivory Parchment base (#F7F4EC -> #EFE6CE)
    const parchmentGrad = ctx.createLinearGradient(
      side === 'left' ? 512 : 0,
      0,
      side === 'left' ? 0 : 512,
      0
    );
    parchmentGrad.addColorStop(0, '#E5D8B6'); // Subtle inner spine crease shading
    parchmentGrad.addColorStop(0.12, '#F7F4EC');
    parchmentGrad.addColorStop(0.65, '#FAF7F0');
    parchmentGrad.addColorStop(1, '#EDE2C8');
    ctx.fillStyle = parchmentGrad;
    ctx.fillRect(0, 0, 512, 768);

    // 2. Sacred Noor warm radial luminescence emerging from the center of the page
    const noorGlow = ctx.createRadialGradient(256, 360, 20, 256, 360, 320);
    noorGlow.addColorStop(0, 'rgba(232, 213, 138, 0.36)');
    noorGlow.addColorStop(0.55, 'rgba(217, 182, 76, 0.14)');
    noorGlow.addColorStop(1, 'rgba(217, 182, 76, 0)');
    ctx.fillStyle = noorGlow;
    ctx.fillRect(0, 0, 512, 768);

    // 3. Outer & Inner Tazhib (Illuminated Islamic Border) in Champagne Gold & Deep Emerald
    ctx.strokeStyle = '#C69D33';
    ctx.lineWidth = 6;
    ctx.strokeRect(30, 36, 452, 696);

    ctx.strokeStyle = '#064B3A';
    ctx.lineWidth = 3;
    ctx.strokeRect(42, 48, 428, 672);

    ctx.strokeStyle = '#D9B64C';
    ctx.lineWidth = 2;
    ctx.strokeRect(52, 58, 408, 652);

    // 4. Ornate Surah Header Cartouche at top of page
    ctx.fillStyle = '#064B3A';
    ctx.fillRect(66, 74, 380, 56);
    ctx.strokeStyle = '#D9B64C';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(66, 74, 380, 56);

    // Gold floral arabesque accents in Surah cartouche
    ctx.fillStyle = '#E8D58A';
    ctx.beginPath();
    ctx.arc(100, 102, 11, 0, Math.PI * 2);
    ctx.arc(412, 102, 11, 0, Math.PI * 2);
    ctx.fill();

    // Central golden cartouche medallion
    ctx.fillStyle = '#D9B64C';
    ctx.fillRect(168, 86, 176, 32);
    ctx.fillStyle = '#061326';
    ctx.fillRect(174, 91, 164, 22);

    // 5. Stylized Quranic Calligraphy Lines & Golden Verse Medallions (Ayah markers)
    const totalLines = 13;
    const startY = 166;
    const lineStep = 40;

    for (let i = 0; i < totalLines; i++) {
      const y = startY + i * lineStep;

      // Subtle ruled manuscript baseline
      ctx.strokeStyle = 'rgba(217, 182, 76, 0.22)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(74, y + 12);
      ctx.lineTo(438, y + 12);
      ctx.stroke();

      // Calligraphic strokes (segmented right-to-left rhythmic script silhouette)
      ctx.fillStyle = '#182436';
      let cursorX = 432;
      const lineSeed = (i + 1) * (side === 'right' ? 17 : 29);
      while (cursorX > 92) {
        const wordWidth = 22 + ((cursorX * lineSeed) % 44);
        const drawW = Math.min(wordWidth, cursorX - 80);
        if (drawW > 10) {
          ctx.fillRect(cursorX - drawW, y - 3, drawW, 4.5);
          // Diacritical Tashkeel marks above and below
          ctx.fillStyle = '#087A59';
          ctx.fillRect(cursorX - drawW * 0.65, y - 10, 7, 2.2);
          ctx.fillStyle = '#B88924';
          ctx.fillRect(cursorX - drawW * 0.35, y + 5, 6, 2.2);
          ctx.fillStyle = '#182436';
        }
        cursorX -= drawW + 14;
      }

      // Golden Ayah Rosette Marker on alternating lines
      if (i % 3 === 1) {
        const markerX = 96 + ((i * 67) % 260);
        ctx.fillStyle = '#D9B64C';
        ctx.beginPath();
        ctx.arc(markerX, y - 1, 7.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#064B3A';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // 6. Outer Margin Illuminated Medallion (Hizb / Juz ornament)
    const marginX = side === 'left' ? 40 : 472;
    ctx.fillStyle = '#D9B64C';
    ctx.beginPath();
    ctx.arc(marginX, 384, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#087A59';
    ctx.beginPath();
    ctx.arc(marginX, 384, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates a soft circular radial glow sprite texture for ascending Noor particles.
 */
function createGoldenParticleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 250, 228, 1)');
    grad.addColorStop(0.32, 'rgba(232, 213, 138, 0.88)');
    grad.addColorStop(0.68, 'rgba(217, 182, 76, 0.28)');
    grad.addColorStop(1, 'rgba(217, 182, 76, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * High-luxury SVG & CSS architectural fallback when WebGL is unavailable.
 * Ensures zero blank space and identical spiritual & aesthetic dignity on all devices.
 */
const QuranRehalFallbackScene: React.FC<{ language: Language }> = ({ language }) => {
  return (
    <div
      data-testid="quran-rehal-fallback-scene"
      className="relative w-full h-full min-h-[340px] flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-[#061326] via-[#0A1B33] to-[#062620] border border-[#D9B64C]/35 p-6 shadow-2xl"
    >
      {/* Upward Sacred Noor Radial Glow from the Open Quran */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-[26%] top-0 mx-auto w-[85%] rounded-full blur-3xl opacity-75"
        style={{
          background:
            'radial-gradient(ellipse at 50% 78%, rgba(232,213,138,0.44) 0%, rgba(217,182,76,0.22) 38%, rgba(8,122,89,0.12) 65%, transparent 82%)',
        }}
      />

      {/* Illustrated Mihrab Arch, Ascending Noor Rays & Open Quran on Carved Wooden Rehal */}
      <svg
        viewBox="0 0 420 400"
        className="relative z-10 w-full max-w-[360px] h-auto drop-shadow-[0_20px_40px_rgba(217,182,76,0.25)]"
        role="img"
        aria-label={
          language === 'bn'
            ? 'রেহালে রাখা খোলা পবিত্র কুরআন থেকে ঊর্ধ্বমুখী নূরের জ্যোতি'
            : language === 'ar'
              ? 'المصحف الشريف مفتوح على الرحل يصعد منه النور'
              : 'Open Holy Quran on wooden Rehal radiating upward sacred light'
        }
      >
        <defs>
          <linearGradient id="noorUpwardBeam" x1="0.5" y1="1" x2="0.5" y2="0">
            <stop offset="0%" stopColor="#E8D58A" stopOpacity="0.68" />
            <stop offset="48%" stopColor="#D9B64C" stopOpacity="0.26" />
            <stop offset="100%" stopColor="#D9B64C" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="goldFrameGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E8D58A" />
            <stop offset="50%" stopColor="#D9B64C" />
            <stop offset="100%" stopColor="#9E7B23" />
          </linearGradient>
          <linearGradient id="ivoryPageGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FAF7F0" />
            <stop offset="48%" stopColor="#EAE0C8" />
            <stop offset="52%" stopColor="#EAE0C8" />
            <stop offset="100%" stopColor="#FAF7F0" />
          </linearGradient>
        </defs>

        {/* Outer Islamic Pointed Mihrab Arch */}
        <path
          d="M 66 352 L 66 172 Q 66 56 210 28 Q 354 56 354 172 L 354 352"
          fill="none"
          stroke="url(#goldFrameGrad)"
          strokeWidth="2.5"
          strokeOpacity="0.62"
        />
        <path
          d="M 84 352 L 84 178 Q 84 74 210 46 Q 336 74 336 178 L 336 352"
          fill="none"
          stroke="#087A59"
          strokeWidth="1.5"
          strokeOpacity="0.55"
        />

        {/* Sacred Noor Volumetric Beams Rising Strictly Upward from the Open Quran Pages */}
        <polygon points="145,255 92,42 328,42 275,255" fill="url(#noorUpwardBeam)" />
        <polygon points="172,255 138,24 282,24 248,255" fill="url(#noorUpwardBeam)" />

        {/* Subtle Ascending Golden Light Particles */}
        <circle cx="210" cy="182" r="3" fill="#FFF9E2" opacity="0.9" />
        <circle cx="176" cy="144" r="2.2" fill="#E8D58A" opacity="0.75" />
        <circle cx="244" cy="132" r="2.5" fill="#E8D58A" opacity="0.8" />
        <circle cx="195" cy="98" r="2" fill="#D9B64C" opacity="0.7" />
        <circle cx="228" cy="84" r="1.8" fill="#FFF9E2" opacity="0.65" />

        {/* Architectural Sanctuary Plinth (Emerald & Midnight Navy with Gold Trim) */}
        <ellipse cx="210" cy="346" rx="146" ry="20" fill="#064B3A" stroke="#D9B64C" strokeWidth="1.5" />
        <ellipse cx="210" cy="340" rx="122" ry="15" fill="#0A1B33" stroke="#E8D58A" strokeWidth="1" strokeOpacity="0.6" />

        {/* Carved Walnut Wooden Rehal (X-Frame Book Stand) */}
        <path
          d="M 126 336 L 274 244 L 286 254 L 138 344 Z"
          fill="#5C361B"
          stroke="#D9B64C"
          strokeWidth="1"
        />
        <path
          d="M 294 336 L 146 244 L 134 254 L 282 344 Z"
          fill="#472812"
          stroke="#D9B64C"
          strokeWidth="1"
        />
        {/* Central Brass Hinge Ornament */}
        <circle cx="210" cy="290" r="6" fill="#D9B64C" />

        {/* Open Holy Quran Gilded Leather Binding */}
        <path
          d="M 102 252 L 210 274 L 318 252 L 306 232 L 210 254 L 114 232 Z"
          fill="#064B3A"
          stroke="#D9B64C"
          strokeWidth="2"
        />

        {/* Open Illuminated Manuscript Pages (Left & Right) */}
        <path
          d="M 108 244 Q 158 232 210 254 L 210 198 Q 158 176 116 190 Z"
          fill="url(#ivoryPageGrad)"
          stroke="#D9B64C"
          strokeWidth="1.5"
        />
        <path
          d="M 312 244 Q 262 232 210 254 L 210 198 Q 262 176 304 190 Z"
          fill="url(#ivoryPageGrad)"
          stroke="#D9B64C"
          strokeWidth="1.5"
        />

        {/* Gold Silk Bookmark Tassel */}
        <path
          d="M 210 254 Q 214 286 226 308"
          fill="none"
          stroke="#D9B64C"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="226" cy="309" r="3.5" fill="#E8D58A" />
      </svg>
    </div>
  );
};

export const QuranRehalScene3D: React.FC<QuranRehalScene3DProps> = ({
  language = 'bn',
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect reduced motion preference
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReducedMotion = reducedMotionQuery.matches;
    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches;
    };
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);

    // Initialize WebGLRenderer with graceful fallback
    let renderer: THREE.WebGLRenderer;
    let isSoftwareGl = false;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      const gl = renderer.getContext();
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const rendererName = debugInfo
        ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '')
        : String(gl.getParameter(gl.RENDERER) || '');
      if (/SwiftShader|llvmpipe|Software|Mesa OffScreen/i.test(rendererName)) {
        isSoftwareGl = true;
      }
    } catch {
      setWebglSupported(false);
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
      return;
    }

    const initialWidth = Math.max(container.clientWidth, 300);
    const initialHeight = Math.max(container.clientHeight, 340);

    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(initialWidth, initialHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Clear container and mount canvas
    container.innerHTML = '';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    container.appendChild(renderer.domElement);

    // Create Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, initialWidth / initialHeight, 0.1, 100);
    camera.position.set(0, 2.35, 7.6);
    camera.lookAt(0, 0.42, 0);

    // Root Sanctuary Group
    const sanctuaryGroup = new THREE.Group();
    scene.add(sanctuaryGroup);

    // =========================================================================
    // 1. ISLAMIC ARCHITECTURAL SANCTUARY PLATFORM & MIHRAB ARCHWAY
    // =========================================================================
    const platformGroup = new THREE.Group();
    platformGroup.position.y = -1.25;
    sanctuaryGroup.add(platformGroup);

    const royalNavyMat = new THREE.MeshStandardMaterial({
      color: 0x061326,
      roughness: 0.34,
      metalness: 0.25,
    });

    const deepEmeraldMat = new THREE.MeshStandardMaterial({
      color: 0x064b3a,
      roughness: 0.28,
      metalness: 0.22,
    });

    const emeraldAccentMat = new THREE.MeshStandardMaterial({
      color: 0x087a59,
      roughness: 0.25,
      metalness: 0.28,
    });

    const champagneGoldMat = new THREE.MeshStandardMaterial({
      color: 0xd9b64c,
      roughness: 0.24,
      metalness: 0.86,
      emissive: 0x6b5214,
      emissiveIntensity: 0.24,
    });

    // Octagonal Lower Sanctuary Base (Midnight Navy #061326)
    const lowerBaseGeo = new THREE.CylinderGeometry(2.75, 2.98, 0.26, 8);
    const lowerBaseMesh = new THREE.Mesh(lowerBaseGeo, royalNavyMat);
    lowerBaseMesh.position.y = -0.18;
    platformGroup.add(lowerBaseMesh);

    // Octagonal Middle Emerald Tier (#064B3A)
    const middleBaseGeo = new THREE.CylinderGeometry(2.32, 2.52, 0.2, 8);
    const middleBaseMesh = new THREE.Mesh(middleBaseGeo, deepEmeraldMat);
    middleBaseMesh.position.y = 0.04;
    middleBaseMesh.rotation.y = Math.PI / 8;
    platformGroup.add(middleBaseMesh);

    // Upper Sanctuary Dais (#087A59)
    const upperDaisGeo = new THREE.CylinderGeometry(1.88, 2.02, 0.12, 16);
    const upperDaisMesh = new THREE.Mesh(upperDaisGeo, emeraldAccentMat);
    upperDaisMesh.position.y = 0.18;
    platformGroup.add(upperDaisMesh);

    // Inlaid Champagne Gold Geometric Rub el Hizb (8-pointed Islamic Star) on Platform
    const starSquareGeo = new THREE.BoxGeometry(2.42, 0.14, 2.42);
    const starSquareA = new THREE.Mesh(starSquareGeo, champagneGoldMat);
    starSquareA.position.y = 0.19;
    platformGroup.add(starSquareA);

    const starSquareB = new THREE.Mesh(starSquareGeo, champagneGoldMat);
    starSquareB.position.y = 0.19;
    starSquareB.rotation.y = Math.PI / 4;
    platformGroup.add(starSquareB);

    // Concentric Golden Rim Rings on Platform
    const outerGoldRingGeo = new THREE.TorusGeometry(2.38, 0.03, 16, 64);
    const outerGoldRing = new THREE.Mesh(outerGoldRingGeo, champagneGoldMat);
    outerGoldRing.rotation.x = Math.PI / 2;
    outerGoldRing.position.y = 0.15;
    platformGroup.add(outerGoldRing);

    const innerGoldRingGeo = new THREE.TorusGeometry(1.78, 0.024, 16, 64);
    const innerGoldRing = new THREE.Mesh(innerGoldRingGeo, champagneGoldMat);
    innerGoldRing.rotation.x = Math.PI / 2;
    innerGoldRing.position.y = 0.25;
    platformGroup.add(innerGoldRing);

    // Background Pointed Islamic Mihrab Archway Framing the Scene
    const mihrabGroup = new THREE.Group();
    mihrabGroup.position.set(0, 0.42, -1.55);
    sanctuaryGroup.add(mihrabGroup);

    // Twin Fluted Columns supporting the Mihrab Arch
    const pillarGeo = new THREE.CylinderGeometry(0.11, 0.13, 3.05, 16);
    const leftPillar = new THREE.Mesh(pillarGeo, deepEmeraldMat);
    leftPillar.position.set(-2.15, -0.22, 0);
    mihrabGroup.add(leftPillar);

    const rightPillar = new THREE.Mesh(pillarGeo, deepEmeraldMat);
    rightPillar.position.set(2.15, -0.22, 0);
    mihrabGroup.add(rightPillar);

    // Golden Column Capitals & Bases
    const capGeo = new THREE.CylinderGeometry(0.18, 0.13, 0.18, 8);
    const leftCap = new THREE.Mesh(capGeo, champagneGoldMat);
    leftCap.position.set(-2.15, 1.32, 0);
    mihrabGroup.add(leftCap);

    const rightCap = new THREE.Mesh(capGeo, champagneGoldMat);
    rightCap.position.set(2.15, 1.32, 0);
    mihrabGroup.add(rightCap);

    const leftBase = new THREE.Mesh(capGeo, champagneGoldMat);
    leftBase.position.set(-2.15, -1.65, 0);
    mihrabGroup.add(leftBase);

    const rightBase = new THREE.Mesh(capGeo, champagneGoldMat);
    rightBase.position.set(2.15, -1.65, 0);
    mihrabGroup.add(rightBase);

    // Outer & Inner Golden Mihrab Arch Rings
    const outerArchGeo = new THREE.TorusGeometry(2.15, 0.048, 16, 72, Math.PI);
    const outerArchMesh = new THREE.Mesh(outerArchGeo, champagneGoldMat);
    outerArchMesh.position.y = 1.32;
    mihrabGroup.add(outerArchMesh);

    const innerArchGeo = new THREE.TorusGeometry(1.92, 0.025, 16, 64, Math.PI);
    const innerArchMesh = new THREE.Mesh(innerArchGeo, champagneGoldMat);
    innerArchMesh.position.y = 1.32;
    mihrabGroup.add(innerArchMesh);

    // Crown Rosette Medallion at the Apex of the Mihrab Arch
    const crownRosetteGeo = new THREE.OctahedronGeometry(0.18, 0);
    const crownRosette = new THREE.Mesh(crownRosetteGeo, champagneGoldMat);
    crownRosette.position.set(0, 3.47, 0.05);
    mihrabGroup.add(crownRosette);

    // =========================================================================
    // 2. CARVED WOODEN REHAL & OPEN ILLUMINATED HOLY QURAN
    // =========================================================================
    const rehalQuranGroup = new THREE.Group();
    rehalQuranGroup.position.set(0, -0.56, 0.18);
    rehalQuranGroup.rotation.x = 0.22; // Tilt both Rehal and Quran together toward the viewer
    sanctuaryGroup.add(rehalQuranGroup);

    const walnutWoodMat = new THREE.MeshStandardMaterial({
      color: 0x4a2912,
      roughness: 0.42,
      metalness: 0.12,
    });

    const carvedWoodTrimMat = new THREE.MeshStandardMaterial({
      color: 0x693b1a,
      roughness: 0.36,
      metalness: 0.16,
    });

    // Rehal Crossed Planks (Traditional X-Frame Folding Stand)
    const rehalPlankGeo = new THREE.BoxGeometry(2.48, 0.08, 1.62);

    // Plank 1: rises from bottom-left to top-right (supports right cover of the Quran)
    const leftSlantPlank = new THREE.Mesh(rehalPlankGeo, walnutWoodMat);
    leftSlantPlank.rotation.z = 0.28;
    leftSlantPlank.position.set(0, -0.02, 0);
    rehalQuranGroup.add(leftSlantPlank);

    // Plank 2: rises from bottom-right to top-left (supports left cover of the Quran)
    const rightSlantPlank = new THREE.Mesh(rehalPlankGeo, walnutWoodMat);
    rightSlantPlank.rotation.z = -0.28;
    rightSlantPlank.position.set(0, -0.02, 0);
    rehalQuranGroup.add(rightSlantPlank);

    // Golden Inlay Borders along the Rehal Cradle Front Edges
    const rehalGoldEdgeGeo = new THREE.BoxGeometry(2.5, 0.028, 0.036);
    const frontLeftEdge = new THREE.Mesh(rehalGoldEdgeGeo, champagneGoldMat);
    frontLeftEdge.rotation.z = 0.28;
    frontLeftEdge.position.set(0, 0.02, 0.81);
    rehalQuranGroup.add(frontLeftEdge);

    const frontRightEdge = new THREE.Mesh(rehalGoldEdgeGeo, champagneGoldMat);
    frontRightEdge.rotation.z = -0.28;
    frontRightEdge.position.set(0, 0.02, 0.81);
    rehalQuranGroup.add(frontRightEdge);

    // Central Brass Axis Pin of the Rehal
    const hingePinGeo = new THREE.CylinderGeometry(0.058, 0.058, 1.68, 16);
    const hingePin = new THREE.Mesh(hingePinGeo, champagneGoldMat);
    hingePin.rotation.x = Math.PI / 2;
    hingePin.position.set(0, -0.02, 0);
    rehalQuranGroup.add(hingePin);

    // Carved Base Support Rails beneath Rehal legs
    const railGeo = new THREE.BoxGeometry(0.24, 0.12, 1.66);
    const leftRail = new THREE.Mesh(railGeo, carvedWoodTrimMat);
    leftRail.position.set(-1.12, -0.38, 0);
    rehalQuranGroup.add(leftRail);

    const rightRail = new THREE.Mesh(railGeo, carvedWoodTrimMat);
    rightRail.position.set(1.12, -0.38, 0);
    rehalQuranGroup.add(rightRail);

    // Open Holy Quran Group resting securely in the upper V-cradle of the Rehal
    const quranGroup = new THREE.Group();
    quranGroup.position.set(0, 0.16, 0);
    rehalQuranGroup.add(quranGroup);

    const quranLeatherCoverMat = new THREE.MeshStandardMaterial({
      color: 0x064b3a,
      roughness: 0.3,
      metalness: 0.38,
    });

    // Left & Right Outer Leather Covers with Gilded Trim
    const coverGeo = new THREE.BoxGeometry(1.34, 0.055, 1.7);
    const leftCover = new THREE.Mesh(coverGeo, quranLeatherCoverMat);
    leftCover.rotation.z = -0.27;
    leftCover.position.set(-0.65, 0.12, 0);
    quranGroup.add(leftCover);

    const rightCover = new THREE.Mesh(coverGeo, quranLeatherCoverMat);
    rightCover.rotation.z = 0.27;
    rightCover.position.set(0.65, 0.12, 0);
    quranGroup.add(rightCover);

    // Central Spine Binding
    const spineGeo = new THREE.CylinderGeometry(0.085, 0.085, 1.72, 16);
    const spineMesh = new THREE.Mesh(spineGeo, champagneGoldMat);
    spineMesh.rotation.x = Math.PI / 2;
    spineMesh.position.set(0, -0.02, 0);
    quranGroup.add(spineMesh);

    // Thick Gilded Page Block (Layered Cream/Gold Edges)
    const pageBlockMat = new THREE.MeshStandardMaterial({
      color: 0xf2e8c9,
      roughness: 0.35,
      metalness: 0.18,
      emissive: 0xd9b64c,
      emissiveIntensity: 0.14,
    });
    const pageBlockGeo = new THREE.BoxGeometry(1.24, 0.075, 1.58);

    const leftPageBlock = new THREE.Mesh(pageBlockGeo, pageBlockMat);
    leftPageBlock.rotation.z = -0.26;
    leftPageBlock.position.set(-0.61, 0.18, 0);
    quranGroup.add(leftPageBlock);

    const rightPageBlock = new THREE.Mesh(pageBlockGeo, pageBlockMat);
    rightPageBlock.rotation.z = 0.26;
    rightPageBlock.position.set(0.61, 0.18, 0);
    quranGroup.add(rightPageBlock);

    // Top Curved Illuminated Manuscript Pages with Procedural Tazhib & Calligraphy Texture
    const leftPageTexture = createQuranManuscriptPageTexture('left');
    const rightPageTexture = createQuranManuscriptPageTexture('right');

    const createCurvedPageGeometry = (side: 'left' | 'right'): THREE.PlaneGeometry => {
      const geo = new THREE.PlaneGeometry(1.26, 1.6, 24, 12);
      geo.rotateX(-Math.PI / 2);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i); // -0.63 .. +0.63
        // Normalize t from 0 at spine to 1 at outer page edge
        const t = side === 'left' ? (0.63 - x) / 1.26 : (x + 0.63) / 1.26;
        // Graceful manuscript arch curve sitting cleanly above the page block
        const archLift = Math.sin(t * Math.PI) * 0.085 + t * 0.33;
        pos.setY(i, archLift);
      }
      geo.computeVertexNormals();
      return geo;
    };

    const leftTopPageGeo = createCurvedPageGeometry('left');
    const rightTopPageGeo = createCurvedPageGeometry('right');

    const leftTopPageMat = new THREE.MeshStandardMaterial({
      map: leftPageTexture,
      roughness: 0.38,
      metalness: 0.08,
      emissive: 0xe8d58a,
      emissiveMap: leftPageTexture,
      emissiveIntensity: 0.42,
    });

    const rightTopPageMat = new THREE.MeshStandardMaterial({
      map: rightPageTexture,
      roughness: 0.38,
      metalness: 0.08,
      emissive: 0xe8d58a,
      emissiveMap: rightPageTexture,
      emissiveIntensity: 0.42,
    });

    const leftTopPageMesh = new THREE.Mesh(leftTopPageGeo, leftTopPageMat);
    leftTopPageMesh.position.set(-0.63, 0.14, 0);
    quranGroup.add(leftTopPageMesh);

    const rightTopPageMesh = new THREE.Mesh(rightTopPageGeo, rightTopPageMat);
    rightTopPageMesh.position.set(0.63, 0.14, 0);
    quranGroup.add(rightTopPageMesh);

    // Golden Silk Bookmark Ribbon Draping from the Spine
    const ribbonCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.08, 0.81),
      new THREE.Vector3(0.06, -0.14, 0.94),
      new THREE.Vector3(0.14, -0.46, 0.98),
    ]);
    const ribbonGeo = new THREE.TubeGeometry(ribbonCurve, 20, 0.018, 8, false);
    const ribbonMesh = new THREE.Mesh(ribbonGeo, champagneGoldMat);
    quranGroup.add(ribbonMesh);

    // =========================================================================
    // 3. SACRED NOOR ILLUMINATION ORIGINATING STRICTLY FROM THE OPEN QURAN PAGES
    // =========================================================================
    const noorOriginGroup = new THREE.Group();
    // Positioned right at the surface of the open Quran pages
    noorOriginGroup.position.set(0, 0.12, 0.22);
    sanctuaryGroup.add(noorOriginGroup);

    // Primary PointLight inside the Open Pages radiating warm Champagne Gold upward
    const quranPageNoorLight = new THREE.PointLight(0xf6df96, 4.4, 11, 1.5);
    quranPageNoorLight.position.set(0, 0.24, 0.12);
    noorOriginGroup.add(quranPageNoorLight);

    // Upward SpotLight casting sacred radiance from the Quran pages toward the upper Mihrab arch
    const upwardNoorSpot = new THREE.SpotLight(0xe8d58a, 3.6, 14, Math.PI / 3.2, 0.75, 1.2);
    upwardNoorSpot.position.set(0, 0.05, 0.1);
    const upwardTarget = new THREE.Object3D();
    upwardTarget.position.set(0, 5.5, -0.35);
    noorOriginGroup.add(upwardTarget);
    upwardNoorSpot.target = upwardTarget;
    noorOriginGroup.add(upwardNoorSpot);

    // Volumetric Translucent Light Cones Expanding Strictly Upward from the Open Pages
    const createUpwardLightBeam = (
      topRadius: number,
      bottomRadius: number,
      height: number,
      opacity: number,
      colorHex: number
    ) => {
      // Cylinder with larger topRadius and smaller bottomRadius so the beam expands as it rises upward
      const coneGeo = new THREE.CylinderGeometry(topRadius, bottomRadius, height, 32, 1, true);
      // Shift geometry so y=0 is at the bottom (the open Quran pages) and y=height is at the top
      coneGeo.translate(0, height / 2, 0);

      const coneMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      return new THREE.Mesh(coneGeo, coneMat);
    };

    const innerNoorCone = createUpwardLightBeam(1.52, 0.58, 3.65, 0.13, 0xfff3c4);
    const middleNoorCone = createUpwardLightBeam(2.25, 0.85, 4.05, 0.075, 0xe8d58a);
    const outerNoorCone = createUpwardLightBeam(2.95, 1.08, 4.35, 0.042, 0xd9b64c);

    noorOriginGroup.add(innerNoorCone);
    noorOriginGroup.add(middleNoorCone);
    noorOriginGroup.add(outerNoorCone);

    // Soft Glowing Halo Disc Hovering Directly on the Open Quran Pages
    const pageHaloTexture = createGoldenParticleTexture();
    const pageHaloMat = new THREE.SpriteMaterial({
      map: pageHaloTexture,
      color: 0xffe9a6,
      transparent: true,
      opacity: 0.52,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const pageHaloSprite = new THREE.Sprite(pageHaloMat);
    pageHaloSprite.scale.set(2.9, 1.55, 1);
    pageHaloSprite.position.set(0, 0.16, 0.15);
    noorOriginGroup.add(pageHaloSprite);

    // =========================================================================
    // 4. ASCENDING GOLDEN LIGHT PARTICLES (STRICTLY RISING UPWARD)
    // =========================================================================
    const particleCount = 78;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount);
    const phases = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const progress = Math.random(); // 0 at Quran pages -> 1 at upper arch
      const spreadRadius = 0.35 + progress * 1.45;
      const angle = Math.random() * Math.PI * 2;

      positions[i * 3] = Math.cos(angle) * spreadRadius * (0.4 + Math.random() * 0.6);
      positions[i * 3 + 1] = progress * 3.75; // Strictly above the Quran pages (y >= 0)
      positions[i * 3 + 2] = Math.sin(angle) * spreadRadius * 0.55;

      speeds[i] = 0.22 + Math.random() * 0.28;
      phases[i] = Math.random() * Math.PI * 2;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      map: pageHaloTexture,
      color: 0xf7e39c,
      size: 0.14,
      transparent: true,
      opacity: 0.78,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const ascendingParticles = new THREE.Points(particleGeometry, particleMaterial);
    noorOriginGroup.add(ascendingParticles);

    // =========================================================================
    // 5. AMBIENT & ARCHITECTURAL RIM LIGHTING
    // =========================================================================
    const ambientLight = new THREE.AmbientLight(0x102542, 1.55);
    scene.add(ambientLight);

    const emeraldRimLight = new THREE.DirectionalLight(0x087a59, 1.45);
    emeraldRimLight.position.set(-4.2, 3.2, -2.5);
    scene.add(emeraldRimLight);

    const warmGoldFillLight = new THREE.DirectionalLight(0xe8d58a, 1.25);
    warmGoldFillLight.position.set(3.8, 4.0, 3.2);
    scene.add(warmGoldFillLight);

    // =========================================================================
    // 6. INTERACTION, VISIBILITY PAUSE, RESIZE & ANIMATION LOOP
    // =========================================================================
    let targetPointerX = 0;
    let targetPointerY = 0;
    let currentPointerX = 0;
    let currentPointerY = 0;

    const handlePointerMove = (e: PointerEvent) => {
      if (prefersReducedMotion) return;
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      targetPointerX = THREE.MathUtils.clamp(normX, -1, 1);
      targetPointerY = THREE.MathUtils.clamp(normY, -1, 1);
    };

    const handlePointerLeave = () => {
      targetPointerX = 0;
      targetPointerY = 0;
    };

    container.addEventListener('pointermove', handlePointerMove, { passive: true });
    container.addEventListener('pointerleave', handlePointerLeave, { passive: true });

    let isVisibleInViewport = true;
    let isDocumentVisible = !document.hidden;

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisibleInViewport = entry.isIntersecting;
        });
      },
      { threshold: 0.05 }
    );
    intersectionObserver.observe(container);

    const handleVisibilityChange = () => {
      isDocumentVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handleResize = () => {
      if (!container) return;
      const w = Math.max(container.clientWidth, 280);
      const h = Math.max(container.clientHeight, 320);
      camera.aspect = w / h;
      // Adjust camera distance slightly on narrow mobile screens so the entire Rehal & Mihrab fit comfortably
      camera.position.z = w < 440 ? 8.35 : 7.6;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    handleResize();

    let animationFrameId: number | null = null;
    const startTimeMs = performance.now();

    const renderFrame = () => {
      const elapsed = (performance.now() - startTimeMs) * 0.001;

      if (!prefersReducedMotion) {
        // Smooth camera & sanctuary gentle floating and parallax response
        currentPointerX += (targetPointerX - currentPointerX) * 0.05;
        currentPointerY += (targetPointerY - currentPointerY) * 0.05;

        sanctuaryGroup.rotation.y =
          Math.sin(elapsed * 0.42) * 0.08 + currentPointerX * 0.16;
        sanctuaryGroup.rotation.x = currentPointerY * 0.06;

        // Subtle breathing motion of the Rehal & Quran
        rehalQuranGroup.position.y = -0.58 + Math.sin(elapsed * 1.15) * 0.025;

        // Sacred Noor gentle intensity pulse
        const noorPulse = 1 + Math.sin(elapsed * 1.8) * 0.09;
        quranPageNoorLight.intensity = 4.4 * noorPulse;
        innerNoorCone.scale.set(noorPulse, 1, noorPulse);
        middleNoorCone.scale.set(1 + Math.sin(elapsed * 1.3 + 1) * 0.06, 1, 1 + Math.sin(elapsed * 1.3 + 1) * 0.06);

        // Rotate crown rosette gently
        crownRosette.rotation.y = elapsed * 0.6;

        // Update ascending golden particles (strictly upward from y=0 to y=3.75)
        const posAttr = particleGeometry.getAttribute('position') as THREE.BufferAttribute;
        for (let i = 0; i < particleCount; i++) {
          let y = posAttr.getY(i) + speeds[i] * 0.016;
          if (y > 3.75) {
            y = 0.04; // Reset back to the open Quran pages
          }
          const progress = y / 3.75;
          const sway = Math.sin(elapsed * 1.2 + phases[i]) * 0.0035 * (1 + progress);
          const x = posAttr.getX(i) + sway;
          posAttr.setXYZ(i, x, y, posAttr.getZ(i));
        }
        posAttr.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    // Initial synchronous draw so screenshots or static views immediately show the full scene
    renderFrame();

    const animate = () => {
      if (isVisibleInViewport && isDocumentVisible) {
        renderFrame();
      }
      if (isSoftwareGl) {
        animationFrameId = window.setTimeout(() => {
          animationFrameId = requestAnimationFrame(animate);
        }, 120) as unknown as number;
      } else {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    if (!prefersReducedMotion) {
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        clearTimeout(animationFrameId);
      }
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerleave', handlePointerLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      intersectionObserver.disconnect();
      resizeObserver.disconnect();

      leftPageTexture.dispose();
      rightPageTexture.dispose();
      pageHaloTexture.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      data-testid="quran-rehal-scene-container"
      className={`relative w-full h-[350px] sm:h-[420px] lg:h-[520px] select-none overflow-hidden rounded-2xl border border-[#D9B64C]/35 bg-gradient-to-b from-[#061326] via-[#0A1B33] to-[#062922] shadow-[0_26px_64px_-18px_rgba(4,12,24,0.85)] ${className}`}
    >
      {/* Subtle Architectural Outer Gold Frame & Ambient Noor Glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 62%, rgba(232, 213, 138, 0.22) 0%, rgba(8, 122, 89, 0.14) 44%, rgba(6, 19, 38, 0) 76%)',
        }}
      />
      <div className="pointer-events-none absolute inset-2.5 rounded-xl border border-[#D9B64C]/20" />

      {webglSupported ? (
        <div
          ref={mountRef}
          data-testid="quran-rehal-webgl-canvas-mount"
          className="relative z-10 w-full h-full"
        />
      ) : (
        <QuranRehalFallbackScene language={language} />
      )}

      {/* Subtle Bottom Sanctuary Caption Strip */}
      <div className="pointer-events-none absolute inset-x-4 bottom-3.5 z-20 flex items-center justify-between border-t border-[#D9B64C]/25 pt-2.5 text-[11px] text-[#E8D58A]/90">
        <span className="font-ar tracking-wide text-xs sm:text-sm text-[#F7F4EC]">
          ﴿ نُورٌ عَلَىٰ نُورٍ ﴾
        </span>
        <span className="tracking-wider uppercase text-[10px] sm:text-[11px] text-[#E8D58A]/85">
          {language === 'bn'
            ? 'কুরআনের শাশ্বত নূর ও আদব'
            : language === 'ar'
              ? 'نور القرآن الكريم والأدب النبوي'
              : 'Sacred Illumination of the Holy Quran'}
        </span>
      </div>
    </div>
  );
};
