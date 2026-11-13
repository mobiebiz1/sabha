import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { detectGpuCapabilities } from './gpuCapabilities';
import { createContactShadowTexture } from './proceduralTextures';

interface StudioEnvProps {
  backgroundColor?: string;
  fogDensity?: number;
  rimIntensity?: number;
}

export function StudioEnvironmentRig({
  backgroundColor = '#090b0f',
  fogDensity = 0.02,
  rimIntensity = 1.6,
}: StudioEnvProps) {
  const { gl, scene } = useThree();
  const caps = useMemo(() => detectGpuCapabilities(), []);

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmrem.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    scene.background = new THREE.Color(backgroundColor);
    scene.fog = new THREE.FogExp2(backgroundColor, fogDensity);

    return () => {
      envTarget.dispose();
      roomEnv.dispose();
      pmrem.dispose();
    };
  }, [gl, scene, backgroundColor, fogDensity]);

  return (
    <>
      <hemisphereLight args={['#a5c4ff', '#161a24', 0.92]} />
      <directionalLight
        position={[5.5, 8.5, 6.5]}
        intensity={2.35}
        color="#fff6eb"
        castShadow={!caps.isSoftwareGl}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        shadow-camera-far={25}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[-6, 3, -5]} intensity={rimIntensity} color="#3b82f6" />
      <directionalLight position={[0, -5, 4]} intensity={0.85} color="#cbd5e1" />
    </>
  );
}

export function GroundContactShadow({
  y = -4.2,
  scale = 5.5,
  opacity = 0.5,
}: {
  y?: number;
  scale?: number;
  opacity?: number;
}) {
  const tex = useMemo(() => createContactShadowTexture(), []);

  useEffect(() => {
    return () => tex.dispose();
  }, [tex]);

  return (
    <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-1}>
      <planeGeometry args={[scale, scale]} />
      <meshBasicMaterial map={tex} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
}

export function useNearViewport(
  ref: React.RefObject<HTMLElement | null>,
  rootMargin = '450px'
): boolean {
  const [near, setNear] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        setNear(entries[0]?.isIntersecting ?? true);
      },
      { rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, rootMargin]);

  return near;
}

interface StudioCanvasProps {
  children: React.ReactNode;
  className?: string;
  cameraPosition?: [number, number, number];
  fov?: number;
  frameloop?: 'always' | 'demand' | 'never';
  allowVerticalPageScroll?: boolean;
  lazyMount?: boolean;
  fallback?: React.ReactNode;
}

export function StudioCanvas({
  children,
  className = '',
  cameraPosition = [0, 0, 8],
  fov = 38,
  frameloop = 'always',
  allowVerticalPageScroll = false,
  lazyMount = false,
  fallback,
}: StudioCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const nearViewport = useNearViewport(wrapperRef, '500px');
  const caps = useMemo(() => detectGpuCapabilities(), []);
  const [contextLost, setContextLost] = useState(false);
  const [hasActivated, setHasActivated] = useState(!lazyMount);

  useEffect(() => {
    if (nearViewport) {
      setHasActivated(true);
    }
  }, [nearViewport]);

  const effectiveFrameloop = lazyMount && !nearViewport ? 'never' : frameloop;

  // Enforce pan-y on mobile touch canvases so vertical scrolling never gets trapped
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || !allowVerticalPageScroll) return;
    const applyTouchAction = () => {
      const canvas = el.querySelector('canvas');
      if (canvas) {
        canvas.style.touchAction = 'pan-y';
      }
    };
    applyTouchAction();
    const timer = window.setTimeout(applyTouchAction, 120);
    return () => window.clearTimeout(timer);
  }, [allowVerticalPageScroll, hasActivated]);

  if (!caps.webglAvailable || contextLost) {
    return (
      <div
        ref={wrapperRef}
        className={`relative flex items-center justify-center bg-[#0c0f15] ${className}`}
      >
        {fallback ?? (
          <div className="p-6 text-center text-sm text-slate-400">
            Interactive 3D view paused — 2D engineering schematic mode active.
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className={`relative w-full h-full min-h-[200px] ${className}`}
      style={allowVerticalPageScroll ? { touchAction: 'pan-y' } : undefined}
    >
      {hasActivated ? (
        <Canvas
          shadows={!caps.isSoftwareGl}
          dpr={caps.maxPixelRatio}
          frameloop={effectiveFrameloop}
          resize={{ scroll: true, debounce: { scroll: 50, resize: 0 } }}
          camera={{ position: cameraPosition, fov, near: 0.1, far: 100 }}
          gl={{
            antialias: !caps.isSoftwareGl,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.1,
            outputColorSpace: THREE.SRGBColorSpace,
          }}
          onCreated={({ gl }) => {
            const canvas = gl.domElement;
            if (allowVerticalPageScroll) {
              canvas.style.touchAction = 'pan-y';
            }
            canvas.addEventListener('webglcontextlost', (e) => {
              e.preventDefault();
              setContextLost(true);
            });
            canvas.addEventListener('webglcontextrestored', () => {
              setContextLost(false);
            });
          }}
        >
          {children}
        </Canvas>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[#090B0F] text-xs text-slate-500">
          Loading 3D Hardware View...
        </div>
      )}
    </div>
  );
}

export function SafeOrbitControls({
  allowVerticalPageScroll = false,
  ...props
}: React.ComponentProps<typeof OrbitControls> & { allowVerticalPageScroll?: boolean }) {
  const { gl } = useThree();

  useEffect(() => {
    gl.domElement.style.touchAction = allowVerticalPageScroll ? 'pan-y' : 'none';
  }, [gl, allowVerticalPageScroll]);

  return (
    <OrbitControls
      touches={{
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_ROTATE,
      }}
      {...props}
    />
  );
}

