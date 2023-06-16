import { globbySync } from 'globby'
import { resolve, extname, basename, relative } from 'node:path'

export { relative }

const defaultIgnorePatterns = [
  '.git', // Git repository files, see <https://git-scm.com/>
  '.log', // Log files emitted by tools such as `tsserver`, see <https://github.com/Microsoft/TypeScript/wiki/Standalone-Server-%28tsserver%29>
  '.nyc_output', // Temporary directory where nyc stores coverage data, see <https://github.com/bcoe/nyc>
  '.sass-cache', // Cache folder for node-sass, see <https://github.com/sass/node-sass>
  'bower_components', // Where Bower packages are installed, see <http://bower.io/>
  'coverage', // Standard output directory for code coverage reports, see <https://github.com/gotwarlost/istanbul>
  'node_modules', // Where Node modules are installed, see <https://nodejs.org/>,
  '**/node_modules',
  '**/__tests__/**/__{helper,fixture}?(s)__/**/*',
  '**/test?(s)/**/{helper,fixture}?(s)/**/*',
]

/**
 * @param {string} cwd
 * @param {string[]} patterns
 */
function globFiles(cwd, patterns) {
  const files = globbySync(patterns, {
    absolute: false,
    braceExpansion: true,
    caseSensitiveMatch: false,
    cwd,
    dot: false,
    expandDirectories: true,
    extglob: true,
    followSymbolicLinks: true,
    gitignore: false,
    globstar: true,
    ignore: defaultIgnorePatterns,
    baseNameMatch: false,
    onlyFiles: true,
    stats: false,
    unique: true,
  })

  // Return absolute file paths. This has the side-effect of normalizing paths
  // on Windows.
  return files.map((file) => resolve(cwd, file))
}

/**
 * @param {string[]} extensions
 * @param {string} file
 */
function hasExtension(extensions, file) {
  return extensions.includes(extname(file).slice(1))
}

/**
 * Find files
 *
 * @param {object} options
 * @param {string} options.cwd
 * @param {string[]} options.extensions
 * @param {string[]} options.filePatterns
 */
function findFiles({ cwd, extensions, filePatterns }) {
  return globFiles(cwd, filePatterns).filter((file) =>
    hasExtension(extensions, file)
  )
}

/**
 * Find the tests files
 *
 * @param {object} options
 * @param {string} options.cwd
 * @param {string[]} options.extensions
 * @param {string[]} options.filePatterns
 */
export function findTests({ cwd, extensions, filePatterns }) {
  return findFiles({
    cwd,
    extensions,
    filePatterns,
  }).filter((file) => !basename(file).startsWith('_'))
}
