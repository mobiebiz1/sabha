import { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ChevronRight,
  MessageCircle,
  Phone,
  Wrench,
} from 'lucide-react';
import { buildTelHref, buildWhatsAppRepairUrl } from '../config/business';
import type { DeviceCategoryId, DeviceModelSpec } from '../data/devices';
import { IPHONE_COMPONENTS } from '../data/componentsCatalog';
import {
  REPAIR_CATEGORIES,
  type RepairCategoryId,
  type RepairCategorySpec,
} from '../data/repairs';
import { getRepairCategoriesForDevice, getResolvedRepairSteps } from '../data/repairSequences';
import { ExplodedIPhoneModel } from '../three/components/ExplodedIPhoneModel';
import { AppleWatch3DModel, IPad3DModel, MacBook3DModel } from '../three/components/DeviceShowcaseModels';
import { GroundContactShadow, SafeOrbitControls, StudioCanvas, StudioEnvironmentRig } from '../three/StudioLighting';
import { detectGpuCapabilities } from '../three/gpuCapabilities';

interface RepairProblemSelectorProps {
  selectedCategory: DeviceCategoryId;
  selectedModel: DeviceModelSpec;
  selectedIssue: RepairCategorySpec | null;
  hasConfirmedIssue: boolean;
  contactPhone: string;
  contactWhatsapp: string;
  lowPower2DMode: boolean;
  onSelectIssue: (issue: RepairCategorySpec) => void;
  onProceedToWalkthrough: () => void;
  onChangeModel: () => void;
}

