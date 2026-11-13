import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import {
  createAppleLogoGeometries,
  createRoundedFrameShape,
  createRoundedRectShape,
} from './AssetRegistry';
import { detectGpuCapabilities } from './gpuCapabilities';
import {
  createBatteryTexture,
  createBrushedMetalRoughnessTexture,
  createCrackedGlassOverlayTexture,
  createLogicBoardTexture,
  createOledDisplayTexture,
} from './proceduralTextures';

export type LodLevel = 'high' | 'medium' | 'low';

export interface IPhoneLodConfig {
  level: LodLevel;
  curveSegments: number;
  frameCurveSegments: number;
  bevelSegments: number;
  logoCurveSegments: number;
  logoBevelSegments: number;
  cylinderSegments: number;
  torusRadialSegments: number;
  torusTubularSegments: number;
  capsuleSegs: number;
  textureScale: number;
  anisotropy: number;
  showMicroFasteners: boolean;
  showSecondaryDetails: boolean;
  enableClearcoat: boolean;
  castShadows: boolean;
}

export const IPHONE_LOD_CONFIGS: Record<LodLevel, IPhoneLodConfig> = {
  high: {
    level: 'high',
    curveSegments: 10,
    frameCurveSegments: 12,
    bevelSegments: 2,
    logoCurveSegments: 24,
    logoBevelSegments: 2,
    cylinderSegments: 24,
    torusRadialSegments: 10,
    torusTubularSegments: 36,
    capsuleSegs: 12,
    textureScale: 1,
    anisotropy: 4,
    showMicroFasteners: true,
    showSecondaryDetails: true,
    enableClearcoat: true,
    castShadows: true,
  },
  medium: {
    level: 'medium',
    curveSegments: 5,
    frameCurveSegments: 6,
    bevelSegments: 1,
    logoCurveSegments: 10,
    logoBevelSegments: 1,
    cylinderSegments: 14,
    torusRadialSegments: 6,
    torusTubularSegments: 20,
    capsuleSegs: 8,
    textureScale: 0.5,
    anisotropy: 2,
    showMicroFasteners: false,
    showSecondaryDetails: true,
    enableClearcoat: false,
    castShadows: true,
  },
  low: {
    level: 'low',
    curveSegments: 3,
    frameCurveSegments: 4,
    bevelSegments: 0,
    logoCurveSegments: 6,
    logoBevelSegments: 0,
    cylinderSegments: 8,
    torusRadialSegments: 4,
    torusTubularSegments: 12,
    capsuleSegs: 4,
    textureScale: 0.5,
    anisotropy: 1,
    showMicroFasteners: false,
    showSecondaryDetails: false,
    enableClearcoat: false,
    castShadows: false,
  },
};

export interface DeviceLodProfile {
  initialLod: LodLevel;
  maxAllowedLod: LodLevel;
  isMobileViewport: boolean;
  isLowMemoryOrCpu: boolean;
  isSoftwareGl: boolean;
}

const LOD_ORDER: Record<LodLevel, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const ORDER_TO_LOD: LodLevel[] = ['high', 'medium', 'low'];

export function clampLodLevel(level: LodLevel, maxAllowedLod: LodLevel): LodLevel {
  const rank = Math.max(LOD_ORDER[level], LOD_ORDER[maxAllowedLod]);
  return ORDER_TO_LOD[Math.min(rank, 2)];
}

export function detectDeviceLodProfile(): DeviceLodProfile {
  const caps = detectGpuCapabilities();
  if (typeof window === 'undefined') {
    return {
      initialLod: 'medium',
      maxAllowedLod: 'high',
      isMobileViewport: false,
      isLowMemoryOrCpu: false,
      isSoftwareGl: caps.isSoftwareGl,
    };
  }

  const touchPoints = typeof navigator !== 'undefined' ? navigator.maxTouchPoints || 0 : 0;
  const isMobileViewport =
    window.innerWidth < 1024 || (touchPoints > 1 && window.innerWidth < 1280);

  const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
  const deviceMemory =
    typeof navigator !== 'undefined'
      ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory
      : undefined;
  const isLowMemoryOrCpu =
    cores <= 4 || (typeof deviceMemory === 'number' && deviceMemory <= 4);

  if (caps.isSoftwareGl) {
    return {
      initialLod: 'low',
      maxAllowedLod: 'medium',
      isMobileViewport,
      isLowMemoryOrCpu,
      isSoftwareGl: true,
    };
  }

  if (isMobileViewport) {
    return {
      initialLod: isLowMemoryOrCpu ? 'low' : 'medium',
      maxAllowedLod: isLowMemoryOrCpu ? 'medium' : 'high',
      isMobileViewport: true,
      isLowMemoryOrCpu,
      isSoftwareGl: false,
    };
  }

  return {
    initialLod: 'high',
    maxAllowedLod: 'high',
    isMobileViewport: false,
    isLowMemoryOrCpu,
    isSoftwareGl: false,
  };
}

