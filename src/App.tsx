import React, { useEffect, useMemo, useState } from 'react';
import { MessageCircle, Phone } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { HeroExplodedSection } from './components/HeroExplodedSection';
import { DeviceModelSelector } from './components/DeviceModelSelector';
import { RepairProblemSelector } from './components/RepairProblemSelector';
import { RepairWalkthroughSection } from './components/RepairWalkthroughSection';
import { CustomerTrustSection } from './components/CustomerTrustSection';
import { BookingSection } from './components/BookingSection';
import { Footer } from './components/Footer';
import {
  buildTelHref,
  buildWhatsAppRepairUrl,
  getStoredBusinessContact,
  saveStoredBusinessContact,
} from './config/business';
import {
  DEVICE_CATALOG,
  type DeviceCategoryId,
  type DeviceModelSpec,
} from './data/devices';
import { REPAIR_CATEGORIES, type RepairCategorySpec } from './data/repairs';
import { getRepairCategoriesForDevice } from './data/repairSequences';
import { detectGpuCapabilities } from './three/gpuCapabilities';

class SceneErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

const STORAGE_KEY = 'applefix_diagnostic_state_v1';

function isIssueHardwareCompatible(
  catId: DeviceCategoryId,
  model: DeviceModelSpec | undefined,
  issueId: string
): boolean {
  const validCategories = getRepairCategoriesForDevice(catId);
  if (!validCategories.some((c) => c.id === issueId)) return false;
  // Classical Touch ID iPhone SE Gen 2/3 lack Face ID hardware
  if (model && model.visualVariant === 'iphone-se-classic' && issueId === 'face_id') {
    return false;
  }
  return true;
}

