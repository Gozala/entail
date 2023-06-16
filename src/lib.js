import * as assert from './assert.js'
import * as API from './api.js'
export * from './api.js'
import { report } from './reporter.js'
export { assert }

/**
 * @param {Record<string, object>} tests
 * @param {{bail: boolean}} options
 * @returns {AsyncIterable<API.Output>}
 */
export async function* run(tests, { bail }) {
  for (const unit of iterate(tests)) {
    if (unit.mode === SKIP) {
      yield { skip: unit }
    } else {
      yield { test: unit }
      let start = performance.now()
      try {
        await unit.test(assert)
        yield { pass: { ...unit, duration: performance.now() - start } }
      } catch (cause) {
        const error = /** @type {API.Assertion} */ (cause)
        yield { fail: { ...unit, duration: performance.now() - start, error } }

        if (bail) {
          return
        }
      }
    }
  }
}

/**
 * @param {Record<string, object>} modules
 * @param {{bail?: boolean}} [options]
 */
export const test = async (modules, { bail = false } = {}) =>
  report(run(modules, { bail }))

/**
 *
 * @param {string[]} urls
 * @param {{bail?:boolean}} [options]
 */
export const testURLs = async (urls, { bail = false } = {}) => {
  const base = new URL(`file://${process.cwd()}/`).href

  const modules = Object.fromEntries(
    await Promise.all(
      urls.map(async (url) => [
        url.startsWith(base) ? url.slice(base.length) : url,
        await import(url),
      ])
    )
  )

  await test(modules, { bail })
}

export default test

const SKIP_EXPORT = /^skipTest|skip_test|skip test|skip! test/
const ONLY_EXPORT = /^onlyTest|only_test|only test|only! test/
const TEST_EXPORT = /^test([_$ A-Z].*)*/

/**
 * @param {Record<string, object>} modules
 * @returns {Iterable<API.Unit>}
 */
export const iterate = function* (modules) {
  let mode = TEST
  const units = []

  for (const [name, exports] of Object.entries(modules)) {
    for (const unit of iterateModule(exports, [name])) {
      if (mode === ONLY) {
        yield unit.mode === ONLY ? unit : { ...unit, mode: SKIP }
      } else {
        if (unit.mode === ONLY) {
          mode = ONLY
          yield* skip(units.splice(0))
          yield unit
        } else {
          units.push(unit)
        }
      }
    }
  }

  yield* units
}

/**
 * @param {API.Unit[]} units
 * @returns {Iterable<API.Unit>}
 */
function* skip(units) {
  for (const unit of units) {
    yield { ...unit, mode: SKIP }
  }
}

/**
 * @param {{test?:{skip?:unknown, only?: unknown}}} exports
 * @param {[string]} at
 * @returns {Iterable<API.Unit>}
 */
function* iterateModule(exports, at) {
  const moduleMode =
    exports?.test?.skip === true
      ? SKIP
      : exports?.test?.only === true
      ? ONLY
      : null

  for (const [name, unit] of Object.entries(exports)) {
    const mode = SKIP_EXPORT.test(name)
      ? SKIP
      : ONLY_EXPORT.test(name)
      ? moduleMode ?? ONLY
      : TEST_EXPORT.test(name)
      ? moduleMode ?? TEST
      : null

    if (mode) {
      if (typeof unit === 'function') {
        yield { test: unit, mode, at, name }
      } else if (unit && typeof unit === 'object') {
        yield* iterateTestSuite(unit, mode, [...at, name])
      }
    }
  }
}

const SKIP_MEMBER = /^skip[!_ ]/
const ONLY_MEMBER = /^only[!_ ]/

const SKIP = 'skip'
const ONLY = 'only'
const TEST = 'test'

/**
 * @param {any} group
 * @param {API.Mode} mode
 * @param {string[]} at
 * @returns {Iterable<API.Unit>}
 */
function* iterateTestSuite(group, mode, at) {
  const groupMode =
    mode === SKIP
      ? SKIP
      : group?.skip === true
      ? SKIP
      : group?.only === true
      ? ONLY
      : mode === ONLY
      ? ONLY
      : undefined

  for (const [name, unit] of Object.entries(group)) {
    const mode = SKIP_MEMBER.test(name)
      ? SKIP
      : ONLY_MEMBER.test(name)
      ? groupMode === SKIP
        ? SKIP
        : ONLY
      : groupMode ?? TEST

    if (typeof unit === 'function') {
      yield { mode, test: unit, at, name }
    } else if (unit && typeof unit === 'object') {
      yield* iterateTestSuite(unit, mode, [...at, name])
    }
  }
}

/**
 * @typedef {{
 * on(event:'console', handler:(msg:{text():string}) => void): void
 * evaluate(code:string): void}
 * } Page
 *
 * @typedef {"before" | "bundle" | "watch"} Mode
 *
 * @typedef {{
 * runTests(page:Page): void
 * build(options:{}, template: string, mode:Mode): void
 * options: { cwd: string }
 * }} TestRunner
 *
 * @param {{new():TestRunner}} Runner
 */
export const createPlaywrightRunner = (Runner) =>
  class SubtestRunner extends Runner {
    /**
     * Compile tests
     *
     * @param {Mode} mode
     */
    compiler(mode = 'bundle') {
      return this.build({}, '', mode)
    }

    /**
     * @param {string[]} urls
     */
    compileTestImports(urls) {
      const base = this.options.cwd + '/'
      return `
const tests = Object.fromEntries([
  ${urls
    .map(
      (url) =>
        `['${
          url.startsWith(base) ? url.slice(base.length) : url
        }', await import('${url}')]`
    )
    .join(',\n    ')}
])
const { test } = await import('@gozala/subtest')

const result = await test(tests)
self.PW_TEST.end(result.failed.length > 0)
`
    }
  }