const LOD_HYSTERESIS = 0.45;

export function selectLodForDistance(
  distance: number,
  currentLod: LodLevel,
  maxAllowedLod: LodLevel,
  isMobileViewport: boolean,
  performanceDowngradeSteps = 0
): LodLevel {
  const highToMed = isMobileViewport ? 4.2 : 6.8;
  const medToLow = isMobileViewport ? 7.4 : 9.4;

  let next: LodLevel = currentLod;

  if (currentLod === 'high') {
    if (distance > medToLow + LOD_HYSTERESIS) {
      next = 'low';
    } else if (distance > highToMed + LOD_HYSTERESIS) {
      next = 'medium';
    }
  } else if (currentLod === 'medium') {
    if (distance < highToMed - LOD_HYSTERESIS) {
      next = 'high';
    } else if (distance > medToLow + LOD_HYSTERESIS) {
      next = 'low';
    }
  } else {
    if (distance < highToMed - LOD_HYSTERESIS) {
      next = 'high';
    } else if (distance < medToLow - LOD_HYSTERESIS) {
      next = 'medium';
    }
  }

  const steppedRank = Math.min(2, LOD_ORDER[next] + Math.max(0, performanceDowngradeSteps));
  return clampLodLevel(ORDER_TO_LOD[steppedRank], maxAllowedLod);
}

const PHONE_W = 1.62;
const PHONE_H = 3.34;
const PHONE_R = 0.25;

export interface IPhoneLodGeometries {
  backGlassGeo: THREE.ExtrudeGeometry;
  plateauGeo: THREE.ExtrudeGeometry;
  squarePlateauGeo: THREE.ExtrudeGeometry;
  pillPlateauGeo: THREE.ExtrudeGeometry;
  titaniumBandGeo: THREE.ExtrudeGeometry;
  middleFrameGeo: THREE.ExtrudeGeometry;
  displayBezelGeo: THREE.ExtrudeGeometry;
  oledGeo: THREE.ExtrudeGeometry;
  batteryGeo: THREE.ExtrudeGeometry;
  boardGeo: THREE.ExtrudeGeometry;
  logoBodyGeo: THREE.ExtrudeGeometry;
  logoLeafGeo: THREE.ExtrudeGeometry;
}

export interface IPhoneTextureSet {
  brushed: THREE.CanvasTexture;
  oled: THREE.CanvasTexture;
  crack: THREE.CanvasTexture;
  batteryOld: THREE.CanvasTexture;
  batteryNew: THREE.CanvasTexture;
  pcb: THREE.CanvasTexture;
}

interface PoolEntry<T> {
  value: T;
  refCount: number;
  cleanupTimer?: ReturnType<typeof setTimeout>;
}

const geometryPool = new Map<LodLevel, PoolEntry<IPhoneLodGeometries>>();
const texturePool = new Map<string, PoolEntry<IPhoneTextureSet>>();

