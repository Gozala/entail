import * as API from './api.js'
import { dequal as isDeepEqual } from 'dequal'
import { compare } from 'uvu/diff'
import kleur from 'kleur'

const FAILURE = kleur.bold().bgRed(' FAIL ')
const SUITE = kleur.bold
const QUOTE = kleur.dim('"')
const GUTTER = '\n        '

const { isNaN } = Number
const { is } = Object
/**
 * @param {unknown} actual
 * @param {unknown} expected
 */
const isEqual = (actual, expected) =>
  actual === expected || (isNaN(actual) && isNaN(expected))

/**
 * @param {unknown} value
 * @param {API.Pattern|string} pattern
 */
const isMatch = (value, pattern) =>
  !value
    ? false
    : typeof pattern === 'string'
    ? String(value).includes(pattern)
    : pattern.test(value)

/**
 * @typedef {((actual: unknown, expected:unknown) => string)} Compare
 * @implements {API.AssertionError}
 */
export class AssertionError extends Error {
  /**
   * @param {object} input
   * @param {string} input.reason
   * @param {string} input.operator
   * @param {unknown} input.actual
   * @param {unknown} input.expected
   * @param {string|Error|undefined} [input.message]
   * @param {boolean} [input.generated]
   * @param {Compare} [input.compare]
   * @param {Partial<API.Unit>} [input.origin]
   * @returns {never}
   */
  static throw(input) {
    if (input.message instanceof Error) {
      throw input.message
    } else {
      throw new AssertionError(/** @type {*} */ (input))
    }
  }
  /**
   * @param {object} input
   * @param {string} input.reason
   * @param {string} input.operator
   * @param {unknown} input.actual
   * @param {unknown} input.expected
   * @param {string|undefined} [input.message]
   * @param {boolean} [input.generated]
   * @param {Compare} [input.compare]
   * @param {Partial<API.Unit>} [input.origin]
   */
  constructor({
    message,
    reason,
    operator,
    actual,
    expected,
    compare,
    origin,
  }) {
    super(message || reason)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
    this.reason = reason
    this.operator = operator
    this.expected = expected
    this.actual = actual
    this.details = compare ? compare(actual, expected) : ''
    this.origin = origin || {}
  }
  get name() {
    return /** @type {const} */ ('AssertionError')
  }
  get code() {
    return /** @type {const} */ ('ERR_ASSERTION')
  }
  get generated() {
    return this.message === this.reason
  }
  get expects() {
    return this.expected
  }

  toString() {
    return AssertionError.format(this)
  }
  /**
   * @param {API.AssertionError} error
   * @param {Partial<API.Unit>} [origin]
   */
  static format(error, origin = error.origin) {
    const { details, operator, message } = error
    const { at = [], name = '' } = origin
    const title = name.length ? `"${kleur.red().bold(name)}"` : ``
    const place = title.length > 0 ? [...at, title] : at
    const site = place.length ? ` ${kleur.red(SUITE(place.join(' ⏵ ')))} ` : ''

    const method = operator.length ? kleur.italic().dim(`  (${operator}) `) : ''
    const stack = this.formatStack(error.stack)

    const body = [
      indent(`${indent(message)}${method}`),
      ...(details.length ? ['', details] : []),
      '',
      indent(indent(stack)),
    ]

    return `  ${FAILURE}${site}\n${body.join('\n')}`
  }

  /**
   *
   * @param {string} stack
   */

  static formatStack(stack = '') {
    const offset = stack.indexOf('\n')
    if (offset < 0) {
      return ''
    } else {
      let output = []

      const lines = stack.substring(offset).replace(/\\/g, '/').split('\n')
      for (const line of lines) {
        const text = line.trim()
        if (ENTAIL_RUN.test(text)) {
          break
        }

        if (text.length && !IGNORE.test(text)) {
          output.push(text)
        }
      }

      return kleur.grey(output.join('\n'))
    }
  }
}

/**
 * @param {string} message
 */
const indent = (message, indent = '  ') =>
  `${indent}${message.split('\n').join(`\n${indent}`)}`

