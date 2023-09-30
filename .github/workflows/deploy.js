#!/usr/bin/env -S node --no-warnings

process.removeAllListeners('warning');
process.on('SIGTERM', () => process.exit());
process.on('SIGINT', () => process.exit());

import { readdir, cp, } from 'node:fs/promises';
import { join, } from 'node:path';

try {
  const walk = async (dirPath, filterFiles = f => f) => Promise.all(
    await readdir(
      dirPath,
      { withFileTypes: true }
    )
    .then((entries) => entries.filter(filterFiles).map((entry) => {
      const childPath = join(dirPath, entry.name)
      return entry.isDirectory() ? walk(childPath) : childPath
    })),
  )

  let allFiles = await walk(
    './',
    file => !file?.name?.includes('.git/')
      // && !file?.name?.startsWith('node_modules'),
  )
  allFiles = allFiles.flat(Number.POSITIVE_INFINITY)

  allFiles.forEach(e => {
    let fixDir = e?.split('src/')

    // console.log('fixDir', fixDir, dirname(e), basename(e))

    if (fixDir.length > 1) {
      cp(e, fixDir[1], { recursive: true, });
      return fixDir[1]
    }

    return e
  })


  console.log(
    'replaced named html files with {name}/index.html!',
    allFiles
  );
} catch (err) {
  console.error(err);
}
