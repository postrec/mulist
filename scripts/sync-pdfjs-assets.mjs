import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'esbuild';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'node_modules/pdfjs-dist/legacy/build');
const destination = resolve(root, 'assets/pdfjs');

await mkdir(destination, { recursive: true });
await Promise.all([
  build({
    bundle: true,
    entryPoints: [resolve(source, 'pdf.min.mjs')],
    external: ['./pdf.worker.mjs'],
    format: 'iife',
    globalName: 'pdfjsLib',
    minify: true,
    outfile: resolve(destination, 'pdf.min.bin'),
    platform: 'browser',
    target: ['safari15'],
  }),
  build({
    bundle: true,
    entryPoints: [resolve(source, 'pdf.worker.min.mjs')],
    format: 'iife',
    globalName: 'pdfjsWorkerBundle',
    minify: true,
    outfile: resolve(destination, 'pdf.worker.min.bin'),
    platform: 'browser',
    target: ['safari15'],
  }),
]);
