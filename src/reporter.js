import kleur from 'kleur'
import * as API from './api.js'
import { AssertionError } from './assert.js'

const FILE = kleur.bold().underline().white
const FAIL = kleur.red('✘ ')
const PASS = kleur.gray('⦿ ')
const SKIP = kleur.gray('◌ ')
const NORMAL = (text = '') => text

/**
 * @param {AsyncIterable<API.Output>} output
 * @returns {AsyncGenerator<string, API.Report>}
 */
export const report = async function* (output) {
  const passed = []
  const failed = []
  const skipped = []
  let duration = 0

  let fail = 0
  let skip = 0
  let pass = 0

  /** @type {string[]} */
  let cursor = []

  let total = pass + fail + skip
  for await (const message of output) {
    let at = message.test?.at || message.skip?.at || cursor
    if (cursor !== at) {
      const color = fail ? kleur.red : kleur.green
      if (total) {
        yield color(`  (${pass} / ${total})\n`)
      }

      if (fail > 0) {
        for (const unit of failed.slice(-fail)) {
          yield `\n${AssertionError.format(unit.error)}`
        }
      }
      cursor = yield* updateCursor(cursor, at)
      fail = 0
      skip = 0
      pass = 0
    }

    if (message.skip) {
      skip++
      yield SKIP
      skipped.push(message.skip)
    }

    if (message.pass) {
      pass++
      duration += message.pass.duration
      yield PASS
      passed.push(message.pass)
    }

    if (message.fail) {
      fail++
      duration += message.fail.duration
      failed.push(message.fail)
      yield FAIL
    }
  }

  const color = fail ? kleur.red : kleur.green
  if (total) {
    yield color(`  (${pass} / ${pass + fail + skip})\n`)
  }

  if (fail) {
    for (const unit of failed.slice(-fail)) {
      yield `\n${AssertionError.format(unit.error)}\n`
    }
    yield '\n'
  }

  const formatPass = failed.length ? kleur.red : kleur.green
  const formatSkip = skipped.length ? kleur.yellow : NORMAL
  const ran = passed.length + skipped.length + failed.length
  yield `\n\nTotal:     ${ran}`
  yield formatPass(`\nPassed:    ${passed.length}`)
  yield String(formatSkip(`\nSkipped:   ${skipped.length}`))
  yield `\nDuration:  ${duration.toFixed(2)}ms\n\n`

  return { passed, failed, skipped, duration }
}

/**
 * @param {string[]} before
 * @param {string[]} after
 */
const updateCursor = function* (before, after) {
  if (before !== after) {
    const [fileBefore, ...pathBefore] = before
    const [fileAfter, ...pathAfter] = after
    if (fileBefore !== fileAfter) {
      yield `\n\n` + FILE(fileAfter)
    }

    for (let [level, name] of pathAfter.entries()) {
      if (pathBefore[level] !== name) {
        yield `\n${'  '.repeat(level)}${name} `
      }
    }
  }

  return after
}
