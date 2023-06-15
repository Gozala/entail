# subtest

Native ES test system that simply runs tests that were exported by your modules.

## Format

subtest will run functions exported by a name starting with `test`

```js
// You can use camel case naming
/** @type {import('subtest').Test} */
export const testSum = (assert) => {
  assert.equal(1 + 1, 2)
}

// You can also use snake case naming
/** @type {import('subtest').Test} */
export const test_multiply = (assert) => {
  assert.equal(2 * 2, 4)
}

// Or just use name `test`
/** @type {import('subtest').Test} */
export const test = (assert) => {
  assert.throws(() => new Error('boom'))
}
```

It will also run exported test suites, which are objects (with test functions) exported by name starting with `test`.

> Test suites can contain nested suites with arbitrary names.

```js
export test = {
  'multiply': (assert) => {
    assert.equal(2 * 2, 4)
  },
  'range check': (assert) => {
    assert.throws(() => new Uint8Array().set([1, 2]), /out of bound/)
  }
}
```

### Usage

You can run all the tests in the `test` folder by running

```sh
subtest test
```

Alternatively you can create node script e.g. `mytest.js` that runs tests

```js
import test from 'subtest'
import * testMath from './test/math.js'
import * testString from './test/string.js'

test({ testMath, testString })
```

```sh
node ./mytest.js
```

