// scripts/compress.mjs
// Writes a .br version (Brotli, level 11) next to every compressible file in dist/.
// nginx (with brotli_static on) serves these prebuilt .br files instead of compressing on every request.
// Usage: node scripts/compress.mjs [folder]   (default: dist)

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { brotliCompressSync, constants } from "node:zlib";

const DIST = process.argv[2] ?? "dist";

// Text formats only. Images (png, jpg, webp) and woff/woff2 fonts are already
// compressed and gain nothing.
const EXTENSIONS = new Set([
  ".html", ".js", ".mjs", ".css", ".json", ".svg",
  ".xml", ".txt", ".webmanifest", ".ico", ".ttf", ".otf", ".eot",
]);

// Same as brotli_min_length in the nginx.conf: below this size it isn't worth it.
const MIN_SIZE = 300;

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else yield path;
  }
}

let count = 0;
let before = 0;
let after = 0;

for await (const file of walk(DIST)) {
  if (!EXTENSIONS.has(extname(file).toLowerCase())) continue;

  const data = await readFile(file);
  if (data.length < MIN_SIZE) continue;

  const compressed = brotliCompressSync(data, {
    params: {
      [constants.BROTLI_PARAM_QUALITY]: 11,
      [constants.BROTLI_PARAM_SIZE_HINT]: data.length,
    },
  });

  // If for some reason it doesn't reduce the size, skip the .br file.
  if (compressed.length >= data.length) continue;

  await writeFile(`${file}.br`, compressed);
  count++;
  before += data.length;
  after += compressed.length;
}

const kb = (n) => (n / 1024).toFixed(1);
console.log(`Brotli: ${count} files compressed, ${kb(before)} KB -> ${kb(after)} KB`);
