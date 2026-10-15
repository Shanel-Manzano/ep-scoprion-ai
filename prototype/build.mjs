// Bundles the prototype into dist/. Run: npm run build
import { build } from 'esbuild';
import { cpSync, copyFileSync, mkdirSync, rmSync } from 'node:fs';

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });
await build({
  entryPoints: { app: 'src/main.jsx' },
  bundle: true, minify: true, sourcemap: false, outdir: 'dist',
  jsx: 'automatic', target: ['es2020'], external: ['fonts/*'],
  define: { 'process.env.NODE_ENV': '"production"' },
  loader: { '.svg': 'dataurl' },
  logLevel: 'info',
});
cpSync('public/fonts', 'dist/fonts', { recursive: true });
copyFileSync('public/scorpion-logomark.svg', 'dist/scorpion-logomark.svg');
copyFileSync('public/michelle.jpg', 'dist/michelle.jpg');
copyFileSync('index.html', 'dist/index.html');
