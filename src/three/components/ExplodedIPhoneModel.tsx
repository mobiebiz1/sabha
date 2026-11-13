import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { IPHONE_COMPONENTS, type IPhonePartId } from '../../data/componentsCatalog';
import type { DeviceVisualVariant } from '../../data/devices';
import type { RepairAnimationPose } from '../../data/repairs';
import {
  createAppleLogoGeometries,
  createRoundedFrameShape,
  createRoundedRectShape,
} from '../AssetRegistry';
import {
  createBatteryTexture,
  createBrushedMetalRoughnessTexture,
  createCrackedGlassOverlayTexture,
  createLogicBoardTexture,
  createOledDisplayTexture,
} from '../proceduralTextures';
import { RepairTools3D } from './RepairTools3D';

export interface ExplodedIPhoneProps {
  mode: 'exploded_stack' | 'repair_bench';
  explosionFactor?: number;
  highlightedIds?: IPhonePartId[];
  selectedPartId?: IPhonePartId | null;
  onSelectPart?: (id: IPhonePartId) => void;
  onHoverPart?: (id: IPhonePartId | null) => void;
  repairPose?: RepairAnimationPose;
  chassisColorHex?: string;
  visualVariant?: DeviceVisualVariant;
  crackIntensity?: number;
  reducedMotion?: boolean;
}

const PHONE_W = 1.62;
const PHONE_H = 3.34;
const PHONE_R = 0.25;

// Assembled Z positions (front OLED is +Z, rear Back Glass is -Z)
const ASSEMBLED_Z: Record<IPhonePartId, number> = {
  back_glass: -0.105,
  camera_module: -0.045,
  camera_brackets: -0.015,
  shield_plate: 0.045,
  display_panel: 0.102,
  display_flex: 0.062,
  battery: 0.0,
  logic_board: 0.004,
  taptic_engine: -0.008,
  top_speaker: 0.025,
  middle_frame: -0.02,
  bottom_speaker: -0.01,
  charging_port: -0.012,
  antenna_modules: -0.015,
  titanium_frame: 0.0,
};

