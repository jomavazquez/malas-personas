// scripts/compress.mjs
// Genera una versión .br (Brotli, nivel 11) junto a cada archivo comprimible de dist/.
// nginx (con brotli_static on) servirá estos .br ya hechos, sin comprimir en cada petición.
// Uso: node scripts/compress.mjs [carpeta]   (por defecto: dist)

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { brotliCompressSync, constants } from "node:zlib";

const DIST = process.argv[2] ?? "dist";

// Solo formatos de texto. Las imágenes (png, jpg, webp) y las fuentes woff/woff2
// ya vienen comprimidas y no ganan nada.
const EXTENSIONS = new Set([
  ".html", ".js", ".mjs", ".css", ".json", ".svg",
  ".xml", ".txt", ".webmanifest", ".ico", ".ttf", ".otf", ".eot",
]);

// Igual que brotli_min_length en tu nginx.conf: por debajo no compensa.
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

  // Si por algún motivo no reduce el tamaño, no generamos el .br.
  if (compressed.length >= data.length) continue;

  await writeFile(`${file}.br`, compressed);
  count++;
  before += data.length;
  after += compressed.length;
}

const kb = (n) => (n / 1024).toFixed(1);
console.log(`Brotli: ${count} archivos comprimidos, ${kb(before)} KB -> ${kb(after)} KB`);
