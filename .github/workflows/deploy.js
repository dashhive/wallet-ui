#!/usr/bin/env -S node --no-warnings

process.removeAllListeners('warning');
process.on('SIGTERM', () => process.exit());
process.on('SIGINT', () => process.exit());

import { readFile, writeFile, readdir, cp, rm, } from 'node:fs/promises';
import { join, } from 'node:path';

const SRC = 'src/'
const DIST = './dist/'

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

const fixOrCopy = async (
  sourceFile,
  targetFile
) => {
  targetFile = targetFile || join(DIST, sourceFile)
  if (sourceFile.endsWith('.html')) {
    console.log('fixOrCopy', sourceFile, targetFile, sourceFile.endsWith('.html'))
    let data = await readFile(sourceFile, 'utf-8');

    var fixBase = data.replace(
      '<base href="/src/" />',
      '<base href="/" />'
    );

    await writeFile(
      targetFile,
      fixBase,
      'utf-8'
    );
  } else {
    await cp(sourceFile, targetFile, { recursive: true, });
  }
}

try {
  await rm(DIST, { recursive: true, force: true, })

  let allFiles = await walk(
    './',
    file => !file?.name?.includes('.git')
      // && !file?.name?.includes('node_modules/'),
  )
  allFiles = allFiles.flat(Number.POSITIVE_INFINITY)

  allFiles.forEach(e => {
    let fixDir = e?.split(SRC)

    // console.log('fixDir', fixDir, dirname(e), basename(e))

    if (fixDir.length > 1) {
      fixOrCopy(e, join(DIST, fixDir[1]))
      return fixDir[1]
    }

    fixOrCopy(e, join(DIST, e))

    return e
  })


  console.log(
    'prepare files for deployment',
    allFiles
  );
} catch (err) {
  console.error(err);
}
