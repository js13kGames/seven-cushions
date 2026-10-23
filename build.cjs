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

  // js13k's host pulls inline data: URIs out into assets/ files, taking everything
  // up to the next whitespace as the URI. Unpadded, `url(data:...)}*{...}body,html{`
  // ran on to `font:16px`, so the body/html rules were cut away and the url( left
  // unclosed. Spaces inside url( ) are valid CSS and end the URI exactly where it ends.
  html = html.replace(/url\((data:[^)\s]+)\)/g, (_, uri) => 'url( ' + uri + ' )');

  fs.writeFileSync('index.html', html);
})().catch(e => { console.error(e); process.exit(1); });