function buildIPhoneLodGeometries(cfg: IPhoneLodConfig): IPhoneLodGeometries {
  const bevelEnabled = cfg.bevelSegments > 0;
  const bodyShape = createRoundedRectShape(PHONE_W, PHONE_H, PHONE_R);
  const frameShape = createRoundedFrameShape(
    PHONE_W + 0.06,
    PHONE_H + 0.06,
    PHONE_R + 0.02,
    0.085
  );
  const midFrameShape = createRoundedFrameShape(
    PHONE_W - 0.04,
    PHONE_H - 0.04,
    PHONE_R - 0.02,
    0.13
  );
  const bezelShape = createRoundedFrameShape(
    PHONE_W - 0.02,
    PHONE_H - 0.02,
    PHONE_R - 0.01,
    0.048
  );
  const screenShape = createRoundedRectShape(PHONE_W - 0.06, PHONE_H - 0.06, PHONE_R - 0.025);
  const plateauShape = createRoundedRectShape(1.4, 0.72, 0.16);
  const squarePlateauShape = createRoundedRectShape(0.76, 0.76, 0.14);
  const pillPlateauShape = createRoundedRectShape(0.36, 0.68, 0.16);
  const batteryShape = createRoundedRectShape(0.84, 1.54, 0.06);
  const boardShape = createRoundedRectShape(0.54, 1.8, 0.04);

  // Preserve identical total Z-thickness when bevelEnabled is false so flush inlays (Apple logo, plateau) never float or clip.
  const backGlassGeo = new THREE.ExtrudeGeometry(bodyShape, {
    depth: bevelEnabled ? 0.03 : 0.05,
    bevelEnabled,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: cfg.bevelSegments,
    curveSegments: cfg.curveSegments,
  });
  backGlassGeo.center();

  const plateauGeo = new THREE.ExtrudeGeometry(plateauShape, {
    depth: bevelEnabled ? 0.035 : 0.059,
    bevelEnabled,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: cfg.bevelSegments,
    curveSegments: cfg.curveSegments,
  });
  plateauGeo.center();

  const squarePlateauGeo = new THREE.ExtrudeGeometry(squarePlateauShape, {
    depth: bevelEnabled ? 0.035 : 0.059,
    bevelEnabled,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: cfg.bevelSegments,
    curveSegments: cfg.curveSegments,
  });
  squarePlateauGeo.center();

  const pillPlateauGeo = new THREE.ExtrudeGeometry(pillPlateauShape, {
    depth: bevelEnabled ? 0.032 : 0.052,
    bevelEnabled,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: cfg.bevelSegments,
    curveSegments: cfg.curveSegments,
  });
  pillPlateauGeo.center();

  const titaniumBandGeo = new THREE.ExtrudeGeometry(frameShape, {
    depth: bevelEnabled ? 0.22 : 0.252,
    bevelEnabled,
    bevelThickness: 0.016,
    bevelSize: 0.014,
    bevelSegments: cfg.bevelSegments,
    curveSegments: cfg.frameCurveSegments,
  });
  titaniumBandGeo.center();

  const middleFrameGeo = new THREE.ExtrudeGeometry(midFrameShape, {
    depth: bevelEnabled ? 0.085 : 0.101,
    bevelEnabled,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: cfg.bevelSegments,
    curveSegments: cfg.curveSegments,
  });
  middleFrameGeo.center();

  const displayBezelGeo = new THREE.ExtrudeGeometry(bezelShape, {
    depth: bevelEnabled ? 0.036 : 0.048,
    bevelEnabled,
    bevelThickness: 0.006,
    bevelSize: 0.006,
    bevelSegments: cfg.bevelSegments,
    curveSegments: cfg.curveSegments,
  });
  displayBezelGeo.center();

  const oledGeo = new THREE.ExtrudeGeometry(screenShape, {
    depth: 0.026,
    bevelEnabled: false,
    curveSegments: cfg.curveSegments,
  });
  oledGeo.center();

  const batteryGeo = new THREE.ExtrudeGeometry(batteryShape, {
    depth: bevelEnabled ? 0.08 : 0.096,
    bevelEnabled,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: cfg.bevelSegments,
    curveSegments: Math.max(3, cfg.curveSegments - 2),
  });
  batteryGeo.center();

  const boardGeo = new THREE.ExtrudeGeometry(boardShape, {
    depth: 0.034,
    bevelEnabled: false,
    curveSegments: Math.max(3, cfg.curveSegments - 4),
  });
  boardGeo.center();

  const { logoBodyGeo, logoLeafGeo } = createAppleLogoGeometries(
    0.35,
    cfg.logoCurveSegments,
    cfg.logoBevelSegments
  );

  return {
    backGlassGeo,
    plateauGeo,
    squarePlateauGeo,
    pillPlateauGeo,
    titaniumBandGeo,
    middleFrameGeo,
    displayBezelGeo,
    oledGeo,
    batteryGeo,
    boardGeo,
    logoBodyGeo,
    logoLeafGeo,
  };
}

function disposeGeometriesBundle(bundle: IPhoneLodGeometries) {
  Object.values(bundle).forEach((g) => g.dispose());
}

