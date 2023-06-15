/**
 * Throws an `AssertionError` with the provided error message or a default
 * error message. If the `message` parameter is an instance of an `Error` then
 * it will be thrown instead of the `AssertionError`.
 *
 * ```js
 * import assert from 'node:assert/strict';
 *
 * assert.fail();
 * // AssertionError [ERR_ASSERTION]: Failed
 *
 * assert.fail('boom');
 * // AssertionError [ERR_ASSERTION]: boom
 *
 * assert.fail(new TypeError('need array'));
 * // TypeError: need array
 * ```
 *
 * Using `assert.fail()` with more than two arguments is possible but deprecated.
 * See below for further details.
 * @param [message='Failed']
 */
export declare function fail(message?: string | Error): never

/**
 * Tests if `value` is truthy. It is equivalent to`assert.equal(!!value, true, message)`.
 *
 * If `value` is not truthy, an `AssertionError` is thrown with a `message`property set equal to the value of the `message` parameter. If the `message`parameter is `undefined`, a default
 * error message is assigned. If the `message`parameter is an instance of an `Error` then it will be thrown instead of the`AssertionError`.
 * If no arguments are passed in at all `message` will be set to the string:`` 'No value argument passed to `assert.ok()`' ``.
 *
 * Be aware that in the `repl` the error message will be different to the one
 * thrown in a file! See below for further details.
 *
 * ```js
 * import assert from 'node:assert/strict';
 *
 * assert.ok(true);
 * // OK
 * assert.ok(1);
 * // OK
 *
 * assert.ok();
 * // AssertionError: No value argument passed to `assert.ok()`
 *
 * assert.ok(false, 'it\'s false');
 * // AssertionError: it's false
 *
 * // In the repl:
 * assert.ok(typeof 123 === 'string');
 * // AssertionError: false == true
 *
 * // In a file (e.g. test.js):
 * assert.ok(typeof 123 === 'string');
 * // AssertionError: The expression evaluated to a falsy value:
 * //
 * //   assert.ok(typeof 123 === 'string')
 *
 * assert.ok(false);
 * // AssertionError: The expression evaluated to a falsy value:
 * //
 * //   assert.ok(false)
 *
 * assert.ok(0);
 * // AssertionError: The expression evaluated to a falsy value:
 * //
 * //   assert.ok(0)
 * ```
 *
 * ```js
 * import assert from 'node:assert/strict';
 *
 * // Using `assert()` works the same:
 * assert(0);
 * // AssertionError: The expression evaluated to a falsy value:
 * //
 * //   assert(0)
 * ```
 */
export declare function ok(
  value: unknown,
  message?: string | Error
): asserts value is {}

/**
 * Expects the `string` input to match the regular expression.
 *
 * ```js
 * import assert from 'node:assert/strict';
 *
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
 * @since v13.6.0, v12.16.0
 */
export declare function match(
  value: string | Error | undefined,
  pattern: RegExp,
  message?: string | Error
): asserts value is string | Error

/**
 * Asserts that actual is deeply equal to expected.
 *
 * T   Type of the objects.
 * @param actual   Actual value.
 * @param expected   Potential expected value.
 * @param message   Message to display on error.
 */
export declare function deepEqual<T>(
  actual: T,
  expected: T,
  message?: string
): void

/**
 * Asserts that actual is not deeply equal to expected.
 *
 * T   Type of the objects.
 * @param actual   Actual value.
 * @param expected   Potential expected value.
 * @param message   Message to display on error.
 */
export declare function notDeepEqual<T>(
  actual: T,
  expected: T,
  message?: string
): void

/**
 * Asserts non-strict equality (==) of actual and expected.
 *
 * T   Type of the objects.
 * @param actual   Actual value.
 * @param expected   Potential expected value.
 * @param message   Message to display on error.
 */
export declare function equal<T>(actual: T, expected: T, message?: string): void

/**
 * Asserts non-strict inequality (!=) of actual and expected.
 *
 * T   Type of the objects.
 * @param actual   Actual value.
 * @param expected   Potential expected value.
 * @param message   Message to display on error.
 */
export declare function notEqual<T>(
  actual: T,
  expected: T,
  message?: string
): void

/**
 * Expects the function `block` to throw an error. If `pattern` `RegExp` is
 * provided, it will be used to test the error message.
 */
export declare function throws(
  block: () => unknown,
  pattern?: RegExp,
  message?: string | Error
): void
