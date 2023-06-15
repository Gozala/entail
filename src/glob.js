/**
 * @param {{raw: ArrayLike<string>}|string} template
 * @param  {unknown[]} substitutions
 */
export const glob = (template, ...substitutions) =>
  new Glob(
    String.raw(
      typeof template === 'string' ? { raw: template } : template,
      ...substitutions
    ),
    { flags: 'g' }
  )

export default glob

class Glob extends RegExp {
  /**
   * @param {string} pattern
   * @param {object} [settings]
   * @param {boolean} [settings.extended]
   * @param {boolean} [settings.globstar]
   * @param {string} [settings.flags]
   */
  constructor(pattern, { flags, extended = false, globstar = false } = {}) {
    super(
      compile(pattern, { extended, globstar, global: flags?.includes('g') }),
      flags
    )

    this.pattern = pattern
    // Whether we are matching so called "extended" globs (like bash) and should
    // support single character matching, matching ranges of characters, group
    // matching, etc.
    this.extended = extended
    // When globstar is _false_ (default), '/foo/*' is translated a regexp like
    // '^\/foo\/.*$' which will match any string beginning with '/foo/'
    // When globstar is _true_, '/foo/*' is translated to regexp like
    // '^\/foo\/[^/]*$' which will match any string beginning with '/foo/' BUT
    // which does not have a '/' to the right of it.
    // E.g. with '/foo/*' these will match: '/foo/bar', '/foo/bar.txt' but
    // these will not '/foo/bar/baz', '/foo/bar/baz.txt'
    // Lastely, when globstar is _true_, '/foo/**' is equivelant to '/foo/*' when
    // globstar is _false_
    this.globstar = globstar
  }
  get [Symbol.toStringTag]() {
    return 'Glob'
  }
  toString() {
    return this.pattern
  }
}

/**
 *
 * @param {string} source
 * @param {object} [options]
 * @param {boolean} [options.extended] - Whether we are matching so called
 * "extended" globs (like bash) and should support single character matching,
 * matching ranges of characters, group matching, etc.
 * @param {boolean} [options.globstar] - When globstar is _false_ (default),
 * @param {boolean} [options.global]
 */
const compile = (
  source,
  { extended = false, globstar = false, global = true } = {}
) => {
  // The regexp we are building, as a string.
  let output = ''

  // If we are doing extended matching, this boolean is true when we are inside
  // a group (eg {*.html,*.js}), and false otherwise.
  let inGroup = false

  for (var i = 0, len = source.length; i < len; i++) {
    const c = source[i]

    switch (c) {
      case '/':
      case '$':
      case '^':
      case '+':
      case '.':
      case '(':
      case ')':
      case '=':
      case '!':
      case '|':
        output += '\\' + c
        break

      case '?':
        if (extended) {
          output += '.'
          break
        }

      case '[':
      case ']':
        if (extended) {
          output += c
          break
        }

      case '{':
        if (extended) {
          inGroup = true
          output += '('
          break
        }

      case '}':
        if (extended) {
          inGroup = false
          output += ')'
          break
        }

      case ',':
        if (inGroup) {
          output += '|'
          break
        }
        output += '\\' + c
        break

      case '*':
        // Move over all consecutive "*"'s.
        // Also store the previous and next characters
        var prevChar = source[i - 1]
        var starCount = 1
        while (source[i + 1] === '*') {
          starCount++
          i++
        }
        var nextChar = source[i + 1]

        if (!globstar) {
          // globstar is disabled, so treat any number of "*" as one
          output += '.*'
        } else {
          // globstar is enabled, so determine if this is a globstar segment
          const isGlobstar =
            starCount > 1 && // multiple "*"'s
            (prevChar === '/' || prevChar === undefined) && // from the start of the segment
            (nextChar === '/' || nextChar === undefined) // to the end of the segment

          if (isGlobstar) {
            // it's a globstar, so match zero or more path segments
            output += '((?:[^/]*(?:/|$))*)'
            i++ // move over the "/"
          } else {
            // it's not a globstar, so only match one path segment
            output += '([^/]*)'
          }
        }
        break

      default:
        output += c
    }
  }

  // When regexp 'g' flag is specified don't
  // constrain the regular expression with ^ & $
  return global ? output : `^${output}$`
}
