import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { IPhonePartId } from '../../data/componentsCatalog';
import type { DeviceVisualVariant } from '../../data/devices';
import type { RepairAnimationPose } from '../../data/repairs';
import { createRoundedRectShape } from '../AssetRegistry';
import {
  createBatteryTexture,
  createBrushedMetalRoughnessTexture,
  createIPadScreenTexture,
  createLogicBoardTexture,
  createMacBookScreenTexture,
  createWatchDialTexture,
} from '../proceduralTextures';
import { RepairTools3D } from './RepairTools3D';

interface DeviceModelProps {
  hovered?: boolean;
  highlightedIds?: IPhonePartId[];
  repairPose?: RepairAnimationPose;
  reducedMotion?: boolean;
  mode?: 'card' | 'repair_bench';
  modelId?: string;
  accentColorHex?: string;
  visualVariant?: DeviceVisualVariant;
}

interface KeyPlacement {
  x: number;
  y: number;
  w: number;
  h: number;
}

function generateMacBookKeyGrid(): KeyPlacement[] {
  const keys: KeyPlacement[] = [];
  const rowDefs = [
    { y: -0.66, h: 0.082, widths: [0.16, 0.14, 0.14, 0.14, 0.14, 0.14, 0.14, 0.14, 0.14, 0.14, 0.14, 0.14, 0.14, 0.13] },
    { y: -0.54, h: 0.105, widths: [0.135, 0.135, 0.135, 0.135, 0.135, 0.135, 0.135, 0.135, 0.135, 0.135, 0.135, 0.135, 0.135, 0.24] },
    { y: -0.41, h: 0.105, widths: [0.22, 0.135, 0.135, 0.135, 0.135, 0.135, 0.135, 0.135, 0.135, 0.135, 0.135, 0.135, 0.135, 0.155] },
    { y: -0.28, h: 0.105, widths: [0.26, 0.135, 0.135, 0.135, 0.135, 0.135, 0.135, 0.135, 0.135, 0.135, 0.135, 0.135, 0.27] },
    { y: -0.15, h: 0.105, widths: [0.34, 0.135, 0.135, 0.135, 0.135, 0.135, 0.135, 0.135, 0.135, 0.135, 0.135, 0.345] },
    { y: -0.02, h: 0.105, widths: [0.14, 0.14, 0.14, 0.19, 0.78, 0.19, 0.14, 0.135, 0.135, 0.135] },
  ];

  const totalWidth = 2.38;
  const gap = 0.024;

  for (const row of rowDefs) {
    const rawSum = row.widths.reduce((acc, w) => acc + w, 0) + gap * (row.widths.length - 1);
    const scale = totalWidth / rawSum;
    let cursor = -totalWidth / 2;
    for (const rawW of row.widths) {
      const w = rawW * scale;
      keys.push({
        x: cursor + w / 2,
        y: row.y,
        w,
        h: row.h,
      });
      cursor += w + gap * scale;
    }
  }
  return keys;
}

