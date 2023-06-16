import kleur from 'kleur'
import { compare } from 'uvu/diff'
import * as API from './api.js'

const write =
  (typeof process < 'u' && process.stdout?.write?.bind(process.stdout)) ||
  console.log

const FAILURE = kleur.bold().bgRed(' FAIL ')
const FILE = kleur.bold().underline().white
const SUITE = kleur.bold
const FAIL = kleur.red('✘ ')
const PASS = kleur.gray('⦿ ')
const SKIP = kleur.gray('◌ ')
const NORMAL = (text = '') => text
const QUOTE = kleur.dim('"')
const GUTTER = '\n        '

/**
 * @param {AsyncIterable<API.Output>} output
 * @returns {Promise<API.Report>}
 */
export const report = async (output) => {
  const passed = []
  const failed = []
  const skipped = []
  let duration = 0

  let fail = 0
  let skip = 0
  let pass = 0

  /** @type {string[]} */
  let cursor = []

  for await (const message of output) {
    let at = message.test?.at || message.skip?.at || cursor
    if (cursor !== at) {
      const color = fail ? kleur.red : kleur.green
      write(color(`  (${pass} / ${pass + fail + skip})\n`))

      if (fail > 0) {
        for (const unit of failed.slice(-fail)) {
          write(`\n${format(unit.name, unit.error, unit.at.at(-1))}`)
        }
      }
      cursor = updateCursor(cursor, at)
      fail = 0
      skip = 0
      pass = 0
    }

    if (message.skip) {
      skip++
      write(SKIP)
      skipped.push(message.skip)
    }

    if (message.pass) {
      pass++
      duration += message.pass.duration
      write(PASS)
      passed.push(message.pass)
    }

    if (message.fail) {
      fail++
      duration += message.fail.duration
      failed.push(message.fail)
      write(FAIL)
    }
  }

  const color = fail ? kleur.red : kleur.green
  write(color(`  (${pass} / ${pass + fail + skip})\n`))

  if (fail) {
    for (const unit of failed.slice(-fail)) {
      write(`\n${format(unit.name, unit.error, unit.at.at(-1))}\n`)
    }
    write('\n')
  }

  const formatPass = failed.length ? kleur.red : kleur.green
  const formatSkip = skipped.length ? kleur.yellow : NORMAL
  const total = passed.length + skipped.length + failed.length
  write(`\n\nTotal:     ${total}`)
  write(formatPass(`\nPassed:    ${passed.length}`))
  write(formatSkip(`\nSkipped:   ${skipped.length}`))
  write(`\nDuration:  ${duration.toFixed(2)}ms\n\n`)

  return { passed, failed, skipped, duration }
}

/**
 * @param {string[]} before
 * @param {string[]} after
 */
const updateCursor = (before, after) => {
  if (before !== after) {
    const [fileBefore, ...pathBefore] = before
    const [fileAfter, ...pathAfter] = after
    if (fileBefore !== fileAfter) {
      write(`\n\n` + FILE(fileAfter))
    }

    for (let [level, name] of pathAfter.entries()) {
      if (pathBefore[level] !== name) {
        write(`\n` + '  '.repeat(level) + name + ' ')
      }
    }
  }

  return after
}

/**
 * @param {string} name
 * @param {API.Assertion} error
 * @param {string} suite
 */
function format(name, error, suite = '') {
  let { details, operator = '' } = error
  let idx = error.stack ? error.stack.indexOf('\n') : 0
  if (error.name.startsWith('AssertionError') && !operator.includes('not'))
    details = compare(error.actual, error.expects) // TODO?
  let str =
    '  ' +
    FAILURE +
    (suite ? kleur.red(SUITE(` ${suite} `)) : '') +
    ' ' +
    QUOTE +
    kleur.red().bold(name) +
    QUOTE
  str +=
    '\n    ' +
    error.message +
    (operator ? kleur.italic().dim(`  (${operator})`) : '') +
    '\n'
  if (details) str += GUTTER + details.split('\n').join(GUTTER)
  if (!!~idx) str += stack(error.stack || '', idx)
  return str + '\n'
}

const IGNORE = /^\s*at.*(?:\(|\s)(?:node|(internal\/[\w/]*))/

/**
 * @param {string} stack
 * @param {number} idx
 * @returns
 */
function stack(stack, idx) {
  let i = 0,
    line,
    out = ''
  let arr = stack.substring(idx).replace(/\\/g, '/').split('\n')
  for (; i < arr.length; i++) {
    line = arr[i].trim()
    if (line.length && !IGNORE.test(line)) {
      out += '\n    ' + line
    }
  }
  return kleur.grey(out) + '\n'
}
