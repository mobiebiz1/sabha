import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import {
  Box,
  Camera,
  Captions,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Maximize,
  Maximize2,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  Volume2,
  VolumeX,
  Wrench,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { DeviceCategoryId, DeviceModelSpec } from '../data/devices';
import type { RepairAnimationPose, RepairCategorySpec, RepairToolType } from '../data/repairs';
import {
  formatViewerModelTitle,
  getResolvedRepairSteps,
  type ResolvedRepairStep,
  type WorkshopHotspot,
} from '../data/repairSequences';
import { ExplodedIPhoneModel } from '../three/components/ExplodedIPhoneModel';
import {
  AppleWatch3DModel,
  IPad3DModel,
  MacBook3DModel,
} from '../three/components/DeviceShowcaseModels';
import {
  GroundContactShadow,
  SafeOrbitControls,
  StudioCanvas,
  StudioEnvironmentRig,
} from '../three/StudioLighting';
import { detectGpuCapabilities } from '../three/gpuCapabilities';
import {
  type NarrationLanguage,
  pauseTechnicianNarration,
  resumeTechnicianNarration,
  speakTechnicianNarration,
  stopTechnicianNarration,
} from '../utils/technicianVoice';

interface RepairWalkthroughSectionProps {
  selectedCategory: DeviceCategoryId;
  selectedModel: DeviceModelSpec;
  selectedIssue: RepairCategorySpec;
  lowPower2DMode: boolean;
  onChangeIssue: () => void;
  onProceedToBooking: () => void;
}

const TOOL_LABELS: Record<RepairToolType, string> = {
  none: 'Visual Inspection',
  diagnostic_dock: 'USB-C & BMS Diagnostic Bench',
  heating_pad: 'Regulated Thermal Separator',
  suction_opener: 'Dual-Cup Precision Screen Lifter',
  pentalobe_driver: 'P5 / P2 Pentalobe Precision Driver',
  esd_spudger: 'Non-Conductive ESD Nylon Spudger',
  precision_tweezers: 'Anti-Static Precision Tweezers',
  micro_solder: 'Microscope BGA / Micro-Solder Iron',
  ultrasonic_clean: 'Electronics Ultrasonic Cleaner',
  adhesive_press: 'Calibrated Perimeter Seal Press',
};

const CAMERA_PRESET_POS: Record<
  RepairAnimationPose['cameraPreset'],
  { pos: [number, number, number]; target: [number, number, number] }
> = {
  front_angle: { pos: [1.8, 0.35, 5.2], target: [0, 0, 0] },
  internal_top: { pos: [2.2, 0.85, 4.4], target: [-0.2, 0.4, 0.1] },
  battery_bay: { pos: [1.4, -0.1, 4.6], target: [-0.15, -0.15, 0.2] },
  lower_io: { pos: [1.6, -1.15, 4.4], target: [0, -0.95, 0.1] },
  rear_optics: { pos: [-2.1, 0.9, -4.6], target: [-0.2, 0.8, -0.2] },
  logic_board: { pos: [1.8, 0.35, 4.2], target: [0.3, 0.25, 0.1] },
  final_front: { pos: [0.6, 0.15, 5.3], target: [0, 0, 0] },
};

function WalkthroughCameraRig({
  preset,
  stepKey,
  reducedMotion,
  userInteractingRef,
}: {
  preset: RepairAnimationPose['cameraPreset'];
  stepKey: string;
  reducedMotion: boolean;
  userInteractingRef: React.MutableRefObject<boolean>;
}) {
  const { camera } = useThree();
  const lastStepKey = useRef(stepKey);

  useEffect(() => {
    if (lastStepKey.current !== stepKey) {
      userInteractingRef.current = false;
      lastStepKey.current = stepKey;
    }
  }, [stepKey, userInteractingRef]);

  useFrame((_, rawDelta) => {
    if (userInteractingRef.current) return;
    const dt = Math.min(rawDelta, 0.05);
    const k = reducedMotion ? 24 : 5.5;
    const alpha = 1 - Math.exp(-k * dt);
    const cfg = CAMERA_PRESET_POS[preset] ?? CAMERA_PRESET_POS.front_angle;

    const curRho = Math.max(0.5, Math.hypot(camera.position.x, camera.position.z));
    const curTheta = Math.atan2(camera.position.x, camera.position.z);
    const tgtRho = Math.hypot(cfg.pos[0], cfg.pos[2]);
    const tgtTheta = Math.atan2(cfg.pos[0], cfg.pos[2]);

    let deltaTheta = tgtTheta - curTheta;
    while (deltaTheta > Math.PI) deltaTheta -= Math.PI * 2;
    while (deltaTheta < -Math.PI) deltaTheta += Math.PI * 2;

    const nextTheta = curTheta + alpha * deltaTheta;
    const nextRho = THREE.MathUtils.damp(curRho, tgtRho, k, dt);
    const nextY = THREE.MathUtils.damp(camera.position.y, cfg.pos[1], k, dt);

    camera.position.set(
      Math.sin(nextTheta) * nextRho,
      nextY,
      Math.cos(nextTheta) * nextRho
    );
    camera.lookAt(cfg.target[0], cfg.target[1], cfg.target[2]);
  });

  return null;
}

export function RepairWalkthroughSection({
  selectedCategory,
  selectedModel,
  selectedIssue,
  lowPower2DMode,
  onChangeIssue,
  onProceedToBooking,
}: RepairWalkthroughSectionProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [viewMode, setViewMode] = useState<'workshop' | '3d'>('workshop');
  const [userZoom, setUserZoom] = useState(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingPan, setIsDraggingPan] = useState(false);
  const [replayNonce, setReplayNonce] = useState(0);
  const [motionEntered, setMotionEntered] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState<WorkshopHotspot | null>(null);

  // Fullscreen & theater fallback state
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);
  const [isTheaterExpanded, setIsTheaterExpanded] = useState(false);

  // Female technician voice narration state (never auto-plays before user action)
  const [narrationLang, setNarrationLang] = useState<NarrationLanguage>('en-IN');
  const [isMuted, setIsMuted] = useState(false);
  const [narrationVolume, setNarrationVolume] = useState(0.9);
  const narrationVolumeRef = useRef(0.9);
  narrationVolumeRef.current = narrationVolume;
  const [narrationActive, setNarrationActive] = useState(false);
  const [voiceState, setVoiceState] = useState<'idle' | 'speaking' | 'paused'>('idle');
  const [showCaptions, setShowCaptions] = useState(true);

  const viewportShellRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; origX: number; origY: number } | null>(null);
  const userInteractingRef = useRef(false);
  const voiceCleanupRef = useRef<(() => void) | null>(null);
  const autoAdvanceTimeoutRef = useRef<number | null>(null);
  const caps = useMemo(() => detectGpuCapabilities(), []);

  const resolvedSteps = useMemo(
    () => getResolvedRepairSteps(selectedCategory, selectedModel, selectedIssue),
    [selectedCategory, selectedModel, selectedIssue]
  );

  const clearVoiceAndTimers = useCallback(() => {
    if (autoAdvanceTimeoutRef.current) {
      window.clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }
    if (voiceCleanupRef.current) {
      voiceCleanupRef.current();
      voiceCleanupRef.current = null;
    }
    stopTechnicianNarration();
  }, []);

  // Reset cleanly when user changes model, category, or issue
  useEffect(() => {
    clearVoiceAndTimers();
    setStepIndex(0);
    setAutoPlay(false);
    setNarrationActive(false);
    setVoiceState('idle');
    setViewMode('workshop');
    setUserZoom(1);
    setPanOffset({ x: 0, y: 0 });
    setImageError(false);
  }, [selectedIssue.id, selectedModel.id, selectedCategory, clearVoiceAndTimers]);

  useEffect(() => {
    return () => {
      clearVoiceAndTimers();
    };
  }, [clearVoiceAndTimers]);

  // Listen to native fullscreen state changes + Escape key for theater overlay fallback
  useEffect(() => {
    const onFsChange = () => {
      const fsEl = document.fullscreenElement;
      setIsNativeFullscreen(Boolean(fsEl && fsEl === viewportShellRef.current));
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isTheaterExpanded) {
        setIsTheaterExpanded(false);
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isTheaterExpanded]);

  const currentStep: ResolvedRepairStep = resolvedSteps[stepIndex] ?? resolvedSteps[0];
  const hasWorkshopVisual = Boolean(currentStep?.visualFrame);
  const showWorkshopVisual = hasWorkshopVisual && viewMode === 'workshop';

  const speakStep = useCallback(
    (step: ResolvedRepairStep, lang: NarrationLanguage, shouldAutoAdvance: boolean) => {
      clearVoiceAndTimers();
      if (isMuted) {
        setVoiceState('idle');
        return;
      }

      const text = lang === 'en-IN' ? step.narrationEn : step.narrationHi;
      setVoiceState('speaking');

      voiceCleanupRef.current = speakTechnicianNarration(
        text,
        lang,
        {
          onStart: () => {
            setVoiceState('speaking');
          },
          onEnd: () => {
            setVoiceState('idle');
            if (shouldAutoAdvance) {
              autoAdvanceTimeoutRef.current = window.setTimeout(() => {
                setStepIndex((prev) => {
                  if (prev >= resolvedSteps.length - 1) {
                    setAutoPlay(false);
                    return prev;
                  }
                  return prev + 1;
                });
              }, 450);
            }
          },
          onError: () => {
            setVoiceState('idle');
            if (shouldAutoAdvance) {
              autoAdvanceTimeoutRef.current = window.setTimeout(() => {
                setStepIndex((prev) => {
                  if (prev >= resolvedSteps.length - 1) {
                    setAutoPlay(false);
                    return prev;
                  }
                  return prev + 1;
                });
              }, 3400);
            }
          },
        },
        narrationVolumeRef.current
      );
    },
    [clearVoiceAndTimers, isMuted, resolvedSteps.length]
  );

  // Trigger clean focus-zoom transition & default hotspot selection on step change or replay
  useEffect(() => {
    setUserZoom(1);
    setPanOffset({ x: 0, y: 0 });
    setImageError(false);

    const hotspots = currentStep?.visualFrame?.hotspots;
    if (hotspots && hotspots.length > 0) {
      setActiveHotspot(hotspots.find((h) => h.primary) ?? hotspots[0]);
    } else {
      setActiveHotspot(null);
    }

    if (caps.prefersReducedMotion) {
      setMotionEntered(true);
      return;
    }

    setMotionEntered(false);
    const raf = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setMotionEntered(true);
      });
    });
    return () => window.cancelAnimationFrame(raf);
  }, [stepIndex, replayNonce, currentStep, caps.prefersReducedMotion]);

  // Speak automatically on step changes only after user has started narration or Play Sequence
  useEffect(() => {
    if (!narrationActive || isMuted) return;
    speakStep(currentStep, narrationLang, autoPlay);
    // Intentionally sync to step/replay/language/autoPlay/narrationActive/isMuted transitions
  }, [stepIndex, replayNonce, narrationLang, narrationActive, isMuted, autoPlay, currentStep, speakStep]);

  // Silent fallback auto-play progression when muted or narration is not active
  useEffect(() => {
    if (!autoPlay || (narrationActive && !isMuted)) return;
    const timer = window.setInterval(() => {
      setStepIndex((prev) => {
        if (prev >= resolvedSteps.length - 1) {
          setAutoPlay(false);
          return prev;
        }
        return prev + 1;
      });
    }, 3800);
    return () => window.clearInterval(timer);
  }, [autoPlay, narrationActive, isMuted, resolvedSteps.length]);

  const highlightedIds = useMemo(() => {
    if (currentStep.pose.focusPart === 'all') return [];
    return [currentStep.pose.focusPart];
  }, [currentStep]);

  const categoryLabel =
    selectedCategory === 'iphone'
      ? 'iPhone'
      : selectedCategory === 'macbook'
      ? 'MacBook'
      : selectedCategory === 'ipad'
      ? 'iPad'
      : 'Apple Watch';

  const modelTitleUpper = formatViewerModelTitle(selectedModel);
  const issueTitleUpper = selectedIssue.title.toUpperCase();
  const activeCaptionText =
    narrationLang === 'en-IN' ? currentStep.narrationEn : currentStep.narrationHi;

  const handleToggleFullscreen = async () => {
    const shellEl = viewportShellRef.current;
    if (!shellEl) return;

    if (document.fullscreenElement === shellEl) {
      try {
        await document.exitFullscreen();
      } catch {
        setIsNativeFullscreen(false);
      }
      return;
    }

    if (isTheaterExpanded) {
      setIsTheaterExpanded(false);
      return;
    }

    try {
      if (shellEl.requestFullscreen) {
        await shellEl.requestFullscreen();
        return;
      }
    } catch {
      // Embedded preview iframes may disallow native Fullscreen API; fall back cleanly
    }
    setIsTheaterExpanded(true);
  };

  const handleToggleNarrationPlayback = () => {
    if (isMuted) {
      setIsMuted(false);
      setNarrationActive(true);
      return;
    }
    if (!narrationActive || voiceState === 'idle') {
      setNarrationActive(true);
      speakStep(currentStep, narrationLang, autoPlay);
      return;
    }
    if (voiceState === 'speaking') {
      pauseTechnicianNarration();
      setVoiceState('paused');
      return;
    }
    resumeTechnicianNarration();
    setVoiceState('speaking');
  };

  const handleReplayNarration = () => {
    setIsMuted(false);
    setNarrationActive(true);
    setReplayNonce((n) => n + 1);
  };

  const handleToggleMute = () => {
    if (!isMuted) {
      clearVoiceAndTimers();
      setVoiceState('idle');
      setIsMuted(true);
    } else {
      setIsMuted(false);
      if (narrationActive) {
        // useEffect will speak current step once isMuted flips false
      }
    }
  };

  const handleZoomChange = (delta: number) => {
    setUserZoom((prev) => {
      const next = Math.min(2.4, Math.max(1, Number((prev + delta).toFixed(2))));
      if (next <= 1.01) {
        setPanOffset({ x: 0, y: 0 });
      }
      return next;
    });
  };

  const handleResetView = () => {
    setUserZoom(1);
    setPanOffset({ x: 0, y: 0 });
    userInteractingRef.current = false;
  };

  const handleReplayStep = () => {
    setAutoPlay(false);
    setReplayNonce((n) => n + 1);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (userZoom <= 1.02) return;
    setIsDraggingPan(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      origX: panOffset.x,
      origY: panOffset.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingPan || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const maxPan = (userZoom - 1) * 165;
    setPanOffset({
      x: Math.max(-maxPan, Math.min(maxPan, dragStartRef.current.origX + dx)),
      y: Math.max(-maxPan, Math.min(maxPan, dragStartRef.current.origY + dy)),
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingPan) return;
    setIsDraggingPan(false);
    dragStartRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const baseScale =
    currentStep.visualFrame && motionEntered && !caps.prefersReducedMotion
      ? currentStep.visualFrame.focusZoom
      : 1;
  const effectiveScale = Number((baseScale * userZoom).toFixed(3));
  const isExpandedMode = isNativeFullscreen || isTheaterExpanded;

  return (
    <section
      id="repair-walkthrough"
      className="relative border-t border-white/10 bg-[#0B0E14] py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div className="max-w-2xl space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-blue-400">
              <span>Step 03</span>
              <span aria-hidden="true">·</span>
              <span>{categoryLabel}</span>
              <span aria-hidden="true">·</span>
              <span>{selectedModel.name}</span>
              <span aria-hidden="true">·</span>
              <span>{selectedIssue.title}</span>
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              KNOW BEFORE YOU REPAIR.
            </h2>
            <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
              Inspect the exact procedure our Bangalore workshop follows for your {selectedModel.name}. Every step, tool, technician explanation, and safety boundary is shown transparently before you book.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onChangeIssue}
              className="rounded-lg border border-white/15 bg-[#121620] px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-blue-400/50 hover:text-white whitespace-nowrap"
            >
              Change Issue
            </button>
            <button
              type="button"
              onClick={onProceedToBooking}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-500 whitespace-nowrap"
            >
              Proceed to Book Repair
            </button>
          </div>
        </div>

        {/* Main Repair Workbench Grid */}
        <div className="mt-10 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
          {/* LEFT (Desktop) / TOP (Mobile): Large Interactive Repair Viewer */}
          <div
            ref={viewportShellRef}
            className={`flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#090B0F] lg:col-span-8 ${
              isTheaterExpanded ? 'fixed inset-3 z-50 sm:inset-6' : ''
            }`}
          >
            {/* Exact Model & Repair Issue Header Strip */}
            <div className="flex flex-col justify-between gap-3 border-b border-white/10 bg-[#0E121A] px-4 py-3.5 sm:flex-row sm:items-center sm:px-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                  <h3 className="font-display text-sm font-bold tracking-wide text-white sm:text-base">
                    {modelTitleUpper}
                  </h3>
                  <span className="text-slate-600" aria-hidden="true">
                    /
                  </span>
                  <span className="font-display text-xs font-bold tracking-wider text-blue-400 sm:text-sm">
                    {issueTitleUpper}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-slate-400">
                  <span className="font-mono text-slate-300">{selectedModel.modelCode}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedModel.chip}</span>
                  <span aria-hidden="true">·</span>
                  <span>{TOOL_LABELS[currentStep.pose.tool]}</span>
                </div>
              </div>

              {/* View Toggle (Workshop Sequence vs 360° 3D Hardware) + Fullscreen + Step Counter */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 sm:justify-end">
                {hasWorkshopVisual && (
                  <div
                    role="tablist"
                    aria-label="Repair viewer mode"
                    className="inline-flex rounded-lg border border-white/15 bg-[#090B0F] p-0.5"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={viewMode === 'workshop'}
                      onClick={() => setViewMode('workshop')}
                      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors whitespace-nowrap ${
                        viewMode === 'workshop'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Camera className="h-3.5 w-3.5" />
                      <span>Workshop Sequence</span>
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={viewMode === '3d'}
                      onClick={() => setViewMode('3d')}
                      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors whitespace-nowrap ${
                        viewMode === '3d'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Box className="h-3.5 w-3.5" />
                      <span>3D Hardware</span>
                    </button>
                  </div>
                )}

                <span className="font-mono text-xs font-semibold tabular-nums text-slate-300 shrink-0">
                  STEP {String(currentStep.stepNumber).padStart(2, '0')} /{' '}
                  {String(resolvedSteps.length).padStart(2, '0')}
                </span>

                <button
                  type="button"
                  onClick={handleToggleFullscreen}
                  aria-label={isExpandedMode ? 'Exit full screen' : 'Full screen repair viewer'}
                  title={isExpandedMode ? 'Exit Full Screen' : 'Full Screen'}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-[#090B0F] px-2.5 py-1.5 text-[11px] font-medium text-slate-200 transition-colors hover:border-blue-400/50 hover:text-white whitespace-nowrap"
                >
                  {isExpandedMode ? (
                    <Minimize className="h-3.5 w-3.5" />
                  ) : (
                    <Maximize className="h-3.5 w-3.5" />
                  )}
                  <span className="hidden sm:inline">{isExpandedMode ? 'Exit' : 'Full Screen'}</span>
                </button>
              </div>
            </div>

            {/* Viewport Body */}
            <div
              onPointerDown={showWorkshopVisual ? handlePointerDown : undefined}
              onPointerMove={showWorkshopVisual ? handlePointerMove : undefined}
              onPointerUp={showWorkshopVisual ? handlePointerUp : undefined}
              onPointerCancel={showWorkshopVisual ? handlePointerUp : undefined}
              style={{
                touchAction: showWorkshopVisual && userZoom > 1.02 ? 'none' : 'pan-y',
              }}
              className={`relative w-full overflow-hidden bg-[#07090D] ${
                isExpandedMode
                  ? 'flex-1 min-h-[320px]'
                  : 'aspect-[16/10] min-h-[260px] sm:aspect-auto sm:h-[460px] lg:h-[500px]'
              } ${
                showWorkshopVisual && userZoom > 1.02
                  ? isDraggingPan
                    ? 'cursor-grabbing'
                    : 'cursor-grab'
                  : ''
              }`}
            >
              {showWorkshopVisual && currentStep.visualFrame ? (
                <>
                  {!imageError ? (
                    <div
                      key={`${selectedModel.id}-${selectedIssue.id}-${currentStep.stepNumber}-${replayNonce}`}
                      className="relative h-full w-full overflow-hidden select-none"
                    >
                      <img
                        src={currentStep.visualFrame.imageSrc}
                        alt={currentStep.visualFrame.alt}
                        referrerPolicy="no-referrer"
                        draggable={false}
                        onError={() => setImageError(true)}
                        style={{
                          transformOrigin: currentStep.visualFrame.panOrigin,
                          transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0) scale(${effectiveScale})`,
                          transition: isDraggingPan
                            ? 'none'
                            : caps.prefersReducedMotion
                            ? 'opacity 150ms ease'
                            : 'transform 900ms cubic-bezier(0.22, 1, 0.36, 1), opacity 300ms ease',
                        }}
                        className="h-full w-full object-cover object-center"
                      />

                      {/* Subtle edge vignette for crisp legibility */}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#090B0F]/85 via-transparent to-[#090B0F]/25" />

                      {/* Interactive Component Hotspots */}
                      {currentStep.visualFrame.hotspots && userZoom <= 1.1 && (
                        <div className="absolute inset-0">
                          {currentStep.visualFrame.hotspots.map((spot, spotIdx) => {
                            const isSelected = activeHotspot?.id === spot.id;
                            return (
                              <button
                                key={spot.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveHotspot(spot);
                                }}
                                style={{ left: `${spot.xPct}%`, top: `${spot.yPct}%` }}
                                aria-label={`Inspect ${spot.label}`}
                                className={`group absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-semibold shadow-lg transition-all ${
                                  isSelected
                                    ? 'z-20 scale-105 border-blue-400 bg-blue-600 text-white'
                                    : spot.primary
                                    ? 'z-10 border-blue-400/80 bg-[#090B0F]/90 text-blue-200 hover:bg-blue-600 hover:text-white'
                                    : 'z-10 border-white/25 bg-[#090B0F]/88 text-slate-200 hover:border-blue-400 hover:text-white'
                                }`}
                              >
                                <Crosshair className="h-3 w-3 shrink-0" />
                                <span className="font-mono text-[10px] sm:hidden">{spotIdx + 1}</span>
                                <span className="hidden whitespace-nowrap sm:inline">{spot.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                      <Wrench className="h-10 w-10 text-blue-400" />
                      <p className="mt-3 font-display text-lg font-semibold text-white">
                        Step {currentStep.stepNumber}: {currentStep.title}
                      </p>
                      <p className="mt-2 max-w-md text-sm text-slate-300">
                        {currentStep.technicianAction}
                      </p>
                    </div>
                  )}

                  {/* Bottom-left active hotspot detail + bottom-right zoom controls */}
                  <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-20 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                    <div className="pointer-events-auto max-w-lg rounded-lg border border-white/15 bg-[#0B0E14]/92 px-3.5 py-2.5 text-xs">
                      {activeHotspot ? (
                        <div>
                          <p className="font-semibold text-blue-300">{activeHotspot.label}</p>
                          <p className="mt-0.5 leading-relaxed text-slate-200">{activeHotspot.detail}</p>
                        </div>
                      ) : (
                        <p className="font-medium text-slate-200">
                          {currentStep.visualFrame.caption}
                        </p>
                      )}
                    </div>

                    <div className="pointer-events-auto flex items-center gap-1 self-end rounded-lg border border-white/15 bg-[#0B0E14]/92 p-1 text-xs text-slate-200">
                      <button
                        type="button"
                        onClick={() => handleZoomChange(-0.35)}
                        disabled={userZoom <= 1}
                        aria-label="Zoom out"
                        className="rounded p-1.5 hover:bg-white/10 disabled:opacity-35"
                      >
                        <ZoomOut className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-[3.1rem] text-center font-mono text-[11px] tabular-nums text-slate-300">
                        {userZoom.toFixed(1)}x
                      </span>
                      <button
                        type="button"
                        onClick={() => handleZoomChange(0.35)}
                        disabled={userZoom >= 2.4}
                        aria-label="Zoom in"
                        className="rounded p-1.5 hover:bg-white/10 disabled:opacity-35"
                      >
                        <ZoomIn className="h-3.5 w-3.5" />
                      </button>
                      {userZoom > 1.02 && (
                        <button
                          type="button"
                          onClick={handleResetView}
                          aria-label="Reset zoom and pan"
                          className="ml-0.5 inline-flex items-center gap-1 rounded border-l border-white/15 px-2 py-1 text-[11px] text-blue-300 hover:bg-white/10"
                        >
                          <Maximize2 className="h-3 w-3" />
                          <span>Fit</span>
                        </button>
                      )}
                    </div>
                  </div>
                </>
              ) : !lowPower2DMode && caps.webglAvailable ? (
                <>
                  <StudioCanvas
                    className="h-full w-full"
                    cameraPosition={
                      selectedCategory === 'macbook'
                        ? [1.9, 1.45, 4.9]
                        : selectedCategory === 'ipad'
                        ? [0.4, 0.45, 5.1]
                        : selectedCategory === 'watch'
                        ? [0.4, 0.25, 5.0]
                        : [1.8, 0.35, 5.2]
                    }
                    fov={38}
                    lazyMount={true}
                    allowVerticalPageScroll={true}
                  >
                    <StudioEnvironmentRig backgroundColor="#090b0f" fogDensity={0.015} rimIntensity={1.9} />
                    <WalkthroughCameraRig
                      preset={currentStep.pose.cameraPreset}
                      stepKey={`${selectedModel.id}-${selectedIssue.id}-${currentStep.stepNumber}`}
                      reducedMotion={caps.prefersReducedMotion}
                      userInteractingRef={userInteractingRef}
                    />
                    <SafeOrbitControls
                      allowVerticalPageScroll={true}
                      enablePan={false}
                      enableDamping={!caps.isSoftwareGl}
                      minDistance={2.8}
                      maxDistance={9}
                      minPolarAngle={Math.PI * 0.15}
                      maxPolarAngle={Math.PI * 0.88}
                      onStart={() => {
                        userInteractingRef.current = true;
                      }}
                    />

                    {selectedCategory === 'iphone' && (
                      <ExplodedIPhoneModel
                        mode="repair_bench"
                        highlightedIds={highlightedIds}
                        repairPose={currentStep.pose}
                        chassisColorHex={selectedModel.accentFinishHex}
                        visualVariant={selectedModel.visualVariant}
                        reducedMotion={caps.prefersReducedMotion}
                      />
                    )}

                    {selectedCategory === 'macbook' && (
                      <MacBook3DModel
                        highlightedIds={highlightedIds}
                        repairPose={currentStep.pose}
                        reducedMotion={caps.prefersReducedMotion}
                        mode="repair_bench"
                        modelId={selectedModel.id}
                        accentColorHex={selectedModel.accentFinishHex}
                        visualVariant={selectedModel.visualVariant}
                      />
                    )}

                    {selectedCategory === 'ipad' && (
                      <IPad3DModel
                        highlightedIds={highlightedIds}
                        repairPose={currentStep.pose}
                        reducedMotion={caps.prefersReducedMotion}
                        mode="repair_bench"
                        modelId={selectedModel.id}
                        accentColorHex={selectedModel.accentFinishHex}
                        visualVariant={selectedModel.visualVariant}
                      />
                    )}

                    {selectedCategory === 'watch' && (
                      <AppleWatch3DModel
                        highlightedIds={highlightedIds}
                        repairPose={currentStep.pose}
                        reducedMotion={caps.prefersReducedMotion}
                        mode="repair_bench"
                        modelId={selectedModel.id}
                        visualVariant={selectedModel.visualVariant}
                      />
                    )}

                    <GroundContactShadow y={-2.25} scale={4.5} opacity={0.48} />
                  </StudioCanvas>

                  <button
                    type="button"
                    onClick={handleResetView}
                    className="absolute bottom-3 right-3 z-20 inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#0E121A]/95 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Snap Camera</span>
                  </button>
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                  <Wrench className="h-10 w-10 text-blue-400" />
                  <p className="mt-3 font-display text-lg font-semibold text-white">
                    Step {currentStep.stepNumber}: {currentStep.title}
                  </p>
                  <p className="mt-2 max-w-md text-sm text-slate-300">
                    {currentStep.technicianAction}
                  </p>
                  <p className="mt-4 text-xs text-slate-500">
                    2D Schematic Mode active · Step controls below remain fully interactive.
                  </p>
                </div>
              )}
            </div>

            {/* Synchronized Live Captions & Technician Voice Strip */}
            <div className="border-t border-white/10 bg-[#0B0E14] px-4 py-3 sm:px-5">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                {/* Narration Audio Controls */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleToggleNarrationPlayback}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                      voiceState === 'speaking'
                        ? 'border-blue-500 bg-blue-600/20 text-blue-200'
                        : 'border-white/15 bg-[#141925] text-slate-200 hover:border-blue-400/50 hover:text-white'
                    }`}
                  >
                    {voiceState === 'speaking' ? (
                      <Pause className="h-3.5 w-3.5 text-blue-400" />
                    ) : (
                      <Play className="h-3.5 w-3.5 text-blue-400" />
                    )}
                    <span>
                      {voiceState === 'speaking'
                        ? 'Pause Voice'
                        : voiceState === 'paused'
                        ? 'Resume Voice'
                        : 'Play Voice'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleReplayNarration}
                    title="Replay Step Narration"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#141925] px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:text-white whitespace-nowrap"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Replay Voice</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleMute}
                    aria-label={isMuted ? 'Unmute technician voice' : 'Mute technician voice'}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-[#141925] px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:text-white whitespace-nowrap"
                  >
                    {isMuted ? (
                      <VolumeX className="h-3.5 w-3.5 text-slate-400" />
                    ) : (
                      <Volume2 className="h-3.5 w-3.5 text-blue-400" />
                    )}
                    <span>{isMuted ? 'Muted' : 'Audio'}</span>
                  </button>

                  <label className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#141925] px-2.5 py-1.5 text-[11px] text-slate-400">
                    <span className="sr-only">Voice volume</span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={isMuted ? 0 : narrationVolume}
                      onChange={(e) => {
                        const nextVol = Number(e.target.value);
                        setNarrationVolume(nextVol);
                        narrationVolumeRef.current = nextVol;
                        if (nextVol <= 0.01) {
                          clearVoiceAndTimers();
                          setVoiceState('idle');
                          setIsMuted(true);
                        } else if (isMuted) {
                          setIsMuted(false);
                        }
                      }}
                      aria-label="Voice narration volume"
                      className="h-1.5 w-16 cursor-pointer accent-blue-500"
                    />
                  </label>
                </div>

                {/* Language Selector (Indian English / Hindi) + Captions Toggle */}
                <div className="flex items-center gap-2">
                  <div
                    role="group"
                    aria-label="Narration language"
                    className="inline-flex rounded-lg border border-white/15 bg-[#090B0F] p-0.5"
                  >
                    <button
                      type="button"
                      onClick={() => setNarrationLang('en-IN')}
                      className={`rounded-md px-2 py-1 text-[11px] font-semibold transition-colors whitespace-nowrap ${
                        narrationLang === 'en-IN'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      EN (IN)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNarrationLang('hi-IN')}
                      className={`rounded-md px-2 py-1 text-[11px] font-semibold transition-colors whitespace-nowrap ${
                        narrationLang === 'hi-IN'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      हिन्दी (HI)
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowCaptions((v) => !v)}
                    aria-pressed={showCaptions}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors whitespace-nowrap ${
                      showCaptions
                        ? 'border-blue-500/40 bg-blue-600/15 text-blue-200'
                        : 'border-white/15 bg-[#141925] text-slate-400 hover:text-white'
                    }`}
                  >
                    <Captions className="h-3.5 w-3.5" />
                    <span>Captions</span>
                  </button>
                </div>
              </div>

              {showCaptions && (
                <div className="mt-2.5 rounded-lg border border-white/10 bg-[#0F141F] px-3.5 py-2 text-xs leading-relaxed text-slate-200">
                  <span className="mr-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-blue-400">
                    Technician ({narrationLang === 'en-IN' ? 'EN-IN' : 'HI'})
                  </span>
                  <span>{activeCaptionText}</span>
                </div>
              )}
            </div>

            {/* Interactive Step Progress Strip */}
            <div className="border-t border-white/10 bg-[#0B0E14] px-4 pt-2.5 pb-2">
              <div className="flex items-center gap-1.5" role="group" aria-label="Repair sequence progress">
                {resolvedSteps.map((step, idx) => {
                  const isCurrent = idx === stepIndex;
                  const isCompleted = idx < stepIndex;
                  return (
                    <button
                      key={step.stepNumber}
                      type="button"
                      onClick={() => {
                        setAutoPlay(false);
                        setStepIndex(idx);
                      }}
                      title={`Step ${String(step.stepNumber).padStart(2, '0')}: ${step.title}`}
                      aria-label={`Jump to step ${step.stepNumber}: ${step.title}`}
                      className="group flex flex-1 flex-col gap-1 py-1 text-left focus-visible:outline-2 focus-visible:outline-blue-400"
                    >
                      <span
                        className={`h-1.5 w-full rounded-sm transition-colors ${
                          isCurrent
                            ? 'bg-blue-500'
                            : isCompleted
                            ? 'bg-blue-500/45 group-hover:bg-blue-400/70'
                            : 'bg-white/12 group-hover:bg-white/25'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Playback & Step Navigation Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 bg-[#0E121A] px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={stepIndex === 0}
                  onClick={() => {
                    setAutoPlay(false);
                    setStepIndex((i) => Math.max(0, i - 1));
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#151A26] px-3 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-[#1C2232] disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  disabled={stepIndex >= resolvedSteps.length - 1}
                  onClick={() => {
                    setAutoPlay(false);
                    setStepIndex((i) => Math.min(resolvedSteps.length - 1, i + 1));
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap"
                >
                  <span>Next Step</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleReplayStep}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#151A26] px-3 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-[#1C2232] whitespace-nowrap"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-slate-300" />
                  <span>Replay Step</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (stepIndex >= resolvedSteps.length - 1) setStepIndex(0);
                  const nextAuto = !autoPlay;
                  setAutoPlay(nextAuto);
                  if (nextAuto && !isMuted) {
                    setNarrationActive(true);
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#151A26] px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-[#1C2232] whitespace-nowrap"
              >
                {autoPlay ? (
                  <Pause className="h-3.5 w-3.5 text-blue-400" />
                ) : (
                  <Play className="h-3.5 w-3.5 text-blue-400" />
                )}
                <span>{autoPlay ? 'Pause' : 'Play Sequence'}</span>
              </button>
            </div>
          </div>

          {/* RIGHT (Desktop) / BELOW (Mobile): Active Step Details + Interactive Step Index */}
          <div className="flex flex-col justify-between gap-5 lg:col-span-4">
            {/* Active Step Card */}
            <div className="rounded-2xl border border-white/10 bg-[#10141E] p-5 sm:p-6">
              <div className="flex items-center justify-between text-xs text-blue-400">
                <span className="font-mono font-semibold tabular-nums">
                  STEP {String(currentStep.stepNumber).padStart(2, '0')} OF{' '}
                  {String(resolvedSteps.length).padStart(2, '0')}
                </span>
                <span className="text-slate-400">{selectedIssue.estimatedBenchTime}</span>
              </div>

              <h3 className="mt-2 font-display text-xl font-bold text-white sm:text-2xl">
                {currentStep.title}
              </h3>

              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                {currentStep.explanation}
              </p>

              <div className="mt-5 space-y-3 border-t border-white/10 pt-4 text-xs leading-relaxed">
                <div className="flex items-start gap-2">
                  <Wrench className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-400" />
                  <div>
                    <span className="font-semibold text-slate-100">Technician Action: </span>
                    <span className="text-slate-300">{currentStep.technicianAction}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3 text-amber-200">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  <div>
                    <span className="font-semibold text-amber-300">Safety &amp; Accuracy: </span>
                    <span className="text-amber-100/90">{currentStep.safetyNote}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Step List */}
            <div className="rounded-2xl border border-white/10 bg-[#0E121B] p-4">
              <p className="px-2 pb-2 text-xs font-semibold text-slate-400">
                All {resolvedSteps.length} Repair Stages
              </p>
              <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
                {resolvedSteps.map((step, idx) => {
                  const active = idx === stepIndex;
                  return (
                    <button
                      key={step.stepNumber}
                      type="button"
                      onClick={() => {
                        setAutoPlay(false);
                        setStepIndex(idx);
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                        active
                          ? 'border border-blue-500/40 bg-blue-600/20 text-white'
                          : 'border border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200'
                      }`}
                    >
                      <span
                        className={`font-mono text-[11px] font-semibold tabular-nums ${
                          active ? 'text-blue-400' : 'text-slate-500'
                        }`}
                      >
                        {String(step.stepNumber).padStart(2, '0')}
                      </span>
                      <span className="truncate font-medium">{step.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
