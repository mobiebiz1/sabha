import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Check, ChevronRight } from 'lucide-react';
import {
  DEVICE_CATALOG,
  type DeviceCategoryId,
  type DeviceModelSpec,
  type DeviceSeriesSpec,
} from '../data/devices';
import iphoneCardImg from '../assets/images/card_iphone_17_pro_1794579594570.jpg';
import macbookCardImg from '../assets/images/card_macbook_pro_1794579594562.jpg';
import ipadCardImg from '../assets/images/card_ipad_pro_1794579595310.jpg';
import watchCardImg from '../assets/images/card_apple_watch_ultra_1794579594483.jpg';

const CARD_PRODUCT_IMAGES: Record<DeviceCategoryId, { src: string; alt: string }> = {
  iphone: {
    src: iphoneCardImg,
    alt: 'Natural Titanium iPhone',
  },
  macbook: {
    src: macbookCardImg,
    alt: 'MacBook Pro and Air laptops',
  },
  ipad: {
    src: ipadCardImg,
    alt: 'Space Black iPad Pro',
  },
  watch: {
    src: watchCardImg,
    alt: 'Titanium Apple Watch Ultra',
  },
};

const MODEL_SCREEN_HEADINGS: Record<DeviceCategoryId, string> = {
  iphone: 'Choose Your iPhone Model',
  macbook: 'Choose Your MacBook Model',
  ipad: 'Choose Your iPad Model',
  watch: 'Choose Your Apple Watch Model',
};

interface DeviceModelSelectorProps {
  selectedCategory: DeviceCategoryId | null;
  selectedSeriesId: string | null;
  selectedModel: DeviceModelSpec | null;
  lowPower2DMode: boolean;
  onSelectCategory: (cat: DeviceCategoryId) => void;
  onSelectSeries: (seriesId: string) => void;
  onSelectModel: (model: DeviceModelSpec) => void;
  onResetToCategory: () => void;
  onContinueToProblems: () => void;
}

interface FlightOriginState {
  categoryId: DeviceCategoryId;
  left: number;
  top: number;
  width: number;
  height: number;
  deltaX: number;
  deltaY: number;
}

