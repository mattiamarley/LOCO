import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = dirname(dirname(fileURLToPath(import.meta.url)));
const requiredRoutes = ['page.tsx', 'about/page.tsx', 'piani/page.tsx', 'faq/page.tsx', 'demo/page.tsx', 'app/page.tsx'];
const requiredAssets = [
  'hero-home.webp', 'hero-about.webp', 'hero-piani.webp', 'hero-faq.webp',
  'demo-street.webp', 'loco-logo.webp', 'feature-route.webp', 'feature-magic.webp',
  'feature-tools.webp', 'feature-human.webp', 'method-loci.webp',
  'method-link.webp', 'method-phonetic.webp', 'zoo.webp'
];
let missing = 0;
for (const relative of requiredRoutes.map(p => `app/${p}`).concat(requiredAssets.map(p => `public/marketing/${p}`))) {
  if (!existsSync(join(app, relative))) { console.error(`MISSING ${relative}`); missing++; }
}
for (const font of ['baloo-variable.ttf', 'inter-tight-variable.ttf']) {
  if (!existsSync(join(app, 'assets', 'fonts', font))) {
    console.error(`MISSING original brand font: app/assets/fonts/${font}`);
    missing++;
  }
}
const vercel = JSON.parse(readFileSync(join(app, 'vercel.json'), 'utf8'));
const pkg = JSON.parse(readFileSync(join(app, 'package.json'), 'utf8'));
if (vercel.framework !== 'nextjs' || vercel.buildCommand !== 'npm run build:vercel') {
  console.error('Incorrect app/vercel.json configuration'); missing++;
}
if (!pkg.scripts?.['build:vercel']?.includes('next build') || !pkg.scripts?.['dev:next']?.includes('next dev')) {
  console.error('Missing Next.js-specific package scripts; run the installer'); missing++;
}
if (!existsSync(join(app, 'server')) || !existsSync(join(app, 'prototype'))) {
  console.error('This must be installed into the existing LOCO repository, preserving server and prototype'); missing++;
}
if (missing) process.exit(1);
console.log(`LOCO marketing: routes, ${requiredAssets.length} critical assets, fonts, Vercel config and scripts OK.`);
