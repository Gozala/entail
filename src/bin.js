#!/usr/bin/env node

import sade from 'sade'
import * as process from 'node:process'
import { pathToFileURL } from 'node:url'
import { findTests, relative } from './fs.js'
import test from './lib.js'

sade('entail [pattern]')
  .option('-b, --bail', 'Exit on first failure')
  .option('-C, --cwd', 'The current directory to resolve from')
  .option('-c, --color', 'Print colorized output', true)
  .option(
    '--extensions',
    'File extensions allowed in the bundle.  (default js,cjs,mjs,ts,tsx)'
  )
  .action(
    async (
      pattern = '**/*.js',
      {
        cwd = process.cwd(),
        extensions = 'js,cjs,mjs,ts,tsx',
        bail = false,
        color = true,
      }
    ) => {
      try {
        if (color) process.env.FORCE_COLOR = '1'

        const paths = findTests({
          cwd,
          extensions: extensions.split(','),
          filePatterns: [pattern],
        })

        const modules = Object.fromEntries(
          await Promise.all(
            paths.map(async (path) => [
              relative(cwd, path),
              await import(pathToFileURL(path).href),
            ])
          )
        )

        await test(modules, { bail })
      } catch (cause) {
        const error = /** @type {Error} */ (cause)
        console.error(error.stack || error.message)
        process.exit(1)
      }
    }
  )
  .parse(process.argv)
