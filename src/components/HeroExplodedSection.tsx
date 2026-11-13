import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Layers,
  Monitor,
  MoveHorizontal,
  Play,
  RotateCcw,
} from 'lucide-react';
import {
  IPHONE_COMPONENTS,
  SCROLL_CHAPTERS,
  type ComponentSpec,
  type IPhonePartId,
} from '../data/componentsCatalog';
import { ExplodedIPhoneModel } from '../three/components/ExplodedIPhoneModel';
import { GroundContactShadow, StudioCanvas, StudioEnvironmentRig } from '../three/StudioLighting';
import { detectGpuCapabilities } from '../three/gpuCapabilities';

gsap.registerPlugin(ScrollTrigger);

interface HeroExplodedSectionProps {
  lowPower2DMode: boolean;
  onToggleLowPowerMode: () => void;
  onExploreDevice: () => void;
  onDiagnoseDevice: () => void;
}

interface HeroCameraRigProps {
  targetX: number;
  targetY: number;
  targetZ: number;
  lookAtY: number;
  reducedMotion: boolean;
  userInteractingRef: React.MutableRefObject<boolean>;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}

function HeroCameraRig({
  targetX,
  targetY,
  targetZ,
  lookAtY,
  reducedMotion,
  userInteractingRef,
  controlsRef,
}: HeroCameraRigProps) {
  const { camera } = useThree();
  const prevTargets = useRef({ x: targetX, y: targetY, z: targetZ });

  useFrame((_, rawDelta) => {
    if (
      Math.abs(prevTargets.current.y - targetY) > 0.08 ||
      Math.abs(prevTargets.current.z - targetZ) > 0.08 ||
      Math.abs(prevTargets.current.x - targetX) > 0.08
    ) {
      userInteractingRef.current = false;
      prevTargets.current = { x: targetX, y: targetY, z: targetZ };
    }

    if (userInteractingRef.current) return;

    const dt = Math.min(rawDelta, 0.05);
    const k = reducedMotion ? 24 : 5.5;
    const alpha = 1 - Math.exp(-k * dt);

    const curRho = Math.max(0.5, Math.hypot(camera.position.x, camera.position.z));
    const curTheta = Math.atan2(camera.position.x, camera.position.z);
    const tgtRho = Math.hypot(targetX, targetZ);
    const tgtTheta = Math.atan2(targetX, targetZ);

    let deltaTheta = tgtTheta - curTheta;
    while (deltaTheta > Math.PI) deltaTheta -= Math.PI * 2;
    while (deltaTheta < -Math.PI) deltaTheta += Math.PI * 2;
    // When flipping nearly 180 deg from front to back, consistently orbit past the +X side rail
    if (Math.abs(deltaTheta) > Math.PI * 0.92 && curTheta >= 0 && curTheta < Math.PI * 0.45) {
      if (deltaTheta < 0) deltaTheta += Math.PI * 2;
    }

    const nextTheta = curTheta + alpha * deltaTheta;
    const nextRho = THREE.MathUtils.damp(curRho, tgtRho, k, dt);
    const nextY = THREE.MathUtils.damp(camera.position.y, targetY, k, dt);

    camera.position.set(
      Math.sin(nextTheta) * nextRho,
      nextY,
      Math.cos(nextTheta) * nextRho
    );

    if (controlsRef.current) {
      controlsRef.current.target.y = THREE.MathUtils.damp(
        controlsRef.current.target.y,
        lookAtY,
        k,
        dt
      );
      controlsRef.current.update();
    } else {
      camera.lookAt(0, lookAtY, 0);
    }
  });

  return null;
}

function TouchSafeOrbitControls({
  controlsRef,
  isDesktop,
  isSoftwareGl,
  onStart,
}: {
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  isDesktop: boolean;
  isSoftwareGl: boolean;
  onStart: () => void;
}) {
  const { gl } = useThree();

  useEffect(() => {
    const dom = gl.domElement;
    // Enforce pan-y on mobile/tablet so vertical page scrolling is never trapped
    dom.style.touchAction = isDesktop ? 'none' : 'pan-y';
  }, [gl, isDesktop]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableZoom={true}
      enableDamping={!isSoftwareGl}
      dampingFactor={0.07}
      rotateSpeed={isDesktop ? 0.85 : 0.72}
      minDistance={3.8}
      maxDistance={12.5}
      minAzimuthAngle={-Infinity}
      maxAzimuthAngle={Infinity}
      minPolarAngle={Math.PI * 0.15}
      maxPolarAngle={Math.PI * 0.85}
      touches={{
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_ROTATE,
      }}
      onStart={onStart}
    />
  );
}