export function MacBook3DModel({
  hovered = false,
  highlightedIds = [],
  repairPose,
  reducedMotion = false,
  mode = 'card',
  modelId = 'mba-13-m1-2020',
  accentColorHex = '#94a3b8',
  visualVariant,
}: DeviceModelProps) {
  const rootRef = useRef<THREE.Group>(null);
  const lidRef = useRef<THREE.Group>(null);
  const bottomPlateRef = useRef<THREE.Group>(null);
  const batteryRef = useRef<THREE.Group>(null);
  const logicBoardRef = useRef<THREE.Group>(null);
  const keyMeshRef = useRef<THREE.InstancedMesh>(null);
  const p5ScrewMeshRef = useRef<THREE.InstancedMesh>(null);

  const isPro = modelId.startsWith('mbp-') || visualVariant === 'macbook-pro-intel' || visualVariant === 'macbook-pro-apple-silicon';
  const isIntelAir = modelId.includes('intel') && !isPro;
  const hasNotch = !modelId.includes('m1-2020') && !modelId.includes('intel') && !modelId.includes('mbp-13-m2');

  const chassisColor = useMemo(() => {
    const c = new THREE.Color(accentColorHex);
    const base = new THREE.Color('#9ca3af');
    return base.lerp(c, 0.35).getStyle();
  }, [accentColorHex]);

  const textures = useMemo(() => {
    return {
      brushed: createBrushedMetalRoughnessTexture(8),
      screen: createMacBookScreenTexture(8),
      battery: createBatteryTexture(repairPose?.batteryState === 'old' ? 'old' : 'new', 8),
      pcb: createLogicBoardTexture(8),
    };
  }, [repairPose?.batteryState]);

  useEffect(() => {
    return () => {
      textures.brushed.dispose();
      textures.screen.dispose();
      textures.battery.dispose();
      textures.pcb.dispose();
    };
  }, [textures]);

  const keyPlacements = useMemo(() => generateMacBookKeyGrid(), []);

  const geos = useMemo(() => {
    const baseShape = createRoundedRectShape(3.22, 2.22, 0.13);
    const lidShape = createRoundedRectShape(3.2, 2.18, 0.13);
    const bottomShape = createRoundedRectShape(3.12, 2.12, 0.12);

    const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
      depth: 0.105,
      bevelEnabled: true,
      bevelThickness: 0.016,
      bevelSize: 0.016,
      bevelSegments: 3,
      curveSegments: 14,
    });
    baseGeo.center();

    const lidGeo = new THREE.ExtrudeGeometry(lidShape, {
      depth: 0.038,
      bevelEnabled: true,
      bevelThickness: 0.008,
      bevelSize: 0.008,
      bevelSegments: 3,
      curveSegments: 14,
    });
    lidGeo.center();

    const bottomGeo = new THREE.ExtrudeGeometry(bottomShape, {
      depth: 0.018,
      bevelEnabled: true,
      bevelThickness: 0.005,
      bevelSize: 0.005,
      bevelSegments: 2,
      curveSegments: 12,
    });
    bottomGeo.center();

    const keyGeo = new THREE.BoxGeometry(1, 1, 0.014);
    const screwGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.012, 10);

    return { baseGeo, lidGeo, bottomGeo, keyGeo, screwGeo };
  }, []);

  useEffect(() => {
    return () => {
      geos.baseGeo.dispose();
      geos.lidGeo.dispose();
      geos.bottomGeo.dispose();
      geos.keyGeo.dispose();
      geos.screwGeo.dispose();
    };
  }, [geos]);

  useEffect(() => {
    if (!keyMeshRef.current) return;
    const dummy = new THREE.Object3D();
    keyPlacements.forEach((k, i) => {
      dummy.position.set(k.x, k.y, -0.064);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(k.w, k.h, 1);
      dummy.updateMatrix();
      keyMeshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    keyMeshRef.current.instanceMatrix.needsUpdate = true;
  }, [keyPlacements]);

  useEffect(() => {
    if (!p5ScrewMeshRef.current) return;
    const dummy = new THREE.Object3D();
    const positions: [number, number][] = [
      [-1.38, -0.92],
      [-0.48, -0.96],
      [0.48, -0.96],
      [1.38, -0.92],
      [-1.44, 0.02],
      [1.44, 0.02],
      [-1.38, 0.94],
      [-0.48, 0.96],
      [0.48, 0.96],
      [1.38, 0.94],
    ];
    positions.forEach(([sx, sz], i) => {
      dummy.position.set(sx, -0.013, sz);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      p5ScrewMeshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    p5ScrewMeshRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  const hasHighlight = highlightedIds.length > 0;
  const isHighlighted = (keys: IPhonePartId[]) =>
    keys.some((k) => highlightedIds.includes(k));

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const speed = reducedMotion ? 20 : 7;

    if (rootRef.current && mode === 'card') {
      const targetRotY = hovered ? 0.34 : -0.38;
      const targetRotX = hovered ? 0.36 : 0.28;
      rootRef.current.rotation.y = THREE.MathUtils.damp(rootRef.current.rotation.y, targetRotY, speed, dt);
      rootRef.current.rotation.x = THREE.MathUtils.damp(rootRef.current.rotation.x, targetRotX, speed, dt);
    }

    if (lidRef.current) {
      const targetLid =
        mode === 'repair_bench' && repairPose
          ? -Math.PI / 2 - 0.24 + repairPose.screenLiftAngle * 0.25
          : -Math.PI / 2 - 0.34;
      lidRef.current.rotation.x = THREE.MathUtils.damp(lidRef.current.rotation.x, targetLid, speed, dt);
    }

    if (bottomPlateRef.current) {
      const lift = repairPose?.backGlassLift || (repairPose?.explosionFactor ?? 0) * 1.1;
      bottomPlateRef.current.position.y = THREE.MathUtils.damp(
        bottomPlateRef.current.position.y,
        -0.068 - lift * 0.72,
        speed,
        dt
      );
    }

    if (batteryRef.current) {
      const lift = repairPose?.batteryLift ?? 0;
      batteryRef.current.position.y = THREE.MathUtils.damp(
        batteryRef.current.position.y,
        -0.008 - lift * 0.36,
        speed,
        dt
      );
    }

    if (logicBoardRef.current) {
      const lift = repairPose?.logicBoardLift ?? 0;
      logicBoardRef.current.position.y = THREE.MathUtils.damp(
        logicBoardRef.current.position.y,
        0.008 - lift * 0.34,
        speed,
        dt
      );
    }
  });

  return (
    <group ref={rootRef} position={[0, -0.32, 0]}>
      {/* Lower aluminum unibody deck */}
      <group rotation={[Math.PI / 2, 0, 0]}>
        <mesh geometry={geos.baseGeo} castShadow receiveShadow>
          <meshPhysicalMaterial
            color={chassisColor}
            metalness={0.92}
            roughness={0.25}
            roughnessMap={textures.brushed}
            anisotropy={0.65}
            transparent={hasHighlight && !isHighlighted(['titanium_frame', 'middle_frame'])}
            opacity={hasHighlight && !isHighlighted(['titanium_frame', 'middle_frame']) ? 0.38 : 1}
          />
        </mesh>

        {/* Recessed Keyboard Well */}
        <mesh position={[0, -0.34, -0.061]}>
          <planeGeometry args={[2.5, 0.84]} />
          <meshStandardMaterial color="#11151e" roughness={0.68} metalness={0.22} />
        </mesh>

        {/* Instanced 64+ Scissor-Switch Keys */}
        <instancedMesh ref={keyMeshRef} args={[geos.keyGeo, undefined, keyPlacements.length]}>
          <meshStandardMaterial color="#0b0e14" roughness={0.55} metalness={0.12} />
        </instancedMesh>

        {/* Touch ID Ring Accent */}
        <mesh position={[1.11, -0.66, -0.056]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.036, 0.036, 0.008, 20]} />
          <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.25} />
        </mesh>

        {/* Left & Right Acoustic Speaker Micro-Grilles */}
        {[-1.4, 1.4].map((sx, idx) => (
          <mesh key={idx} position={[sx, -0.34, -0.068]}>
            <planeGeometry args={[0.18, 0.8]} />
            <meshStandardMaterial color="#334155" roughness={0.78} metalness={0.3} />
          </mesh>
        ))}

        {/* Force Touch Glass Trackpad with Hairline Bevel */}
        <mesh position={[0, 0.56, -0.065]}>
          <planeGeometry args={[1.28, 0.78]} />
          <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.35} />
        </mesh>
        <mesh position={[0, 0.56, -0.068]}>
          <planeGeometry args={[1.24, 0.74]} />
          <meshPhysicalMaterial
            color={chassisColor}
            metalness={0.55}
            roughness={0.16}
            clearcoat={0.85}
            emissive={isHighlighted(['taptic_engine']) ? '#2563eb' : '#000000'}
            emissiveIntensity={0.65}
          />
        </mesh>

        {/* Front Thumb-Scoop Cutout */}
        <mesh position={[0, 1.108, -0.025]}>
          <boxGeometry args={[0.72, 0.035, 0.055]} />
          <meshStandardMaterial color="#1f2937" metalness={0.65} roughness={0.35} />
        </mesh>

        {/* Left Side: Dual USB-C / Thunderbolt Ports */}
        <mesh position={[-1.622, -0.52, 0]}>
          <boxGeometry args={[0.025, 0.22, 0.034]} />
          <meshStandardMaterial
            color="#0f172a"
            emissive={isHighlighted(['charging_port']) ? '#2563eb' : '#000000'}
            emissiveIntensity={0.95}
          />
        </mesh>
        <mesh position={[-1.622, -0.26, 0]}>
          <boxGeometry args={[0.025, 0.22, 0.034]} />
          <meshStandardMaterial
            color="#0f172a"
            emissive={isHighlighted(['charging_port']) ? '#2563eb' : '#000000'}
            emissiveIntensity={0.95}
          />
        </mesh>

        {/* Right Side: 3.5mm Headphone Jack */}
        <mesh position={[1.622, -0.52, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.018, 0.018, 0.03, 14]} />
          <meshStandardMaterial color="#090d16" roughness={0.4} metalness={0.5} />
        </mesh>

        {/* Black Clutch Hinge Barrel */}
        <mesh position={[0, -1.07, -0.02]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.044, 0.044, 2.52, 16]} />
          <meshStandardMaterial color="#0b0f17" roughness={0.42} metalness={0.35} />
        </mesh>
      </group>

      {/* Authentic 4-Cell Stepped Li-ion Battery Pack */}
      <group ref={batteryRef} position={[0, -0.008, 0.36]}>
        {[-0.95, 0.95].map((bx, i) => (
          <mesh key={i} position={[bx, 0, 0.04]}>
            <boxGeometry args={[0.64, 0.042, 0.94]} />
            <meshStandardMaterial
              map={textures.battery}
              color="#1c212b"
              roughness={0.44}
              metalness={0.22}
              emissive={isHighlighted(['battery']) ? '#2563eb' : '#000000'}
              emissiveIntensity={0.65}
            />
          </mesh>
        ))}
        {[-0.31, 0.31].map((bx, i) => (
          <mesh key={i} position={[bx, 0, 0.08]}>
            <boxGeometry args={[0.56, 0.042, 0.78]} />
            <meshStandardMaterial
              map={textures.battery}
              color="#171c25"
              roughness={0.46}
              metalness={0.22}
              emissive={isHighlighted(['battery']) ? '#2563eb' : '#000000'}
              emissiveIntensity={0.65}
            />
          </mesh>
        ))}
        <mesh position={[0, -0.008, -0.34]}>
          <boxGeometry args={[1.65, 0.02, 0.14]} />
          <meshStandardMaterial color="#0f172a" roughness={0.38} metalness={0.45} />
        </mesh>
        <mesh position={[0, -0.024, 0.12]}>
          <boxGeometry args={[0.14, 0.006, 0.86]} />
          <meshStandardMaterial color="#b45309" roughness={0.35} metalness={0.45} />
        </mesh>
        {[-1.38, 1.38].map((sx, idx) => (
          <mesh key={idx} position={[sx, 0, 0.14]}>
            <boxGeometry args={[0.18, 0.038, 0.62]} />
            <meshStandardMaterial
              color="#1e293b"
              roughness={0.55}
              metalness={0.3}
              emissive={isHighlighted(['bottom_speaker', 'top_speaker']) ? '#2563eb' : '#000000'}
              emissiveIntensity={0.65}
            />
          </mesh>
        ))}
      </group>

      {/* Model-Accurate Logic Board & Cooling (Dual fans on Pro, single side fan on Intel Air, fanless heat spreader on M-series Air) */}
      <group ref={logicBoardRef} position={[0, 0.008, -0.52]}>
        <mesh>
          <boxGeometry args={[2.08, 0.028, 0.56]} />
          <meshStandardMaterial
            map={textures.pcb}
            roughness={0.35}
            metalness={0.55}
            emissive={isHighlighted(['logic_board']) ? '#2563eb' : '#000000'}
            emissiveIntensity={0.75}
          />
        </mesh>
        {isPro ? (
          [-0.78, 0.78].map((fx, i) => (
            <mesh key={i} position={[fx, -0.015, 0]}>
              <cylinderGeometry args={[0.22, 0.22, 0.032, 24]} />
              <meshStandardMaterial color="#181f2c" metalness={0.65} roughness={0.32} />
            </mesh>
          ))
        ) : isIntelAir ? (
          <>
            <mesh position={[0.72, -0.015, 0]}>
              <cylinderGeometry args={[0.21, 0.21, 0.03, 24]} />
              <meshStandardMaterial color="#181f2c" metalness={0.65} roughness={0.32} />
            </mesh>
            <mesh position={[-0.1, -0.015, 0]}>
              <boxGeometry args={[0.68, 0.016, 0.24]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.28} />
            </mesh>
          </>
        ) : (
          <mesh position={[0, -0.015, 0]}>
            <boxGeometry args={[0.88, 0.016, 0.34]} />
            <meshStandardMaterial color="#0a0d12" metalness={0.75} roughness={0.36} />
          </mesh>
        )}
      </group>

      {/* Bottom Aluminum Cover + 10 P5 Screws + 4 Rubber Feet */}
      <group ref={bottomPlateRef} position={[0, -0.068, 0]}>
        <group rotation={[Math.PI / 2, 0, 0]}>
          <mesh geometry={geos.bottomGeo} receiveShadow>
            <meshPhysicalMaterial
              color={chassisColor}
              metalness={0.9}
              roughness={0.28}
              roughnessMap={textures.brushed}
              transparent
              opacity={hasHighlight ? 0.25 : 0.94}
            />
          </mesh>
        </group>

        <instancedMesh ref={p5ScrewMeshRef} args={[geos.screwGeo, undefined, 10]}>
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.18} />
        </instancedMesh>

        {[
          [-1.24, -0.82],
          [1.24, -0.82],
          [-1.24, 0.82],
          [1.24, 0.82],
        ].map(([rx, rz], idx) => (
          <mesh key={idx} position={[rx, -0.015, rz]}>
            <cylinderGeometry args={[0.085, 0.095, 0.014, 20]} />
            <meshStandardMaterial color="#0b0d12" roughness={0.85} metalness={0.05} />
          </mesh>
        ))}
      </group>

      {/* Hinged Retina Display Lid */}
      <group ref={lidRef} position={[0, 0.04, -1.06]}>
        <group position={[0, 1.09, 0]}>
          <mesh geometry={geos.lidGeo} castShadow>
            <meshPhysicalMaterial
              color={chassisColor}
              metalness={0.92}
              roughness={0.22}
              roughnessMap={textures.brushed}
              emissive={isHighlighted(['display_panel', 'display_flex']) ? '#2563eb' : '#000000'}
              emissiveIntensity={0.45}
            />
          </mesh>
          <mesh position={[0, 0, 0.025]}>
            <planeGeometry args={[3.1, 2.08]} />
            <meshStandardMaterial color="#05070c" roughness={0.15} metalness={0.1} />
          </mesh>
          <mesh position={[0, -0.01, 0.028]}>
            <planeGeometry args={[2.94, 1.88]} />
            <meshStandardMaterial
              map={textures.screen}
              emissive="#1d4ed8"
              emissiveMap={textures.screen}
              emissiveIntensity={0.72}
              roughness={0.08}
            />
          </mesh>
          {hasNotch ? (
            <mesh position={[0, 0.905, 0.031]}>
              <boxGeometry args={[0.3, 0.08, 0.006]} />
              <meshStandardMaterial color="#020409" />
            </mesh>
          ) : (
            <mesh position={[0, 0.96, 0.031]}>
              <cylinderGeometry args={[0.016, 0.016, 0.004, 14]} />
              <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.2} />
            </mesh>
          )}
        </group>
      </group>
    </group>
  );
}

