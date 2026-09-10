// game.source.html -> index.html : minify the inline JS (terser) and CSS (clean-css).
const fs = require('fs'), terser = require('terser'), CleanCSS = require('clean-css');

(async () => {
  let html = fs.readFileSync('game.source.html', 'utf8');

  const js = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const result = await terser.minify(js, { compress: { passes: 3 }, mangle: true });
  if (result.error) throw result.error;

  // The replacements MUST be functions. With a string, any $& / $` / $' the
  // minifier happens to emit (terser will mangle a variable to `$`) would be
  // treated as a replacement pattern and splice the match back into the output.
  html = html.replace(/<script>[\s\S]*?<\/script>/, () => '<script>' + result.code + '</script>');
  html = html.replace(/<style>([\s\S]*?)<\/style>/,
    (_, css) => '<style>' + new CleanCSS({ level: 2 }).minify(css).styles + '</style>');

  fs.writeFileSync('index.html', html);
})().catch(e => { console.error(e); process.exit(1); });
