/**
 *
 */
export interface Assert {
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
   */
  ok<T>(value: T, message?: string | Error): void

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
   */
  fail(message?: string | Error): never

  /**
   * Tests strict equality between the `actual` and `expected` parameters as
   * determined by Object.is().
   */
  strictEqual<T, U extends T>(
    actual: T,
    expected: U,
    message?: string | Error
  ): void

  /**
   * The strict non-equivalence assertion tests for any strict inequality.
   */
  notStrictEqual<T, U extends T>(
    actual: T,
    expected: U,
    message?: string | Error
  ): void

  /**
   * Tests shallow, coercive equality between the `actual` and `expected` parameters
   * using the `==` operator. `NaN` is specially handled and treated as being
   * identical if both sides are `NaN`.
   */
  equal<T, U extends T>(actual: T, expected: U, message?: string | Error): void

  /**
   * Tests shallow, coercive inequality with the `!=` operator. `NaN` is specially
   * handled and treated as being identical if both sides are `NaN`.
   *
   * ```js
   * assert.notEqual(1, 2) // true
   * assert.notEqual(1, 1) // AssertionError: 1 != 1
   *
   * assert.notEqual(1, '1') // AssertionError: 1 != '1'
   * ```
   */
  notEqual<T, U extends T>(
    actual: T,
    expected: U,
    message?: string | Error
  ): void

  /**
   *
   */
  deepEqual<T, U extends T>(
    actual: T,
    expected: U,
    message?: string | Error
  ): void

  /**
   *
   */
  notDeepEqual<T, U extends T>(
    actual: T,
    expected: U,
    message?: string | Error
  ): void
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
   */
  match<T extends string | Error>(
    value: T | undefined,
    pattern: Pattern,
    message?: string | Error
  ): void

  /**
   * Expects the function `block` to throw an error. If `pattern` `RegExp` is
   * provided, it will be used to test the error message.
   */
  throws(
    block: () => unknown,
    pattern?: Pattern,
    message?: string | Error
  ): Error

  /**
   * Expects the function `block` to throw an error. If `pattern` `RegExp` is
   * provided, it will be used to test the error message.
   */
  rejects(
    block: () => unknown,
    pattern?: Pattern,
    message?: string | Error
  ): Promise<Error>
}

/**
 * Indicates the failure of an assertion. All errors thrown by the `node:assert`module will be instances of the `AssertionError` class.
 */
export interface AssertionError extends Error {
  name: 'AssertionError'
  // use the code node uses
  code: 'ERR_ASSERTION'

  origin: Partial<Unit>

  details: string
  generated: boolean
  /**
   * Set to the passed in operator value.
   */
  operator: string
  /**
   * Set to the `expected` argument for methods such as {@link assert.strictEqual()}.
   */
  expects: unknown
  /**
   * Set to the `actual` argument for methods such as {@link assert.strictEqual()}.
   */
  actual: unknown
}

export type Test = (ass: Assert) => unknown
export type Suite = { [name: string]: Test | Suite }

export type Mode = 'skip' | 'only' | 'test'

export type Unit = {
  at: string[]
  name: string
  test: Test
  mode: Mode
}

export type Output = Variant<{
  at: string[]
  skip: Unit
  test: Unit
  pass: Passed
  fail: Failed
}>

export type Failed = Unit & {
  duration: number
  error: AssertionError
}

export type Passed = Unit & {
  duration: number
}

export type Report = {
  passed: Passed[]
  failed: Failed[]
  skipped: Unit[]
  duration: number
}

/**
 * Subset of {@link RegExp} interface that can be used to test
 * if string matches the pattern.
 */
export interface Pattern {
  /**
   * Returns a Boolean value that indicates whether or not a pattern exists in
   * a searched string.
   *
   * @param source - String on which to perform the search.
   */
  test(source: unknown): boolean
}

/**
 * Defines result type as per invocation spec
 *
 * @see https://github.com/ucan-wg/invocation/#6-result
 */

export type Result<T extends {} = {}, X extends {} = {}> = Variant<{
  ok: T
  error: X
}>

/**
 * Utility type for defining a [keyed union] type as in IPLD Schema. In practice
 * this just works around typescript limitation that requires discriminant field
 * on all variants.
 *
 * ```ts
 * type Result<T, X> =
 *   | { ok: T }
 *   | { error: X }
 *
 * const demo = (result: Result<string, Error>) => {
 *   if (result.ok) {
 *   //  ^^^^^^^^^ Property 'ok' does not exist on type '{ error: Error; }`
 *   }
 * }
 * ```
 *
 * Using `Variant` type we can define same union type that works as expected:
 *
 * ```ts
 * type Result<T, X> = Variant<{
 *   ok: T
 *   error: X
 * }>
 *
 * const demo = (result: Result<string, Error>) => {
 *   if (result.ok) {
 *     result.ok.toUpperCase()
 *   }
 * }
 * ```
 *
 * [keyed union]:https://ipld.io/docs/schemas/features/representation-strategies/#union-keyed-representation
 */
export type Variant<U extends Record<string, unknown>> = {
  [Key in keyof U]: { [K in Exclude<keyof U, Key>]?: never } & {
    [K in Key]: U[Key]
  }
}[keyof U]
