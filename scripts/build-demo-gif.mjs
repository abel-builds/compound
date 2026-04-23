// demo-gif.mjs — Generates compound's demo GIF programmatically (no recording needed)
//
// Shows a split-screen: left = vault/raw/ (inbox), right = vault/wiki/ (LLM's brain).
// The animation walks through: drop source → ingest → wiki grows → log entry.
// Output: docs/assets/demo.gif (800x500, ~10s, <2MB target).

import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import GIFEncoderMod from "gif-encoder-2";
const GIFEncoder = GIFEncoderMod.default || GIFEncoderMod;
import { writeFile, mkdir } from "node:fs/promises";

const W = 800, H = 500;
const FPS = 18;
const OUT = "C:/Users/diper/Desktop/Claude/proyectos/compound/docs/assets/demo.gif";

// --- Theme ---
const C = {
  bg:      "#0A0E1A",
  panel:   "#0E1423",
  border:  "#1F2937",
  text:    "#E5E7EB",
  dim:     "#6B7280",
  accent:  "#F5822F",
  green:   "#22C55E",
  blue:    "#60A5FA",
  purple:  "#A78BFA",
  cursor:  "#F5EDE0",
};

const MONO   = "Consolas, 'Cascadia Mono', monospace";
const SANS   = "'Segoe UI', system-ui, sans-serif";

await mkdir(OUT.slice(0, OUT.lastIndexOf("/")), { recursive: true });

// ---------- helpers ----------
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function easeInOut(t)    { return t<0.5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2; }
function lerp(a,b,t) { return a + (b-a)*t; }
function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;
}

function drawPanelHeader(ctx, x, y, w, title, subtitle) {
  ctx.fillStyle = C.border;
  ctx.fillRect(x, y, w, 1);
  ctx.font = `600 13px ${SANS}`;
  ctx.fillStyle = C.dim;
  ctx.fillText(title, x + 12, y + 20);
  if (subtitle) {
    ctx.font = `400 11px ${MONO}`;
    ctx.fillStyle = C.dim;
    ctx.fillText(subtitle, x + w - ctx.measureText(subtitle).width - 12, y + 20);
  }
  ctx.fillStyle = C.border;
  ctx.fillRect(x, y + 30, w, 1);
}

function drawFileRow(ctx, x, y, icon, name, meta, opts = {}) {
  const { accent = false, fade = 1, glow = 0, indent = 0 } = opts;
  const baseX = x + indent;

  if (glow > 0) {
    ctx.save();
    ctx.shadowColor = C.accent;
    ctx.shadowBlur = 16 * glow;
    ctx.fillStyle = rgba(C.accent, 0.08 * glow);
    ctx.fillRect(x + 4, y - 14, 340, 24);
    ctx.restore();
  }

  // icon
  ctx.font = `${accent ? 'bold ' : ''}13px ${MONO}`;
  ctx.fillStyle = rgba(accent ? C.accent : C.dim, fade);
  ctx.fillText(icon, baseX, y);

  // name
  ctx.font = `${accent ? 'bold ' : ''}13px ${MONO}`;
  ctx.fillStyle = rgba(accent ? C.accent : C.text, fade);
  ctx.fillText(name, baseX + 24, y);
  const nameW = ctx.measureText(name).width;

  // meta
  if (meta) {
    ctx.font = `11px ${SANS}`;
    ctx.fillStyle = rgba(C.dim, fade * 0.75);
    ctx.fillText(meta, baseX + 24 + nameW + 18, y);
  }
}

function drawCursor(ctx, x, y, t) {
  const on = Math.floor(t * 2) % 2 === 0;
  if (on) {
    ctx.fillStyle = C.cursor;
    ctx.fillRect(x, y - 11, 7, 14);
  }
}