const _calloutWorldVec = new THREE.Vector3();

function HeroCalloutProjector({
  phoneGroupRef,
  calloutRefs,
  explosionFactor,
  enabled,
}: {
  phoneGroupRef: React.RefObject<THREE.Group | null>;
  calloutRefs: React.MutableRefObject<Partial<Record<IPhonePartId, HTMLButtonElement | null>>>;
  explosionFactor: number;
  enabled: boolean;
}) {
  const { camera, size } = useThree();

  useFrame(() => {
    if (!enabled) return;
    const grp = phoneGroupRef.current;
    if (!grp) return;
    grp.updateWorldMatrix(true, false);

    for (let i = 0; i < IPHONE_COMPONENTS.length; i++) {
      const comp = IPHONE_COMPONENTS[i];
      const btn = calloutRefs.current[comp.id];
      if (!btn) continue;

      const xOffset = comp.side === 'right' ? 1.24 : -1.24;
      const yPos = comp.explodedY * explosionFactor;
      _calloutWorldVec.set(xOffset, yPos, 0.08).applyMatrix4(grp.matrixWorld);
      _calloutWorldVec.project(camera);

      if (_calloutWorldVec.z > 1 || _calloutWorldVec.y < -0.94 || _calloutWorldVec.y > 0.94) {
        btn.style.opacity = '0';
        btn.style.pointerEvents = 'none';
        continue;
      }

      const px = (_calloutWorldVec.x * 0.5 + 0.5) * size.width;
      const py = (-_calloutWorldVec.y * 0.5 + 0.5) * size.height;
      btn.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0) translate(-50%, -50%)`;
      btn.style.opacity = '1';
      btn.style.pointerEvents = 'auto';
    }
  });

  return null;
}

function CinematicHeroPhoneGroup({
  groupRef,
  dropOffsetY,
  impactTiltX,
  impactTiltZ,
  floatingActive,
  reducedMotion,
  isDesktop,
  children,
}: {
  groupRef: React.RefObject<THREE.Group | null>;
  dropOffsetY: number;
  impactTiltX: number;
  impactTiltZ: number;
  floatingActive: boolean;
  reducedMotion: boolean;
  isDesktop: boolean;
  children: React.ReactNode;
}) {
  useFrame(({ clock }, rawDelta) => {
    const grp = groupRef.current;
    if (!grp) return;
    const dt = Math.min(rawDelta, 0.05);
    const t = clock.getElapsedTime();

    const baseX = isDesktop ? -0.2 : 0;
    const floatY = floatingActive && !reducedMotion ? Math.sin(t * 1.15) * 0.06 : 0;
    const floatRotY = floatingActive && !reducedMotion ? Math.sin(t * 0.55) * 0.06 : 0;

    if (dropOffsetY > 0.005 || Math.abs(impactTiltX) > 0.001) {
      grp.position.set(baseX, dropOffsetY + floatY, 0);
      grp.rotation.set(impactTiltX, floatRotY, impactTiltZ);
    } else {
      grp.position.x = THREE.MathUtils.damp(grp.position.x, baseX, 10, dt);
      grp.position.y = THREE.MathUtils.damp(grp.position.y, floatY, 10, dt);
      grp.rotation.x = THREE.MathUtils.damp(grp.rotation.x, 0, 10, dt);
      grp.rotation.y = THREE.MathUtils.damp(grp.rotation.y, floatRotY, 10, dt);
      grp.rotation.z = THREE.MathUtils.damp(grp.rotation.z, 0, 10, dt);
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

export function HeroExplodedSection({
  lowPower2DMode,
  onToggleLowPowerMode,
  onExploreDevice,
  onDiagnoseDevice,
}: HeroExplodedSectionProps) {
  const triggerTargetRef = useRef<HTMLDivElement>(null);
  const phoneGroupRef = useRef<THREE.Group>(null);
  const calloutRefs = useRef<Partial<Record<IPhonePartId, HTMLButtonElement | null>>>({});
  const userInteractingRef = useRef(false);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const caps = useMemo(() => detectGpuCapabilities(), []);

  const [isDesktop, setIsDesktop] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const [scrollProgress, setScrollProgress] = useState(0);
  const [manualExplode, setManualExplode] = useState<boolean | null>(null);
  const [selectedPartId, setSelectedPartId] = useState<IPhonePartId | null>(null);
  const [hoveredPartId, setHoveredPartId] = useState<IPhonePartId | null>(null);
  const [showCallouts, setShowCallouts] = useState(true);
  const [viewProfile, setViewProfile] = useState<'front' | 'side' | 'back'>('front');
  const [resetTick, setResetTick] = useState(0);
  const [introPlayCount, setIntroPlayCount] = useState(0);
  const [introTime, setIntroTime] = useState<number>(() =>
    caps.prefersReducedMotion || lowPower2DMode ? 3.5 : 0
  );

  // Track responsive breakpoint cleanly
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // 5-Scene Opening Cinematic Sequence (Drop -> Impact Crack -> Auto Separation -> Floating Exploded View)
  useEffect(() => {
    if (caps.prefersReducedMotion || lowPower2DMode) {
      setIntroTime(3.5);
      return;
    }

    let rafId = 0;
    const startTs = performance.now();
    const DURATION_SEC = 3.1;

    const tick = (now: number) => {
      const elapsed = (now - startTs) / 1000;
      if (elapsed >= DURATION_SEC) {
        setIntroTime(DURATION_SEC);
        return;
      }
      setIntroTime(elapsed);
      rafId = requestAnimationFrame(tick);
    };

    setIntroTime(0);
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [caps.prefersReducedMotion, lowPower2DMode, introPlayCount]);

  // ScrollTrigger scrubs scrollProgress cleanly while CSS position:sticky handles pinning without DOM reparenting
  useEffect(() => {
    if (caps.prefersReducedMotion || lowPower2DMode) return;
    const triggerEl = triggerTargetRef.current;
    if (!triggerEl) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: triggerEl,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.55,
        onUpdate: (self) => {
          setScrollProgress(self.progress);
        },
      });
    }, triggerTargetRef);

    return () => {
      ctx.revert();
    };
  }, [caps.prefersReducedMotion, lowPower2DMode]);

  // Scene timeline computation:
  // Scene 1 (0.00 - 0.85s): Gravity Drop
  // Scene 2 (0.85 - 1.55s): Impact recoil + Ceramic Shield Crack formation
  // Scene 3-4 (1.55 - 3.00s): Auto separation into Floating Exploded Architecture
  const dropState = useMemo(() => {
    if (introTime < 0.85) {
      const p = THREE.MathUtils.clamp(introTime / 0.85, 0, 1);
      // Gravity acceleration curve (easeInQuad) + tiny impact anticipation at top
      const y = 4.2 * (1 - p * p);
      return {
        offsetY: y,
        tiltX: 0.14 * (1 - p),
        tiltZ: -0.08 * (1 - p),
        crackIntensity: 0,
        phaseLabel: 'Drop Impact Kinematics',
      };
    }
    if (introTime < 1.55) {
      const p = THREE.MathUtils.clamp((introTime - 0.85) / 0.7, 0, 1);
      // Damped impact bounce right after striking virtual datum
      const bounce = Math.abs(Math.sin(p * Math.PI * 1.5)) * Math.exp(-p * 4.5) * 0.22;
      const crack = THREE.MathUtils.smoothstep(p, 0.02, 0.45);
      return {
        offsetY: bounce,
        tiltX: Math.sin(p * Math.PI * 2) * (1 - p) * 0.06,
        tiltZ: Math.cos(p * Math.PI * 2) * (1 - p) * 0.05,
        crackIntensity: crack,
        phaseLabel: 'Ceramic Shield Fracture',
      };
    }
    // Fade crack cleanly as user views internal clean architecture or keep subtle until assembled toggle
    const fadeCrack =
      scrollProgress > 0.3
        ? 0.2
        : 0.85 - THREE.MathUtils.smoothstep(introTime, 1.85, 3.1) * 0.45;
    return {
      offsetY: 0,
      tiltX: 0,
      tiltZ: 0,
      crackIntensity: fadeCrack,
      phaseLabel: 'Exploded Internal Architecture',
    };
  }, [introTime, scrollProgress]);

  const introSeparation = useMemo(() => {
    if (introTime < 1.55) return 0;
    const p = THREE.MathUtils.clamp((introTime - 1.55) / 1.35, 0, 1);
    // Smoothstep ease out into 74% floating exploded stack
    const smooth = p * p * (3 - 2 * p);
    return smooth * 0.74;
  }, [introTime]);

  // Smooth explosion factor combines Scene 3–4 intro separation + scroll progression + user toggles
  const explosionFactor = useMemo(() => {
    if (selectedPartId) return 1.0;
    if (manualExplode === false) return 0;
    if (manualExplode === true) return Math.max(0.92, scrollProgress);
    if (introTime < 1.55) return 0;
    return THREE.MathUtils.clamp(Math.max(introSeparation, scrollProgress * 1.35), 0, 1);
  }, [scrollProgress, selectedPartId, manualExplode, introTime, introSeparation]);

  const activeChapter = useMemo(() => {
    return (
      SCROLL_CHAPTERS.find(
        (ch) => scrollProgress >= ch.range[0] && scrollProgress <= ch.range[1]
      ) ?? SCROLL_CHAPTERS[0]
    );
  }, [scrollProgress]);

  // Mobile single-component index derived from scroll or manual stepper
  const activeMobilePartIndex = useMemo(() => {
    if (selectedPartId) {
      const idx = IPHONE_COMPONENTS.findIndex((c) => c.id === selectedPartId);
      if (idx >= 0) return idx;
    }
    if (explosionFactor < 0.08) return 4; // Display default
    return Math.min(
      IPHONE_COMPONENTS.length - 1,
      Math.floor(Math.max(scrollProgress, 0.3) * (IPHONE_COMPONENTS.length - 0.01))
    );
  }, [selectedPartId, scrollProgress, explosionFactor]);

  const activePartSpec: ComponentSpec | null = useMemo(() => {
    const id = selectedPartId ?? hoveredPartId;
    if (id) return IPHONE_COMPONENTS.find((c) => c.id === id) ?? null;
    if (!isDesktop && explosionFactor > 0.08) {
      return IPHONE_COMPONENTS[activeMobilePartIndex] ?? null;
    }
    return null;
  }, [selectedPartId, hoveredPartId, isDesktop, explosionFactor, activeMobilePartIndex]);

  const cameraTarget = useMemo(() => {
    if (selectedPartId) {
      const comp = IPHONE_COMPONENTS.find((c) => c.id === selectedPartId);
      if (comp) {
        return {
          x: isDesktop ? 0.35 : 0,
          y: comp.explodedY * explosionFactor + 0.1,
          z: isDesktop ? 5.2 : 6.0,
          lookAtY: comp.explodedY * explosionFactor,
        };
      }
    }

    if (explosionFactor < 0.08) {
      // Assembled 360° inspection profiles (Front OLED, Titanium Side Rail, Rear Camera Plateau)
      if (viewProfile === 'back') {
        return {
          x: isDesktop ? -1.45 : -1.1,
          y: 0.2,
          z: isDesktop ? -5.8 : -6.2,
          lookAtY: 0,
        };
      }
      if (viewProfile === 'side') {
        return {
          x: isDesktop ? 5.65 : 5.95,
          y: 0.15,
          z: 0.85,
          lookAtY: 0,
        };
      }
      // Subtle impact impulse zoom right when cracking in Scene 2
      const impactZOffset = introTime >= 0.85 && introTime < 1.55 ? -0.35 : 0;
      return {
        x: isDesktop ? 1.35 : 0.95,
        y: 0.25,
        z: (isDesktop ? 5.8 : 6.3) + impactZOffset,
        lookAtY: 0,
      };
    }

    return {
      x: isDesktop ? 0.45 : 0,
      y: activeChapter.cameraY * explosionFactor + 0.12,
      z: isDesktop
        ? THREE.MathUtils.lerp(6.4, activeChapter.cameraZ + 0.65, explosionFactor)
        : THREE.MathUtils.lerp(6.5, 8.9, explosionFactor),
      lookAtY: activeChapter.cameraY * explosionFactor * 0.85,
    };
  }, [selectedPartId, explosionFactor, activeChapter, isDesktop, viewProfile, introTime]);

  const highlightedIds = useMemo(() => {
    if (selectedPartId) return [selectedPartId];
    if (hoveredPartId) return [hoveredPartId];
    if (explosionFactor < 0.08) return [];
    if (!isDesktop) {
      const comp = IPHONE_COMPONENTS[activeMobilePartIndex];
      return comp ? [comp.id] : [];
    }
    return activeChapter.highlightedIds;
  }, [selectedPartId, hoveredPartId, explosionFactor, isDesktop, activeMobilePartIndex, activeChapter]);

  const jumpToChapter = (chapterIndex: number) => {
    const ch = SCROLL_CHAPTERS[chapterIndex];
    if (!ch) return;
    const mid = Math.max(0.22, (ch.range[0] + ch.range[1]) * 0.5);
    setSelectedPartId(null);
    setManualExplode(true);
    setScrollProgress(mid);

    if (triggerTargetRef.current && !caps.prefersReducedMotion && !lowPower2DMode) {
      const rect = triggerTargetRef.current.getBoundingClientRect();
      const docTop = window.scrollY + rect.top;
      const scrollable = triggerTargetRef.current.offsetHeight - window.innerHeight;
      if (scrollable > 0) {
        window.scrollTo({
          top: docTop + scrollable * mid,
          behavior: 'smooth',
        });
      }
    }
  };

  const stepMobileComponent = (delta: -1 | 1) => {
    const nextIdx = THREE.MathUtils.clamp(
      activeMobilePartIndex + delta,
      0,
      IPHONE_COMPONENTS.length - 1
    );
    setManualExplode(true);
    setSelectedPartId(IPHONE_COMPONENTS[nextIdx].id);
  };

  const scrollDurationHeight =
    caps.prefersReducedMotion || lowPower2DMode
      ? 'min-h-screen'
      : isDesktop
      ? 'h-[310vh]'
      : 'h-[230vh]';

  return (
    <section
      id="hero-explorer"
      ref={triggerTargetRef}
      className={`relative w-full bg-[#090B0F] pt-16 ${scrollDurationHeight}`}
    >
      <div className="sticky top-16 min-h-[calc(100vh-4rem)] flex w-full flex-col justify-between bg-engineering-grid">
        {/* Main Hero Content Grid */}
        <div className="relative z-20 mx-auto w-full max-w-7xl flex-1 px-4 pt-2.5 pb-2 sm:px-6 lg:grid lg:grid-cols-12 lg:items-center lg:gap-6 lg:px-8 lg:py-0">
          {/* MOBILE HEADER COPY (shown above 3D iPhone on < lg) */}
          <div className="space-y-1.5 text-center lg:hidden">
            <div className="flex items-center justify-center gap-2 text-[11px] font-medium text-slate-400">
              <span>AppleFix Service Centre</span>
              <span aria-hidden="true">·</span>
              <span>iPhone 18 Pro · Bangalore</span>
            </div>
            <h1 className="font-display text-[1.45rem] font-extrabold leading-[1.1] tracking-tight text-white sm:text-3xl">
              KNOW YOUR DEVICE BEFORE YOU REPAIR.
            </h1>
            <p className="mx-auto max-w-md text-xs leading-snug text-slate-300 sm:text-sm">
              Understand every component. Know what can go wrong. See how your device is repaired.
            </p>
          </div>

          {/* DESKTOP LEFT EDITORIAL COLUMN (hidden < lg) */}
          <div className="hidden lg:col-span-5 lg:block space-y-5 py-8">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-400">
              <span>AppleFix Service Centre</span>
              <span aria-hidden="true">·</span>
              <span>Bangalore</span>
              <span aria-hidden="true">·</span>
              <span className="text-blue-400">iPhone 18 Pro · {dropState.phaseLabel}</span>
            </div>

            <h1 className="font-display text-4xl font-bold tracking-tight text-white xl:text-5xl leading-[1.08]">
              KNOW YOUR DEVICE BEFORE YOU REPAIR.
            </h1>

            <p className="max-w-lg text-base leading-relaxed text-slate-300">
              Understand every component. Know what can go wrong. See how your device is repaired.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  jumpToChapter(1);
                  onExploreDevice();
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 whitespace-nowrap"
              >
                <span>EXPLORE YOUR DEVICE</span>
                <ArrowDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onDiagnoseDevice}
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-[#121620] px-5 py-2.5 text-sm font-semibold text-slate-100 transition-colors hover:border-blue-400/50 hover:bg-[#171c28] whitespace-nowrap"
              >
                SELECT YOUR REPAIR
              </button>
            </div>

            {/* Desktop Chapter / Component Telemetry Card */}
            <div className="mt-4 rounded-xl border border-white/10 bg-[#0E121A]/95 p-4 shadow-xl">
              <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                <span className="font-medium text-blue-400">
                  {activePartSpec
                    ? `Component ${String(activePartSpec.order).padStart(2, '0')} · ${activePartSpec.subsystem}`
                    : explosionFactor < 0.08
                    ? 'iPhone 18 Pro · 360° Impact & Exterior Inspection'
                    : activeChapter.eyebrow}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPartId(null);
                      setManualExplode(null);
                      setScrollProgress(0);
                      setViewProfile('front');
                      userInteractingRef.current = false;
                      setIntroPlayCount((c) => c + 1);
                      setResetTick((t) => t + 1);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-300 hover:text-white"
                  >
                    <Play className="h-3 w-3" />
                    <span>Replay Intro</span>
                  </button>
                  {(selectedPartId || manualExplode !== null) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPartId(null);
                        setManualExplode((prev) => (prev === false ? null : false));
                      }}
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate-300 hover:text-white"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>{manualExplode === false ? 'Auto Explode' : 'Assembled View'}</span>
                    </button>
                  )}
                </div>
              </div>

              <h2 className="mt-1.5 font-display text-lg font-semibold text-white">
                {activePartSpec
                  ? activePartSpec.name
                  : explosionFactor < 0.08
                  ? 'Natural Titanium iPhone 18 Pro'
                  : activeChapter.title}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
                {activePartSpec
                  ? activePartSpec.role
                  : explosionFactor < 0.08
                  ? 'Drag horizontally to rotate 360° and inspect the cracked Ceramic Shield OLED, Grade-5 Titanium buttons, USB-C receptacle, and Pro triple camera bar.'
                  : activeChapter.description}
              </p>
              {activePartSpec && (
                <p className="mt-2 border-t border-white/10 pt-2 text-xs text-slate-400">
                  <strong className="font-semibold text-slate-200">Technician Check: </strong>
                  {activePartSpec.inspectionNote}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-white/10 pt-3">
                {SCROLL_CHAPTERS.map((ch, idx) => {
                  const isActive = !selectedPartId && activeChapter.id === ch.id && explosionFactor >= 0.08;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => jumpToChapter(idx)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                      }`}
                    >
                      0{idx + 1}. {ch.eyebrow.split(' ')[0]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3D VIEWPORT (Centered on Mobile, Right Column on Desktop) */}
          <div className="relative mt-2 w-full lg:mt-0 lg:col-span-7">
            <div className="relative h-[44vh] min-h-[290px] max-h-[460px] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#090B0F] sm:h-[47vh] sm:min-h-[330px] lg:h-[calc(100vh-8.5rem)] lg:max-h-none lg:border-0 lg:bg-transparent">
              {!lowPower2DMode && caps.webglAvailable ? (
                <StudioCanvas
                  className="h-full w-full"
                  cameraPosition={isDesktop ? [1.35, 0.25, 5.8] : [1.05, 0.25, 6.1]}
                  fov={isDesktop ? 38 : 40}
                  allowVerticalPageScroll={!isDesktop}
                >
                  <StudioEnvironmentRig backgroundColor="#090b0f" fogDensity={0.016} rimIntensity={1.85} />
                  <HeroCameraRig
                    key={resetTick}
                    targetX={cameraTarget.x}
                    targetY={cameraTarget.y}
                    targetZ={cameraTarget.z}
                    lookAtY={cameraTarget.lookAtY}
                    reducedMotion={caps.prefersReducedMotion}
                    userInteractingRef={userInteractingRef}
                    controlsRef={controlsRef}
                  />
                  <TouchSafeOrbitControls
                    controlsRef={controlsRef}
                    isDesktop={isDesktop}
                    isSoftwareGl={caps.isSoftwareGl}
                    onStart={() => {
                      userInteractingRef.current = true;
                    }}
                  />

                  <CinematicHeroPhoneGroup
                    groupRef={phoneGroupRef}
                    dropOffsetY={dropState.offsetY}
                    impactTiltX={dropState.tiltX}
                    impactTiltZ={dropState.tiltZ}
                    floatingActive={introTime >= 1.65 && !userInteractingRef.current}
                    reducedMotion={caps.prefersReducedMotion}
                    isDesktop={isDesktop}
                  >
                    <ExplodedIPhoneModel
                      mode="exploded_stack"
                      explosionFactor={explosionFactor}
                      highlightedIds={highlightedIds}
                      selectedPartId={selectedPartId}
                      onSelectPart={(id) =>
                        setSelectedPartId((prev) => (prev === id ? null : id))
                      }
                      onHoverPart={setHoveredPartId}
                      visualVariant="iphone-18-pro"
                      crackIntensity={dropState.crackIntensity}
                      reducedMotion={caps.prefersReducedMotion}
                    />

                    <HeroCalloutProjector
                      phoneGroupRef={phoneGroupRef}
                      calloutRefs={calloutRefs}
                      explosionFactor={explosionFactor}
                      enabled={isDesktop && showCallouts && explosionFactor > 0.35}
                    />
                  </CinematicHeroPhoneGroup>

                  <GroundContactShadow
                    y={explosionFactor > 0.25 ? -4.25 : -2.1}
                    scale={explosionFactor > 0.25 ? 6.0 : 4.2}
                    opacity={0.46}
                  />
                </StudioCanvas>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#0D1017] p-4">
                  <div className="relative flex h-full w-full max-w-md items-center justify-center overflow-hidden rounded-xl bg-[#090B0F] p-2">
                    <img
                      src="/assets/aistudio/ChatGPT_Image_Nov_13__2026__06_44_42_PM_9c559ec2.png"
                      alt="Exploded internal component diagram of titanium iPhone"
                      referrerPolicy="no-referrer"
                      className="max-h-full w-auto object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Desktop-only projected 2D component callout overlay (no nested createRoot portals) */}
              {!lowPower2DMode &&
                caps.webglAvailable &&
                isDesktop &&
                showCallouts &&
                explosionFactor > 0.35 && (
                  <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
                    {IPHONE_COMPONENTS.map((comp) => {
                      const isFocused = highlightedIds.includes(comp.id);
                      return (
                        <button
                          key={comp.id}
                          ref={(el) => {
                            calloutRefs.current[comp.id] = el;
                          }}
                          type="button"
                          onClick={() =>
                            setSelectedPartId((prev) => (prev === comp.id ? null : comp.id))
                          }
                          style={{ opacity: 0, pointerEvents: 'none', left: 0, top: 0 }}
                          className={`absolute flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${
                            comp.side === 'left' ? 'flex-row-reverse' : 'flex-row'
                          } ${
                            isFocused
                              ? 'border-blue-400 bg-blue-600/95 text-white shadow-lg'
                              : 'border-white/15 bg-[#0E121A]/90 text-slate-300 hover:border-blue-400/60 hover:text-white'
                          }`}
                        >
                          <span
                            className={`h-px w-4 ${
                              isFocused ? 'bg-blue-200' : 'bg-slate-500'
                            }`}
                          />
                          <span>{comp.shortLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

              {/* 360° Exterior Angle Quick Selector (Front / Side / Back) */}
              {!lowPower2DMode && caps.webglAvailable && (
                <div
                  role="group"
                  aria-label="360 degree exterior view profile"
                  className="absolute top-2.5 left-2.5 z-30 inline-flex items-center gap-0.5 rounded-lg border border-white/10 bg-[#0E121A]/95 p-0.5 lg:top-auto lg:bottom-3 lg:left-3"
                >
                  {(['front', 'side', 'back'] as const).map((profile) => {
                    const active = explosionFactor < 0.08 && viewProfile === profile;
                    return (
                      <button
                        key={profile}
                        type="button"
                        onClick={() => {
                          setManualExplode(false);
                          setSelectedPartId(null);
                          setScrollProgress(0);
                          userInteractingRef.current = false;
                          setViewProfile(profile);
                          setResetTick((t) => t + 1);
                        }}
                        className={`rounded px-2 py-1 text-[11px] font-medium capitalize transition-colors whitespace-nowrap lg:text-xs ${
                          active
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {profile}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Top-Right Compact Mode Switch on Mobile + Bottom-Right on Desktop */}
              <div className="absolute top-2.5 right-2.5 z-30 flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#0E121A]/95 px-2 py-1 lg:top-auto lg:bottom-3 lg:right-3 lg:px-2.5 lg:py-1.5">
                {isDesktop && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowCallouts((v) => !v)}
                      className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white"
                    >
                      <Layers className="h-3.5 w-3.5 text-blue-400" />
                      <span>{showCallouts ? 'Hide Labels' : 'Show Labels'}</span>
                    </button>
                    <span className="h-3.5 w-px bg-white/10" aria-hidden="true" />
                  </>
                )}
                <button
                  type="button"
                  onClick={() =>
                    setManualExplode((v) =>
                      v === null ? !(explosionFactor > 0.2) : !v
                    )
                  }
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-blue-300 hover:bg-white/10 hover:text-white lg:text-xs"
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>{explosionFactor > 0.2 ? 'Assemble' : 'Explode'}</span>
                </button>
                <span className="h-3.5 w-px bg-white/10" aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPartId(null);
                    setManualExplode(null);
                    setScrollProgress(0);
                    setViewProfile('front');
                    userInteractingRef.current = false;
                    setIntroPlayCount((c) => c + 1);
                    setResetTick((t) => t + 1);
                  }}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-slate-300 hover:bg-white/10 hover:text-white lg:text-xs"
                  aria-label="Replay intro animation and reset camera"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Replay</span>
                </button>
                <span className="h-3.5 w-px bg-white/10" aria-hidden="true" />
                <button
                  type="button"
                  onClick={onToggleLowPowerMode}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-slate-300 hover:bg-white/10 hover:text-white lg:text-xs"
                >
                  <Monitor className="h-3.5 w-3.5 text-blue-400" />
                  <span>{lowPower2DMode ? '3D' : '2D'}</span>
                </button>
              </div>
            </div>

            {/* MOBILE INTERACTION HINT + COMPACT SINGLE-COMPONENT PANEL + CTAs (shown < lg) */}
            <div className="mt-2.5 space-y-2.5 lg:hidden">
              {/* Subtle 360° Rotation Hint */}
              <div className="flex items-center justify-center gap-2 text-[11px] font-semibold tracking-wider text-slate-400">
                <MoveHorizontal className="h-3.5 w-3.5 text-blue-400" />
                <span>DRAG TO EXPLORE 360°</span>
              </div>

              {/* Compact Single-Component Info Panel (prevents overlapping labels on mobile) */}
              <div className="rounded-xl border border-white/10 bg-[#0E121A]/95 px-3.5 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-blue-400 truncate">
                      {explosionFactor < 0.08 && !selectedPartId
                        ? `iPhone 18 Pro · ${dropState.phaseLabel}`
                        : `Layer ${String(
                            (activePartSpec ?? IPHONE_COMPONENTS[activeMobilePartIndex]).order
                          ).padStart(2, '0')} / 15 · ${
                            (activePartSpec ?? IPHONE_COMPONENTS[activeMobilePartIndex]).subsystem
                          }`}
                    </p>
                    <p className="font-display text-sm font-semibold text-white truncate">
                      {explosionFactor < 0.08 && !selectedPartId
                        ? 'Titanium Enclosure & Ceramic Shield OLED'
                        : (activePartSpec ?? IPHONE_COMPONENTS[activeMobilePartIndex]).name}
                    </p>
                  </div>

                  {/* Single-component Prev / Next stepper */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      aria-label="Previous component"
                      onClick={() => stepMobileComponent(-1)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[#151A26] text-slate-200 hover:border-blue-400/50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Next component"
                      onClick={() => stepMobileComponent(1)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[#151A26] text-slate-200 hover:border-blue-400/50"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Mobile CTA Buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setManualExplode(true);
                    onExploreDevice();
                  }}
                  className="inline-flex items-center justify-center gap-1 rounded-lg bg-blue-600 px-2 py-2.5 text-[11px] font-semibold text-white hover:bg-blue-500 sm:text-xs sm:px-3 whitespace-nowrap"
                >
                  <span>EXPLORE YOUR DEVICE</span>
                </button>
                <button
                  type="button"
                  onClick={onDiagnoseDevice}
                  className="inline-flex items-center justify-center rounded-lg border border-white/15 bg-[#121620] px-2 py-2.5 text-[11px] font-semibold text-slate-100 hover:border-blue-400/50 sm:text-xs sm:px-3 whitespace-nowrap"
                >
                  SELECT YOUR REPAIR
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Scroll Indicator Strip */}
        <div className="relative z-20 border-t border-white/10 bg-[#0A0C12] px-4 py-2 sm:px-6">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 text-[11px] text-slate-400 sm:text-xs">
            <span className="truncate">
              Drag horizontally to rotate 360° · Scroll down to separate internal layers
            </span>
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10 sm:w-24">
                <div
                  className="h-full bg-blue-500 transition-[width] duration-150"
                  style={{ width: `${Math.round(scrollProgress * 100)}%` }}
                />
              </div>
              <span className="font-mono tabular-nums text-slate-300">
                {Math.round(scrollProgress * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
