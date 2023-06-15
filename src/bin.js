#!/usr/bin/env node

import sade from 'sade'
import * as Parser from 'uvu/parse'
import * as process from 'node:process'

/**
 * This is the fork of the uvu/run module, which unlike original does not
 * require you to define tests with `test` function nor it requires you to
 * start executing them with `test.run()`. Instead, it will automatically
 * collect all the tests from the matched test files and then execute them.
 *
 * @see https://github.com/lukeed/uvu/blob/master/run/index.mjs
 *
 * @param {Parser.Suite[]} suites
 * @param {{bail?:boolean}} options
 */
export async function run(suites, { bail = false }) {
  // @ts-expect-error
  globalThis.UVU_DEFER = 1
  const { exec } = await import('uvu')
  const { default: test } = await import('subtest')

  let suite,
    idx = 0
  for (suite of suites) {
    // @ts-expect-error
    globalThis.UVU_INDEX = idx++
    // @ts-expect-error
    globalThis.UVU_QUEUE.push([suite.name])
    const module = await import('file:///' + suite.file)
    test(module)
  }

  await exec(bail)
}

sade('uvu [dir] [pattern]')
  .option('-b, --bail', 'Exit on first failure')
  .option('-i, --ignore', 'Any file patterns to ignore')
  .option('-r, --require', 'Additional module(s) to preload')
  .option('-C, --cwd', 'The current directory to resolve from', '.')
  .option('-c, --color', 'Print colorized output', true)
  .action(async (dir, pattern, opts) => {
    try {
      if (opts.color) process.env.FORCE_COLOR = '1'
      const context = await Parser.parse(dir, pattern, opts)
      await run(context.suites, opts)
    } catch (cause) {
      const error = /** @type {Error} */ (cause)
      console.error(error.stack || error.message)
      process.exit(1)
    }
  })
  .parse(process.argv)
