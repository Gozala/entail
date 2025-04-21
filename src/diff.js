import kleur from 'kleur'
import * as diff from 'diff'

/**
 * @typedef {Record<string, import('kleur').Color>} DiffColors
 */

/**
 * Color mapping for diff symbols
 * @type {DiffColors}
 */
const colors = {
  '--': kleur.red,
  '··': kleur.grey,
  '++': kleur.green,
}

/** @type {Function} - Style for titles */
const TITLE = kleur.dim().italic
/** @type {string} - Tab character representation */
const TAB = kleur.dim('→'),
  /** @type {string} - Space character representation */
  SPACE = kleur.dim('·'),
  /** @type {string} - Newline character representation */
  NL = kleur.dim('↵')
/**
 * Log a line with a symbol and formatted string
 * @param {string} sym - Symbol prefix (--/··/++)
 * @param {string} str - String to format and log
 * @returns {string} Formatted log line
 */
const LOG = (sym, str) => colors[sym](sym + PRETTY(str)) + '\n'
/**
 * Format a line number
 * @param {number} num - Line number
 * @param {number} x - Padding width
 * @returns {string} Formatted line number
 */
const LINE = (num, x) => kleur.dim('L' + String(num).padStart(x, '0') + ' ')
/**
 * Format a string to show whitespace characters
 * @param {string} str - Input string
 * @returns {string} Formatted string with visible whitespace
 */
const PRETTY = (str) =>
  str
    .replace(/[ ]/g, SPACE)
    .replace(/\t/g, TAB)
    .replace(/(\r?\n)/g, NL)

/**
 * @typedef {Object} DiffLine
 * @property {boolean} [added] - If line was added
 * @property {boolean} [removed] - If line was removed
 * @property {string} value - Line content
 * @property {number} [count] - Line count
 */

/**
 * Format a diff line object
 * @param {DiffLine} obj - Diff line object
 * @param {number} prev - Previous line number
 * @param {number} pad - Padding width for line numbers
 * @returns {string} Formatted diff line
 */
function line(obj, prev, pad) {
  let char = obj.removed ? '--' : obj.added ? '++' : '··'
  let arr = obj.value.replace(/\r?\n$/, '').split('\n')
  let i = 0,
    tmp,
    out = ''

  if (obj.added) out += colors[char]().underline(TITLE('Expected:')) + '\n'
  else if (obj.removed) out += colors[char]().underline(TITLE('Actual:')) + '\n'

  for (; i < arr.length; i++) {
    tmp = arr[i]
    if (tmp != null) {
      if (prev) out += LINE(prev + i, pad)
      out += LOG(char, tmp || '\n')
    }
  }

  return out
}

/**
 * Generate diff for arrays
 * @param {any[]} input - Actual array
 * @param {any[]} expect - Expected array
 * @returns {string} Formatted array diff
 */
export function arrays(input, expect) {
  let arr = diff.diffArrays(input, expect)
  let i = 0,
    j = 0,
    k = 0,
    tmp,
    val,
    char,
    isObj,
    str
  let out = LOG('··', '[')

  for (; i < arr.length; i++) {
    char = (tmp = arr[i]).removed ? '--' : tmp.added ? '++' : '··'

    if (tmp.added) {
      out += colors[char]().underline(TITLE('Expected:')) + '\n'
    } else if (tmp.removed) {
      out += colors[char]().underline(TITLE('Actual:')) + '\n'
    }

    for (j = 0; j < tmp.value.length; j++) {
      isObj = tmp.value[j] && typeof tmp.value[j] === 'object'
      val = stringify(tmp.value[j]).split(/\r?\n/g)
      for (k = 0; k < val.length; ) {
        str = '  ' + val[k++] + (isObj ? '' : ',')
        if (isObj && k === val.length && j + 1 < tmp.value.length) str += ','
        out += LOG(char, str)
      }
    }
  }

  return out + LOG('··', ']')
}

/**
 * Generate diff for multiline strings
 * @param {string} input - Actual string
 * @param {string} expect - Expected string
 * @param {number} [linenum=0] - Starting line number
 * @returns {string} Formatted line diff
 */
export function lines(input, expect, linenum = 0) {
  let i = 0,
    tmp,
    output = ''
  let arr = diff.diffLines(input, expect)
  let pad = String(expect.split(/\r?\n/g).length - linenum).length

  for (; i < arr.length; i++) {
    output += line((tmp = arr[i]), linenum, pad)
    if (linenum && !tmp.removed) linenum += tmp.count || 0
  }

  return output
}

/**
 * Generate character-level diff
 * @param {string} input - Actual string
 * @param {string} expect - Expected string
 * @returns {string} Formatted character diff
 */
export function chars(input, expect) {
  let arr = diff.diffChars(input, expect)
  let i = 0,
    output = '',
    tmp

  let l1 = input.length
  let l2 = expect.length

  let p1 = PRETTY(input)
  let p2 = PRETTY(expect)

  tmp = arr[i]

  if (l1 === l2) {
    // no length offsets
  } else if (tmp && tmp.removed && arr[i + 1]) {
    let del = (tmp.count || 0) - (arr[i + 1].count || 0)
    if (del == 0) {
      // wash~
    } else if (del > 0) {
      expect = ' '.repeat(del) + expect
      p2 = ' '.repeat(del) + p2
      l2 += del
    } else if (del < 0) {
      input = ' '.repeat(-del) + input
      p1 = ' '.repeat(-del) + p1
      l1 += -del
    }
  }

  output += direct(p1, p2, l1, l2)

  if (l1 === l2) {
    for (tmp = '  '; i < l1; i++) {
      tmp += input[i] === expect[i] ? ' ' : '^'
    }
  } else {
    for (tmp = '  '; i < arr.length; i++) {
      tmp += (arr[i].added || arr[i].removed ? '^' : ' ').repeat(
        Math.max(arr[i].count || 0, 0)
      )
      if (
        i + 1 < arr.length &&
        ((arr[i].added && arr[i + 1].removed) ||
          (arr[i].removed && arr[i + 1].added))
      ) {
        arr[i + 1].count = (arr[i + 1].count || 0) - (arr[i].count || 0)
      }
    }
  }

  return output + kleur.red(tmp)
}

