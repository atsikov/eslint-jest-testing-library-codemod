// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore no such function in typings
import { defineSnapshotTest } from 'jscodeshift/src/testUtils'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { Transform, Options } from 'jscodeshift'

import * as transform from '../jest-prefer-presence-queries'

const snapshotTest: (
  module: { default: Transform, parser?: string },
  options: Options,
  inputSource: string,
  testName?: string
  ) => unknown = defineSnapshotTest

function getInput(moduleName: string) {
  const MODULE_EXTS = ['ts', 'tsx']
  const paths = MODULE_EXTS.map(ext =>
    resolve(__dirname, `../__testfixtures__/${moduleName}.input.${ext}`),
  )
  const fixturePath = paths.find(path => existsSync(path))
  if (!fixturePath) {
    throw new Error(`Unable to find fixture ${moduleName}`)
  }

  return readFileSync(fixturePath).toString()
}

snapshotTest(
  transform,
  {},
  getInput('jest-prefer-presence-queries/truthy-queries'),
  'Use getBy in truthy queries',
)
snapshotTest(
  transform,
  {},
  getInput('jest-prefer-presence-queries/falsy-queries'),
  'Use queryBy in falsy queries',
)