function ComponentVisualThumbnail({
  id,
  selected,
}: {
  id: RepairCategoryId;
  selected: boolean;
}) {
  const stroke = selected ? '#FFFFFF' : '#60A5FA';
  const fillBg = selected ? '#1D4ED8' : '#0B101B';

  switch (id) {
    case 'display':
      return (
        <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none" aria-hidden="true">
          <rect x="9" y="4" width="22" height="32" rx="4" fill={fillBg} stroke={stroke} strokeWidth="1.8" />
          <rect x="15" y="7" width="10" height="2.4" rx="1.2" fill={stroke} />
          <path d="M13 15 L25 27 M22 14 L15 24" stroke="#93C5FD" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case 'battery':
      return (
        <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none" aria-hidden="true">
          <rect x="11" y="7" width="18" height="27" rx="3" fill={fillBg} stroke={stroke} strokeWidth="1.8" />
          <rect x="16" y="4" width="8" height="3" rx="1" fill={stroke} />
          <path d="M21 13 L16 21 H20 L19 28 L24 19 H20 L21 13 Z" fill="#93C5FD" />
        </svg>
      );
    case 'back_glass':
      return (
        <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none" aria-hidden="true">
          <rect x="9" y="4" width="22" height="32" rx="4" fill={fillBg} stroke={stroke} strokeWidth="1.8" />
          <rect x="12" y="7" width="10" height="10" rx="2.5" stroke="#93C5FD" strokeWidth="1.3" />
          <circle cx="15.5" cy="10.5" r="1.5" fill={stroke} />
          <circle cx="15.5" cy="14" r="1.5" fill={stroke} />
          <circle cx="19" cy="12.2" r="1.5" fill={stroke} />
          <path d="M16 25 L26 20 M21 23 L25 30" stroke="#93C5FD" strokeWidth="1.2" />
        </svg>
      );
    case 'camera':
      return (
        <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none" aria-hidden="true">
          <rect x="6" y="6" width="28" height="28" rx="6" fill={fillBg} stroke={stroke} strokeWidth="1.8" />
          <circle cx="15" cy="15" r="4.5" stroke="#93C5FD" strokeWidth="1.6" />
          <circle cx="15" cy="25" r="4.5" stroke="#93C5FD" strokeWidth="1.6" />
          <circle cx="25" cy="20" r="4.5" stroke="#93C5FD" strokeWidth="1.6" />
          <circle cx="25" cy="12" r="1.6" fill="#FDE68A" />
        </svg>
      );
    case 'charging_port':
      return (
        <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none" aria-hidden="true">
          <rect x="7" y="13" width="26" height="14" rx="7" fill={fillBg} stroke={stroke} strokeWidth="1.8" />
          <rect x="12" y="18.5" width="16" height="3" rx="1.5" fill="#FBBF24" />
          <path d="M20 7 V12 M20 28 V33" stroke="#93C5FD" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case 'earpiece_speaker':
      return (
        <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none" aria-hidden="true">
          <rect x="7" y="13" width="26" height="14" rx="4" fill={fillBg} stroke={stroke} strokeWidth="1.8" />
          <rect x="12" y="18.5" width="16" height="3" rx="1.5" fill="#93C5FD" />
        </svg>
      );
    case 'loudspeaker':
      return (
        <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none" aria-hidden="true">
          <path d="M10 15 H16 L24 9 V31 L16 25 H10 Z" fill={fillBg} stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M28 15 C30 17.5 30 22.5 28 25 M31.5 11.5 C34.5 16 34.5 24 31.5 28.5" stroke="#93C5FD" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case 'microphone':
      return (
        <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none" aria-hidden="true">
          <rect x="15" y="7" width="10" height="16" rx="5" fill={fillBg} stroke={stroke} strokeWidth="1.8" />
          <path d="M11 19 C11 24 15 27.5 20 27.5 C25 27.5 29 24 29 19 M20 27.5 V33 M15 33 H25" stroke="#93C5FD" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case 'taptic_engine':
      return (
        <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none" aria-hidden="true">
          <rect x="8" y="13" width="24" height="14" rx="3" fill={fillBg} stroke={stroke} strokeWidth="1.8" />
          <circle cx="20" cy="20" r="3.8" stroke="#FBBF24" strokeWidth="1.5" />
          <path d="M5 15 V25 M35 15 V25" stroke="#93C5FD" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case 'logic_board':
      return (
        <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none" aria-hidden="true">
          <rect x="11" y="11" width="18" height="18" rx="3" fill={fillBg} stroke={stroke} strokeWidth="1.8" />
          <rect x="16" y="16" width="8" height="8" rx="1.2" stroke="#FBBF24" strokeWidth="1.4" />
          <path d="M15 6 V11 M20 6 V11 M25 6 V11 M15 29 V34 M20 29 V34 M25 29 V34 M6 15 H11 M6 20 H11 M6 25 H11 M29 15 H34 M29 20 H34 M29 25 H34" stroke="#93C5FD" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case 'water_damage':
      return (
        <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none" aria-hidden="true">
          <path d="M20 6 C20 6 10 18 10 24.5 C10 30 14.5 34 20 34 C25.5 34 30 30 30 24.5 C30 18 20 6 20 6 Z" fill={fillBg} stroke={stroke} strokeWidth="1.8" />
          <path d="M16 25 C16 27.5 18 29.5 20.5 29.5" stroke="#93C5FD" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case 'face_id':
      return (
        <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none" aria-hidden="true">
          <path d="M9 14 V10 C9 9.4 9.4 9 10 9 H14 M26 9 H30 C30.6 9 31 9.4 31 10 V14 M31 26 V30 C31 30.6 30.6 31 30 31 H26 M14 31 H10 C9.4 31 9 30.6 9 30 V26" stroke={stroke} strokeWidth="1.9" strokeLinecap="round" />
          <circle cx="16" cy="17" r="1.5" fill="#93C5FD" />
          <circle cx="24" cy="17" r="1.5" fill="#93C5FD" />
          <path d="M16 24 C17.5 26 22.5 26 24 24" stroke="#93C5FD" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case 'buttons':
      return (
        <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none" aria-hidden="true">
          <rect x="13" y="6" width="14" height="28" rx="3.5" fill={fillBg} stroke={stroke} strokeWidth="1.8" />
          <rect x="8.5" y="12" width="4" height="6" rx="1.2" fill="#93C5FD" />
          <rect x="8.5" y="20" width="4" height="6" rx="1.2" fill="#93C5FD" />
          <rect x="27.5" y="15" width="4" height="8" rx="1.2" fill="#FBBF24" />
        </svg>
      );
    case 'software':
      return (
        <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none" aria-hidden="true">
          <rect x="6" y="8" width="28" height="24" rx="4" fill={fillBg} stroke={stroke} strokeWidth="1.8" />
          <path d="M13 16 L18 20 L13 24 M20 24 H27" stroke="#93C5FD" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'power_boot':
    default:
      return (
        <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none" aria-hidden="true">
          <circle cx="20" cy="20" r="13" fill={fillBg} stroke={stroke} strokeWidth="1.8" />
          <path d="M20 11 V20 M14.5 14.5 C12.5 17 12.8 22 16 24.8 C19.2 27.6 24 26.8 26 23.8 C28 20.8 27.5 16.5 25.5 14.5" stroke="#93C5FD" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
  }
}

export function RepairProblemSelector({
  selectedCategory,
  selectedModel,
  selectedIssue,
  hasConfirmedIssue,
  contactPhone,
  contactWhatsapp,
  lowPower2DMode,
  onSelectIssue,
  onProceedToWalkthrough,
  onChangeModel,
}: RepairProblemSelectorProps) {
  const [hoveredIssue, setHoveredIssue] = useState<RepairCategorySpec | null>(null);
  const actionPanelRef = useRef<HTMLDivElement>(null);
  const caps = useMemo(() => detectGpuCapabilities(), []);

  const deviceLabel =
    selectedCategory === 'iphone'
      ? 'iPhone'
      : selectedCategory === 'macbook'
      ? 'MacBook'
      : selectedCategory === 'ipad'
      ? 'iPad'
      : 'Apple Watch';

  const deviceCategories = useMemo(
    () => getRepairCategoriesForDevice(selectedCategory),
    [selectedCategory]
  );

  const fallbackIssue = useMemo(
    () => deviceCategories.find((c) => c.id === 'battery') ?? deviceCategories[0] ?? REPAIR_CATEGORIES[1],
    [deviceCategories]
  );

  const matchedSelectedIssue = useMemo(
    () => (selectedIssue ? deviceCategories.find((c) => c.id === selectedIssue.id) ?? null : null),
    [deviceCategories, selectedIssue]
  );

  const previewIssue = hoveredIssue ?? matchedSelectedIssue ?? fallbackIssue;

  const highlightedPartNames = useMemo(() => {
    return previewIssue.highlightedParts
      .map((id) => IPHONE_COMPONENTS.find((c) => c.id === id)?.shortLabel)
      .filter(Boolean)
      .join(' · ');
  }, [previewIssue]);

  const activeContactIssue = matchedSelectedIssue ?? previewIssue;

  const whatsappUrl = buildWhatsAppRepairUrl({
    device: deviceLabel,
    model: selectedModel.name,
    issue: activeContactIssue.title,
    customNumber: contactWhatsapp,
  });

  const telHref = buildTelHref(contactPhone);

  const handleIssueCardClick = (issue: RepairCategorySpec) => {
    onSelectIssue(issue);
    setTimeout(() => {
      actionPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 90);
  };

  return (
    <section
      id="repair-problem-selector"
      className="relative border-t border-white/10 bg-[#090B0F] py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header with active model context */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="max-w-2xl space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-blue-400">
              <span>Step 02</span>
              <span aria-hidden="true">·</span>
              <span>{selectedModel.name}</span>
              <span aria-hidden="true">·</span>
              <span>{selectedModel.modelCode}</span>
              <span aria-hidden="true">·</span>
              <span>Component Isolation</span>
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              WHAT PROBLEM ARE YOU FACING?
            </h2>
            <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
              Tap the exact repair issue for your {selectedModel.name} to highlight the internal component, inspect technician checks, and contact AppleFix directly.
            </p>
          </div>
          <button
            type="button"
            onClick={onChangeModel}
            className="self-start rounded-lg border border-white/15 bg-[#121620] px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-blue-400/50 hover:text-white whitespace-nowrap"
          >
            Change Model
          </button>
        </div>

        {/* 2-Column Split: Device-Specific Repair Category Grid + Sticky 3D Component Spotlight & Action Panel */}
        <div className="mt-10 grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
          {/* Left: Repair Categories with Component Visuals */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-7">
            {deviceCategories.map((issue) => {
              const isSelected = matchedSelectedIssue?.id === issue.id;
              return (
                <button
                  key={issue.id}
                  type="button"
                  onMouseEnter={() => setHoveredIssue(issue)}
                  onMouseLeave={() => setHoveredIssue(null)}
                  onClick={() => handleIssueCardClick(issue)}
                  aria-pressed={isSelected}
                  className={`group flex items-start gap-3.5 rounded-xl border p-4 text-left transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-[#121B2E] shadow-[0_0_0_1px_rgba(59,130,246,0.35)]'
                      : 'border-white/10 bg-[#0F131C] hover:border-white/25 hover:bg-[#131824]'
                  }`}
                >
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                      isSelected
                        ? 'border-blue-400/70 bg-blue-600/25'
                        : 'border-white/10 bg-[#141925] group-hover:border-blue-400/40'
                    }`}
                  >
                    <ComponentVisualThumbnail id={issue.id} selected={isSelected} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-sm font-semibold text-white">
                        {issue.title}
                      </h3>
                      <span className="font-mono text-[11px] tabular-nums text-slate-400 shrink-0">
                        {issue.estimatedBenchTime}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400 line-clamp-2">
                      {issue.symptomSummary}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Interactive 3D Component Spotlight & Auto-Revealed Contact Panel */}
          <div className="lg:col-span-5">
            <div className="sticky top-20 flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0E121B] p-5">
              <div>
                <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div>
                    <p className="text-xs font-medium text-blue-400">
                      Highlighted Subsystem · {highlightedPartNames}
                    </p>
                    <h3 className="mt-0.5 font-display text-lg font-bold text-white">
                      {previewIssue.title}
                    </h3>
                  </div>
                  <span className="font-mono text-xs tabular-nums text-slate-400">
                    {getResolvedRepairSteps(selectedCategory, selectedModel, previewIssue).length} Steps
                  </span>
                </div>

                {/* 3D Component Isolation Viewport */}
                <div className="mt-4 h-72 w-full overflow-hidden rounded-xl border border-white/10 bg-[#090B0F] sm:h-80">
                  {!lowPower2DMode && caps.webglAvailable ? (
                    <StudioCanvas
                      className="h-full w-full"
                      cameraPosition={
                        selectedCategory === 'macbook'
                          ? [0, 1.4, 5.4]
                          : selectedCategory === 'ipad'
                          ? [0.3, 0.35, 5.2]
                          : selectedCategory === 'watch'
                          ? [0, 0.2, 5.2]
                          : [2.2, 0.3, 5.4]
                      }
                      fov={38}
                      lazyMount={true}
                      allowVerticalPageScroll={true}
                    >
                      <StudioEnvironmentRig backgroundColor="#090b0f" fogDensity={0.015} rimIntensity={2.0} />
                      <SafeOrbitControls
                        allowVerticalPageScroll={true}
                        enablePan={false}
                        enableDamping={!caps.isSoftwareGl}
                        minDistance={3.2}
                        maxDistance={9}
                        minPolarAngle={Math.PI * 0.2}
                        maxPolarAngle={Math.PI * 0.8}
                      />

                      {selectedCategory === 'iphone' && (
                        <ExplodedIPhoneModel
                          mode="repair_bench"
                          highlightedIds={previewIssue.highlightedParts}
                          repairPose={{
                            explosionFactor: 0.35,
                            screenLiftAngle: 0.25,
                            backGlassLift: previewIssue.highlightedParts.includes('back_glass') ? 0.45 : 0,
                            batteryLift: previewIssue.highlightedParts.includes('battery') ? 0.38 : 0,
                            logicBoardLift: previewIssue.highlightedParts.includes('logic_board') ? 0.38 : 0,
                            cameraModuleLift: previewIssue.highlightedParts.includes('camera_module') ? 0.38 : 0,
                            chargingPortLift: previewIssue.highlightedParts.includes('charging_port') ? 0.35 : 0,
                            focusPart: previewIssue.highlightedParts[0] ?? 'all',
                            cameraPreset: 'front_angle',
                            tool: 'none',
                          }}
                          chassisColorHex={selectedModel.accentFinishHex}
                          visualVariant={selectedModel.visualVariant}
                          reducedMotion={caps.prefersReducedMotion}
                        />
                      )}

                      {selectedCategory === 'macbook' && (
                        <MacBook3DModel
                          highlightedIds={previewIssue.highlightedParts}
                          repairPose={{
                            explosionFactor: 0.4,
                            screenLiftAngle: 0,
                            backGlassLift: 0.35,
                            batteryLift: previewIssue.highlightedParts.includes('battery') ? 0.4 : 0,
                            logicBoardLift: previewIssue.highlightedParts.includes('logic_board') ? 0.4 : 0,
                            focusPart: previewIssue.highlightedParts[0] ?? 'all',
                            cameraPreset: 'front_angle',
                            tool: 'none',
                          }}
                          reducedMotion={caps.prefersReducedMotion}
                          mode="repair_bench"
                          modelId={selectedModel.id}
                          accentColorHex={selectedModel.accentFinishHex}
                          visualVariant={selectedModel.visualVariant}
                        />
                      )}

                      {selectedCategory === 'ipad' && (
                        <IPad3DModel
                          highlightedIds={previewIssue.highlightedParts}
                          repairPose={{
                            explosionFactor: 0.36,
                            screenLiftAngle: 0.32,
                            backGlassLift: 0,
                            batteryLift: previewIssue.highlightedParts.includes('battery') ? 0.38 : 0,
                            logicBoardLift: previewIssue.highlightedParts.includes('logic_board') ? 0.38 : 0,
                            focusPart: previewIssue.highlightedParts[0] ?? 'all',
                            cameraPreset: 'front_angle',
                            tool: 'none',
                          }}
                          reducedMotion={caps.prefersReducedMotion}
                          mode="repair_bench"
                          modelId={selectedModel.id}
                          accentColorHex={selectedModel.accentFinishHex}
                          visualVariant={selectedModel.visualVariant}
                        />
                      )}

                      {selectedCategory === 'watch' && (
                        <AppleWatch3DModel
                          highlightedIds={previewIssue.highlightedParts}
                          repairPose={{
                            explosionFactor: 0.35,
                            screenLiftAngle: 0.3,
                            backGlassLift: 0,
                            batteryLift: previewIssue.highlightedParts.includes('battery') ? 0.35 : 0,
                            logicBoardLift: previewIssue.highlightedParts.includes('logic_board') ? 0.35 : 0,
                            focusPart: previewIssue.highlightedParts[0] ?? 'all',
                            cameraPreset: 'front_angle',
                            tool: 'none',
                          }}
                          reducedMotion={caps.prefersReducedMotion}
                          mode="repair_bench"
                          modelId={selectedModel.id}
                          visualVariant={selectedModel.visualVariant}
                        />
                      )}

                      <GroundContactShadow y={-2.3} scale={4.2} opacity={0.45} />
                    </StudioCanvas>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                      <AlertTriangle className="h-8 w-8 text-blue-400" />
                      <p className="mt-2 text-sm font-medium text-white">
                        Isolated Component: {highlightedPartNames}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        2D Schematic Mode active. Enable 3D mode in the explorer above for live orbit inspection.
                      </p>
                    </div>
                  )}
                </div>

                {/* Inspection First & Replacement Criteria */}
                <div className="mt-4 space-y-3 text-xs leading-relaxed">
                  <div className="rounded-xl border border-white/10 bg-[#131824] p-3.5">
                    <p className="font-semibold text-slate-100">What Technicians Inspect First</p>
                    <p className="mt-1 text-slate-300">{previewIssue.inspectFirst}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-[#131824] p-3.5">
                    <p className="font-semibold text-slate-100">When Part Replacement Is Needed</p>
                    <p className="mt-1 text-slate-300">{previewIssue.whenReplacementNeeded}</p>
                  </div>
                </div>
              </div>

              {/* Selected Device Summary & Contact Action Panel */}
              <div
                ref={actionPanelRef}
                className={`mt-5 rounded-xl border p-4 transition-colors ${
                  hasConfirmedIssue || matchedSelectedIssue
                    ? 'border-blue-500/45 bg-[#11192A]'
                    : 'border-white/10 bg-[#121722]'
                }`}
              >
                <div className="space-y-1.5 border-b border-white/10 pb-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold uppercase tracking-wider text-slate-400">
                      YOUR SELECTED DEVICE
                    </span>
                    <span className="font-semibold text-white text-right">
                      {selectedModel.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold uppercase tracking-wider text-slate-400">
                      YOUR REPAIR ISSUE
                    </span>
                    <span className="font-semibold text-blue-400 text-right">
                      {activeContactIssue.title}
                    </span>
                  </div>
                </div>

                <div className="mt-3.5 space-y-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (!matchedSelectedIssue) onSelectIssue(activeContactIssue);
                      onProceedToWalkthrough();
                    }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
                  >
                    <Wrench className="h-4 w-4" />
                    <span>SEE HOW IT&apos;S REPAIRED</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <a
                      href={telHref}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-[#151C2B] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:border-blue-400/60 hover:bg-[#1A2234] whitespace-nowrap"
                    >
                      <Phone className="h-4 w-4 text-blue-400" />
                      <span>CALL APPLEFIX</span>
                    </a>
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#16A34A] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#15803D] whitespace-nowrap"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>WHATSAPP APPLEFIX</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
