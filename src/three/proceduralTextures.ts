import * as THREE from 'three';

function createCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

export function createBrushedMetalRoughnessTexture(anisotropy = 4): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(256, 256);
  ctx.fillStyle = '#5a5a5a';
  ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y++) {
    const v = 72 + Math.floor(Math.sin(y * 0.9) * 12 + Math.random() * 22);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(0, y, 256, 1);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.anisotropy = anisotropy;
  return tex;
}

export function createOledDisplayTexture(anisotropy = 4): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(512, 1024);

  // Deep pure OLED black base
  ctx.fillStyle = '#010308';
  ctx.fillRect(0, 0, 512, 1024);

  // Subtle ambient sapphire & warm titanium radial depth
  const bgGlow = ctx.createRadialGradient(256, 510, 24, 256, 510, 450);
  bgGlow.addColorStop(0, 'rgba(37, 99, 235, 0.48)');
  bgGlow.addColorStop(0.45, 'rgba(30, 58, 138, 0.24)');
  bgGlow.addColorStop(1, 'rgba(1, 3, 8, 0)');
  ctx.fillStyle = bgGlow;
  ctx.fillRect(0, 0, 512, 1024);

  // Sculpted Pro Titanium & Sapphire light-arc folds (clean commercial lockscreen aesthetic)
  const lowerArc = ctx.createLinearGradient(40, 520, 470, 900);
  lowerArc.addColorStop(0, 'rgba(15, 23, 42, 0.0)');
  lowerArc.addColorStop(0.35, 'rgba(29, 78, 216, 0.65)');
  lowerArc.addColorStop(0.62, 'rgba(147, 197, 253, 0.85)');
  lowerArc.addColorStop(1, 'rgba(2, 6, 23, 0.05)');

  ctx.strokeStyle = lowerArc;
  ctx.lineWidth = 42;
  ctx.beginPath();
  ctx.ellipse(256, 650, 155, 210, -0.25, Math.PI * 0.1, Math.PI * 1.18);
  ctx.stroke();

  const upperArc = ctx.createLinearGradient(60, 230, 450, 560);
  upperArc.addColorStop(0, 'rgba(226, 204, 180, 0.08)');
  upperArc.addColorStop(0.48, 'rgba(214, 191, 166, 0.72)');
  upperArc.addColorStop(0.85, 'rgba(96, 165, 250, 0.45)');
  upperArc.addColorStop(1, 'rgba(2, 4, 9, 0.0)');

  ctx.strokeStyle = upperArc;
  ctx.lineWidth = 28;
  ctx.beginPath();
  ctx.ellipse(240, 395, 168, 175, 0.35, Math.PI * 1.05, Math.PI * 2.08);
  ctx.stroke();

  // Thin crisp specular edge rim highlights
  ctx.strokeStyle = 'rgba(248, 250, 252, 0.65)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(256, 650, 134, 190, -0.25, Math.PI * 0.15, Math.PI * 1.12);
  ctx.stroke();

  // Status bar indicators flanking Dynamic Island
  ctx.fillStyle = 'rgba(248, 250, 252, 0.88)';
  ctx.font = '600 17px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('5G', 385, 58);

  // Battery pill icon
  ctx.strokeStyle = 'rgba(248, 250, 252, 0.75)';
  ctx.lineWidth = 2;
  ctx.strokeRect(422, 44, 34, 16);
  ctx.fillStyle = 'rgba(248, 250, 252, 0.9)';
  ctx.fillRect(425, 47, 24, 10);
  ctx.fillRect(457, 49, 3, 6);

  // Lock screen typography positioned cleanly below Dynamic Island
  ctx.fillStyle = 'rgba(226, 232, 240, 0.82)';
  ctx.font = '600 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Fri, 13 Nov', 256, 138);

  ctx.fillStyle = 'rgba(248, 250, 252, 0.96)';
  ctx.font = '700 112px sans-serif';
  ctx.fillText('9:41', 256, 236);

  // Subtle bottom lockscreen Flashlight & Camera circles
  [84, 428].forEach((cx, idx) => {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.beginPath();
    ctx.arc(cx, 922, 27, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = 'rgba(248, 250, 252, 0.86)';
    if (idx === 0) {
      // Torch glyph
      ctx.fillRect(cx - 4, 913, 8, 18);
      ctx.fillRect(cx - 6, 910, 12, 4);
    } else {
      // Camera glyph
      ctx.fillRect(cx - 10, 915, 20, 14);
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(cx, 922, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // Home indicator bar
  ctx.fillStyle = 'rgba(248, 250, 252, 0.9)';
  ctx.beginPath();
  ctx.roundRect(172, 988, 168, 7, 3.5);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}

export function createBatteryTexture(state: 'old' | 'new' = 'new', anisotropy = 4): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(512, 768);
  ctx.fillStyle = state === 'old' ? '#1c1d22' : '#101318';
  ctx.fillRect(0, 0, 512, 768);

  ctx.strokeStyle = state === 'old' ? '#3d3f4a' : '#2d3544';
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, 492, 748);

  ctx.fillStyle = state === 'old' ? '#94a3b8' : '#e2e8f0';
  ctx.font = '700 26px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Li-ion Polymer Cell', 256, 290);

  ctx.fillStyle = state === 'old' ? '#f59e0b' : '#60a5fa';
  ctx.font = '600 20px monospace';
  ctx.fillText(state === 'old' ? 'HEALTH: 74% · AGED CELL' : 'HEALTH: 100% · 3.89V / 12.68Wh', 256, 336);

  ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
  ctx.font = '500 15px monospace';
  ctx.fillText('DO NOT PUNCTURE · DO NOT HEAT >60°C', 256, 405);
  ctx.fillText('BMS INTEGRATED PROTECTION', 256, 434);

  ctx.fillStyle = state === 'old' ? '#64748b' : '#e2e8f0';
  ctx.fillRect(90, 660, 110, 26);
  ctx.fillRect(312, 660, 110, 26);
  ctx.fillStyle = '#090b0f';
  ctx.font = '700 12px monospace';
  ctx.fillText('PULL TAB A', 145, 677);
  ctx.fillText('PULL TAB B', 367, 677);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}

export function createLogicBoardTexture(anisotropy = 4): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(512, 768);
  ctx.fillStyle = '#0f1621';
  ctx.fillRect(0, 0, 512, 768);

  ctx.strokeStyle = 'rgba(217, 179, 98, 0.35)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 42; i++) {
    const x = 30 + (i * 11) % 450;
    const y = 30 + (i * 19) % 680;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 40, y);
    ctx.lineTo(x + 65, y + 30);
    ctx.stroke();
  }

  ctx.fillStyle = '#181e29';
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 3;
  ctx.fillRect(156, 220, 200, 200);
  ctx.strokeRect(156, 220, 200, 200);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '700 24px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('A-SERIES SoC', 256, 315);
  ctx.fillStyle = '#60a5fa';
  ctx.font = '500 14px monospace';
  ctx.fillText('3nm SILICON · PMIC', 256, 344);

  ctx.fillStyle = '#262e3d';
  ctx.fillRect(72, 70, 140, 110);
  ctx.fillRect(280, 70, 160, 110);
  ctx.fillRect(82, 460, 160, 180);
  ctx.fillRect(272, 460, 160, 180);

  ctx.fillStyle = '#eab308';
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(60 + i * 68, 690, 44, 24);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}