function DeviceFallbackVector({ categoryId }: { categoryId: DeviceCategoryId }) {
  if (categoryId === 'iphone') {
    return (
      <svg viewBox="0 0 120 160" className="h-28 w-auto text-slate-300 sm:h-36" fill="none" aria-hidden="true">
        <rect x="26" y="10" width="68" height="140" rx="14" stroke="currentColor" strokeWidth="3" fill="#121824" />
        <rect x="46" y="18" width="28" height="6" rx="3" fill="#090B0F" />
        <rect x="33" y="28" width="54" height="114" rx="8" fill="#1e293b" />
      </svg>
    );
  }
  if (categoryId === 'macbook') {
    return (
      <svg viewBox="0 0 200 130" className="h-24 w-auto text-slate-300 sm:h-32" fill="none" aria-hidden="true">
        <rect x="26" y="16" width="148" height="86" rx="8" stroke="currentColor" strokeWidth="3" fill="#121824" />
        <rect x="34" y="24" width="132" height="70" rx="3" fill="#1e293b" />
        <path d="M12 104 H188 L178 116 H22 Z" stroke="currentColor" strokeWidth="2.5" fill="#171e2c" />
      </svg>
    );
  }
  if (categoryId === 'ipad') {
    return (
      <svg viewBox="0 0 180 140" className="h-28 w-auto text-slate-300 sm:h-36" fill="none" aria-hidden="true">
        <rect x="18" y="16" width="144" height="108" rx="12" stroke="currentColor" strokeWidth="3" fill="#121824" />
        <rect x="28" y="26" width="124" height="88" rx="6" fill="#1e293b" />
        <circle cx="90" cy="21" r="2" fill="#64748b" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 140 160" className="h-28 w-auto text-slate-300 sm:h-36" fill="none" aria-hidden="true">
      <rect x="48" y="8" width="44" height="28" rx="6" fill="#c2410c" opacity="0.85" />
      <rect x="48" y="124" width="44" height="28" rx="6" fill="#c2410c" opacity="0.85" />
      <rect x="34" y="34" width="72" height="92" rx="20" stroke="currentColor" strokeWidth="3" fill="#121824" />
      <rect x="42" y="42" width="56" height="76" rx="14" fill="#1e293b" />
      <rect x="107" y="54" width="7" height="18" rx="3" fill="currentColor" />
    </svg>
  );
}

function DeviceArtwork({
  categoryId,
  className = '',
}: {
  categoryId: DeviceCategoryId;
  className?: string;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const asset = CARD_PRODUCT_IMAGES[categoryId];

  if (imgFailed) {
    return (
      <div className={`flex h-full w-full items-center justify-center ${className}`}>
        <DeviceFallbackVector categoryId={categoryId} />
      </div>
    );
  }

  return (
    <img
      src={asset.src}
      alt={asset.alt}
      loading="eager"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setImgFailed(true)}
      className={`h-full w-full object-contain object-center select-none ${className}`}
    />
  );
}

export function DeviceModelSelector({
  selectedCategory,
  selectedSeriesId,
  selectedModel,
  lowPower2DMode: _lowPower2DMode,
  onSelectCategory,
  onSelectSeries,
  onSelectModel,
  onResetToCategory,
  onContinueToProblems,
}: DeviceModelSelectorProps) {
  const [viewStage, setViewStage] = useState<'grid' | 'models'>('grid');
  const [flightState, setFlightState] = useState<FlightOriginState | null>(null);
  const [dropRevealKey, setDropRevealKey] = useState(0);

  const sectionRef = useRef<HTMLElement>(null);
  const cardVisualRefs = useRef<Partial<Record<DeviceCategoryId, HTMLDivElement | null>>>({});
  const modelsSectionRef = useRef<HTMLDivElement>(null);
  const transitionTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  const activeCategorySpec = useMemo(
    () => DEVICE_CATALOG.find((c) => c.id === selectedCategory) ?? null,
    [selectedCategory]
  );

  const activeSeriesSpec: DeviceSeriesSpec | null = useMemo(() => {
    if (!activeCategorySpec) return null;
    return (
      activeCategorySpec.series.find((s) => s.id === selectedSeriesId) ??
      activeCategorySpec.series[0] ??
      null
    );
  }, [activeCategorySpec, selectedSeriesId]);

  const scrollSectionIntoFocus = () => {
    const el = sectionRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < 56 || rect.top > window.innerHeight * 0.35) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCategoryClick = (id: DeviceCategoryId) => {
    if (flightState) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      onSelectCategory(id);
      setDropRevealKey((k) => k + 1);
      setViewStage('models');
      scrollSectionIntoFocus();
      return;
    }

    const visualEl = cardVisualRefs.current[id];
    if (!visualEl) {
      onSelectCategory(id);
      setDropRevealKey((k) => k + 1);
      setViewStage('models');
      scrollSectionIntoFocus();
      return;
    }

    const rect = visualEl.getBoundingClientRect();
    const startCenterX = rect.left + rect.width / 2;
    const startCenterY = rect.top + rect.height / 2;
    const targetCenterX = window.innerWidth / 2;
    const targetTopEntryY = Math.max(115, Math.min(window.innerHeight * 0.23, 195));

    setFlightState({
      categoryId: id,
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      deltaX: targetCenterX - startCenterX,
      deltaY: targetTopEntryY - startCenterY,
    });

    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current);
    }

    transitionTimerRef.current = window.setTimeout(() => {
      onSelectCategory(id);
      setDropRevealKey((k) => k + 1);
      setViewStage('models');
      setFlightState(null);
      scrollSectionIntoFocus();
    }, 320);
  };

  const handleBackToAllDevices = () => {
    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    setFlightState(null);
    setViewStage('grid');
    onResetToCategory();
    scrollSectionIntoFocus();
  };

  const handleSeriesClick = (seriesId: string) => {
    onSelectSeries(seriesId);
    window.setTimeout(() => {
      modelsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 90);
  };

  const showModelStage = viewStage === 'models' && activeCategorySpec !== null;

  return (
    <section
      id="device-selector"
      ref={sectionRef}
      className="relative scroll-mt-16 border-t border-white/10 bg-[#0B0E14] py-16 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {!showModelStage ? (
          <motion.div
            key="four-device-grid"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto max-w-4xl"
          >
            <h2 className="text-center font-display text-2xl font-bold tracking-tight text-white sm:text-4xl">
              Choose Your Device
            </h2>

            {/* Strict 2 × 2 Grid on Desktop & Mobile: iPhone, MacBook, iPad, Apple Watch */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-6">
              {DEVICE_CATALOG.map((cat) => {
                const isLifting = flightState?.categoryId === cat.id;
                const isDimmed = flightState !== null && !isLifting;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryClick(cat.id)}
                    aria-label={`Select ${cat.name}`}
                    className={`group relative flex cursor-pointer flex-col items-center rounded-2xl border border-white/10 bg-[#0F131C] p-3 text-center transition-all duration-200 ease-out hover:-translate-y-1.5 hover:border-blue-400/45 hover:bg-[#131824] hover:shadow-[0_24px_54px_-18px_rgba(37,99,235,0.28)] active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 sm:p-6 ${
                      isDimmed ? 'opacity-20 scale-[0.97]' : 'opacity-100'
                    }`}
                  >
                    <div
                      ref={(el) => {
                        cardVisualRefs.current[cat.id] = el;
                      }}
                      className={`relative flex aspect-[4/3] min-h-[124px] w-full items-center justify-center overflow-hidden rounded-xl bg-[#090B0F] p-2 sm:min-h-[210px] sm:p-4 ${
                        isLifting ? 'opacity-0' : 'opacity-100'
                      }`}
                    >
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(59,130,246,0.14),transparent_68%)] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                      />
                      <DeviceArtwork
                        categoryId={cat.id}
                        className="relative z-10 transition-transform duration-300 ease-out group-hover:scale-[1.06]"
                      />
                    </div>

                    <span className="mt-3 font-display text-base font-semibold tracking-tight text-white transition-colors group-hover:text-blue-200 sm:mt-4 sm:text-xl">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={`model-selection-${activeCategorySpec.id}-${dropRevealKey}`}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            className="mx-auto max-w-6xl"
          >
              {/* Back Navigation to 2 × 2 Grid */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <button
                  type="button"
                  onClick={handleBackToAllDevices}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#121722] px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-blue-400/50 hover:text-white sm:text-sm"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>All Devices</span>
                </button>
                <span className="text-xs font-medium text-slate-400 sm:text-sm">
                  {activeCategorySpec.name}
                </span>
              </div>

              {/* Dropped Device Hero Pedestal + Dynamic Heading */}
              <div className="relative mt-6 flex flex-col items-center text-center sm:mt-8">
                <div className="relative flex h-44 w-64 items-center justify-center sm:h-56 sm:w-80">
                  {/* Soft landing shadow beneath device */}
                  <motion.div
                    aria-hidden="true"
                    initial={{ opacity: 0.1, scaleX: 0.55 }}
                    animate={{
                      opacity: [0.1, 0.62, 0.42, 0.56, 0.52],
                      scaleX: [0.55, 1.04, 0.9, 1.01, 1],
                    }}
                    transition={{
                      duration: 0.64,
                      times: [0, 0.54, 0.74, 0.89, 1],
                    }}
                    className="pointer-events-none absolute bottom-1 h-5 w-44 rounded-full bg-blue-500/20 blur-md sm:w-56"
                  />

                  {/* Device falling smoothly from the top with a subtle landing bounce */}
                  <motion.div
                    key={`dropped-device-${activeCategorySpec.id}-${dropRevealKey}`}
                    initial={{ y: -150, scale: 1.14, opacity: 0.9 }}
                    animate={{
                      y: [-150, 10, -5, 2, 0],
                      scale: [1.14, 0.985, 1.015, 0.996, 1],
                      opacity: [0.9, 1, 1, 1, 1],
                    }}
                    transition={{
                      duration: 0.64,
                      times: [0, 0.54, 0.74, 0.89, 1],
                      ease: 'easeOut',
                    }}
                    className="relative z-10 flex h-full w-full items-center justify-center rounded-2xl border border-white/10 bg-[#090B0F] p-3 shadow-2xl"
                  >
                    <DeviceArtwork categoryId={activeCategorySpec.id} />
                  </motion.div>
                </div>

                <motion.h2
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.34, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="mt-5 font-display text-2xl font-bold tracking-tight text-white sm:text-4xl"
                >
                  {MODEL_SCREEN_HEADINGS[activeCategorySpec.id]}
                </motion.h2>
              </div>

              {/* Existing Series & Exact Model Selection Lists (Preserved Intact) */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.36, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="mt-8 rounded-2xl border border-white/10 bg-[#0F131C] p-5 sm:p-8"
              >
                {/* Breadcrumb Summary */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-semibold text-white">{activeCategorySpec.name}</span>
                    {activeSeriesSpec && (
                      <>
                        <span className="text-slate-600">/</span>
                        <span className="font-medium text-blue-400">{activeSeriesSpec.name}</span>
                      </>
                    )}
                    {selectedModel && (
                      <>
                        <span className="text-slate-600">/</span>
                        <span className="font-semibold text-slate-100">{selectedModel.name}</span>
                      </>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">
                    Select series &amp; exact model
                  </span>
                </div>

                {/* Series / Lineup Selector Tabs */}
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-slate-200">
                    {activeCategorySpec.id === 'iphone'
                      ? '1. Choose iPhone Series'
                      : activeCategorySpec.id === 'macbook'
                      ? '1. Choose MacBook Lineup'
                      : activeCategorySpec.id === 'ipad'
                      ? '1. Choose iPad Lineup'
                      : '1. Choose Apple Watch Lineup'}
                  </h3>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
                    {activeCategorySpec.series.map((series) => {
                      const active = activeSeriesSpec?.id === series.id;
                      return (
                        <button
                          key={series.id}
                          type="button"
                          onClick={() => handleSeriesClick(series.id)}
                          className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition-colors ${
                            active
                              ? 'border-blue-500 bg-blue-600/15 text-white'
                              : 'border-white/10 bg-[#141925] text-slate-300 hover:border-white/25 hover:text-white'
                          }`}
                        >
                          <span className="font-display text-sm font-semibold">{series.name}</span>
                          <span className="mt-1 text-xs text-slate-400 line-clamp-1">
                            {series.models.length} models
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Individual Model Cards */}
                {activeSeriesSpec && (
                  <div ref={modelsSectionRef} className="mt-8">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="text-sm font-semibold text-slate-200">
                        2. Tap Exact Model to Choose Repair Issue — {activeSeriesSpec.name}
                      </h3>
                      <span className="text-xs text-slate-400">{activeSeriesSpec.subtitle}</span>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {activeSeriesSpec.models.map((model) => {
                        const active = selectedModel?.id === model.id;
                        return (
                          <button
                            key={model.id}
                            type="button"
                            onClick={() => onSelectModel(model)}
                            className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-colors ${
                              active
                                ? 'border-blue-500 bg-blue-600/15'
                                : 'border-white/10 bg-[#141925] hover:border-white/25'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-display text-base font-semibold text-white">
                                  {model.name}
                                </span>
                                {active && <Check className="h-4 w-4 shrink-0 text-blue-400" />}
                              </div>
                              <p className="mt-1 font-mono text-[11px] text-blue-300/90">
                                {model.modelCode}
                              </p>
                              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
                                <span className="tabular-nums">{model.year}</span>
                                <span aria-hidden="true">·</span>
                                <span>{model.chip}</span>
                                <span aria-hidden="true">·</span>
                                <span>{model.portType}</span>
                              </div>
                              <p className="mt-2 text-xs text-slate-400">
                                {model.screenSize}
                                {model.connectivity ? ` · ${model.connectivity}` : ''}
                              </p>
                            </div>
                            <div className="mt-3 border-t border-white/10 pt-2.5 text-xs text-slate-300">
                              {model.chassisMaterial}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Selected Model Architecture Summary & Continue Button */}
                {selectedModel && (
                  <div className="mt-6 flex flex-col justify-between gap-4 rounded-xl border border-blue-500/30 bg-[#111928] p-4 sm:flex-row sm:items-center">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-blue-300">
                        <span>Selected Architecture</span>
                        <span aria-hidden="true">·</span>
                        <span>{selectedModel.name}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{selectedModel.modelCode}</span>
                      </div>
                      <p className="text-sm text-slate-200">{selectedModel.repairNotes}</p>
                    </div>
                    <button
                      type="button"
                      onClick={onContinueToProblems}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 whitespace-nowrap"
                    >
                      <span>Select Repair Issue</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
      </div>

      {/* Floating Device Flight Overlay: Lifts out of card -> moves smoothly to horizontal center & rises toward top entry */}
      {flightState && (
        <motion.div
          key={`flight-${flightState.categoryId}`}
          aria-hidden="true"
          initial={{
            x: 0,
            y: 0,
            scale: 1,
            opacity: 1,
          }}
          animate={{
            x: flightState.deltaX,
            y: flightState.deltaY,
            scale: 1.18,
            opacity: 1,
          }}
          transition={{
            duration: 0.31,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{
            position: 'fixed',
            left: flightState.left,
            top: flightState.top,
            width: flightState.width,
            height: flightState.height,
            zIndex: 60,
            pointerEvents: 'none',
          }}
          className="flex items-center justify-center rounded-2xl border border-blue-400/50 bg-[#090B0F] p-3 shadow-[0_32px_70px_-14px_rgba(37,99,235,0.48)]"
        >
          <DeviceArtwork categoryId={flightState.categoryId} />
        </motion.div>
      )}
    </section>
  );
}