export function IPad3DModel({
  hovered = false,
  highlightedIds = [],
  repairPose,
  reducedMotion = false,
  mode = 'card',
  modelId = 'ipad-pro-13-m4-2024',
  accentColorHex = '#475569',
  visualVariant = 'ipad-pro-m4',
}: DeviceModelProps) {
  const rootRef = useRef<THREE.Group>(null);
  const screenRef = useRef<THREE.Group>(null);
  const batteryRef = useRef<THREE.Group>(null);
  const boardRef = useRef<THREE.Group>(null);

  const isMini = visualVariant === 'ipad-mini' || modelId.includes('mini');
  const hasHomeButton = visualVariant === 'ipad-standard-home' || modelId.includes('9th');
  const isPro = visualVariant === 'ipad-pro-m4' || visualVariant === 'ipad-pro-m1-m2';

  const tabletW = isMini ? 2.15 : 2.95;
  const tabletH = isMini ? 1.52 : 2.18;

  const chassisColor = useMemo(() => {
    const c = new THREE.Color(accentColorHex);
    const base = new THREE.Color('#64748b');
    return base.lerp(c, 0.45).getStyle();
  }, [accentColorHex]);

  const textures = useMemo(() => {
    return {
      brushed: createBrushedMetalRoughnessTexture(8),
      screen: createIPadScreenTexture(8),
      battery: createBatteryTexture(repairPose?.batteryState === 'old' ? 'old' : 'new', 8),
      pcb: createLogicBoardTexture(8),
    };
  }, [repairPose?.batteryState]);

  useEffect(() => {
    return () => {
      textures.brushed.dispose();
      textures.screen.dispose();
      textures.battery.dispose();
      textures.pcb.dispose();
    };
  }, [textures]);

  const geos = useMemo(() => {
    const bodyShape = createRoundedRectShape(tabletW, tabletH, 0.14);
    const glassShape = createRoundedRectShape(tabletW - 0.08, tabletH - 0.08, 0.11);

    const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
      depth: 0.068,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
      bevelSegments: 3,
      curveSegments: 14,
    });
    bodyGeo.center();

    const glassGeo = new THREE.ExtrudeGeometry(glassShape, {
      depth: 0.018,
      bevelEnabled: true,
      bevelThickness: 0.005,
      bevelSize: 0.005,
      bevelSegments: 2,
      curveSegments: 12,
    });
    glassGeo.center();

    return { bodyGeo, glassGeo };
  }, [tabletW, tabletH]);

  useEffect(() => {
    return () => {
      geos.bodyGeo.dispose();
      geos.glassGeo.dispose();
    };
  }, [geos]);

  const hasHighlight = highlightedIds.length > 0;
  const isHighlighted = (keys: IPhonePartId[]) =>
    keys.some((k) => highlightedIds.includes(k));

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const speed = reducedMotion ? 20 : 7;

    if (rootRef.current && mode === 'card') {
      const targetRotY = hovered ? 0.3 : -0.26;
      const targetRotX = hovered ? -0.05 : 0.12;
      rootRef.current.rotation.y = THREE.MathUtils.damp(rootRef.current.rotation.y, targetRotY, speed, dt);
      rootRef.current.rotation.x = THREE.MathUtils.damp(rootRef.current.rotation.x, targetRotX, speed, dt);
    }

    if (screenRef.current) {
      const lift = repairPose?.screenLiftAngle ?? 0;
      const exp = repairPose?.explosionFactor ?? 0;
      screenRef.current.position.z = THREE.MathUtils.damp(
        screenRef.current.position.z,
        0.048 + lift * 0.42 + exp * 0.55,
        speed,
        dt
      );
      screenRef.current.rotation.y = THREE.MathUtils.damp(
        screenRef.current.rotation.y,
        -lift * 0.35,
        speed,
        dt
      );
    }

    if (batteryRef.current) {
      const lift = repairPose?.batteryLift ?? 0;
      batteryRef.current.position.z = THREE.MathUtils.damp(
        batteryRef.current.position.z,
        0.008 + lift * 0.38,
        speed,
        dt
      );
    }

    if (boardRef.current) {
      const lift = repairPose?.logicBoardLift ?? 0;
      boardRef.current.position.z = THREE.MathUtils.damp(
        boardRef.current.position.z,
        0.012 + lift * 0.42,
        speed,
        dt
      );
    }
  });

  return (
    <group ref={rootRef}>
      {/* Precision Aluminum Unibody Enclosure */}
      <mesh geometry={geos.bodyGeo} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={chassisColor}
          metalness={0.92}
          roughness={0.24}
          roughnessMap={textures.brushed}
          anisotropy={0.65}
          transparent={hasHighlight && !isHighlighted(['titanium_frame', 'back_glass', 'middle_frame'])}
          opacity={hasHighlight && !isHighlighted(['titanium_frame', 'back_glass', 'middle_frame']) ? 0.34 : 1}
        />
      </mesh>

      {/* Rear Camera Housing */}
      <group position={[-tabletW * 0.36, tabletH * 0.34, -0.048]}>
        <mesh>
          <boxGeometry args={[isPro ? 0.34 : 0.22, isPro ? 0.34 : 0.22, 0.025]} />
          <meshStandardMaterial
            color="#0f172a"
            metalness={0.5}
            roughness={0.25}
            emissive={isHighlighted(['camera_module']) ? '#2563eb' : '#000000'}
            emissiveIntensity={0.75}
          />
        </mesh>
        <mesh position={[0.05, 0.05, -0.015]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.065, 0.065, 0.018, 20]} />
          <meshPhysicalMaterial color="#1d4ed8" metalness={0.3} roughness={0.05} clearcoat={1} />
        </mesh>
      </group>

      {/* USB-C Port on Right Edge */}
      <mesh position={[tabletW * 0.506, 0, 0]}>
        <boxGeometry args={[0.02, 0.18, 0.028]} />
        <meshStandardMaterial
          color="#090d16"
          emissive={isHighlighted(['charging_port']) ? '#2563eb' : '#000000'}
          emissiveIntensity={0.95}
        />
      </mesh>

      {/* Authentic Symmetrical Dual-Cell iPad Battery Bay */}
      <group ref={batteryRef} position={[0, 0, 0.008]}>
        {[-tabletW * 0.28, tabletW * 0.28].map((bx, idx) => (
          <mesh key={idx} position={[bx, 0, 0]}>
            <boxGeometry args={[tabletW * 0.34, tabletH * 0.78, 0.028]} />
            <meshStandardMaterial
              map={textures.battery}
              color="#1a202c"
              roughness={0.44}
              metalness={0.22}
              emissive={isHighlighted(['battery']) ? '#2563eb' : '#000000'}
              emissiveIntensity={0.68}
            />
          </mesh>
        ))}

        {/* Quad Corner Acoustic Speaker Chambers */}
        {[
          [-tabletW * 0.34, tabletH * 0.41],
          [tabletW * 0.34, tabletH * 0.41],
          [-tabletW * 0.34, -tabletH * 0.41],
          [tabletW * 0.34, -tabletH * 0.41],
        ].map(([sx, sy], idx) => (
          <mesh key={idx} position={[sx, sy, 0]}>
            <boxGeometry args={[0.38, 0.16, 0.024]} />
            <meshStandardMaterial
              color="#1e293b"
              roughness={0.5}
              metalness={0.35}
              emissive={isHighlighted(['bottom_speaker', 'top_speaker']) ? '#2563eb' : '#000000'}
              emissiveIntensity={0.75}
            />
          </mesh>
        ))}
      </group>

      {/* Central Logic Board + Copper-Graphite Thermal Shield */}
      <group ref={boardRef} position={[0, 0, 0.012]}>
        <mesh>
          <boxGeometry args={[tabletW * 0.24, tabletH * 0.74, 0.022]} />
          <meshStandardMaterial
            map={textures.pcb}
            color={visualVariant === 'ipad-pro-m4' ? '#8c5a3c' : '#1e293b'}
            roughness={0.36}
            metalness={0.65}
            emissive={isHighlighted(['logic_board']) ? '#2563eb' : '#000000'}
            emissiveIntensity={0.75}
          />
        </mesh>
      </group>

      {/* Front Tandem OLED / Liquid Retina Display Assembly */}
      <group ref={screenRef} position={[0, 0, 0.048]}>
        <mesh geometry={geos.glassGeo}>
          <meshPhysicalMaterial
            color="#06080e"
            metalness={0.25}
            roughness={0.08}
            clearcoat={1}
            emissive={isHighlighted(['display_panel', 'display_flex']) ? '#2563eb' : '#000000'}
            emissiveIntensity={0.5}
          />
        </mesh>
        <mesh position={[0, 0, 0.015]}>
          <planeGeometry args={[tabletW - (hasHomeButton ? 0.36 : 0.2), tabletH - 0.2]} />
          <meshStandardMaterial
            map={textures.screen}
            emissive="#1d4ed8"
            emissiveMap={textures.screen}
            emissiveIntensity={0.78}
            roughness={0.08}
          />
        </mesh>
        {/* Landscape Front TrueDepth Camera (Centered along long top bezel) */}
        <mesh position={[0, tabletH * 0.465, 0.016]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.022, 0.022, 0.004, 14]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.2} />
        </mesh>
        {/* Classic Touch ID Home Button on 9th Gen */}
        {hasHomeButton && (
          <mesh position={[-tabletW * 0.44, 0, 0.016]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.075, 0.075, 0.004, 20]} />
            <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.25} />
          </mesh>
        )}
      </group>
    </group>
  );
}