export function createMacBookScreenTexture(anisotropy = 4): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(512, 320);
  ctx.fillStyle = '#040812';
  ctx.fillRect(0, 0, 512, 320);

  const grad = ctx.createRadialGradient(256, 160, 20, 256, 160, 230);
  grad.addColorStop(0, '#2563eb');
  grad.addColorStop(0.45, '#1e3a8a');
  grad.addColorStop(1, '#040812');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 320);

  ctx.strokeStyle = 'rgba(147, 197, 253, 0.5)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 215);
  ctx.bezierCurveTo(160, 110, 340, 245, 512, 130);
  ctx.stroke();

  ctx.fillStyle = 'rgba(241, 245, 249, 0.85)';
  ctx.font = '600 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('AppleFix Diagnostic Bench · Liquid Retina XDR', 256, 275);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}

export function createWatchDialTexture(anisotropy = 4): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(256, 300);
  ctx.fillStyle = '#03050a';
  ctx.fillRect(0, 0, 256, 300);

  ctx.strokeStyle = 'rgba(59, 130, 246, 0.45)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(128, 150, 82, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(128, 150, 62, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const r1 = i % 5 === 0 ? 74 : 78;
    const r2 = 82;
    ctx.strokeStyle = i % 5 === 0 ? '#e2e8f0' : 'rgba(148,163,184,0.45)';
    ctx.lineWidth = i % 5 === 0 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(128 + Math.cos(a) * r1, 150 + Math.sin(a) * r1);
    ctx.lineTo(128 + Math.cos(a) * r2, 150 + Math.sin(a) * r2);
    ctx.stroke();
  }

  ctx.fillStyle = '#f8fafc';
  ctx.font = '700 26px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('10:09', 128, 148);
  ctx.fillStyle = '#60a5fa';
  ctx.font = '600 11px monospace';
  ctx.fillText('OLED · SiP OK', 128, 172);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}

