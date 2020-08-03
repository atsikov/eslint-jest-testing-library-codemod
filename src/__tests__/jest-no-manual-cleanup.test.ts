// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore no such function in typings
import { defineSnapshotTest } from 'jscodeshift/src/testUtils'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { Transform, Options } from 'jscodeshift'

import * as transform from '../jest-no-manual-cleanup'

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
  getInput('jest-no-manual-cleanup/cleanup-as-argument'),
  "Remove lifecycle method call if 'cleanup' is used as argument",
)
snapshotTest(
  transform,
  {},
  getInput('jest-no-manual-cleanup/keep-lifecycle-method'),
  "Keep lifecycle method call if 'cleanup' not the only call",
)
snapshotTest(
  transform,
  {},
  getInput('jest-no-manual-cleanup/remove-cleanup-call'),
  "Remove 'cleanup' call in non-lifecycle method",
)
snapshotTest(
  transform,
  {},
  getInput('jest-no-manual-cleanup/remove-lifecycle-method'),
  "Remove lifecycle method call if 'cleanup' is the only call in callback",
)