export function AppleWatch3DModel({
  hovered = false,
  highlightedIds = [],
  repairPose,
  reducedMotion = false,
  mode = 'card',
  modelId = 'watch-ultra-1',
  visualVariant,
}: DeviceModelProps) {
  const rootRef = useRef<THREE.Group>(null);
  const screenRef = useRef<THREE.Group>(null);
  const batteryRef = useRef<THREE.Group>(null);
  const sipRef = useRef<THREE.Group>(null);

  const isUltra = visualVariant === 'watch-ultra' || modelId.includes('ultra');

  const textures = useMemo(() => {
    return {
      brushed: createBrushedMetalRoughnessTexture(8),
      dial: createWatchDialTexture(8),
      battery: createBatteryTexture(repairPose?.batteryState === 'old' ? 'old' : 'new', 8),
      pcb: createLogicBoardTexture(8),
    };
  }, [repairPose?.batteryState]);

  useEffect(() => {
    return () => {
      textures.brushed.dispose();
      textures.dial.dispose();
      textures.battery.dispose();
      textures.pcb.dispose();
    };
  }, [textures]);

  const geos = useMemo(() => {
    const caseShape = createRoundedRectShape(isUltra ? 1.66 : 1.56, isUltra ? 2.02 : 1.92, isUltra ? 0.36 : 0.42);
    const glassShape = createRoundedRectShape(isUltra ? 1.48 : 1.42, isUltra ? 1.82 : 1.76, isUltra ? 0.3 : 0.36);
    const caseGeo = new THREE.ExtrudeGeometry(caseShape, {
      depth: isUltra ? 0.48 : 0.42,
      bevelEnabled: true,
      bevelThickness: isUltra ? 0.035 : 0.05,
      bevelSize: isUltra ? 0.03 : 0.04,
      bevelSegments: 4,
      curveSegments: 18,
    });
    caseGeo.center();

    const glassGeo = new THREE.ExtrudeGeometry(glassShape, {
      depth: isUltra ? 0.05 : 0.08,
      bevelEnabled: true,
      bevelThickness: isUltra ? 0.01 : 0.025,
      bevelSize: isUltra ? 0.01 : 0.02,
      bevelSegments: 3,
      curveSegments: 16,
    });
    glassGeo.center();
    return { caseGeo, glassGeo };
  }, [isUltra]);

  useEffect(() => {
    return () => {
      geos.caseGeo.dispose();
      geos.glassGeo.dispose();
    };
  }, [geos]);

  const hasHighlight = highlightedIds.length > 0;
  const isHighlighted = (keys: IPhonePartId[]) =>
    keys.some((k) => highlightedIds.includes(k));

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const speed = reducedMotion ? 20 : 7;

    if (rootRef.current && mode === 'card') {
      const targetY = hovered ? 0.35 : -0.32;
      const targetX = hovered ? 0.18 : 0.1;
      rootRef.current.rotation.y = THREE.MathUtils.damp(rootRef.current.rotation.y, targetY, speed, dt);
      rootRef.current.rotation.x = THREE.MathUtils.damp(rootRef.current.rotation.x, targetX, speed, dt);
    }

    if (screenRef.current) {
      const lift = repairPose?.screenLiftAngle ?? 0;
      const exp = repairPose?.explosionFactor ?? 0;
      screenRef.current.position.z = THREE.MathUtils.damp(
        screenRef.current.position.z,
        (isUltra ? 0.27 : 0.24) + lift * 0.65 + exp * 0.85,
        speed,
        dt
      );
      screenRef.current.rotation.y = THREE.MathUtils.damp(
        screenRef.current.rotation.y,
        -lift * 0.6,
        speed,
        dt
      );
    }

    if (batteryRef.current) {
      const lift = repairPose?.batteryLift ?? 0;
      batteryRef.current.position.z = THREE.MathUtils.damp(
        batteryRef.current.position.z,
        0.08 + lift * 0.75,
        speed,
        dt
      );
    }

    if (sipRef.current) {
      const lift = repairPose?.logicBoardLift ?? 0;
      sipRef.current.position.z = THREE.MathUtils.damp(
        sipRef.current.position.z,
        -0.06 + lift * 0.55,
        speed,
        dt
      );
    }
  });

  return (
    <group ref={rootRef}>
      {/* Titanium / Aluminum Watch Case */}
      <mesh geometry={geos.caseGeo} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={isUltra ? '#b6b0a6' : '#94a3b8'}
          metalness={0.94}
          roughness={isUltra ? 0.28 : 0.22}
          roughnessMap={textures.brushed}
          anisotropy={0.8}
          transparent={hasHighlight && !isHighlighted(['titanium_frame', 'back_glass'])}
          opacity={hasHighlight && !isHighlighted(['titanium_frame', 'back_glass']) ? 0.36 : 1}
        />
      </mesh>

      {/* Upper & Lower Alpine / Fluoroelastomer Bands */}
      {[1.44, -1.44].map((by, idx) => (
        <mesh key={idx} position={[0, by, -0.02]}>
          <boxGeometry args={[1.1, 1.05, 0.14]} />
          <meshStandardMaterial
            color={isUltra ? '#c2410c' : '#1e2430'}
            roughness={0.72}
            metalness={0.08}
            transparent={hasHighlight}
            opacity={hasHighlight ? 0.35 : 1}
          />
        </mesh>
      ))}

      {/* Digital Crown + Side Button (+ Ultra Raised Guard & International Orange Action Button) */}
      {isUltra && (
        <>
          {/* Raised titanium crown guard */}
          <mesh position={[0.89, 0.1, 0]}>
            <boxGeometry args={[0.14, 1.04, 0.34]} />
            <meshStandardMaterial color="#a8a29e" metalness={0.9} roughness={0.28} />
          </mesh>
          {/* International Orange Action Button on Left Edge */}
          <mesh position={[-0.88, -0.1, 0]}>
            <boxGeometry args={[0.075, 0.62, 0.18]} />
            <meshStandardMaterial color="#ea580c" roughness={0.35} metalness={0.2} />
          </mesh>
          {/* 4 Rear Titanium P5 Corner Screws on Ultra */}
          {[
            [-0.58, 0.74],
            [0.58, 0.74],
            [-0.58, -0.74],
            [0.58, -0.74],
          ].map(([sx, sy], idx) => (
            <mesh key={idx} position={[sx, sy, -0.275]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.045, 0.045, 0.02, 12]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.18} />
            </mesh>
          ))}
        </>
      )}

      <mesh position={[isUltra ? 0.96 : 0.88, 0.36, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.16, 0.16, 0.16, 20]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.2} />
      </mesh>
      <mesh position={[isUltra ? 0.94 : 0.84, -0.26, 0]}>
        <boxGeometry args={[0.08, 0.44, 0.16]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.25} />
      </mesh>

      {/* Internal Li-ion Watch Battery */}
      <group ref={batteryRef} position={[0, 0, 0.08]}>
        <mesh>
          <boxGeometry args={[1.02, 1.18, 0.12]} />
          <meshStandardMaterial
            map={textures.battery}
            roughness={0.45}
            metalness={0.25}
            emissive={isHighlighted(['battery']) ? '#2563eb' : '#000000'}
            emissiveIntensity={0.85}
          />
        </mesh>
      </group>

      {/* S-Series SiP Logic Module & Taptic Engine */}
      <group ref={sipRef} position={[0, 0, -0.06]}>
        <mesh position={[0, 0.25, 0]}>
          <boxGeometry args={[0.96, 0.65, 0.1]} />
          <meshStandardMaterial
            map={textures.pcb}
            roughness={0.35}
            metalness={0.55}
            emissive={isHighlighted(['logic_board', 'charging_port']) ? '#2563eb' : '#000000'}
            emissiveIntensity={0.8}
          />
        </mesh>
        <mesh position={[0, -0.52, 0]}>
          <boxGeometry args={[0.92, 0.32, 0.1]} />
          <meshStandardMaterial
            color="#334155"
            metalness={0.8}
            roughness={0.28}
            emissive={isHighlighted(['taptic_engine']) ? '#2563eb' : '#000000'}
            emissiveIntensity={0.85}
          />
        </mesh>
      </group>

      {/* Sapphire OLED Display Front */}
      <group ref={screenRef} position={[0, 0, isUltra ? 0.27 : 0.24]}>
        <mesh geometry={geos.glassGeo}>
          <meshPhysicalMaterial
            color="#070a12"
            metalness={0.2}
            roughness={0.08}
            clearcoat={1}
            emissive={isHighlighted(['display_panel', 'display_flex']) ? '#2563eb' : '#000000'}
            emissiveIntensity={0.6}
          />
        </mesh>
        <mesh position={[0, 0, 0.04]}>
          <planeGeometry args={[isUltra ? 1.28 : 1.22, isUltra ? 1.6 : 1.54]} />
          <meshStandardMaterial
            map={textures.dial}
            emissive="#1d4ed8"
            emissiveMap={textures.dial}
            emissiveIntensity={0.8}
            roughness={0.08}
          />
        </mesh>
      </group>

      {mode === 'repair_bench' && repairPose && (
        <RepairTools3D tool={repairPose.tool} reducedMotion={reducedMotion} />
      )}
    </group>
  );
}