/**
 * Generate direct comparison
 * @param {string|any} input - Actual value
 * @param {string|any} expect - Expected value
 * @param {number} [lenA=String(input).length] - Length of input string
 * @param {number} [lenB=String(expect).length] - Length of expect string
 * @returns {string} Formatted direct comparison
 */
export function direct(
  input,
  expect,
  lenA = String(input).length,
  lenB = String(expect).length
) {
  let gutter = 4
  let lenC = Math.max(lenA, lenB)
  let typeA = typeof input,
    typeB = typeof expect

  if (typeA !== typeB) {
    gutter = 2

    let delA = gutter + lenC - lenA
    let delB = gutter + lenC - lenB

    input += ' '.repeat(delA) + kleur.dim(`[${typeA}]`)
    expect += ' '.repeat(delB) + kleur.dim(`[${typeB}]`)

    lenA += delA + typeA.length + 2
    lenB += delB + typeB.length + 2
    lenC = Math.max(lenA, lenB)
  }

  let output =
    colors['++'](
      '++' + expect + ' '.repeat(gutter + lenC - lenB) + TITLE('(Expected)')
    ) + '\n'
  return (
    output +
    colors['--'](
      '--' + input + ' '.repeat(gutter + lenC - lenA) + TITLE('(Actual)')
    ) +
    '\n'
  )
}

/**
 * Sort object keys to match expected object structure
 * @template T
 * @param {any} input - Actual object or array
 * @param {any} expect - Expected object or array
 * @returns {any} Sorted object or array
 */
export function sort(input, expect) {
  var k,
    i = 0,
    tmp,
    isArr = Array.isArray(input)
  /** @type {string[]} */
  var keys = []
  /** @type {any} */
  var out = isArr ? new Array(Array.isArray(input) ? input.length : 0) : {}

  if (isArr && Array.isArray(input)) {
    for (i = 0; i < input.length; i++) {
      tmp = input[i]
      if (!tmp || typeof tmp !== 'object') out[i] = tmp
      else out[i] = sort(tmp, Array.isArray(expect) && i < expect.length ? expect[i] : {}) // might not be right
    }
  } else if (
    typeof input === 'object' && 
    input !== null && 
    typeof expect === 'object' && 
    expect !== null
  ) {
    for (k in expect) keys.push(k)

    for (; i < keys.length; i++) {
      k = keys[i]
      if (input && Object.prototype.hasOwnProperty.call(input, k)) {
        tmp = input[k]
        if (!tmp || typeof tmp !== 'object') {
          if (typeof out === 'object' && out !== null) out[k] = tmp
        }
        else {
          if (typeof out === 'object' && out !== null && typeof expect === 'object' && expect !== null)
            out[k] = sort(tmp, expect[k] || {})
        }
      }
    }

    for (k in input) {
      if (input && typeof out === 'object' && out !== null && !Object.prototype.hasOwnProperty.call(out, k)) {
        out[k] = input[k] // expect didnt have
      }
    }
  } else {
    return input
  }

  return out
}

/**
 * Create a circular reference-safe replacer for JSON.stringify
 * @returns {(key: string, val: any) => any} Replacer function for JSON.stringify
 */
export function circular() {
  var cache = new Set()
  return function print(key, val) {
    if (val === void 0) return '[__VOID__]'
    if (typeof val === 'number' && val !== val) return '[__NAN__]'
    if (typeof val === 'bigint') return val.toString()
    if (!val || typeof val !== 'object') return val
    if (cache.has(val)) return '[Circular]'
    cache.add(val)
    return val
  }
}

/**
 * Stringify a value safely handling circular references
 * @param {unknown} input - Value to stringify
 * @returns {string} JSON string representation
 */
export function stringify(input) {
  return JSON.stringify(input, circular(), 2)
    .replace(/"\[__NAN__\]"/g, 'NaN')
    .replace(/"\[__VOID__\]"/g, 'undefined')
}

/**
 * Compare two values and generate appropriate diff
 * @param {unknown} input - Actual value
 * @param {unknown} expect - Expected value
 * @returns {string} Formatted diff
 */
export function compare(input, expect) {
  if (Array.isArray(expect) && Array.isArray(input))
    return arrays(input, expect)
  if (expect instanceof RegExp) return chars(String(input || ''), String(expect))

  let isA = input && typeof input == 'object'
  let isB = expect && typeof expect == 'object'

  if (isA && isB && input !== null && expect !== null) {
    input = sort(input, expect)
  }
  if (isB) expect = stringify(expect)
  if (isA) input = stringify(input)

  if (expect && typeof expect == 'object') {
    input = stringify(sort(input || {}, expect))
    expect = stringify(expect)
  }

  isA = typeof input == 'string'
  isB = typeof expect == 'string'

  if (isA && /\r?\n/.test(String(input))) return lines(String(input || ''), String(expect || ''))
  if (isB && /\r?\n/.test(String(expect))) return lines(String(input || ''), String(expect || ''))
  if (isA && isB) return chars(String(input || ''), String(expect || ''))

  return direct(input, expect)
}