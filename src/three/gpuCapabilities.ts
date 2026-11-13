export interface GpuCapabilities {
  webglAvailable: boolean;
  isSoftwareGl: boolean;
  prefersReducedMotion: boolean;
  maxPixelRatio: number;
}

let cachedCaps: GpuCapabilities | null = null;

export function detectGpuCapabilities(): GpuCapabilities {
  if (cachedCaps) return cachedCaps;
  if (typeof window === 'undefined') {
    return {
      webglAvailable: false,
      isSoftwareGl: true,
      prefersReducedMotion: false,
      maxPixelRatio: 1,
    };
  }

  const prefersReducedMotion =
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  let webglAvailable = false;
  let isSoftwareGl = false;

  try {
    const probeCanvas = document.createElement('canvas');
    const gl =
      (probeCanvas.getContext('webgl2') as WebGL2RenderingContext | null) ||
      (probeCanvas.getContext('webgl') as WebGLRenderingContext | null);

    if (gl) {
      webglAvailable = true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param) || '');
      isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  } catch {
    webglAvailable = false;
    isSoftwareGl = true;
  }

  cachedCaps = {
    webglAvailable,
    isSoftwareGl,
    prefersReducedMotion,
    maxPixelRatio: isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2),
  };
  return cachedCaps;
}
