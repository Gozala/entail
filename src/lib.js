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
