#!/usr/bin/env -S node --no-warnings

process.removeAllListeners('warning');
process.on('SIGTERM', () => process.exit());
process.on('SIGINT', () => process.exit());

import { copyFile, readdir, mkdir } from 'node:fs/promises';
import { basename } from 'node:path';

try {
  const files = await readdir('./');
  for (const file of files) {
    if (file.endsWith('.html')) {
      const name = basename(file, '.html');
      await mkdir(`./${name}`, { recursive: true });
      await copyFile(`./${file}`, `./${name}/index.html`);
      console.log(file, name, file.endsWith('.html'), name.includes('.html'));
    }
  }

  console.log('replaced named html files with {name}/index.html!');
} catch (err) {
  console.error(err);
}
