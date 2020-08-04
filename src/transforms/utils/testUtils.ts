// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore no such function in typings
import { applyTransform } from 'jscodeshift/dist/testUtils'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { Transform, Options, FileInfo } from 'jscodeshift'
import { format } from 'prettier'

export const snapshotTest = (
  module: { default: Transform, parser?: string },
  options: Options,
  inputFileName: string,
  testName?: string,
): void => {
  it(testName || 'transforms correctly', () => {
    const transformed = applyTransform(module, options, getInput(inputFileName))
    const formatted = format(transformed, {
      parser: 'typescript',
      singleQuote: true,
      semi: false,
      trailingComma: 'all',
      printWidth: 90,
      arrowParens: 'avoid',
    })
    expect(formatted).toMatchSnapshot()
  })
}

function getInput(moduleName: string): FileInfo {
  const MODULE_EXTS = ['ts', 'tsx']
  const paths = MODULE_EXTS.map(ext =>
    resolve(__dirname, `../__testfixtures__/${moduleName}.input.${ext}`),
  )
  const fixturePath = paths.find(path => existsSync(path))
  if (!fixturePath) {
    throw new Error(`Unable to find fixture ${moduleName}`)
  }

  return {
    path: fixturePath,
    source: readFileSync(fixturePath).toString(),
  }
}
