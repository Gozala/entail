import * as assert from '../src/assert.js'

/**
 * @type {import('entail').Suite}
 */
export const test = {
  'skip should not run': (assert) => {
    assert.fail('should not run')
  },

  'assert ok': (assert) => {
    /** @type {unknown} */
    const input = true
    assert.ok(input)
    assert.ok(1)

    try {
      assert.ok('')
      assert.fail('should have failed throw')
    } catch (error) {
      const message = String(error)
      assert.match(message, /AssertionError/)
      assert.match(message, /"" == true/)
    }
  },

  'assert fail': (assert) => {
    let threw = 0
    try {
      assert.fail('should have failed throw')
    } catch (error) {
      threw++
      const message = String(error)
      assert.match(message, /AssertionError/)
      assert.match(message, /should have failed throw/)
    }

    assert.equal(threw, 1)

    try {
      assert.fail()
    } catch (error) {
      threw++
      const message = String(error)
      assert.match(message, /AssertionError/)
      assert.match(message, /Failed/)
    }
    assert.equal(threw, 2)
  },

  'assert strictEqual': (assert) => {
    try {
      // @ts-expect-error - types do not overlap
      assert.strictEqual(1, '1')
      assert.fail('should have failed throw')
    } catch (error) {
      const message = String(error)
      assert.match(message, /Expected values to be strictly equal/)
    }

    assert.strictEqual(NaN, NaN)
    assert.strictEqual(1, 1)
  },

  'assert notStrictEqual': (assert) => {
    try {
      assert.notStrictEqual(1, 1)
      assert.fail('should have failed throw')
    } catch (error) {
      const message = String(error)
      assert.match(message, /Expected values to be strictly unequal/)
    }

    assert.notStrictEqual(-Infinity, Infinity)
    // @ts-expect-error - types do not overlap
    assert.notStrictEqual(1, '1')
  },

  'should equal': (assert) => {
    assert.equal(1, 1)

    try {
      // @ts-expect-error - types do not overlap
      assert.equal(2, { x: 1 })
    } catch (error) {
      const message = String(error)
      assert.match(message, /AssertionError/)
    }
  },

  'assert notEqual': (assert) => {
    assert.notEqual({ x: 1 }, { x: 1 })
  },
  'assert deepEqual': (assert) => {
    assert.deepEqual({ x: 1 }, { x: 1 })
  },
  'assert notDeepEqual': (assert) => {
    // @ts-expect-error - types do not overlap
    assert.notDeepEqual({ x: 1 }, { x: 1, y: 1 })
  },
  'assert throws pattern': (assert) => {
    assert.throws(() => {
      throw new Error('Boom')
    }, /Boom/)
  },
  'assert throws string': (assert) => {
    assert.throws(() => {
      throw new Error('Boom')
    })
  },
}