const IGNORE = /^\s*at.*(?:\(|\s)(?:node|(internal\/[\w/]*))/
const ENTAIL_RUN = /^\s*at run \(.*entail\/src\/lib.js/
const PASS = undefined

/**
 * Tests if `value` is truthy. It is equivalent to
 * `assert.equal(!!value, true, message)`.
 *
 * If `value` is not truthy, an `AssertionError` is thrown with a
 * `message`property set equal to the value of the `message` parameter. If the
 * `message` parameter is `undefined`, a default error message is assigned.
 *
 * If the `message`parameter is an instance of an `Error` then it will be
 * thrown instead of the`AssertionError`.
 *
 * @example
 *
 * ```js
 * assert.ok(true)
 * assert.ok(1)
 * assert.ok() // AssertionError: Expected value to be truthy
 * assert.ok(false, 'it is false') // AssertionError: it is false
 * ```
 * @template T
 * @param {T} value
 * @param {string|Error} [message]
 * @returns {asserts value is T & {}}
 */
export const ok = (value, message) =>
  !!value
    ? PASS
    : AssertionError.throw({
        actual: value,
        expected: true,
        operator: 'ok',
        reason: 'Expected value to be truthy',
        compare: (actual) => `${formatValue(actual)} == true`,
        message,
      })

/**
 * Throws an `AssertionError` with the provided error `message` or a default
 * error message. If the `message` parameter is an instance of an `Error` then
 * it will be thrown instead of the `AssertionError`.
 *
 * @example
 *
 * ```js
 * assert.fail() // AssertionError: Failed
 * assert.fail('boom') // AssertionError: boom
 * assert.fail(new TypeError('need array')) // TypeError: need array
 * ```
 *
 * @param {string|Error} [message]
 * @returns {never}
 */
export const fail = (message) =>
  AssertionError.throw({
    actual: fail,
    expected: undefined,
    operator: 'fail',
    reason: 'Failed',
    message,
  })

/**
 * Tests strict equality between the `actual` and `expected` parameters as
 * determined by Object.is().
 *
 * @example
 * ```js
 * assert.strictEqual(1, 2) // AssertionError: Expected values to be strictly equal (strictEqual)
 *
 * assert.strictEqual(1, 1)
 * ```
 *
 * @template T
 * @template {T} U
 * @param {T} actual
 * @param {U} expected
 * @param {string|Error} [message]
 * @returns {asserts actual is T}
 */
export const strictEqual = (actual, expected, message) =>
  is(actual, expected)
    ? PASS
    : AssertionError.throw({
        actual,
        expected,
        operator: 'strictEqual',
        compare,
        reason: 'Expected values to be strictly equal',
        message,
      })

/**
 * The strict non-equivalence assertion tests for any strict inequality.
 *
 * @example
 * ```js
 * assert.notStrictEqual(1, 2)
 *
 * assert.notStrictEqual(1, 1) // AssertionError: Expected values to be strictly unequal:  (notStrictEqual)
 *
 * assert.notStrictEqual(1, '1')
 * ```
 *
 * @template T, U
 * @param {T|U} actual
 * @param {U} expected
 * @param {string} [message]
 * @returns {asserts actual is T}
 */
export const notStrictEqual = (actual, expected, message) =>
  !is(actual, expected)
    ? PASS
    : AssertionError.throw({
        actual,
        expected,
        operator: 'notStrictEqual',
        reason: 'Expected values to be strictly unequal:',
        message,
      })

/**
 * Tests shallow, coercive equality between the `actual` and `expected` parameters
 * using the `==` operator. `NaN` is specially handled and treated as being
 * identical if both sides are `NaN`.
 *
 * ```js
 * assert.equal(1, 1)
 *
 * assert.equal(NaN, NaN)
 *
 * assert.equal(1, 2) // AssertionError: Expected values to be loosely equal
 *
 * assert.equal({ a: { b: 1 } }, { a: { b: 1 } }) // AssertionError: Expected values to be loosely equal
 * ```
 *
 * @template T
 * @template {T} U
 * @param {T} actual
 * @param {U} expected
 * @param {string|Error} [message]
 * @returns {asserts actual is T}
 */
export const equal = (actual, expected, message) =>
  isEqual(actual, expected)
    ? PASS
    : AssertionError.throw({
        actual,
        expected,
        operator: 'equal',
        compare,
        reason: 'Expected values to be loosely equal',
        message,
      })

/**
 * Tests shallow, coercive inequality with the `!=` operator. `NaN` is specially
 * handled and treated as being identical if both sides are `NaN`.
 *
 * ```js
 * assert.notEqual(1, 2) // true
 * assert.notEqual(1, 1) // Expected values to be loosely not equal  (notEqual)
 *```
 *
 * @template T, U
 * @param {T|U} actual
 * @param {U} expected
 * @param {string|Error} [message]
 * @returns {asserts actual is T}
 */
export const notEqual = (actual, expected, message) =>
  !isEqual(actual, expected)
    ? PASS
    : AssertionError.throw({
        actual,
        expected,
        operator: 'notEqual',
        reason: 'Expected values to be loosely not equal',
        compare: (actual, expected) =>
          `${formatValue(actual)} != ${formatValue(expected)}`,
        message,
      })

/**
 * Tests for deep equality between the `actual` and `expected` parameters.
 *
 * @template T
 * @template {T} U
 * @param {T} actual
 * @param {U} expected
 * @param {string|Error} [message]
 * @returns {asserts actual is T}
 */
export const deepEqual = (actual, expected, message) =>
  isDeepEqual(actual, expected)
    ? PASS
    : AssertionError.throw({
        actual,
        expected,
        operator: 'deepEqual',
        compare,
        reason: 'Expected values to be deeply equal',
        message,
      })

/**
 * If the values are deeply equal, an `AssertionError` is thrown with a`message`
 * property set equal to the value of the `message` parameter. If the`message`
 * parameter is undefined, a default error message is assigned. If the`message`
 * parameter is an instance of an `Error` then it will be thrown instead of the
 * `AssertionError`.
 *
 * ```js
 * * const obj1 = {
 *   a: {
 *     b: 1,
 *   },
 * }
 *
 * const obj2 = {
 *   a: {
 *     b: 2,
 *   },
 * }
 *
 * const obj3 = {
 *   a: {
 *     b: 1,
 *   },
 * }
 *
 * const obj4 = { __proto__: obj1 }
 *
 * assert.notDeepEqual(obj1, obj1)
 * // AssertionError: { a: { b: 1 } } notDeepEqual { a: { b: 1 } }
 *
 * assert.notDeepEqual(obj1, obj2)
 *
 * assert.notDeepEqual(obj1, obj3)
 * // AssertionError: { a: { b: 1 } } notDeepEqual { a: { b: 1 } }
 *
 * assert.notDeepEqual(obj1, obj4)
 * ```
 *
 * @template T, U
 * @param {T|U} actual
 * @param {U} expected
 * @param {string|Error} [message]
 * @returns {asserts actual is T}
 */
export const notDeepEqual = (actual, expected, message) =>
  !isDeepEqual(actual, expected)
    ? PASS
    : AssertionError.throw({
        actual,
        expected,
        operator: 'deepEqual',
        compare,
        reason: 'Expected values to be deeply equal',
        message,
      })

/**
 * Expects the `string` input to match the regular expression.
 *
 * ```js
 * assert.match('I will fail', /pass/);
 * // AssertionError [ERR_ASSERTION]: The input did not match the regular ...
 *
 * assert.match(123, /pass/);
 * // AssertionError [ERR_ASSERTION]: The "string" argument must be of type string.
 *
 * assert.match('I will pass', /pass/);
 * // OK
 * ```
 *
 * If the values do not match, or if the `string` argument is of another type than`string`, an `AssertionError` is thrown with a `message` property set equal
 * to the value of the `message` parameter. If the `message` parameter is
 * undefined, a default error message is assigned. If the `message` parameter is an
 * instance of an `Error` then it will be thrown instead of the `AssertionError`.
 *
 * @template {string|Error} T
 * @param {T|undefined} value
 * @param {API.Pattern} pattern
 * @param {string|Error} [message]
 * @returns {asserts value is T}
 */
export const match = (value, pattern, message) =>
  value && isMatch(value, pattern)
    ? PASS
    : AssertionError.throw({
        actual: value,
        expected: pattern,
        operator: 'match',
        reason:
          typeof pattern === 'string'
            ? `Expected value to include "${pattern}" substring`
            : `Expected value to match \`${String(pattern)}\` pattern`,
      })

/**
 * Expects the function `block` to throw an error. If `pattern` `RegExp` is
 * provided, it will be used to test the error message.
 *
 * @param {() => unknown} block
 * @param {API.Pattern} [pattern]
 * @param {string|Error} [message]
 * @returns {Error}
 */
export const throws = (block, pattern, message) => {
  let threw = false
  let error
  try {
    block()
  } catch (cause) {
    threw = true
    error = /** @type {Error} */ (cause)
  }

  if (error && error.name === 'AssertionError') {
    throw error
  }

  if (!threw) {
    return AssertionError.throw({
      actual: threw,
      expected: true,
      operator: 'throws',
      reason: 'Expected function to throw',
      message,
    })
  } else if (pattern && !pattern.test(error)) {
    return AssertionError.throw({
      actual: error,
      expected: pattern,
      operator: 'throws',
      reason:
        pattern instanceof RegExp
          ? `Expected function to throw exception matching \`${String(
              pattern
            )}\` pattern`
          : 'Expected function to throw matching exception',
      message,
    })
  } else {
    return /** @type {Error} */ (error)
  }
}

/**
 * @param {() => unknown} block
 * @param {API.Pattern} [pattern]
 * @param {string|Error} [message]
 * @returns {Promise<Error>}
 */
export const rejects = async (block, pattern, message) => {
  let threw = false
  let error
  try {
    await block()
  } catch (cause) {
    threw = true
    error = /** @type {Error} */ (cause)
  }

  if (error && error.name === 'AssertionError') {
    throw error
  }

  if (!threw) {
    return AssertionError.throw({
      actual: threw,
      expected: true,
      operator: 'rejects',
      reason: 'Expected function to return promise that fails',
      message,
    })
  } else if (pattern && !pattern.test(error)) {
    return AssertionError.throw({
      actual: error,
      expected: pattern,
      operator: 'rejects',
      reason:
        pattern instanceof RegExp
          ? `Expected function to return failing promise matching \`${String(
              pattern
            )}\` pattern`
          : 'Expected function to return matching failing promise',
      message,
    })
  } else {
    return /** @type {Error} */ (error)
  }
}

/**
 * @param {unknown} value
 */
export const formatValue = (value) => {
  const tag = `#${Date.now().toString(36)}#`
  const formatted = JSON.stringify(value, createFormatter(tag), 2)
  return formatted.replace(`"${tag}`, '').replace(`${tag}"`, '')
}

/**
 * @param {string} tag
 */
const createFormatter = (tag) => {
  const seen = new Set()

  /**
   * @param {PropertyKey} key
   * @param {unknown} value
   */
  return (key, value) => {
    switch (typeof value) {
      case 'undefined':
        return `${tag}undefined${tag}`
      case 'bigint':
        return `${tag}${value}n${tag}`
      case 'symbol': {
        const { description = '' } = value
        if (Symbol.for(description) === value) {
          return `${tag}Symbol.for(${JSON.stringify(description)})${tag}`
        } else {
          return `${tag}Symbol(${JSON.stringify(description)})${tag}`
        }
      }
      case 'number': {
        if (value === Infinity) {
          return `${tag}Infinity${tag}`
        } else if (value === -Infinity) {
          return `${tag}-Infinity${tag}`
        } else if (value !== value) {
          return `${tag}NaN${tag}`
        } else {
          return value
        }
      }
      case 'object': {
        if (value === null) {
          return null
        } else if (seen.has(value)) {
          return `${tag}[Circular]${tag}`
        } else {
          seen.add(value)
          return value
        }
      }
      default:
        return value
    }
  }
}
