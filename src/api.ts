export type Assert = typeof import('./assert.js')

export type Test = (ass: Assert) => unknown
export type Suite = { [name: string]: Test | Suite }