function disposeTextureBundle(bundle: IPhoneTextureSet) {
  Object.values(bundle).forEach((t) => t.dispose());
}

export function getOrBuildIPhoneLodGeometries(level: LodLevel): IPhoneLodGeometries {
  const existing = geometryPool.get(level);
  if (existing) {
    if (existing.cleanupTimer) {
      clearTimeout(existing.cleanupTimer);
      existing.cleanupTimer = undefined;
    }
    return existing.value;
  }

  const value = buildIPhoneLodGeometries(IPHONE_LOD_CONFIGS[level]);
  geometryPool.set(level, { value, refCount: 0 });
  return value;
}

export function retainIPhoneLodGeometries(level: LodLevel): IPhoneLodGeometries {
  const value = getOrBuildIPhoneLodGeometries(level);
  const entry = geometryPool.get(level)!;
  if (entry.cleanupTimer) {
    clearTimeout(entry.cleanupTimer);
    entry.cleanupTimer = undefined;
  }
  entry.refCount += 1;
  return value;
}

export function releaseIPhoneLodGeometries(level: LodLevel, immediate = false) {
  const entry = geometryPool.get(level);
  if (!entry) return;
  entry.refCount = Math.max(0, entry.refCount - 1);
  if (entry.refCount > 0) return;

  if (immediate) {
    if (entry.cleanupTimer) clearTimeout(entry.cleanupTimer);
    disposeGeometriesBundle(entry.value);
    geometryPool.delete(level);
    return;
  }

  if (!entry.cleanupTimer) {
    entry.cleanupTimer = setTimeout(() => {
      const current = geometryPool.get(level);
      if (current && current.refCount <= 0) {
        disposeGeometriesBundle(current.value);
        geometryPool.delete(level);
      }
    }, 350);
  }
}

export function acquireIPhoneLodGeometries(level: LodLevel): IPhoneLodGeometries {
  return retainIPhoneLodGeometries(level);
}

function getTexturePoolKey(resolutionScale: number, anisotropy: number): string {
  return `${resolutionScale.toFixed(2)}:${anisotropy}`;
}

export function getOrBuildIPhoneTextureSet(
  resolutionScale: number,
  anisotropy: number
): IPhoneTextureSet | null {
  if (typeof document === 'undefined') return null;

  const key = getTexturePoolKey(resolutionScale, anisotropy);
  const existing = texturePool.get(key);
  if (existing) {
    if (existing.cleanupTimer) {
      clearTimeout(existing.cleanupTimer);
      existing.cleanupTimer = undefined;
    }
    return existing.value;
  }

  const value: IPhoneTextureSet = {
    brushed: createBrushedMetalRoughnessTexture(anisotropy, resolutionScale),
    oled: createOledDisplayTexture(anisotropy, resolutionScale),
    crack: createCrackedGlassOverlayTexture(anisotropy, resolutionScale),
    batteryOld: createBatteryTexture('old', anisotropy, resolutionScale),
    batteryNew: createBatteryTexture('new', anisotropy, resolutionScale),
    pcb: createLogicBoardTexture(anisotropy, resolutionScale),
  };
  texturePool.set(key, { value, refCount: 0 });
  return value;
}

export function retainIPhoneTextureSet(
  resolutionScale: number,
  anisotropy: number
): IPhoneTextureSet | null {
  const value = getOrBuildIPhoneTextureSet(resolutionScale, anisotropy);
  if (!value) return null;

  const key = getTexturePoolKey(resolutionScale, anisotropy);
  const entry = texturePool.get(key)!;
  if (entry.cleanupTimer) {
    clearTimeout(entry.cleanupTimer);
    entry.cleanupTimer = undefined;
  }
  entry.refCount += 1;
  return value;
}

export function releaseIPhoneTextureSet(
  resolutionScale: number,
  anisotropy: number,
  immediate = false
) {
  const key = getTexturePoolKey(resolutionScale, anisotropy);
  const entry = texturePool.get(key);
  if (!entry) return;
  entry.refCount = Math.max(0, entry.refCount - 1);
  if (entry.refCount > 0) return;

  if (immediate) {
    if (entry.cleanupTimer) clearTimeout(entry.cleanupTimer);
    disposeTextureBundle(entry.value);
    texturePool.delete(key);
    return;
  }

  if (!entry.cleanupTimer) {
    entry.cleanupTimer = setTimeout(() => {
      const current = texturePool.get(key);
      if (current && current.refCount <= 0) {
        disposeTextureBundle(current.value);
        texturePool.delete(key);
      }
    }, 350);
  }
}

