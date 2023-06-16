export type Assert = typeof import('./assert.js')
import type { Assertion } from 'uvu/assert'

export type { Assertion }

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
  error: Assertion
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