export function ExplodedIPhoneModel({
  mode,
  explosionFactor = 0,
  highlightedIds = [],
  selectedPartId = null,
  onSelectPart,
  onHoverPart,
  repairPose,
  chassisColorHex = '#b2b8c2',
  visualVariant = 'iphone-18-pro',
  crackIntensity = 0,
  reducedMotion = false,
}: ExplodedIPhoneProps) {
  const rootRef = useRef<THREE.Group>(null);
  const partRefs = useRef<Partial<Record<IPhonePartId, THREE.Group>>>({});
  const screwsRef = useRef<THREE.InstancedMesh>(null);
  const smdRef = useRef<THREE.InstancedMesh>(null);
  const grilleRef = useRef<THREE.InstancedMesh>(null);

  const textures = useMemo(() => {
    return {
      brushed: createBrushedMetalRoughnessTexture(4),
      oled: createOledDisplayTexture(4),
      crack: createCrackedGlassOverlayTexture(4),
      batteryOld: createBatteryTexture('old', 4),
      batteryNew: createBatteryTexture('new', 4),
      pcb: createLogicBoardTexture(4),
    };
  }, []);

  useEffect(() => {
    return () => {
      textures.brushed.dispose();
      textures.oled.dispose();
      textures.crack.dispose();
      textures.batteryOld.dispose();
      textures.batteryNew.dispose();
      textures.pcb.dispose();
    };
  }, [textures]);

  // Optimized multi-part precision extruded geometries
  const geometries = useMemo(() => {
    const bodyShape = createRoundedRectShape(PHONE_W, PHONE_H, PHONE_R);
    const frameShape = createRoundedFrameShape(PHONE_W + 0.06, PHONE_H + 0.06, PHONE_R + 0.02, 0.085);
    const midFrameShape = createRoundedFrameShape(PHONE_W - 0.04, PHONE_H - 0.04, PHONE_R - 0.02, 0.13);
    const bezelShape = createRoundedFrameShape(PHONE_W - 0.02, PHONE_H - 0.02, PHONE_R - 0.01, 0.048);
    const screenShape = createRoundedRectShape(PHONE_W - 0.06, PHONE_H - 0.06, PHONE_R - 0.025);
    const plateauShape = createRoundedRectShape(1.4, 0.72, 0.16);
    const squarePlateauShape = createRoundedRectShape(0.76, 0.76, 0.14);
    const pillPlateauShape = createRoundedRectShape(0.36, 0.68, 0.16);
    const batteryShape = createRoundedRectShape(0.84, 1.54, 0.06);
    const boardShape = createRoundedRectShape(0.54, 1.8, 0.04);

    const backGlassGeo = new THREE.ExtrudeGeometry(bodyShape, {
      depth: 0.03,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
      bevelSegments: 2,
      curveSegments: 10,
    });
    backGlassGeo.center();

    const plateauGeo = new THREE.ExtrudeGeometry(plateauShape, {
      depth: 0.035,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.012,
      bevelSegments: 2,
      curveSegments: 10,
    });
    plateauGeo.center();

    const squarePlateauGeo = new THREE.ExtrudeGeometry(squarePlateauShape, {
      depth: 0.035,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.012,
      bevelSegments: 2,
      curveSegments: 10,
    });
    squarePlateauGeo.center();

    const pillPlateauGeo = new THREE.ExtrudeGeometry(pillPlateauShape, {
      depth: 0.032,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
      bevelSegments: 2,
      curveSegments: 10,
    });
    pillPlateauGeo.center();

    const titaniumBandGeo = new THREE.ExtrudeGeometry(frameShape, {
      depth: 0.22,
      bevelEnabled: true,
      bevelThickness: 0.016,
      bevelSize: 0.014,
      bevelSegments: 2,
      curveSegments: 12,
    });
    titaniumBandGeo.center();

    const middleFrameGeo = new THREE.ExtrudeGeometry(midFrameShape, {
      depth: 0.085,
      bevelEnabled: true,
      bevelThickness: 0.008,
      bevelSize: 0.008,
      bevelSegments: 2,
      curveSegments: 10,
    });
    middleFrameGeo.center();

    const displayBezelGeo = new THREE.ExtrudeGeometry(bezelShape, {
      depth: 0.036,
      bevelEnabled: true,
      bevelThickness: 0.006,
      bevelSize: 0.006,
      bevelSegments: 2,
      curveSegments: 10,
    });
    displayBezelGeo.center();

    const oledGeo = new THREE.ExtrudeGeometry(screenShape, {
      depth: 0.026,
      bevelEnabled: false,
      curveSegments: 10,
    });
    oledGeo.center();

    const batteryGeo = new THREE.ExtrudeGeometry(batteryShape, {
      depth: 0.08,
      bevelEnabled: true,
      bevelThickness: 0.008,
      bevelSize: 0.008,
      bevelSegments: 2,
      curveSegments: 8,
    });
    batteryGeo.center();

    const boardGeo = new THREE.ExtrudeGeometry(boardShape, {
      depth: 0.034,
      bevelEnabled: false,
      curveSegments: 6,
    });
    boardGeo.center();

    const { logoBodyGeo, logoLeafGeo } = createAppleLogoGeometries(0.35);

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
  }, []);

  useEffect(() => {
    return () => {
      Object.values(geometries).forEach((g) => g.dispose());
    };
  }, [geometries]);

  // Populate InstancedMesh micro-screws, SMD chips, and bottom speaker/mic grille perforations
  useEffect(() => {
    const dummy = new THREE.Object3D();

    if (screwsRef.current) {
      const coords: [number, number][] = [
        [-0.72, 1.45], [0.72, 1.45], [-0.72, 0.95], [0.72, 0.95],
        [-0.72, 0.35], [0.72, 0.35], [-0.72, -0.35], [0.72, -0.35],
        [-0.72, -0.95], [0.72, -0.95], [-0.72, -1.45], [0.72, -1.45],
        [-0.35, 1.54], [0.35, 1.54], [-0.35, -1.54], [0.35, -1.54],
        [-0.22, 0.65], [0.18, 0.65], [-0.22, -0.65], [0.18, -0.65],
        [0.0, 1.1], [0.0, -1.1],
      ];
      coords.forEach(([x, y], i) => {
        dummy.position.set(x, y, 0.05);
        dummy.rotation.set(Math.PI / 2, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        screwsRef.current!.setMatrixAt(i, dummy.matrix);
      });
      screwsRef.current.instanceMatrix.needsUpdate = true;
      screwsRef.current.computeBoundingSphere();
    }

    if (smdRef.current) {
      for (let i = 0; i < 36; i++) {
        const col = i % 4;
        const row = Math.floor(i / 4);
        dummy.position.set(-0.18 + col * 0.12, -0.7 + row * 0.17, 0.024);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(0.8 + (i % 3) * 0.25, 0.7 + (i % 2) * 0.3, 1);
        dummy.updateMatrix();
        smdRef.current.setMatrixAt(i, dummy.matrix);
      }
      smdRef.current.instanceMatrix.needsUpdate = true;
      smdRef.current.computeBoundingSphere();
    }

    if (grilleRef.current) {
      // Bottom speaker & mic perforations (5 left + 5 right)
      const xs = [-0.56, -0.49, -0.42, -0.35, -0.28, 0.28, 0.35, 0.42, 0.49, 0.56];
      xs.forEach((x, idx) => {
        dummy.position.set(x, -1.7, 0);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        grilleRef.current!.setMatrixAt(idx, dummy.matrix);
      });
      grilleRef.current.instanceMatrix.needsUpdate = true;
      grilleRef.current.computeBoundingSphere();
    }
  }, []);

  const hasAnyHighlight = Boolean(selectedPartId) || highlightedIds.length > 0;
  const isPartFocused = (id: IPhonePartId) =>
    selectedPartId === id || highlightedIds.includes(id);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const speed = reducedMotion ? 24 : 7.5;
    const e = THREE.MathUtils.clamp(explosionFactor, 0, 1);

    IPHONE_COMPONENTS.forEach((comp) => {
      const grp = partRefs.current[comp.id];
      if (!grp) return;

      let targetX = 0;
      let targetY = 0;
      let targetZ = 0;
      let targetRotX = 0;
      let targetRotY = 0;
      let targetRotZ = 0;
      let targetScale = 1;

      if (mode === 'exploded_stack') {
        // Blend smoothly from upright assembled iPhone (e=0) to vertical exploded stack (e=1)
        const tiltT = THREE.MathUtils.smoothstep(e, 0.04, 0.42);
        const stackT = THREE.MathUtils.smoothstep(e, 0.08, 1.0);

        targetRotX = THREE.MathUtils.lerp(0, -Math.PI / 2 + 0.34, tiltT);
        targetRotZ = THREE.MathUtils.lerp(0, -0.36, tiltT);
        targetY = THREE.MathUtils.lerp(0, comp.explodedY, stackT);
        targetZ = THREE.MathUtils.lerp(ASSEMBLED_Z[comp.id], 0, tiltT);

        if (isPartFocused(comp.id)) {
          targetZ += 0.16 * stackT;
          targetScale = 1.03;
        } else if (hasAnyHighlight && e > 0.15) {
          targetScale = 0.985;
        }
      } else {
        const pose = repairPose;
        const exp = pose?.explosionFactor ?? 0;

        const zDepthMap: Record<IPhonePartId, number> = {
          back_glass: -0.13 - (pose?.backGlassLift ?? 0),
          camera_module: -0.045 - (pose?.cameraModuleLift ?? 0),
          camera_brackets: -0.015,
          shield_plate: 0.055 + (pose?.shieldRemoved ? 0.55 : 0),
          display_panel: 0.12 + (pose?.screenRemoved ? 1.25 : 0),
          display_flex: 0.075 + (pose?.flexDetached ? 0.28 : 0),
          battery: 0.0 + (pose?.batteryLift ?? 0),
          logic_board: 0.004 + (pose?.logicBoardLift ?? 0),
          taptic_engine: -0.01 + (pose?.tapticLift ?? 0),
          top_speaker: 0.025 + (pose?.speakerLift ?? 0) * 0.5,
          middle_frame: -0.04,
          bottom_speaker: -0.015 + (pose?.speakerLift ?? 0),
          charging_port: -0.025 + (pose?.chargingPortLift ?? 0),
          antenna_modules: -0.03,
          titanium_frame: 0.0,
        };

        targetZ = zDepthMap[comp.id] + (15 - comp.order - 7) * 0.052 * exp;

        if (comp.id === 'display_panel' && pose) {
          const lift = pose.screenLiftAngle;
          if (pose.screenRemoved) {
            targetX = -1.65;
            targetY = 0.2;
            targetRotY = -0.45;
          } else if (lift > 0.01) {
            targetRotY = -lift;
            targetX = -PHONE_W * 0.5 * (1 - Math.cos(lift)) - 0.05;
            targetZ += PHONE_W * 0.5 * Math.sin(lift);
          }
        }

        if (comp.id === 'battery' && pose && pose.batteryLift > 0.4) {
          targetX = 0.65;
        }
        if (comp.id === 'back_glass' && pose && pose.backGlassLift > 0.3) {
          targetY = 0.25;
        }
      }

      grp.position.x = THREE.MathUtils.damp(grp.position.x, targetX, speed, dt);
      grp.position.y = THREE.MathUtils.damp(grp.position.y, targetY, speed, dt);
      grp.position.z = THREE.MathUtils.damp(grp.position.z, targetZ, speed, dt);

      grp.rotation.x = THREE.MathUtils.damp(grp.rotation.x, targetRotX, speed, dt);
      grp.rotation.y = THREE.MathUtils.damp(grp.rotation.y, targetRotY, speed, dt);
      grp.rotation.z = THREE.MathUtils.damp(grp.rotation.z, targetRotZ, speed, dt);

      const s = THREE.MathUtils.damp(grp.scale.x, targetScale, speed, dt);
      grp.scale.setScalar(s);
    });
  });

  const handleClick = (id: IPhonePartId) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelectPart?.(id);
  };

  const handlePointerOver = (id: IPhonePartId) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
    onHoverPart?.(id);
  };

  const handlePointerOut = () => {
    document.body.style.cursor = 'auto';
    onHoverPart?.(null);
  };

  const getEmissive = (id: IPhonePartId) => (isPartFocused(id) ? '#2563eb' : '#000000');
  const getEmissiveIntensity = (id: IPhonePartId) => {
    if (selectedPartId === id) return 0.72;
    if (highlightedIds.includes(id)) return 0.48;
    return 0;
  };
  const getDimOpacity = (id: IPhonePartId) => {
    if (!hasAnyHighlight) return 1;
    return isPartFocused(id) ? 1 : 0.26;
  };
  const setGroupRef = (id: IPhonePartId) => (el: THREE.Group | null) => {
    if (el) partRefs.current[id] = el;
  };

  const batteryTex = repairPose?.batteryState === 'old' ? textures.batteryOld : textures.batteryNew;
  const hideInternalDetails = mode === 'exploded_stack' && explosionFactor < 0.03;

  return (
    <group ref={rootRef}>
      {/* 1. BACK GLASS (MODEL-ACCURATE TITANIUM CAMERA PLATEAU, LENSES, FLASH & LIDAR) */}
      <group
        ref={setGroupRef('back_glass')}
        onClick={handleClick('back_glass')}
        onPointerOver={handlePointerOver('back_glass')}
        onPointerOut={handlePointerOut}
      >
        {/* Frosted Titanium / Ceramic Shield Back Glass */}
        <mesh geometry={geometries.backGlassGeo} castShadow receiveShadow>
          <meshPhysicalMaterial
            color="#c7ccd5"
            roughness={0.34}
            metalness={0.26}
            clearcoat={0.72}
            clearcoatRoughness={0.18}
            emissive={getEmissive('back_glass')}
            emissiveIntensity={getEmissiveIntensity('back_glass')}
            transparent={hasAnyHighlight && !isPartFocused('back_glass')}
            opacity={getDimOpacity('back_glass')}
          />
        </mesh>

        {/* Flush PVD Metallic Apple Logo centered on rear Ceramic Shield glass */}
        <group
          position={[0, visualVariant === 'iphone-se-classic' ? 0.22 : -0.02, -0.0245]}
          rotation={[0, Math.PI, 0]}
        >
          <mesh geometry={geometries.logoBodyGeo}>
            <meshPhysicalMaterial
              color="#2d3748"
              metalness={0.92}
              roughness={0.06}
              clearcoat={1}
              clearcoatRoughness={0.02}
              envMapIntensity={1.95}
              polygonOffset
              polygonOffsetFactor={-2}
              polygonOffsetUnits={-2}
              emissive={getEmissive('back_glass')}
              emissiveIntensity={getEmissiveIntensity('back_glass') * 0.65}
              transparent={hasAnyHighlight && !isPartFocused('back_glass')}
              opacity={getDimOpacity('back_glass')}
            />
          </mesh>
          <mesh geometry={geometries.logoLeafGeo}>
            <meshPhysicalMaterial
              color="#2d3748"
              metalness={0.92}
              roughness={0.06}
              clearcoat={1}
              clearcoatRoughness={0.02}
              envMapIntensity={1.95}
              polygonOffset
              polygonOffsetFactor={-2}
              polygonOffsetUnits={-2}
              emissive={getEmissive('back_glass')}
              emissiveIntensity={getEmissiveIntensity('back_glass') * 0.65}
              transparent={hasAnyHighlight && !isPartFocused('back_glass')}
              opacity={getDimOpacity('back_glass')}
            />
          </mesh>
        </group>

        {/* Model-specific Rear Camera Plateau & Lens Arrangement */}
        {(() => {
          const isWideBar =
            visualVariant === 'iphone-18-pro' ||
            visualVariant === 'iphone-17-pro' ||
            visualVariant === 'iphone-17-air';
          const isSingleLens = visualVariant === 'iphone-se-classic' || visualVariant === 'iphone-17-air';
          const isVerticalDual = visualVariant === 'iphone-standard-vertical';
          const isDiagonalDual = visualVariant === 'iphone-standard-diagonal';
          const plateauPos: [number, number, number] = isWideBar
            ? [0, 1.06, -0.034]
            : isVerticalDual
            ? [0.42, 1.08, -0.034]
            : [0.3, 1.06, -0.034];
          const plateauGeometry = isWideBar
            ? geometries.plateauGeo
            : isVerticalDual
            ? geometries.pillPlateauGeo
            : geometries.squarePlateauGeo;

          const lensCoords: [number, number][] =
            visualVariant === 'iphone-17-air'
              ? [[0.4, 1.06]]
              : visualVariant === 'iphone-se-classic'
              ? [[0.44, 1.24]]
              : isVerticalDual
              ? [
                  [0.42, 1.22],
                  [0.42, 0.92],
                ]
              : isDiagonalDual
              ? [
                  [0.44, 1.21],
                  [0.14, 0.91],
                ]
              : [
                  [0.42, 1.21],
                  [0.42, 0.9],
                  [0.12, 1.055],
                ];

          const flashPos: [number, number, number] = isWideBar
            ? [-0.44, 1.22, -0.056]
            : isSingleLens
            ? [0.16, 1.24, -0.044]
            : isVerticalDual
            ? [0.08, 1.12, -0.044]
            : [0.12, 1.24, -0.056];

          const showLidar =
            visualVariant === 'iphone-18-pro' ||
            visualVariant === 'iphone-17-pro' ||
            visualVariant === 'iphone-16-pro' ||
            visualVariant === 'iphone-pro-titanium';
          const lidarPos: [number, number, number] = isWideBar
            ? [-0.44, 0.9, -0.056]
            : [0.12, 0.88, -0.056];

          return (
            <>
              {visualVariant !== 'iphone-se-classic' && (
                <mesh geometry={plateauGeometry} position={plateauPos}>
                  <meshPhysicalMaterial
                    color={chassisColorHex}
                    roughness={0.18}
                    metalness={0.68}
                    clearcoat={0.92}
                    clearcoatRoughness={0.1}
                  />
                </mesh>
              )}

              {lensCoords.map(([cx, cy], idx) => (
                <group key={idx} position={[cx, cy, -0.068]} rotation={[Math.PI / 2, 0, 0]}>
                  <mesh>
                    <cylinderGeometry args={[0.142, 0.148, 0.055, 24]} />
                    <meshStandardMaterial color={chassisColorHex} metalness={0.95} roughness={0.16} />
                  </mesh>
                  <mesh position={[0, -0.018, 0]}>
                    <cylinderGeometry args={[0.115, 0.115, 0.025, 22]} />
                    <meshStandardMaterial color="#090c12" metalness={0.4} roughness={0.5} />
                  </mesh>
                  <mesh position={[0, -0.026, 0]}>
                    <cylinderGeometry args={[0.075, 0.075, 0.02, 20]} />
                    <meshPhysicalMaterial
                      color="#0f2966"
                      metalness={0.25}
                      roughness={0.04}
                      clearcoat={1}
                      ior={1.77}
                    />
                  </mesh>
                </group>
              ))}

              {/* True Tone Quad-LED Flash */}
              <group position={flashPos} rotation={[Math.PI / 2, 0, 0]}>
                <mesh>
                  <cylinderGeometry args={[0.068, 0.068, 0.016, 18]} />
                  <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
                </mesh>
                <mesh position={[0, -0.008, 0]}>
                  <cylinderGeometry args={[0.052, 0.052, 0.012, 18]} />
                  <meshStandardMaterial
                    color="#fde68a"
                    emissive="#f59e0b"
                    emissiveIntensity={0.32}
                    roughness={0.25}
                  />
                </mesh>
              </group>

              {/* LiDAR Scanner Sensor on Pro models */}
              {showLidar && (
                <group position={lidarPos} rotation={[Math.PI / 2, 0, 0]}>
                  <mesh>
                    <cylinderGeometry args={[0.072, 0.072, 0.016, 18]} />
                    <meshStandardMaterial color="#1e293b" metalness={0.75} roughness={0.25} />
                  </mesh>
                  <mesh position={[0, -0.009, 0]}>
                    <cylinderGeometry args={[0.058, 0.058, 0.01, 18]} />
                    <meshPhysicalMaterial color="#070a10" roughness={0.08} metalness={0.2} clearcoat={1} />
                  </mesh>
                </group>
              )}

              {/* Rear Microphone Pinhole */}
              <mesh position={[flashPos[0], flashPos[1] - 0.16, flashPos[2]]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.018, 0.018, 0.012, 12]} />
                <meshStandardMaterial color="#05070b" roughness={0.7} />
              </mesh>
            </>
          );
        })()}
      </group>

      {/* 2. INTERNAL CAMERA MODULE MATCHING SELECTED VARIANT */}
      <group
        ref={setGroupRef('camera_module')}
        visible={!hideInternalDetails}
        onClick={handleClick('camera_module')}
        onPointerOver={handlePointerOver('camera_module')}
        onPointerOut={handlePointerOut}
      >
        <mesh
          position={[
            visualVariant === 'iphone-18-pro' ||
            visualVariant === 'iphone-17-pro' ||
            visualVariant === 'iphone-17-air'
              ? 0.05
              : 0.28,
            1.06,
            0,
          ]}
        >
          <boxGeometry
            args={[
              visualVariant === 'iphone-18-pro' || visualVariant === 'iphone-17-pro'
                ? 1.18
                : visualVariant === 'iphone-17-air'
                ? 0.96
                : 0.66,
              0.68,
              0.08,
            ]}
          />
          <meshStandardMaterial
            color="#151820"
            metalness={0.78}
            roughness={0.28}
            emissive={getEmissive('camera_module')}
            emissiveIntensity={getEmissiveIntensity('camera_module')}
            transparent={hasAnyHighlight && !isPartFocused('camera_module')}
            opacity={getDimOpacity('camera_module')}
          />
        </mesh>
        {(visualVariant === 'iphone-17-air'
          ? [[0.4, 1.06]]
          : visualVariant === 'iphone-se-classic'
          ? [[0.44, 1.24]]
          : visualVariant === 'iphone-standard-vertical'
          ? [
              [0.42, 1.22],
              [0.42, 0.92],
            ]
          : visualVariant === 'iphone-standard-diagonal'
          ? [
              [0.44, 1.21],
              [0.14, 0.91],
            ]
          : [
              [0.42, 1.21],
              [0.42, 0.9],
              [0.12, 1.055],
            ]
        ).map(([cx, cy], idx) => (
          <group key={idx} position={[cx, cy, 0.01]} rotation={[Math.PI / 2, 0, 0]}>
            <mesh>
              <cylinderGeometry args={[0.115, 0.115, 0.09, 20]} />
              <meshStandardMaterial color="#1f2937" metalness={0.85} roughness={0.22} />
            </mesh>
            <mesh position={[0, 0.05, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 0.018, 20]} />
              <meshPhysicalMaterial color="#1d4ed8" metalness={0.35} roughness={0.04} clearcoat={1} />
            </mesh>
          </group>
        ))}
        <mesh position={[-0.36, 1.08, 0]}>
          <boxGeometry args={[0.32, 0.28, 0.06]} />
          <meshStandardMaterial color="#272c38" metalness={0.75} roughness={0.3} />
        </mesh>
      </group>

      {/* 3. CAMERA BRACKETS & TRUEDEPTH SENSORS */}
      <group
        ref={setGroupRef('camera_brackets')}
        visible={!hideInternalDetails}
        onClick={handleClick('camera_brackets')}
        onPointerOver={handlePointerOver('camera_brackets')}
        onPointerOut={handlePointerOut}
      >
        {[-0.45, -0.15, 0.18, 0.48].map((bx, idx) => (
          <mesh key={idx} position={[bx, 1.12, 0]}>
            <boxGeometry args={[0.2, 0.16, 0.04]} />
            <meshStandardMaterial
              color="#9ca3af"
              metalness={0.9}
              roughness={0.24}
              emissive={getEmissive('camera_brackets')}
              emissiveIntensity={getEmissiveIntensity('camera_brackets')}
              transparent={hasAnyHighlight && !isPartFocused('camera_brackets')}
              opacity={getDimOpacity('camera_brackets')}
            />
          </mesh>
        ))}
        <mesh position={[0, 1.38, 0]}>
          <boxGeometry args={[0.52, 0.13, 0.04]} />
          <meshStandardMaterial color="#111827" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      {/* 4. SHIELD PLATE */}
      <group
        ref={setGroupRef('shield_plate')}
        visible={!hideInternalDetails}
        onClick={handleClick('shield_plate')}
        onPointerOver={handlePointerOver('shield_plate')}
        onPointerOut={handlePointerOut}
      >
        <mesh position={[0.14, 0.15, 0]}>
          <boxGeometry args={[0.74, 1.66, 0.02]} />
          <meshPhysicalMaterial
            color="#cbd5e1"
            metalness={0.94}
            roughness={0.2}
            roughnessMap={textures.brushed}
            anisotropy={0.7}
            emissive={getEmissive('shield_plate')}
            emissiveIntensity={getEmissiveIntensity('shield_plate')}
            transparent={hasAnyHighlight && !isPartFocused('shield_plate')}
            opacity={getDimOpacity('shield_plate')}
          />
        </mesh>
      </group>

      {/* 5. DISPLAY (EDGE-TO-EDGE OLED, THIN BEZEL, DYNAMIC ISLAND & GLASS REFLECTION) */}
      <group
        ref={setGroupRef('display_panel')}
        onClick={handleClick('display_panel')}
        onPointerOver={handlePointerOver('display_panel')}
        onPointerOut={handlePointerOut}
      >
        {/* Outer precision anodized display bezel */}
        <mesh geometry={geometries.displayBezelGeo} castShadow>
          <meshPhysicalMaterial
            color="#0b0e14"
            metalness={0.45}
            roughness={0.14}
            clearcoat={1}
            clearcoatRoughness={0.06}
            emissive={getEmissive('display_panel')}
            emissiveIntensity={getEmissiveIntensity('display_panel') * 0.55}
            transparent={hasAnyHighlight && !isPartFocused('display_panel')}
            opacity={getDimOpacity('display_panel')}
          />
        </mesh>

        {/* OLED Backing */}
        <mesh geometry={geometries.oledGeo} position={[0, 0, -0.002]}>
          <meshStandardMaterial color="#03050a" roughness={0.2} metalness={0.2} />
        </mesh>

        {/* Active ProMotion OLED Screen */}
        <mesh position={[0, 0, 0.015]}>
          <planeGeometry args={[PHONE_W - 0.12, PHONE_H - 0.12]} />
          <meshPhysicalMaterial
            map={textures.oled}
            roughness={0.05}
            metalness={0.08}
            clearcoat={1}
            clearcoatRoughness={0.04}
            emissive="#1e40af"
            emissiveMap={textures.oled}
            emissiveIntensity={isPartFocused('display_panel') ? 1.15 : 0.72}
            transparent={hasAnyHighlight && !isPartFocused('display_panel')}
            opacity={getDimOpacity('display_panel')}
          />
        </mesh>

        {/* Cracked Ceramic Shield Impact Overlay (Scene 2+ impact state) */}
        {crackIntensity > 0.01 && (
          <mesh position={[0, 0, 0.0175]}>
            <planeGeometry args={[PHONE_W - 0.12, PHONE_H - 0.12]} />
            <meshPhysicalMaterial
              map={textures.crack}
              transparent
              depthWrite={false}
              polygonOffset
              polygonOffsetFactor={-2}
              roughness={0.08}
              metalness={0.18}
              clearcoat={1}
              opacity={THREE.MathUtils.clamp(crackIntensity, 0, 1) * getDimOpacity('display_panel')}
            />
          </mesh>
        )}

        {/* Physical Dynamic Island Pill + Selfie Lens + IR Dot Projector */}
        <group position={[0, 1.44, 0.019]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.052, 0.28, 6, 12]} />
            <meshStandardMaterial color="#020306" roughness={0.15} metalness={0.2} />
          </mesh>
          {/* Front Camera Optical Lens */}
          <mesh position={[0.11, 0, 0.005]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.032, 0.032, 0.008, 16]} />
            <meshPhysicalMaterial color="#1d4ed8" metalness={0.35} roughness={0.05} clearcoat={1} />
          </mesh>
          {/* IR Flood Illuminator */}
          <mesh position={[-0.09, 0, 0.005]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.006, 14]} />
            <meshStandardMaterial color="#1e1b4b" roughness={0.2} />
          </mesh>
        </group>

        {/* Top Micro Earpiece Slit */}
        <mesh position={[0, 1.615, 0.019]}>
          <boxGeometry args={[0.26, 0.016, 0.006]} />
          <meshStandardMaterial color="#1e2430" roughness={0.6} />
        </mesh>
      </group>

      {/* 6. DISPLAY FLEX & CONNECTORS */}
      <group
        ref={setGroupRef('display_flex')}
        visible={!hideInternalDetails}
        onClick={handleClick('display_flex')}
        onPointerOver={handlePointerOver('display_flex')}
        onPointerOut={handlePointerOut}
      >
        <mesh position={[0.12, 0.15, 0]}>
          <boxGeometry args={[0.92, 0.14, 0.022]} />
          <meshStandardMaterial
            color="#b45309"
            metalness={0.85}
            roughness={0.28}
            emissive={getEmissive('display_flex')}
            emissiveIntensity={getEmissiveIntensity('display_flex')}
            transparent={hasAnyHighlight && !isPartFocused('display_flex')}
            opacity={getDimOpacity('display_flex')}
          />
        </mesh>
        {[-0.25, 0.15, 0.45].map((fx, idx) => (
          <mesh key={idx} position={[fx, 0.34, 0.012]}>
            <boxGeometry args={[0.16, 0.32, 0.018]} />
            <meshStandardMaterial color="#d97706" metalness={0.88} roughness={0.22} />
          </mesh>
        ))}
      </group>

      {/* 7. BATTERY */}
      <group
        ref={setGroupRef('battery')}
        visible={!hideInternalDetails}
        onClick={handleClick('battery')}
        onPointerOver={handlePointerOver('battery')}
        onPointerOut={handlePointerOut}
      >
        <group position={[-0.24, -0.18, 0]}>
          <mesh geometry={geometries.batteryGeo} castShadow>
            <meshStandardMaterial
              map={batteryTex}
              roughness={0.48}
              metalness={0.28}
              emissive={repairPose?.batterySwollenWarning ? '#d97706' : getEmissive('battery')}
              emissiveIntensity={repairPose?.batterySwollenWarning ? 0.45 : getEmissiveIntensity('battery')}
              transparent={hasAnyHighlight && !isPartFocused('battery')}
              opacity={getDimOpacity('battery')}
            />
          </mesh>
          <mesh position={[0, 0.78, 0]}>
            <boxGeometry args={[0.76, 0.08, 0.036]} />
            <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.35} />
          </mesh>
          <mesh position={[-0.24, -0.8, -0.02]}>
            <boxGeometry args={[0.16, 0.1, 0.01]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
          </mesh>
          <mesh position={[0.24, -0.8, -0.02]}>
            <boxGeometry args={[0.16, 0.1, 0.01]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
          </mesh>
        </group>
      </group>

      {/* 8. LOGIC BOARD (MAIN BOARD) */}
      <group
        ref={setGroupRef('logic_board')}
        visible={!hideInternalDetails}
        onClick={handleClick('logic_board')}
        onPointerOver={handlePointerOver('logic_board')}
        onPointerOut={handlePointerOut}
      >
        <group position={[0.42, 0.25, 0]}>
          <mesh geometry={geometries.boardGeo} castShadow>
            <meshStandardMaterial
              map={textures.pcb}
              roughness={0.38}
              metalness={0.55}
              emissive={getEmissive('logic_board')}
              emissiveIntensity={getEmissiveIntensity('logic_board')}
              transparent={hasAnyHighlight && !isPartFocused('logic_board')}
              opacity={getDimOpacity('logic_board')}
            />
          </mesh>
          <instancedMesh ref={smdRef} args={[undefined, undefined, 36]}>
            <boxGeometry args={[0.075, 0.095, 0.02]} />
            <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.22} />
          </instancedMesh>
        </group>
      </group>

      {/* 9. TAPTIC ENGINE */}
      <group
        ref={setGroupRef('taptic_engine')}
        visible={!hideInternalDetails}
        onClick={handleClick('taptic_engine')}
        onPointerOver={handlePointerOver('taptic_engine')}
        onPointerOut={handlePointerOut}
      >
        <group position={[-0.22, -1.16, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.76, 0.24, 0.075]} />
            <meshStandardMaterial
              color="#1f2937"
              metalness={0.82}
              roughness={0.28}
              emissive={getEmissive('taptic_engine')}
              emissiveIntensity={getEmissiveIntensity('taptic_engine')}
              transparent={hasAnyHighlight && !isPartFocused('taptic_engine')}
              opacity={getDimOpacity('taptic_engine')}
            />
          </mesh>
          <mesh position={[0, 0, 0.042]}>
            <cylinderGeometry args={[0.085, 0.085, 0.012, 20]} />
            <meshStandardMaterial color="#b45309" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      </group>

      {/* 10. SPEAKER (TOP) */}
      <group
        ref={setGroupRef('top_speaker')}
        visible={!hideInternalDetails}
        onClick={handleClick('top_speaker')}
        onPointerOver={handlePointerOver('top_speaker')}
        onPointerOut={handlePointerOut}
      >
        <mesh position={[0.05, 1.48, 0]}>
          <boxGeometry args={[0.6, 0.15, 0.06]} />
          <meshStandardMaterial
            color="#272d38"
            metalness={0.72}
            roughness={0.34}
            emissive={getEmissive('top_speaker')}
            emissiveIntensity={getEmissiveIntensity('top_speaker')}
            transparent={hasAnyHighlight && !isPartFocused('top_speaker')}
            opacity={getDimOpacity('top_speaker')}
          />
        </mesh>
      </group>

      {/* 11. MIDDLE FRAME & MAGSAFE COIL */}
      <group
        ref={setGroupRef('middle_frame')}
        visible={!hideInternalDetails}
        onClick={handleClick('middle_frame')}
        onPointerOver={handlePointerOver('middle_frame')}
        onPointerOut={handlePointerOut}
      >
        <mesh geometry={geometries.middleFrameGeo} castShadow receiveShadow>
          <meshPhysicalMaterial
            color="#94a3b8"
            metalness={0.92}
            roughness={0.25}
            roughnessMap={textures.brushed}
            anisotropy={0.75}
            emissive={getEmissive('middle_frame')}
            emissiveIntensity={getEmissiveIntensity('middle_frame')}
            transparent={hasAnyHighlight && !isPartFocused('middle_frame')}
            opacity={getDimOpacity('middle_frame')}
          />
        </mesh>
        <mesh position={[0, 0.05, -0.015]}>
          <torusGeometry args={[0.46, 0.028, 10, 36]} />
          <meshStandardMaterial color="#b45309" metalness={0.88} roughness={0.22} />
        </mesh>
        <instancedMesh ref={screwsRef} args={[undefined, undefined, 22]}>
          <cylinderGeometry args={[0.02, 0.02, 0.018, 8]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
        </instancedMesh>
      </group>

      {/* 12. SPEAKER (BOTTOM) */}
      <group
        ref={setGroupRef('bottom_speaker')}
        visible={!hideInternalDetails}
        onClick={handleClick('bottom_speaker')}
        onPointerOver={handlePointerOver('bottom_speaker')}
        onPointerOut={handlePointerOut}
      >
        <mesh position={[0.42, -1.32, 0]}>
          <boxGeometry args={[0.54, 0.32, 0.075]} />
          <meshStandardMaterial
            color="#1f2530"
            metalness={0.68}
            roughness={0.35}
            emissive={getEmissive('bottom_speaker')}
            emissiveIntensity={getEmissiveIntensity('bottom_speaker')}
            transparent={hasAnyHighlight && !isPartFocused('bottom_speaker')}
            opacity={getDimOpacity('bottom_speaker')}
          />
        </mesh>
      </group>

      {/* 13. CHARGING PORT (USB-C) */}
      <group
        ref={setGroupRef('charging_port')}
        visible={!hideInternalDetails}
        onClick={handleClick('charging_port')}
        onPointerOver={handlePointerOver('charging_port')}
        onPointerOut={handlePointerOut}
      >
        <group position={[0, -1.52, 0]}>
          <mesh>
            <boxGeometry args={[0.3, 0.16, 0.065]} />
            <meshStandardMaterial
              color="#cbd5e1"
              metalness={0.9}
              roughness={0.22}
              emissive={getEmissive('charging_port')}
              emissiveIntensity={getEmissiveIntensity('charging_port')}
              transparent={hasAnyHighlight && !isPartFocused('charging_port')}
              opacity={getDimOpacity('charging_port')}
            />
          </mesh>
          <mesh position={[0.26, 0.07, 0]}>
            <boxGeometry args={[0.34, 0.07, 0.018]} />
            <meshStandardMaterial color="#b45309" metalness={0.85} roughness={0.25} />
          </mesh>
        </group>
      </group>

      {/* 14. ANTENNA MODULES */}
      <group
        ref={setGroupRef('antenna_modules')}
        visible={!hideInternalDetails}
        onClick={handleClick('antenna_modules')}
        onPointerOver={handlePointerOver('antenna_modules')}
        onPointerOut={handlePointerOut}
      >
        <mesh position={[-0.64, 0.25, 0]}>
          <boxGeometry args={[0.1, 0.65, 0.05]} />
          <meshStandardMaterial
            color="#334155"
            metalness={0.78}
            roughness={0.32}
            emissive={getEmissive('antenna_modules')}
            emissiveIntensity={getEmissiveIntensity('antenna_modules')}
            transparent={hasAnyHighlight && !isPartFocused('antenna_modules')}
            opacity={getDimOpacity('antenna_modules')}
          />
        </mesh>
        <mesh position={[0.64, -0.55, 0]}>
          <boxGeometry args={[0.1, 0.52, 0.05]} />
          <meshStandardMaterial color="#334155" metalness={0.78} roughness={0.32} />
        </mesh>
      </group>

      {/* 15. GRADE-5 TITANIUM CHASSIS FRAME (BUTTONS, ANTENNA LINES, USB-C PORT, GRILLES) */}
      <group
        ref={setGroupRef('titanium_frame')}
        onClick={handleClick('titanium_frame')}
        onPointerOver={handlePointerOver('titanium_frame')}
        onPointerOut={handlePointerOut}
      >
        <mesh geometry={geometries.titaniumBandGeo} castShadow receiveShadow>
          <meshPhysicalMaterial
            color={chassisColorHex}
            metalness={0.96}
            roughness={0.2}
            roughnessMap={textures.brushed}
            anisotropy={0.85}
            clearcoat={0.28}
            emissive={getEmissive('titanium_frame')}
            emissiveIntensity={getEmissiveIntensity('titanium_frame')}
            transparent={hasAnyHighlight && !isPartFocused('titanium_frame')}
            opacity={getDimOpacity('titanium_frame')}
          />
        </mesh>

        {/* Right Side: Power Button + Camera Control Capacitive Button (16/17 series) */}
        <mesh position={[0.858, 0.42, 0]}>
          <boxGeometry args={[0.032, 0.42, 0.075]} />
          <meshStandardMaterial color={chassisColorHex} metalness={0.95} roughness={0.18} />
        </mesh>
        {(visualVariant === 'iphone-16-pro' ||
          visualVariant === 'iphone-17-pro' ||
          visualVariant === 'iphone-18-pro' ||
          visualVariant === 'iphone-17-air') && (
          <mesh position={[0.85, -0.55, 0]}>
            <boxGeometry args={[0.022, 0.28, 0.068]} />
            <meshPhysicalMaterial color="#1e293b" metalness={0.45} roughness={0.1} clearcoat={1} />
          </mesh>
        )}

        {/* Left Side: Action Button + Volume Up + Volume Down */}
        <mesh position={[-0.858, 0.78, 0]}>
          <boxGeometry args={[0.032, 0.15, 0.075]} />
          <meshStandardMaterial color={chassisColorHex} metalness={0.95} roughness={0.18} />
        </mesh>
        <mesh position={[-0.858, 0.42, 0]}>
          <boxGeometry args={[0.032, 0.25, 0.075]} />
          <meshStandardMaterial color={chassisColorHex} metalness={0.95} roughness={0.18} />
        </mesh>
        <mesh position={[-0.858, 0.08, 0]}>
          <boxGeometry args={[0.032, 0.25, 0.075]} />
          <meshStandardMaterial color={chassisColorHex} metalness={0.95} roughness={0.18} />
        </mesh>

        {/* Dielectric Antenna Bands around titanium perimeter */}
        {[
          [-0.84, 1.25],
          [-0.84, -1.25],
          [0.84, 1.25],
          [0.84, -1.25],
        ].map(([ax, ay], i) => (
          <mesh key={i} position={[ax, ay, 0]}>
            <boxGeometry args={[0.038, 0.04, 0.23]} />
            <meshStandardMaterial color="#475569" roughness={0.65} metalness={0.1} />
          </mesh>
        ))}
        {/* Top & bottom antenna seams */}
        <mesh position={[0.42, 1.7, 0]}>
          <boxGeometry args={[0.04, 0.04, 0.23]} />
          <meshStandardMaterial color="#475569" roughness={0.65} metalness={0.1} />
        </mesh>
        <mesh position={[-0.42, -1.7, 0]}>
          <boxGeometry args={[0.04, 0.04, 0.23]} />
          <meshStandardMaterial color="#475569" roughness={0.65} metalness={0.1} />
        </mesh>

        {/* Bottom Edge: Recessed USB-C Port + Pentalobe Screws + Instanced Speaker/Mic Grilles */}
        <group position={[0, -1.7, 0]}>
          <mesh>
            <boxGeometry args={[0.26, 0.025, 0.085]} />
            <meshStandardMaterial color="#05070b" roughness={0.4} metalness={0.3} />
          </mesh>
          {/* USB-C internal contact tongue */}
          <mesh position={[0, 0.004, 0]}>
            <boxGeometry args={[0.18, 0.018, 0.022]} />
            <meshStandardMaterial color="#d4af37" metalness={0.85} roughness={0.25} />
          </mesh>
          {/* Bottom Pentalobe Screws */}
          <mesh position={[-0.19, 0, 0]}>
            <cylinderGeometry args={[0.016, 0.016, 0.02, 10]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.15} />
          </mesh>
          <mesh position={[0.19, 0, 0]}>
            <cylinderGeometry args={[0.016, 0.016, 0.02, 10]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.15} />
          </mesh>
        </group>

        <instancedMesh ref={grilleRef} args={[undefined, undefined, 10]}>
          <cylinderGeometry args={[0.016, 0.016, 0.03, 10]} />
          <meshStandardMaterial color="#05070b" roughness={0.6} />
        </instancedMesh>
      </group>

      {mode === 'repair_bench' && repairPose && (
        <RepairTools3D tool={repairPose.tool} reducedMotion={reducedMotion} />
      )}
    </group>
  );
}
