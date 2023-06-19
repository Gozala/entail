# entail

Entail is test runner for exported test from your ES modules. What sets it apart is that it does not require you to import some test library for defining tests - it just treats exports with certain naming convention as tests instead.

## Convention

### Tests

Functions exported by a name that starts with `test` are considered tests. Such functions will be passed common assertion functions

```js
// You can use camel case naming
/** @type {import('entail').Test} */
export const testSum = (assert) => {
  assert.equal(1 + 1, 2)
}

// You can also use snake case naming
/** @type {import('entail').Test} */
export const test_multiply = (assert) => {
  assert.equal(2 * 2, 4)
}

// Or just use name `test`
/** @type {import('entail').Test} */
export const test = (assert) => {
  assert.throws(() => new Error('boom'))
}
```

### Suites

Objects exported by a name that start with `test` are considered test suites. Properties of the suites are considered to be either a tests (function) or sub-suite.

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

### Skip

Tests prefixed with `skip` are accounted for but skipped by a test runner.

```js
// You can use camel case naming
/** @type {import('entail').Test} */
export const skipTestSum = (assert) => {
  assert.equal(1 + 1, 2)
}

export export test = {
  'skip! multiply': (assert) => {
    assert.equal(2 * 2, 4)
  },
  'range check': (assert) => {
    assert.throws(() => new Uint8Array().set([1, 2]), /out of bound/)
  }
}
```

### Only

In presence of tests prefixed with `only` all other tests are skipped by a test runner.

```js
// You can use camel case naming
/** @type {import('entail').Test} */
export const onlyTestSum = (assert) => {
  assert.equal(1 + 1, 2)
}

export export test = {
  'only! multiply': (assert) => {
    assert.equal(2 * 2, 4)
  },
  'range check': (assert) => {
    assert.throws(() => new Uint8Array().set([1, 2]), /out of bound/)
  }
}
```

### Usage

You can scan through all the modules in the working directory (excluding some common paths like `node_modules`) and run all discovered tests

```sh
entail
```

Or you can specify a specific pattern of your test files

```sh
entail test/*.spec.js
```

You do not even need to add `entail` as dependency you can simply run it

```sh
npx entail
```

You can also import `entail` and use it to test modules as follows

```js
import test from 'entail'
import * testMath from './test/math.js'
import * testString from './test/string.js'

test({ testMath, testString })
```

```sh
node ./mytest.js
```

## Credits

Initially this started as wrapper around superb [uvu] library. While it mostly had been replaced by own runner and other components would not have existed without [uvu] been around.

I think of `entail` as successor of [estest], which inspired idea of tests without frameworks.

[uvu]:https://github.com/lukeed/uvu
[estest]:https://www.npmjs.com/package/estest
