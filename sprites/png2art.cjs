// Turn a PNG back into the game's sprite format.
//
//   node sprites/png2art.cjs sprites/slime.png            one frame
//   node sprites/png2art.cjs sprites/unicorn.png 3        a 3-frame sheet
//
// Prints a ready-to-paste  name=tt([...],{...})  snippet. Any fully transparent
// pixel becomes "." ; every distinct opaque colour gets a palette letter, reusing
// the letters the game already uses for that colour so diffs stay small.
// Upscaled images (e.g. drawn at 8x) are detected and reduced automatically.
const fs = require('fs'), zlib = require('zlib');

// letters already in use in game.source.html, so identical colours keep their key
const KNOWN = {
  '#ffffff': 'w', '#d4cae0': 'a', '#fa4881': 'b', '#fed004': 'c', '#fca34b': 'd',
  '#7adf5d': 'e', '#2ba4fe': 'f', '#904ce7': 'g', '#12114f': 'h', '#fda6bd': 'i',
  '#847fb3': 'j', '#fc9502': 'k', '#fd8f17': 'l', '#feeb6c': 'm', '#fdcf02': 'n',
  '#fed40c': 'o', '#a58ee8': 'p', '#efeddc': 'w', '#29243b': 'n', '#2c435b': 'd',
  '#c9c58f': 'g', '#84dccc': 'c', '#172536': 'n', '#e8b7d6': 'c', '#915d9f': 'p',
  '#faf1d4': 'w', '#301f4c': 'n', '#233e50': 'd', '#e3d4ab': 'g', '#986494': 'p',
  '#f6e2c3': 'w', '#ec8e9c': 'n',
};
const ALPHABET = 'wabcdefghijklmnopqrstuvxyz';   // "." is reserved for transparent

function readPNG(file) {
  const buf = fs.readFileSync(file);
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
  let pos = 8, ihdr = null, idat = [], plte = null, trns = null;
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos), tag = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (tag === 'IHDR') ihdr = { w: data.readUInt32BE(0), h: data.readUInt32BE(4), depth: data[8], type: data[9], interlace: data[12] };
    else if (tag === 'IDAT') idat.push(data);
    else if (tag === 'PLTE') plte = data;
    else if (tag === 'tRNS') trns = data;
    pos += 12 + len;
  }
  if (ihdr.depth !== 8) throw new Error('need an 8-bit-per-channel PNG (got depth ' + ihdr.depth + ')');
  if (ihdr.interlace) throw new Error('interlaced PNGs are not supported - re-export without interlacing');
  const CH = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[ihdr.type];
  if (!CH) throw new Error('unsupported PNG colour type ' + ihdr.type);

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = ihdr.w * CH, out = Buffer.alloc(ihdr.h * stride);
  let p = 0;
  for (let y = 0; y < ihdr.h; y++) {
    const filter = raw[p++];
    for (let x = 0; x < stride; x++) {
      const v = raw[p + x];
      const a = x >= CH ? out[y * stride + x - CH] : 0;
      const b = y ? out[(y - 1) * stride + x] : 0;
      const c = (x >= CH && y) ? out[(y - 1) * stride + x - CH] : 0;
      let r;
      if (filter === 0) r = v;
      else if (filter === 1) r = v + a;
      else if (filter === 2) r = v + b;
      else if (filter === 3) r = v + ((a + b) >> 1);
      else {                                   // Paeth
        const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c);
        r = v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
      }
      out[y * stride + x] = r & 255;
    }
    p += stride;
  }

  const px = [];
  for (let y = 0; y < ihdr.h; y++) {
    const row = [];
    for (let x = 0; x < ihdr.w; x++) {
      const i = y * stride + x * CH;
      let r, g, b, a = 255;
      if (ihdr.type === 6) { r = out[i]; g = out[i + 1]; b = out[i + 2]; a = out[i + 3]; }
      else if (ihdr.type === 2) { r = out[i]; g = out[i + 1]; b = out[i + 2]; }
      else if (ihdr.type === 0) { r = g = b = out[i]; }
      else if (ihdr.type === 4) { r = g = b = out[i]; a = out[i + 1]; }
      else { const k = out[i]; r = plte[k * 3]; g = plte[k * 3 + 1]; b = plte[k * 3 + 2]; a = trns && k < trns.length ? trns[k] : 255; }
      row.push([r, g, b, a]);
    }
    px.push(row);
  }
  return { w: ihdr.w, h: ihdr.h, px };
}

// largest N where the image is an exact N-times upscale
function detectScale(img) {
  const same = (p, q) => p[3] === 0 && q[3] === 0 || (p[0] === q[0] && p[1] === q[1] && p[2] === q[2] && p[3] === q[3]);
  outer: for (let n = Math.min(img.w, img.h); n > 1; n--) {
    if (img.w % n || img.h % n) continue;
    for (let y = 0; y < img.h; y++)
      for (let x = 0; x < img.w; x++)
        if (!same(img.px[y][x], img.px[y - y % n][x - x % n])) continue outer;
    return n;
  }
  return 1;
}

const file = process.argv[2];
const frames = +(process.argv[3] || 1);
if (!file) { console.error('usage: node sprites/png2art.cjs <file.png> [frameCount]'); process.exit(1); }

const img = readPNG(file);
const scale = detectScale(img);
const W = img.w / scale, H = img.h / scale;

const hex = c => '#' + [c[0], c[1], c[2]].map(v => v.toString(16).padStart(2, '0')).join('');
const palette = new Map();   // hex -> letter
const rows = [];
for (let y = 0; y < H; y++) {
  let line = '';
  for (let x = 0; x < W; x++) {
    const c = img.px[y * scale][x * scale];
    if (c[3] < 128) { line += '.'; continue; }
    const k = hex(c);
    if (!palette.has(k)) {
      let letter = KNOWN[k];
      const taken = new Set(palette.values());
      if (!letter || taken.has(letter)) letter = [...ALPHABET].find(l => !taken.has(l));
      if (!letter) throw new Error('more than ' + ALPHABET.length + ' distinct colours - reduce the palette');
      palette.set(k, letter);
    }
    line += palette.get(k);
  }
  rows.push(line);
}

const name = file.replace(/.*[\\/]/, '').replace(/@\d+x/, '').replace(/\.png$/i, '');
const pal = [...palette].map(([h, l]) => `${l}:"${h}"`).join(',');
const art = rows.map(r => `"${r}"`).join(',');
const snippet = `${name}=tt([${art}],{${pal}})`;

console.log(`source : ${file}`);
console.log(`pixels : ${W}x${H}` + (scale > 1 ? `  (detected ${scale}x upscale)` : ''));
if (frames > 1) {
  if (W % frames) console.log(`WARNING: width ${W} is not divisible by ${frames} frames`);
  else console.log(`frames : ${frames} x ${W / frames}x${H}   -> pass l=${frames} to la()`);
}
console.log(`colours: ${palette.size}  (${[...palette].map(([h, l]) => l + '=' + h).join(' ')})`);
console.log(`cost   : ${snippet.length} source chars`);
console.log('\n--- paste into game.source.html ---');
console.log(snippet);
