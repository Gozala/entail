import * as concordance from './concordance.js'
import concordanceOptions from './options.js'

/**
 *
 * @param {unknown} actualDescriptor
 * @param {unknown} expectedDescriptor
 * @param {typeof concordanceOptions} [options]
 * @returns {{label:string, formatted: string}}
 */
function formatDescriptorDiff(
  actualDescriptor,
  expectedDescriptor,
  options = concordanceOptions
) {
  const { diffGutters } = options.theme
  const { insertLine, deleteLine } = options.theme.string.diff
  return {
    label: `Difference (${diffGutters.actual}${deleteLine.open}actual${deleteLine.close}, ${diffGutters.expected}${insertLine.open}expected${insertLine.close}):`,
    formatted: concordance.diff(actualDescriptor, expectedDescriptor, options),
  }
}

/**
 * @param {unknown} actual
 * @param {unknown} expected
 * @returns {string}
 */
export const compare = (actual, expected) => {
  const { label, formatted } = formatDescriptorDiff(actual, expected)
  return `${label}\n${formatted}`
}
