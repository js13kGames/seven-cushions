// index.html -> seven-cushions.zip, and report the remaining budget.
//
// DEFLATE's tuning knobs are not monotonic: on this data memLevel 8 beats
// memLevel 9 by ~150 bytes. Rather than guess, sweep every strategy/memLevel
// pair (36 quick deflates) and keep the smallest. The archive stays a plain,
// fully standard zip either way.
const fs = require('fs'), zlib = require('zlib');
const LIMIT = 13312, NAME = 'index.html';

function crc32(buf) {
  const t = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  let r = 0xFFFFFFFF;
  for (const x of buf) r = t[(r ^ x) & 255] ^ (r >>> 8);
  return (r ^ 0xFFFFFFFF) >>> 0;
}

function bestDeflate(data) {
  const S = zlib.constants;
  let best = null;
  for (const strategy of [S.Z_DEFAULT_STRATEGY, S.Z_FILTERED, S.Z_HUFFMAN_ONLY, S.Z_RLE])
    for (let memLevel = 1; memLevel <= 9; memLevel++) {
      const out = zlib.deflateRawSync(data, { level: 9, memLevel, strategy, windowBits: 15 });
      if (!best || out.length < best.out.length) best = { out, memLevel, strategy };
    }
  return best;
}

const data = fs.readFileSync(NAME);
const { out: def, memLevel } = bestDeflate(data);
const nb = Buffer.from(NAME), crc = crc32(data);

const lf = Buffer.alloc(30);
lf.writeUInt32LE(0x04034b50, 0); lf.writeUInt16LE(20, 4); lf.writeUInt16LE(8, 8);
lf.writeUInt32LE(crc, 14); lf.writeUInt32LE(def.length, 18); lf.writeUInt32LE(data.length, 22);
lf.writeUInt16LE(nb.length, 26);

const cd = Buffer.alloc(46);
cd.writeUInt32LE(0x02014b50, 0); cd.writeUInt16LE(20, 4); cd.writeUInt16LE(20, 6); cd.writeUInt16LE(8, 10);
cd.writeUInt32LE(crc, 16); cd.writeUInt32LE(def.length, 20); cd.writeUInt32LE(data.length, 24);
cd.writeUInt16LE(nb.length, 28);

const eo = Buffer.alloc(22);
eo.writeUInt32LE(0x06054b50, 0);
eo.writeUInt16LE(1, 8); eo.writeUInt16LE(1, 10);
eo.writeUInt32LE(cd.length + nb.length, 12);
eo.writeUInt32LE(lf.length + nb.length + def.length, 16);

const zip = Buffer.concat([lf, nb, def, cd, nb, eo]);
fs.writeFileSync('seven-cushions.zip', zip);

console.log('source  :', fs.statSync('game.source.html').size, 'B');
console.log('index   :', data.length, 'B');
console.log('zip     :', zip.length, 'B  /', LIMIT, ' ' +
  (zip.length <= LIMIT ? 'OK, headroom ' + (LIMIT - zip.length) + ' B' : 'OVER by ' + (zip.length - LIMIT) + ' B')
  + '   [deflate memLevel ' + memLevel + ']');