export default function App() {
  const caps = useMemo(() => detectGpuCapabilities(), []);

  // Default example journey: iPhone -> iPhone 15 Series -> iPhone 15 Pro -> Battery Replacement
  const defaultIphone = DEVICE_CATALOG[0];
  const defaultSeries = defaultIphone.series.find((s) => s.id === 'iphone-15') ?? defaultIphone.series[3];
  const defaultModel = defaultSeries.models.find((m) => m.id === 'iphone-15-pro') ?? defaultSeries.models[2];
  const defaultIssue = REPAIR_CATEGORIES.find((r) => r.id === 'battery') ?? REPAIR_CATEGORIES[0];

  const [selectedCategory, setSelectedCategory] = useState<DeviceCategoryId | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).category ?? 'iphone';
    } catch {
      // ignore storage errors
    }
    return 'iphone';
  });

  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).seriesId ?? defaultSeries.id;
    } catch {
      // ignore
    }
    return defaultSeries.id;
  });

  const [selectedModelId, setSelectedModelId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).modelId ?? defaultModel.id;
    } catch {
      // ignore
    }
    return defaultModel.id;
  });

  const [selectedIssueId, setSelectedIssueId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).issueId ?? defaultIssue.id;
    } catch {
      // ignore
    }
    return defaultIssue.id;
  });

  const [issueActionReady, setIssueActionReady] = useState<boolean>(true);
  const [contactConfig, setContactConfig] = useState(() => getStoredBusinessContact());

  const [lowPower2DMode, setLowPower2DMode] = useState<boolean>(
    () => !caps.webglAvailable || caps.prefersReducedMotion
  );

  // Persist user selection journey
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          category: selectedCategory,
          seriesId: selectedSeriesId,
          modelId: selectedModelId,
          issueId: selectedIssueId,
        })
      );
    } catch {
      // ignore storage errors
    }
  }, [selectedCategory, selectedSeriesId, selectedModelId, selectedIssueId]);

  const activeCategory: DeviceCategoryId = selectedCategory ?? 'iphone';

  const activeModel: DeviceModelSpec = useMemo(() => {
    const cat = DEVICE_CATALOG.find((c) => c.id === activeCategory) ?? defaultIphone;
    for (const ser of cat.series) {
      const found = ser.models.find((m) => m.id === selectedModelId);
      if (found) return found;
    }
    const fallbackSeries = cat.series.find((s) => s.id === selectedSeriesId) ?? cat.series[0];
    return fallbackSeries.models[0] ?? defaultModel;
  }, [activeCategory, selectedSeriesId, selectedModelId, defaultIphone, defaultModel]);

  const availableIssues = useMemo(
    () => getRepairCategoriesForDevice(activeCategory),
    [activeCategory]
  );

  const activeIssue: RepairCategorySpec = useMemo(() => {
    return (
      availableIssues.find((r) => r.id === selectedIssueId) ??
      availableIssues.find((r) => r.id === 'battery') ??
      availableIssues[0] ??
      defaultIssue
    );
  }, [availableIssues, selectedIssueId, defaultIssue]);

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: caps.prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
    }
  };

  const resetIssueIfIncompatible = (catId: DeviceCategoryId, model: DeviceModelSpec | undefined) => {
    if (!isIssueHardwareCompatible(catId, model, selectedIssueId)) {
      const nextValid = getRepairCategoriesForDevice(catId)[0]?.id ?? 'battery';
      setSelectedIssueId(nextValid);
      setIssueActionReady(false);
    }
  };

  const handleSelectCategory = (catId: DeviceCategoryId) => {
    setSelectedCategory(catId);
    const cat = DEVICE_CATALOG.find((c) => c.id === catId);
    if (cat && cat.series.length > 0) {
      const preferredSeries =
        catId === 'iphone'
          ? cat.series.find((s) => s.id === 'iphone-15') ?? cat.series[0]
          : cat.series[0];
      setSelectedSeriesId(preferredSeries.id);
      const preferredModel =
        catId === 'iphone'
          ? preferredSeries.models.find((m) => m.id === 'iphone-15-pro') ?? preferredSeries.models[0]
          : preferredSeries.models[0];
      if (preferredModel) setSelectedModelId(preferredModel.id);
      resetIssueIfIncompatible(catId, preferredModel);
    } else {
      resetIssueIfIncompatible(catId, undefined);
    }
  };

  const handleSelectSeries = (seriesId: string) => {
    setSelectedSeriesId(seriesId);
    const cat = DEVICE_CATALOG.find((c) => c.id === activeCategory);
    const ser = cat?.series.find((s) => s.id === seriesId);
    if (ser && ser.models.length > 0) {
      const nextModel = ser.models[0];
      setSelectedModelId(nextModel.id);
      resetIssueIfIncompatible(activeCategory, nextModel);
    }
  };

  const handleSelectModel = (model: DeviceModelSpec) => {
    setSelectedModelId(model.id);
    resetIssueIfIncompatible(activeCategory, model);
    // Automatic immediate transition to the issue-selection screen (zero manual Next step needed)
    setTimeout(() => {
      scrollToSection('repair-problem-selector');
    }, 60);
  };

  const handleUpdateContact = (phone: string, whatsapp: string) => {
    const next = {
      phoneDisplay: phone,
      whatsappNumber: whatsapp,
    };
    setContactConfig(next);
    saveStoredBusinessContact(next);
  };

  const deviceLabel =
    activeCategory === 'iphone'
      ? 'iPhone'
      : activeCategory === 'macbook'
      ? 'MacBook'
      : activeCategory === 'ipad'
      ? 'iPad'
      : 'Apple Watch';

  const mobileStickyWhatsappUrl = buildWhatsAppRepairUrl({
    device: deviceLabel,
    model: activeModel.name,
    issue: activeIssue.title,
    customNumber: contactConfig.whatsappNumber,
  });

  const mobileStickyTelHref = buildTelHref(contactConfig.phoneDisplay);

  return (
    <div className="min-h-screen overflow-x-clip bg-[#090B0F] pb-[4.25rem] text-[#E8ECF2] md:pb-0">
      <Navbar onNavigate={scrollToSection} />

      <main>
        <SceneErrorBoundary
          fallback={
            <div className="pt-24 p-8 text-center text-slate-300">
              3D viewport recovered in 2D schematic mode.
            </div>
          }
        >
          <HeroExplodedSection
            lowPower2DMode={lowPower2DMode}
            onToggleLowPowerMode={() => setLowPower2DMode((v) => !v)}
            onExploreDevice={() => {
              if (window.scrollY < 250) {
                window.scrollTo({ top: 420, behavior: 'smooth' });
              }
            }}
            onDiagnoseDevice={() => scrollToSection('device-selector')}
          />
        </SceneErrorBoundary>

        <DeviceModelSelector
          selectedCategory={selectedCategory}
          selectedSeriesId={selectedSeriesId}
          selectedModel={activeModel}
          lowPower2DMode={lowPower2DMode}
          onSelectCategory={handleSelectCategory}
          onSelectSeries={handleSelectSeries}
          onSelectModel={handleSelectModel}
          onResetToCategory={() => setSelectedCategory(null)}
          onContinueToProblems={() => scrollToSection('repair-problem-selector')}
        />

        <RepairProblemSelector
          selectedCategory={activeCategory}
          selectedModel={activeModel}
          selectedIssue={activeIssue}
          hasConfirmedIssue={issueActionReady}
          contactPhone={contactConfig.phoneDisplay}
          contactWhatsapp={contactConfig.whatsappNumber}
          lowPower2DMode={lowPower2DMode}
          onSelectIssue={(issue) => {
            setSelectedIssueId(issue.id);
            setIssueActionReady(true);
          }}
          onProceedToWalkthrough={() => scrollToSection('repair-walkthrough')}
          onChangeModel={() => scrollToSection('device-selector')}
        />

        <RepairWalkthroughSection
          selectedCategory={activeCategory}
          selectedModel={activeModel}
          selectedIssue={activeIssue}
          lowPower2DMode={lowPower2DMode}
          onChangeIssue={() => scrollToSection('repair-problem-selector')}
          onProceedToBooking={() => scrollToSection('book-repair')}
        />

        <CustomerTrustSection />

        <BookingSection
          selectedCategory={activeCategory}
          selectedModel={activeModel}
          selectedIssue={activeIssue}
          contactPhone={contactConfig.phoneDisplay}
          contactWhatsapp={contactConfig.whatsappNumber}
          onUpdateContact={handleUpdateContact}
          onEditSelection={scrollToSection}
        />
      </main>

      <Footer onNavigate={scrollToSection} />

      {/* Mobile Non-Overlapping Sticky Contact Bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/15 bg-[#0B0E14]/95 px-3 py-2.5 shadow-2xl md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-2 gap-2.5">
          <a
            href={mobileStickyTelHref}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-[#151C2B] px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:border-blue-400/50 whitespace-nowrap"
          >
            <Phone className="h-3.5 w-3.5 text-blue-400" />
            <span>Call AppleFix</span>
          </a>
          <a
            href={mobileStickyWhatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#16A34A] px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#15803D] whitespace-nowrap"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>WhatsApp AppleFix</span>
          </a>
        </div>
      </div>
    </div>
  );
}
