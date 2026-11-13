import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface ExternalAssetDescriptor {
  modelId: string;
  glbUrl?: string;
  /** Maps named nodes inside a real GLB file to internal AppleFix part IDs */
  nodeMap?: Record<string, string>;
}

/**
 * Modular GLB/GLTF Asset Registry.
 * When verified .glb hardware models are added to /public/models/<id>.glb,
 * register their path and node map here. Until then, `resolveDeviceAsset`
 * cleanly returns `null` without issuing 404 network requests so the
 * procedural 15-part PBR hardware assemblies render immediately.
 */
export const DEVICE_GLB_REGISTRY: Record<string, ExternalAssetDescriptor> = {
  // Example for future drop-in GLB assets:
  // 'iphone-15-pro': {
  //   modelId: 'iphone-15-pro',
  //   glbUrl: '/models/iphone-15-pro-exploded.glb',
  //   nodeMap: { BackGlass: 'back_glass', Battery: 'battery', LogicBoard: 'logic_board' },
  // },
};

const loader = new GLTFLoader();
const gltfCache = new Map<string, Promise<GLTF | null>>();

export async function resolveDeviceGlbAsset(modelId: string): Promise<GLTF | null> {
  const entry = DEVICE_GLB_REGISTRY[modelId];
  if (!entry?.glbUrl) {
    return null;
  }

  if (!gltfCache.has(entry.glbUrl)) {
    const promise = new Promise<GLTF | null>((resolve) => {
      loader.load(
        entry.glbUrl!,
        (gltf) => resolve(gltf),
        undefined,
        () => resolve(null)
      );
    });
    gltfCache.set(entry.glbUrl, promise);
  }

  return gltfCache.get(entry.glbUrl)!;
}

export function createRoundedRectShape(width: number, height: number, radius: number): THREE.Shape {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  const r = Math.min(radius, width / 2, height / 2);

  shape.moveTo(x + r, y);
  shape.lineTo(x + width - r, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + r);
  shape.lineTo(x + width, y + height - r);
  shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  shape.lineTo(x + r, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
}

export function createRoundedFrameShape(
  outerW: number,
  outerH: number,
  outerR: number,
  thickness: number
): THREE.Shape {
  const outer = createRoundedRectShape(outerW, outerH, outerR);
  const innerW = outerW - thickness * 2;
  const innerH = outerH - thickness * 2;
  const innerR = Math.max(0.02, outerR - thickness);
  const hole = new THREE.Path();
  const x = -innerW / 2;
  const y = -innerH / 2;

  hole.moveTo(x + innerR, y);
  hole.lineTo(x + innerW - innerR, y);
  hole.quadraticCurveTo(x + innerW, y, x + innerW, y + innerR);
  hole.lineTo(x + innerW, y + innerH - innerR);
  hole.quadraticCurveTo(x + innerW, y + innerH, x + innerW - innerR, y + innerH);
  hole.lineTo(x + innerR, y + innerH);
  hole.quadraticCurveTo(x, y + innerH, x, y + innerH - innerR);
  hole.lineTo(x, y + innerR);
  hole.quadraticCurveTo(x, y, x + innerR, y);

  outer.holes.push(hole);
  return outer;
}

/**
 * Generates geometrically accurate 3D beveled Apple logo body & leaf geometries.
 * Centered horizontally at x = 0 with total height ~ 1.13 * scale and width ~ 0.98 * scale.
 */
export function createAppleLogoGeometries(
  scale = 0.36,
  curveSegments = 24,
  bevelSegments = 2
): {
  logoBodyGeo: THREE.ExtrudeGeometry;
  logoLeafGeo: THREE.ExtrudeGeometry;
} {
  // Apple body outline in +X right, +Y up coordinates (bite on +X side)
  const body = new THREE.Shape();
  body.moveTo(0.0, 0.22);
  // Top-right shoulder
  body.bezierCurveTo(0.11, 0.22, 0.2, 0.285, 0.3, 0.275);
  body.bezierCurveTo(0.39, 0.265, 0.44, 0.215, 0.455, 0.155);
  // Characteristic circular bite crescent on +X right side
  body.bezierCurveTo(0.245, 0.09, 0.245, -0.095, 0.475, -0.165);
  // Lower-right flank down to right base lobe
  body.bezierCurveTo(0.45, -0.29, 0.37, -0.45, 0.27, -0.52);
  body.bezierCurveTo(0.21, -0.56, 0.14, -0.55, 0.07, -0.52);
  // Bottom cleft dip
  body.bezierCurveTo(0.03, -0.5, 0.015, -0.495, 0.0, -0.495);
  body.bezierCurveTo(-0.015, -0.495, -0.03, -0.5, -0.07, -0.52);
  // Left base lobe and continuous smooth outer left apple curve
  body.bezierCurveTo(-0.14, -0.55, -0.22, -0.56, -0.28, -0.51);
  body.bezierCurveTo(-0.41, -0.41, -0.5, -0.18, -0.49, 0.02);
  body.bezierCurveTo(-0.48, 0.2, -0.37, 0.285, -0.24, 0.275);
  body.bezierCurveTo(-0.14, 0.27, -0.07, 0.22, 0.0, 0.22);

  // Detached tilted leaf above top cleft
  const leaf = new THREE.Shape();
  leaf.moveTo(-0.01, 0.295);
  leaf.bezierCurveTo(0.11, 0.295, 0.22, 0.395, 0.21, 0.565);
  leaf.bezierCurveTo(0.09, 0.565, -0.02, 0.455, -0.01, 0.295);

  const extrudeOptions: THREE.ExtrudeGeometryOptions = {
    depth: 0.003,
    bevelEnabled: bevelSegments > 0,
    bevelThickness: 0.001,
    bevelSize: 0.0012,
    bevelSegments,
    curveSegments,
  };

  const logoBodyGeo = new THREE.ExtrudeGeometry(body, extrudeOptions);
  logoBodyGeo.scale(scale, scale, 1);
  logoBodyGeo.computeVertexNormals();

  const logoLeafGeo = new THREE.ExtrudeGeometry(leaf, extrudeOptions);
  logoLeafGeo.scale(scale, scale, 1);
  logoLeafGeo.computeVertexNormals();

  return { logoBodyGeo, logoLeafGeo };
}

