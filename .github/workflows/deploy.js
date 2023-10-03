#!/usr/bin/env -S node --no-warnings

process.removeAllListeners('warning');
process.on('SIGTERM', () => process.exit());
process.on('SIGINT', () => process.exit());

const { BASE_HREF = '' } = process.env

import {
  readFile, writeFile, readdir,
  cp, rm,
} from 'node:fs/promises';
import { join, extname, } from 'node:path';

const SRC = 'src/'
const DIST = './dist/'

const walk = async (
  dirPath,
  filterFiles = f => f
) => Promise.all(
  await readdir(
    dirPath,
    { withFileTypes: true }
  )
  .then(entries => entries.filter(filterFiles)
    .map((entry) => {
      const childPath = join(dirPath, entry.name)
      return entry.isDirectory() ? walk(childPath) : childPath
    })
  ),
)

const fixOrCopy = async (
  sourceFile,
  targetFile,
  exts = ['html'],
  replacer = {
    html: [
      [
        '<base href="/src/" />',
        `<base href="/${BASE_HREF}" />`
      ],
      [
        '../node_modules/',
        '../node_modules/'
      ],
      [
        '../public/',
        '../public/'
      ]
    ],
  }
) => {
  targetFile = targetFile || join(DIST, sourceFile)
  let ext = extname(sourceFile).substring(1)
  await cp(sourceFile, targetFile, { recursive: true, });

  if (exts.includes(ext)) {
    console.log('fix', sourceFile, targetFile, ext)
    // console.log('fixOrCopy replacer', replacer[ext])

    let data = await readFile(sourceFile, 'utf-8');

    for (let rpl of replacer[ext]) {
      data = data.replaceAll(...rpl);
    }

    await writeFile(
      targetFile,
      data,
      'utf-8'
    );
  }
}

let filterDirs = file => {
  return !file?.name?.includes('.git') && !file?.name?.includes('dist/')
}

try {
  await rm(DIST, { recursive: true, force: true, })

  let allFiles = await walk(
    './',
    filterDirs,
  )
  allFiles = allFiles.flat(Number.POSITIVE_INFINITY)

  allFiles.forEach(e => {
    let fixDir = e?.startsWith(SRC)
    let splitDir = e?.split(SRC)

    // console.log('fixDir', fixDir, dirname(e), basename(e))

    if (fixDir) {
      fixOrCopy(
        e,
        join(DIST, splitDir[1]),
        ['html','js','json'],
        {
          html: [
            [
              '<base href="/src/" />',
              `<base href="/${BASE_HREF}" />`
            ],
            [
              '../node_modules/',
              './node_modules/'
            ],
            [
              '../public/',
              './public/'
            ],
          ],
          js: [
            [
              '../node_modules/',
              './node_modules/'
            ],
            [
              '../public/',
              './public/'
            ],
          ],
          json: [
            [
              '../public/',
              './public/'
            ],
          ],
        }
      )
      return splitDir[1]
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
