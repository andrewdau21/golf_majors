// Generates public/og-image.png — a 1200x630 social preview card.
// Uses only Node.js built-ins (no extra packages).
import { deflateSync } from "zlib";
import { writeFileSync } from "fs";

const W = 1200, H = 630;

function hex(h) {
  return [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
}

const BG      = hex("#1a6b3a");
const BANNER  = hex("#0f3d20");
const GOLD    = hex("#c9a227");
const WHITE   = [235, 242, 233];
const DIMPLE  = [185, 205, 185];
const GROUND  = hex("#2e8b57");

const px = new Array(W * H).fill(null).map(() => [...BG]);

function set(x, y, c) {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  px[y * W + x] = c;
}

function rect(x0, y0, x1, y1, c) {
  for (let y = y0; y < y1; y++)
    for (let x = x0; x < x1; x++) set(x, y, c);
}

function circle(cx, cy, r, c, soft = false) {
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      const d = Math.sqrt((x-cx)**2 + (y-cy)**2);
      if (d <= r) {
        if (soft && d > r - 5) {
          const a = (r - d) / 5;
          const bg = px[y * W + x] ?? [...BG];
          set(x, y, c.map((v, i) => Math.round(v * a + bg[i] * (1 - a))));
        } else {
          set(x, y, [...c]);
        }
      }
    }
  }
}

function tri(x0,y0, x1,y1, x2,y2, c) {
  const minY = Math.max(0, Math.min(y0,y1,y2));
  const maxY = Math.min(H-1, Math.max(y0,y1,y2));
  const edges = [[x0,y0,x1,y1],[x1,y1,x2,y2],[x2,y2,x0,y0]];
  for (let y = minY; y <= maxY; y++) {
    const xs = [];
    for (const [ax,ay,bx,by] of edges)
      if ((ay <= y && by > y) || (by <= y && ay > y))
        xs.push(ax + (y-ay)/(by-ay)*(bx-ax));
    if (xs.length >= 2) {
      xs.sort((a,b)=>a-b);
      for (let x = Math.round(xs[0]); x <= Math.round(xs[xs.length-1]); x++)
        set(x, y, [...c]);
    }
  }
}

// Background
rect(0, 0, W, 150, BANNER);
rect(0, 148, W, 160, GOLD);

// Golf ball (right side, large)
const BX = 920, BY = 340, BR = 205;
circle(BX, BY, BR, WHITE, true);

// Dimples
const DIMPLES = [
  [0,0],[55,0],[-55,0],[0,55],[0,-55],
  [38,38],[-38,38],[38,-38],[-38,-38],
  [75,35],[-75,35],[75,-35],[-75,-35],
  [35,75],[-35,75],[35,-75],[-35,-75],
  [0,90],[0,-90],[90,0],[-90,0],
  [65,65],[-65,65],[65,-65],[-65,-65],
  [110,30],[-110,30],[110,-30],[-110,-30],
  [30,110],[-30,110],[30,-110],[-30,-110],
  [120,0],[-120,0],[0,120],[0,-120],
];
for (const [dx,dy] of DIMPLES) {
  if (dx**2 + dy**2 < (BR-25)**2)
    circle(BX+dx, BY+dy, 13, DIMPLE);
}

// Flag pole
const PX = 300;
rect(PX, 115, PX+5, 490, WHITE);

// Flag (gold triangle)
tri(PX+5,125, PX+130,173, PX+5,221, GOLD);

// Ground arc under pole
for (let x = PX-70; x <= PX+70; x++) {
  const t = (x-(PX-70))/140;
  const dy = Math.round(-6*Math.sin(Math.PI*t));
  rect(x, 488+dy, x+1, 495+dy, GROUND);
}

// Build PNG
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c&1) ? 0xEDB88320^(c>>>1) : c>>>1;
  crcTable[n] = c;
}
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (const b of buf) c = crcTable[(c^b)&0xFF]^(c>>>8);
  return (c^0xFFFFFFFF)>>>0;
}
function chunk(type, data) {
  const t = Buffer.from(type,'ascii');
  const l = Buffer.allocUnsafe(4); l.writeUInt32BE(data.length);
  const cr = Buffer.allocUnsafe(4); cr.writeUInt32BE(crc32(Buffer.concat([t,data])));
  return Buffer.concat([l, t, data, cr]);
}

const raw = Buffer.alloc(H*(1+W*3));
for (let y = 0; y < H; y++) {
  const o = y*(1+W*3);
  raw[o] = 0;
  for (let x = 0; x < W; x++) {
    const [r,g,b] = px[y*W+x];
    raw[o+1+x*3]=r; raw[o+1+x*3+1]=g; raw[o+1+x*3+2]=b;
  }
}

const ihdr = Buffer.allocUnsafe(13);
ihdr.writeUInt32BE(W,0); ihdr.writeUInt32BE(H,4);
ihdr[8]=8; ihdr[9]=2; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0;

const png = Buffer.concat([
  Buffer.from([137,80,78,71,13,10,26,10]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, {level:6})),
  chunk('IEND', Buffer.alloc(0)),
]);

writeFileSync('public/og-image.png', png);
console.log(`Generated public/og-image.png (${(png.length/1024).toFixed(1)} KB)`);
