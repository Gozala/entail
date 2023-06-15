import * as assert from 'uvu/assert'

/**
 * @type {import('./api.js').Assert}
 */
export const {
  fail,
  ok,
  match,
  equal,
  notEqual,
  deepEqual,
  notDeepEqual,
  throws,
} = {
  fail: /** @type {(input:string) => never} */ (assert.unreachable),
  ok: assert.ok,
  match: assert.match,
  equal: assert.is,
  notEqual: assert.is.not,
  deepEqual: assert.equal,
  notDeepEqual: assert.not.equal,
  throws: assert.throws,
}

/**
 * @param {unknown} value
 * @returns {asserts value is string}
 */
export const isString = (value) => {}
