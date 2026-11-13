import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { RepairToolType } from '../../data/repairs';

interface RepairToolsProps {
  tool: RepairToolType;
  reducedMotion?: boolean;
}

export function RepairTools3D({ tool, reducedMotion = false }: RepairToolsProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current || reducedMotion) return;
    const t = clock.getElapsedTime();
    groupRef.current.position.y = Math.sin(t * 2.1) * 0.04;
  });

  if (tool === 'none') return null;

  return (
    <group ref={groupRef}>
      {tool === 'suction_opener' && (
        <group position={[0.4, 0.95, 0.85]} rotation={[0.35, -0.25, 0.15]}>
          {/* Dual-cup precision screen lifter */}
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.55, 20]} />
            <meshStandardMaterial color="#3b82f6" metalness={0.7} roughness={0.28} />
          </mesh>
          <mesh position={[0, -0.04, 0]}>
            <cylinderGeometry args={[0.14, 0.24, 0.12, 24]} />
            <meshStandardMaterial color="#1e293b" metalness={0.1} roughness={0.75} />
          </mesh>
          <mesh position={[0, 0.55, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.045, 0.045, 0.48, 16]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.22} />
          </mesh>
        </group>
      )}

      {tool === 'esd_spudger' && (
        <group position={[-0.75, 0.65, 0.72]} rotation={[0.45, 0.35, -0.6]}>
          {/* Matte black ESD-safe nylon spudger */}
          <mesh>
            <cylinderGeometry args={[0.032, 0.042, 1.45, 16]} />
            <meshStandardMaterial color="#111827" metalness={0.15} roughness={0.65} />
          </mesh>
          <mesh position={[0, -0.78, 0]}>
            <boxGeometry args={[0.06, 0.18, 0.015]} />
            <meshStandardMaterial color="#3b82f6" metalness={0.2} roughness={0.4} />
          </mesh>
        </group>
      )}

      {tool === 'precision_tweezers' && (
        <group position={[0.72, 0.85, 0.65]} rotation={[0.4, -0.45, 0.55]}>
          <mesh position={[-0.025, 0, 0]} rotation={[0, 0, -0.04]}>
            <boxGeometry args={[0.02, 1.35, 0.045]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.2} />
          </mesh>
          <mesh position={[0.025, 0, 0]} rotation={[0, 0, 0.04]}>
            <boxGeometry args={[0.02, 1.35, 0.045]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.66, 0]}>
            <boxGeometry args={[0.06, 0.08, 0.05]} />
            <meshStandardMaterial color="#2563eb" metalness={0.5} roughness={0.35} />
          </mesh>
        </group>
      )}

      {tool === 'pentalobe_driver' && (
        <group position={[-0.65, 0.45, 0.88]} rotation={[0.5, 0.2, -0.45]}>
          {/* Anodized aluminum precision screwdriver */}
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.075, 0.065, 0.72, 12]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.7, 0]}>
            <cylinderGeometry args={[0.055, 0.055, 0.08, 16]} />
            <meshStandardMaterial color="#3b82f6" metalness={0.85} roughness={0.2} />
          </mesh>
          <mesh position={[0, -0.35, 0]}>
            <cylinderGeometry args={[0.018, 0.014, 0.72, 12]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
          </mesh>
        </group>
      )}

      {tool === 'diagnostic_dock' && (
        <group position={[0, -1.95, 0.15]}>
          {/* USB-C diagnostic telemetry bridge & digital wattage meter */}
          <mesh position={[0, -0.22, 0]}>
            <boxGeometry args={[0.62, 0.24, 0.18]} />
            <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.32} />
          </mesh>
          <mesh position={[0, -0.22, 0.095]}>
            <planeGeometry args={[0.48, 0.14]} />
            <meshStandardMaterial color="#1d4ed8" emissive="#2563eb" emissiveIntensity={1.2} />
          </mesh>
          <mesh position={[0, -0.02, 0]}>
            <boxGeometry args={[0.16, 0.16, 0.07]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.22} />
          </mesh>
        </group>
      )}

      {tool === 'heating_pad' && (
        <group position={[0, -0.35, -0.58]}>
          {/* Controlled-temperature silicone heating pad */}
          <mesh>
            <boxGeometry args={[2.15, 3.65, 0.08]} />
            <meshStandardMaterial color="#172030" metalness={0.15} roughness={0.75} />
          </mesh>
          <mesh position={[0, 0, -0.045]}>
            <boxGeometry args={[2.0, 3.5, 0.02]} />
            <meshStandardMaterial color="#f59e0b" emissive="#d97706" emissiveIntensity={0.45} />
          </mesh>
        </group>
      )}

      {tool === 'micro_solder' && (
        <group position={[0.68, 0.25, 0.85]} rotation={[0.45, -0.3, 0.4]}>
          {/* Fine micro-soldering pencil tip */}
          <mesh position={[0, 0.42, 0]}>
            <cylinderGeometry args={[0.055, 0.045, 0.78, 16]} />
            <meshStandardMaterial color="#0f172a" metalness={0.5} roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.18, 0]}>
            <cylinderGeometry args={[0.025, 0.005, 0.48, 12]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.15} />
          </mesh>
          <mesh position={[0, -0.41, 0]}>
            <sphereGeometry args={[0.022, 12, 12]} />
            <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={1.5} />
          </mesh>
        </group>
      )}

      {tool === 'adhesive_press' && (
        <group position={[0, 0, 0.55]}>
          {/* Calibrated perimeter sealing press plate */}
          <mesh>
            <boxGeometry args={[1.65, 3.15, 0.06]} />
            <meshStandardMaterial color="#1e293b" metalness={0.75} roughness={0.28} transparent opacity={0.45} />
          </mesh>
        </group>
      )}

      {tool === 'ultrasonic_clean' && (
        <group position={[-0.75, 0.55, 0.7]} rotation={[0.3, 0.2, -0.35]}>
          <mesh>
            <cylinderGeometry args={[0.045, 0.055, 1.05, 16]} />
            <meshStandardMaterial color="#38bdf8" metalness={0.5} roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.58, 0]}>
            <sphereGeometry args={[0.09, 16, 16]} />
            <meshStandardMaterial color="#7dd3fc" emissive="#0284c7" emissiveIntensity={0.8} transparent opacity={0.65} />
          </mesh>
        </group>
      )}
    </group>
  );
}
