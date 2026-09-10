// index.html -> self-extracting index.html, via roadroller.
//
// roadroller's optimiser searches randomly, so repeated runs on identical input
// differ by ~50 bytes. Run it a few times and keep whichever result is smallest
// once deflated, since the ZIP is what the 13312-byte limit applies to.
const fs = require('fs'), zlib = require('zlib');

const TRIES = +(process.env.PACK_TRIES || 4);

// Rank candidates by the same deflate sweep zip.cjs uses, so the one that is
// smallest in the finished archive wins - not the one that looks smallest under
// some arbitrary setting.
function bestDeflate(data) {
  const S = zlib.constants;
  let best = Infinity;
  for (const strategy of [S.Z_DEFAULT_STRATEGY, S.Z_FILTERED, S.Z_HUFFMAN_ONLY, S.Z_RLE])
    for (let memLevel = 1; memLevel <= 9; memLevel++)
      best = Math.min(best, zlib.deflateRawSync(data, { level: 9, memLevel, strategy, windowBits: 15 }).length);
  return best;
}

(async () => {
  const { Packer } = await import('roadroller');
  const html = fs.readFileSync('index.html', 'utf8');

  let best = null;
  const sizes = [];
  for (let i = 0; i < TRIES; i++) {
    const packer = new Packer([{ data: html, type: 'text', action: 'write' }], { allowFreeVars: true });
    await packer.optimize(2);
    const { firstLine, secondLine } = packer.makeDecoder();
    const out = '<meta charset="utf-8"><script>' + firstLine + '\n' + secondLine + '</script>';
    const deflated = bestDeflate(Buffer.from(out, 'utf8'));
    sizes.push(deflated);
    if (!best || deflated < best.deflated) best = { out, deflated };
  }

  fs.writeFileSync('index.html', best.out);
  console.log('pack    : best of ' + TRIES + '  [' + sizes.join(', ') + '] deflated -> kept ' + best.deflated);
})().catch(e => { console.error(e); process.exit(1); });
