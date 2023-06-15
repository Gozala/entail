import * as assert from './assert.js'
import * as API from './api.js'
import { test } from 'uvu'
export * from './api.js'

export { assert }

/**
 * @param {string} title
 */
const match = (title) => {
  switch (title.slice(0, 5)) {
    case 'only!':
    case 'only_':
    case 'only ':
      return test.only
    case 'skip!':
    case 'skip_':
    case 'skip ':
      return test.skip
    default:
      return undefined
  }
}

/**
 * @param {Iterable<[string, API.Suite|API.Test]>} entries
 * @param {(typeof test.only)} [override]
 */

const build = (entries, override) => {
  for (const [name, member] of entries) {
    if (typeof member === 'function') {
      const mode = override || match(name) || test
      mode(name, () => /** @type {void} */ (member(assert)))
    } else {
      build(Object.entries(member), override || match(name))
    }
  }

  return test
}

const TEST_PATTERN = /^(skipTest|onlyTest|test)([_$ A-Z].*)*$/

/**
 * @param {API.Suite} source
 * @returns {Iterable<[string, API.Suite|API.Test]>}
 */
function* iterateTests(source) {
  for (const [name, member] of Object.entries(source)) {
    if (TEST_PATTERN.test(name)) {
      yield [name, member]
    }
  }
}

/**
 * @param {API.Suite} tests
 */
export default (tests) => {
  build(iterateTests(tests))
  test.run()
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
 * }} Test
 *
 * @param {{new():Test}} Runner
 */
export const createPlaywrightRunner = (Runner) =>
  class SubtestRunner extends Runner {
    /**
     * @param {Page} page
     */
    async runTests(page) {
      let total = 0
      let passed = 0

      page.on('console', async (msg) => {
        const txt = msg.text()

        if (txt.includes('  Total: ')) {
          total = Number(txt.replace('Total:', '').trim())
        }
        if (txt.includes('  Passed: ')) {
          passed = Number(txt.replace('Passed:', '').trim())
          await page.evaluate(`self.PW_TEST.end(${total !== passed})`)
        }
      })

      return await super.runTests(page)
    }

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
      return `
const Subtest = await import('@gozala/subtest')
Subtest.default({
  test: [
    ${urls.map((url) => `await import('${url}')`).join(',\n    ')}
  ]
})
`
    }
  }