export function getLodPoolStats(): {
  activeGeometryTiers: LodLevel[];
  activeTextureKeys: string[];
} {
  return {
    activeGeometryTiers: Array.from(geometryPool.keys()),
    activeTextureKeys: Array.from(texturePool.keys()),
  };
}

// Pre-allocated vector reused across frames (zero GC pressure inside useFrame)
const _lodWorldPos = new THREE.Vector3();

export function useIPhoneLodManager(
  rootRef: RefObject<THREE.Group | null>,
  explosionFactor = 0
): {
  lodLevel: LodLevel;
  lodConfig: IPhoneLodConfig;
  geometries: IPhoneLodGeometries;
  textures: IPhoneTextureSet | null;
} {
  const profile = useMemo(() => detectDeviceLodProfile(), []);
  const [lodLevel, setLodLevel] = useState<LodLevel>(profile.initialLod);

  const lodRef = useRef<LodLevel>(lodLevel);
  lodRef.current = lodLevel;

  const frameCounterRef = useRef(0);
  const emaDeltaRef = useRef(0.0167);
  const perfDowngradeRef = useRef(0);
  const lastPerfAdjustTimeRef = useRef(0);
  const lastLodSwitchTimeRef = useRef(0);

  const lodConfig = IPHONE_LOD_CONFIGS[lodLevel];

  const geometries = useMemo(() => getOrBuildIPhoneLodGeometries(lodLevel), [lodLevel]);
  useEffect(() => {
    retainIPhoneLodGeometries(lodLevel);
    return () => {
      releaseIPhoneLodGeometries(lodLevel);
    };
  }, [lodLevel]);

  const textures = useMemo(
    () => getOrBuildIPhoneTextureSet(lodConfig.textureScale, lodConfig.anisotropy),
    [lodConfig.textureScale, lodConfig.anisotropy]
  );
  useEffect(() => {
    retainIPhoneTextureSet(lodConfig.textureScale, lodConfig.anisotropy);
    return () => {
      releaseIPhoneTextureSet(lodConfig.textureScale, lodConfig.anisotropy);
    };
  }, [lodConfig.textureScale, lodConfig.anisotropy]);

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.1);
    emaDeltaRef.current = emaDeltaRef.current * 0.92 + dt * 0.08;
    frameCounterRef.current += 1;

    // Sample LOD every 8 frames to avoid redundant world-matrix checks
    if ((frameCounterRef.current & 7) !== 0) return;

    const elapsed = state.clock.elapsedTime;

    // Adaptive FPS safeguard (starts after initial 48 frames so startup jitter doesn't trigger false downgrades)
    if (frameCounterRef.current > 48 && elapsed - lastPerfAdjustTimeRef.current > 2.2) {
      if (emaDeltaRef.current > 0.028 && perfDowngradeRef.current < 2) {
        perfDowngradeRef.current += 1;
        lastPerfAdjustTimeRef.current = elapsed;
      } else if (
        emaDeltaRef.current < 0.019 &&
        perfDowngradeRef.current > 0 &&
        elapsed - lastPerfAdjustTimeRef.current > 4.5
      ) {
        perfDowngradeRef.current -= 1;
        lastPerfAdjustTimeRef.current = elapsed;
      }
    }

    if (!rootRef.current) return;
    rootRef.current.getWorldPosition(_lodWorldPos);
    const distance = state.camera.position.distanceTo(_lodWorldPos);

    // Subtle distance bias when exploded stack is expanded so internal parts stay legible during interactive inspection
    const effectiveDistance = explosionFactor > 0.35 ? distance * 0.88 : distance;

    const candidate = selectLodForDistance(
      effectiveDistance,
      lodRef.current,
      profile.maxAllowedLod,
      profile.isMobileViewport,
      perfDowngradeRef.current
    );

    if (candidate !== lodRef.current && elapsed - lastLodSwitchTimeRef.current > 0.45) {
      lastLodSwitchTimeRef.current = elapsed;
      lodRef.current = candidate;
      setLodLevel(candidate);
    }
  });

  return {
    lodLevel,
    lodConfig,
    geometries,
    textures,
  };
}