export function createIPadScreenTexture(anisotropy = 4): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(512, 384);
  ctx.fillStyle = '#03060e';
  ctx.fillRect(0, 0, 512, 384);

  const grad = ctx.createRadialGradient(256, 185, 24, 256, 185, 260);
  grad.addColorStop(0, '#2563eb');
  grad.addColorStop(0.5, '#1e3a8a');
  grad.addColorStop(1, '#040812');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 384);

  ctx.strokeStyle = 'rgba(147, 197, 253, 0.55)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, 260);
  ctx.bezierCurveTo(150, 120, 340, 285, 512, 130);
  ctx.stroke();

  ctx.fillStyle = 'rgba(248, 250, 252, 0.9)';
  ctx.font = '700 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('9:41', 256, 118);

  ctx.fillStyle = 'rgba(203, 213, 225, 0.8)';
  ctx.font = '600 14px sans-serif';
  ctx.fillText('Tandem OLED · TrueDepth & USB-C Ready', 256, 336);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(256, 256);
  const grad = ctx.createRadialGradient(128, 128, 8, 128, 128, 128);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
  grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.22)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

export function createCrackedGlassOverlayTexture(anisotropy = 4): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(512, 1024);
  ctx.clearRect(0, 0, 512, 1024);

  // Impact epicenter near upper-right glass zone
  const cx = 338;
  const cy = 342;

  // Subtle internal glass bruising & micro-splinter haze around point of impact
  const impactGlow = ctx.createRadialGradient(cx, cy, 4, cx, cy, 130);
  impactGlow.addColorStop(0, 'rgba(241, 245, 249, 0.65)');
  impactGlow.addColorStop(0.18, 'rgba(148, 163, 184, 0.25)');
  impactGlow.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = impactGlow;
  ctx.beginPath();
  ctx.arc(cx, cy, 130, 0, Math.PI * 2);
  ctx.fill();

  // Concentric stress-wave rings near impact crater
  [12, 26, 46, 78, 122].forEach((r, ringIdx) => {
    ctx.strokeStyle =
      ringIdx < 2 ? 'rgba(255, 255, 255, 0.72)' : 'rgba(203, 213, 225, 0.42)';
    ctx.lineWidth = ringIdx === 0 ? 1.8 : 1.05;
    ctx.beginPath();
    for (let s = 0; s <= 28; s++) {
      const a = (s / 28) * Math.PI * 2;
      const jitter = Math.sin(s * 3.7 + ringIdx) * (2.5 + ringIdx * 1.4);
      const px = cx + Math.cos(a) * (r + jitter);
      const py = cy + Math.sin(a) * (r + jitter);
      if (s === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  });

  // Radial jagged propagation hairline cracks across screen height & edges
  const rays = [
    { angle: -2.4, len: 430, w: 2.2 },
    { angle: -1.9, len: 390, w: 1.8 },
    { angle: -1.3, len: 360, w: 1.5 },
    { angle: -0.6, len: 240, w: 1.9 },
    { angle: 0.12, len: 220, w: 1.6 },
    { angle: 0.75, len: 330, w: 2.0 },
    { angle: 1.32, len: 620, w: 2.3 },
    { angle: 1.75, len: 670, w: 2.1 },
    { angle: 2.18, len: 590, w: 1.8 },
    { angle: 2.65, len: 460, w: 1.9 },
    { angle: 3.02, len: 410, w: 1.6 },
  ];

  rays.forEach((ray, rIdx) => {
    const segs = 14;
    let x = cx;
    let y = cy;
    const stepLen = ray.len / segs;

    // Dark subsurface fissure shadow
    ctx.strokeStyle = 'rgba(2, 6, 23, 0.55)';
    ctx.lineWidth = ray.w + 1.4;
    ctx.beginPath();
    ctx.moveTo(x + 1.2, y + 1.2);
    const pts: [number, number][] = [[x, y]];
    for (let i = 1; i <= segs; i++) {
      const wobble = Math.sin(i * 2.1 + rIdx * 1.7) * 14 + Math.cos(i * 4.3 + rIdx) * 7;
      x += Math.cos(ray.angle) * stepLen + Math.cos(ray.angle + Math.PI / 2) * wobble * 0.45;
      y += Math.sin(ray.angle) * stepLen + Math.sin(ray.angle + Math.PI / 2) * wobble * 0.45;
      pts.push([x, y]);
      ctx.lineTo(x + 1.2, y + 1.2);
    }
    ctx.stroke();

    // Bright specular glass edge
    ctx.strokeStyle = 'rgba(248, 250, 252, 0.84)';
    ctx.lineWidth = ray.w;
    ctx.beginPath();
    pts.forEach(([px, py], i) => {
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // Secondary bifurcating micro-splinters along major fractures
    if (rIdx % 2 === 0) {
      pts.forEach(([px, py], i) => {
        if (i === 4 || i === 8) {
          const branchA = ray.angle + (i % 4 === 0 ? 0.52 : -0.48);
          ctx.strokeStyle = 'rgba(226, 232, 240, 0.62)';
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.moveTo(px, py);
          const bx = px + Math.cos(branchA) * 58;
          const by = py + Math.sin(branchA) * 58;
          ctx.lineTo(px + Math.cos(branchA + 0.14) * 28, py + Math.sin(branchA + 0.14) * 28);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }
      });
    }
  });

  // Impact point bright glass-crush star
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.beginPath();
  ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}
