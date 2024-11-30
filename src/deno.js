#!/usr/bin/env deno

import test from './lib.js'
// @ts-expect-error
import sade from 'https://deno.land/x/sade@v1.8.1/deno/mod.js'
// @ts-expect-error
import { globber } from 'https://deno.land/x/globber@0.1.0/mod.ts'
// @ts-expect-error
import { toFileUrl } from 'https://deno.land/std@0.224.0/path/mod.ts'

const main = sade('entail [pattern]')
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
        cwd = Deno.cwd(),
        extensions = 'js,cjs,mjs,ts,tsx',
        bail = false,
        color = true,
      } = {}
    ) => {
      const base = toFileUrl(Deno.cwd())
      const paths = globber({
        cwd: base,
        include: [pattern],
      })

      const urls = []
      for await (const entry of paths) {
        urls.push(toFileUrl(entry.absolute))
      }

      try {
        const modules = Object.fromEntries(
          await Promise.all(
            urls.map(async (url) => [
              `.${url.href.slice(base.href.length)}`,
              await import(url.href),
            ])
          )
        )

        const result = await test(modules, { bail })

        Deno.exit(result.failed.length > 0 ? 1 : 0)
      } catch (cause) {
        const error = /** @type {Error} */ (cause)
        console.error(error.stack || error.message)
        process.exit(1)
      }
    }
  )
  .parse(Deno.args)
