// Generate GitHub social preview card: 1280x640 using the REAL avatar (not SVG stub)
import sharp from "sharp";
import { writeFile } from "node:fs/promises";

const W = 1280, H = 640;
const AVATAR = "C:/Users/diper/Desktop/Claude/proyectos/compound/docs/branding/avatar.png";

// Resize the avatar to ~420px square, positioned on the left
const avatarResized = await sharp(AVATAR).resize(420, 420, { fit: "cover" }).png().toBuffer();

const svg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
      <circle cx="1.4" cy="1.4" r="1.4" fill="#1a2238" opacity="0.55"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="#0A0E1A"/>
  <rect width="${W}" height="${H}" fill="url(#dots)"/>

  <text x="560" y="270" font-family="ui-sans-serif,system-ui,-apple-system,Segoe UI,Inter,Helvetica,Arial" font-weight="800" font-size="128" fill="#F5EDE0">compound</text>

  <text x="560" y="338" font-family="ui-sans-serif,system-ui,-apple-system,Segoe UI,Inter,Helvetica,Arial" font-weight="500" font-size="32" fill="#9CA3AF">A self-compounding knowledge base</text>
  <text x="560" y="378" font-family="ui-sans-serif,system-ui,-apple-system,Segoe UI,Inter,Helvetica,Arial" font-weight="500" font-size="32" fill="#9CA3AF">for Claude Code.</text>

  <text x="560" y="460" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-weight="500" font-size="22" fill="#6B7280">inspired by @karpathy · MIT · en/es</text>

  <text x="1200" y="600" text-anchor="end" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="22" fill="#F5822F">$ compound init _</text>
</svg>
`;

const base = await sharp(Buffer.from(svg)).png().toBuffer();

const final = await sharp(base)
  .composite([{ input: avatarResized, left: 90, top: 110 }])
  .png()
  .toBuffer();

const OUT = "C:/Users/diper/Desktop/Claude/proyectos/compound/docs/branding/social-preview.png";
await writeFile(OUT, final);
console.log(`✓ Social preview written: ${OUT} (${final.length} bytes)`);