function drawProgressDot(ctx, x, y, phase) {
  const dots = 3;
  for (let i = 0; i < dots; i++) {
    const pulse = Math.sin(phase * 6 - i * 0.7);
    const r = 3 + Math.max(0, pulse) * 2;
    ctx.fillStyle = rgba(C.accent, 0.5 + Math.max(0, pulse) * 0.5);
    ctx.beginPath();
    ctx.arc(x + i * 14, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTitleCard(ctx, t) {
  // fade in title, fade out at end
  const fadeIn = easeOutCubic(Math.min(1, t / 0.35));
  const fadeOut = easeOutCubic(Math.min(1, Math.max(0, (t - 0.65) / 0.35)));
  const a = fadeIn * (1 - fadeOut);
  if (a <= 0.001) return;

  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  // centered mini-logo
  const logoX = W/2 - 120, logoY = H/2 - 60;
  ctx.fillStyle = C.accent;
  ctx.beginPath();
  ctx.moveTo(logoX + 30, logoY);
  ctx.lineTo(logoX, logoY + 60);
  ctx.lineTo(logoX + 12, logoY + 60);
  ctx.lineTo(logoX + 20, logoY + 42);
  ctx.lineTo(logoX + 40, logoY + 42);
  ctx.lineTo(logoX + 48, logoY + 60);
  ctx.lineTo(logoX + 60, logoY + 60);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(logoX + 20, logoY + 48, 20, 4);
  // underscore cursor
  ctx.fillRect(logoX + 18, logoY + 70, 24, 6);

  // title
  ctx.font = `800 44px ${SANS}`;
  ctx.fillStyle = C.cursor;
  ctx.fillText("compound", logoX + 80, logoY + 36);

  // tagline
  ctx.font = `400 18px ${SANS}`;
  ctx.fillStyle = C.dim;
  ctx.fillText("A self-compounding knowledge base for Claude Code.", logoX + 80, logoY + 64);

  ctx.font = `400 13px ${MONO}`;
  ctx.fillStyle = C.accent;
  ctx.fillText("$ compound init _", logoX + 80, logoY + 90);

  ctx.restore();
}

// ---------- scene state machine ----------
// timeline (seconds from scene start):
//   0.0 - 1.2   : title card
//   1.2 - 2.4   : panels appear, empty
//   2.4 - 3.6   : source file drops into raw/
//   3.6 - 4.8   : SessionStart hook triggers (pulse), "compiling..."
//   4.8 - 6.2   : knowledge/ category emerges + article appears in wiki/
//   6.2 - 7.4   : backlinks line drawn + master-index updates
//   7.4 - 8.4   : log.md entry appends
//   8.4 - 9.8   : final state breath (cursor blink), "compound understands what you know"
//
// Total: ~9.8s at 18 fps = 176 frames

const SCENE_S = 9.8;
const TOTAL_FRAMES = Math.ceil(SCENE_S * FPS);

export function frame(t) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // dark bg with subtle dot pattern
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#12182A";
  for (let y = 0; y < H; y += 18) for (let x = 0; x < W; x += 18) {
    ctx.fillRect(x, y, 1.2, 1.2);
  }

  // --- Title card 0.0 - 1.2s ---
  if (t < 1.2) {
    const localT = t / 1.2;
    drawTitleCard(ctx, localT);
    return canvas.toBuffer("image/png");
  }

  // Panels appear
  const panelA = easeOutCubic(Math.min(1, (t - 1.2) / 0.8)); // fade in panels

  // LEFT panel: raw/
  const padding = 24;
  const panelW = (W - padding * 3) / 2;
  const panelH = H - 88;
  const panelY = 56;
  const leftX = padding;
  const rightX = padding * 2 + panelW;

  ctx.save();
  ctx.globalAlpha = panelA;
  ctx.fillStyle = C.panel;
  ctx.fillRect(leftX, panelY, panelW, panelH);
  ctx.fillRect(rightX, panelY, panelW, panelH);

  // panel titles
  drawPanelHeader(ctx, leftX, panelY, panelW, "vault/raw/", "inbox");
  drawPanelHeader(ctx, rightX, panelY, panelW, "vault/wiki/", "brain");

  // Top band title
  ctx.font = `600 15px ${SANS}`;
  ctx.fillStyle = C.cursor;
  ctx.fillText("compound", padding, 32);
  ctx.font = `400 12px ${SANS}`;
  ctx.fillStyle = C.dim;
  ctx.fillText("A self-compounding knowledge base for Claude Code.", padding + 90, 32);

  // bottom status bar
  const statusY = H - 28;
  ctx.fillStyle = C.border;
  ctx.fillRect(0, statusY, W, 1);

  ctx.restore();

  if (t < 2.0) return canvas.toBuffer("image/png");

  // --- Source drops into raw/ ---
  // Animate: karpathy-thread.md appears in left panel with a soft slide-in
  const dropT = Math.min(1, Math.max(0, (t - 2.4) / 0.6));
  const dropEase = easeOutCubic(dropT);
  const fileY = panelY + 58;

  if (dropT > 0) {
    const slide = 20 * (1 - dropEase);
    ctx.save();
    ctx.translate(0, slide);
    const glow = Math.min(1, dropT * 2) * Math.min(1, Math.max(0, 1 - (t - 3.4) * 2));
    drawFileRow(ctx, leftX + 12, fileY, "📄", "karpathy-thread.md", "2.4 KB · just now",
      { accent: true, fade: dropEase, glow });
    ctx.restore();
  }

  // subtle second file existing in raw/ (for realism)
  if (t > 2.0) {
    drawFileRow(ctx, leftX + 12, fileY + 28, "📄", "README.md", "",
      { fade: 0.4 });
  }

  // --- SessionStart hook fires 3.6 - 4.8s ---
  const hookT = (t - 3.6) / 1.2;
  if (hookT >= 0 && hookT <= 1) {
    // status bar message
    ctx.font = `400 11px ${MONO}`;
    ctx.fillStyle = C.accent;
    ctx.fillText("SessionStart hook: 1 file pending → compiling...",
      padding, statusY + 18);
    drawProgressDot(ctx, W - padding - 60, statusY + 14, t - 3.6);

    // cursor in raw panel
    if (t < 4.6) {
      drawCursor(ctx, leftX + 12 + 24 + ctx.measureText("karpathy-thread.md").width + 4,
        fileY, t);
    }
  }

  // --- Wiki grows 4.8 - 7.4s ---
  // Stage 1: knowledge/ category emerges
  const k1T = Math.min(1, Math.max(0, (t - 4.8) / 0.5));
  if (k1T > 0) {
    ctx.save();
    ctx.globalAlpha = easeOutCubic(k1T);
    drawFileRow(ctx, rightX + 12, panelY + 58, "📁", "knowledge/", "new category",
      { accent: k1T < 0.7, fade: 1, glow: 1 - k1T });
    ctx.restore();
  }

  // Stage 2: article appears under knowledge/
  const k2T = Math.min(1, Math.max(0, (t - 5.3) / 0.5));
  if (k2T > 0) {
    ctx.save();
    ctx.globalAlpha = easeOutCubic(k2T);
    drawFileRow(ctx, rightX + 12, panelY + 86, "📝", "karpathy-wiki.md", "7 sections · 3 links",
      { accent: k2T < 0.7, fade: 1, indent: 16, glow: 1 - k2T });
    ctx.restore();
  }

  // Stage 3: _index.md updated
  const k3T = Math.min(1, Math.max(0, (t - 5.8) / 0.4));
  if (k3T > 0) {
    ctx.save();
    ctx.globalAlpha = easeOutCubic(k3T);
    drawFileRow(ctx, rightX + 12, panelY + 114, "📇", "_index.md", "+1 article",
      { fade: 0.85, indent: 16 });
    ctx.restore();
  }

  // Stage 4: master-index update + backlink line animation
  const k4T = Math.min(1, Math.max(0, (t - 6.2) / 0.5));
  if (k4T > 0) {
    ctx.save();
    ctx.globalAlpha = easeOutCubic(k4T);
    drawFileRow(ctx, rightX + 12, panelY + 148, "🗂️", "_master-index.md",
      "1 article · 1 category", { fade: 0.95 });

    // backlink animation: small curved line from karpathy-thread.md → karpathy-wiki.md
    ctx.strokeStyle = rgba(C.accent, easeOutCubic(k4T) * 0.6);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    const sx = leftX + 12 + 220, sy = fileY - 4;
    const ex = rightX + 12 + 24, ey = panelY + 86 + 16 - 4;
    const midX = (sx + ex) / 2;
    ctx.moveTo(sx, sy);
    ctx.bezierCurveTo(midX, sy - 24, midX, ey - 24, ex, ey);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // --- Log.md entry 7.4 - 8.4s ---
  const logT = Math.min(1, Math.max(0, (t - 7.4) / 0.8));
  if (logT > 0) {
    ctx.save();
    ctx.globalAlpha = easeOutCubic(logT);
    // separator
    ctx.fillStyle = C.border;
    ctx.fillRect(rightX + 12, panelY + 190, panelW - 24, 1);

    // log.md file name
    ctx.font = `600 11px ${MONO}`;
    ctx.fillStyle = C.dim;
    ctx.fillText("vault/log.md", rightX + 12, panelY + 210);

    // log entry, appearing as if typed
    const entry = "[2026-04-23T14:02Z] INGEST: karpathy-thread.md → knowledge/karpathy-wiki.md";
    const nTypewriter = Math.min(entry.length, Math.floor(entry.length * logT * 1.3));
    const partial = entry.slice(0, nTypewriter);
    ctx.font = `400 11px ${MONO}`;
    ctx.fillStyle = C.accent;
    // wrap at ~58 chars (rough)
    const lineA = partial.slice(0, 58);
    const lineB = partial.slice(58);
    ctx.fillText(lineA, rightX + 12, panelY + 232);
    if (lineB) ctx.fillText(lineB, rightX + 12, panelY + 250);

    if (logT < 1 && t > 7.4) {
      const cy = (lineB ? panelY + 250 : panelY + 232);
      const cx = rightX + 12 + ctx.measureText(lineB || lineA).width + 2;
      drawCursor(ctx, cx, cy, t);
    }
    ctx.restore();
  }

  // --- Final state / tagline 8.4 - 9.8s ---
  // Position below the panels so it doesn't cover the log entry.
  const finalT = Math.min(1, Math.max(0, (t - 8.4) / 1.0));
  if (finalT > 0) {
    ctx.save();
    ctx.globalAlpha = easeOutCubic(finalT);
    // subtle dark strip at bottom of panels, above the status bar
    const stripH = 52;
    const stripY = H - stripH - 28;
    ctx.fillStyle = rgba("#05080F", 0.92);
    ctx.fillRect(0, stripY, W, stripH);
    ctx.strokeStyle = rgba(C.accent, 0.4);
    ctx.fillStyle = rgba(C.accent, 0.5);
    ctx.fillRect(0, stripY, W, 1);

    ctx.font = `700 18px ${SANS}`;
    ctx.fillStyle = C.cursor;
    const msg1 = "your knowledge, compounded.";
    ctx.fillText(msg1, W/2 - ctx.measureText(msg1).width/2, stripY + 22);
    ctx.font = `400 12px ${MONO}`;
    ctx.fillStyle = C.accent;
    const msg2 = "github.com/abel-builds/compound";
    ctx.fillText(msg2, W/2 - ctx.measureText(msg2).width/2, stripY + 42);
    ctx.restore();
  }

  return canvas.toBuffer("image/png");
}

if (!process.env.DEMO_PREVIEW_ONLY) {

// ---------- encode GIF ----------
const enc = new GIFEncoder(W, H, "octree", false, TOTAL_FRAMES);
enc.setDelay(Math.round(1000 / FPS));
enc.setQuality(10);
enc.setRepeat(0);  // loop forever
enc.start();

for (let f = 0; f < TOTAL_FRAMES; f++) {
  const t = f / FPS;
  const pngBuf = frame(t);
  // gif-encoder-2 wants RGBA pixel data. Decode the PNG via canvas once more:
  const cv = createCanvas(W, H);
  const ctx = cv.getContext("2d");
  const { Image } = await import("@napi-rs/canvas");
  const img = new Image();
  img.src = pngBuf;
  ctx.drawImage(img, 0, 0, W, H);
  const imgData = ctx.getImageData(0, 0, W, H).data;
  enc.addFrame(imgData);
  if (f % 20 === 0) console.log(`  ${f}/${TOTAL_FRAMES} frames (t=${t.toFixed(2)}s)`);
}

enc.finish();
const buf = enc.out.getData();
await writeFile(OUT, buf);

const sizeMB = (buf.length / 1024 / 1024).toFixed(2);
console.log(`\n✓ demo.gif written: ${OUT}`);
console.log(`  size: ${sizeMB} MB  |  ${TOTAL_FRAMES} frames  |  ${SCENE_S}s @ ${FPS}fps`);

}  // end of non-preview guard
