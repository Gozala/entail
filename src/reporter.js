import kleur from 'kleur'
import { compare } from 'uvu/diff'
import * as API from './api.js'

const write =
  (typeof process < 'u' && process.stdout?.write?.bind(process.stdout)) ||
  console.log

const FILE = kleur.bold().underline().white
const FAIL = kleur.red('✘ ')
const PASS = kleur.gray('⦿ ')
const SKIP = kleur.gray('◌ ')
const NORMAL = (text = '') => text

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

  let total = pass + fail + skip
  for await (const message of output) {
    let at = message.test?.at || message.skip?.at || cursor
    if (cursor !== at) {
      const color = fail ? kleur.red : kleur.green
      if (total) {
        write(color(`  (${pass} / ${total})\n`))
      }

      if (fail > 0) {
        for (const unit of failed.slice(-fail)) {
          write(`\n${unit.error}`)
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
  if (total) {
    write(color(`  (${pass} / ${pass + fail + skip})\n`))
  }

  if (fail) {
    for (const unit of failed.slice(-fail)) {
      write(`\n${unit.error}\n`)
    }
    write('\n')
  }

  const formatPass = failed.length ? kleur.red : kleur.green
  const formatSkip = skipped.length ? kleur.yellow : NORMAL
  const ran = passed.length + skipped.length + failed.length
  write(`\n\nTotal:     ${ran}`)
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

const IGNORE = /^\s*at.*(?:\(|\s)(?:node|(internal\/[\w/]*))/
