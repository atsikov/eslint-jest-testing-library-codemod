// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore no such function in typings
import { defineSnapshotTest } from 'jscodeshift/src/testUtils'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { Transform, Options } from 'jscodeshift'

import * as transform from '../jest-prefer-screen-queries'

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
  getInput('jest-prefer-screen-queries/empty-destructure'),
  'Remove empty destructure',
)
snapshotTest(
  transform,
  {},
  getInput('jest-prefer-screen-queries/non-empty-destructure'),
  'Keep non empty destructure',
)
snapshotTest(
  transform,
  {},
  getInput('jest-prefer-screen-queries/destructure-and-unused-local-var'),
  'Remove destructure and unused local var',
)
snapshotTest(
  transform,
  {},
  getInput('jest-prefer-screen-queries/destructure-and-unused-global-var'),
  'Remove destructure and unused global var',
)
snapshotTest(
  transform,
  {},
  getInput('jest-prefer-screen-queries/named-destructure'),
  'Handled named destructure',
)
snapshotTest(
  transform,
  {},
  getInput('jest-prefer-screen-queries/named-imports'),
  'Handled named imports',
)
snapshotTest(
  transform,
  {},
  getInput('jest-prefer-screen-queries/keep-other-imports'),
  'Keep non query methods imports',
)
snapshotTest(
  transform,
  {},
  getInput('jest-prefer-screen-queries/reuse-existing-import'),
  'Add screen to existing rtl import',
)
snapshotTest(
  transform,
  {},
  getInput('jest-prefer-screen-queries/keep-object-props'),
  'Keep object properties with rtl query names',
)
snapshotTest(
  transform,
  {},
  getInput('jest-prefer-screen-queries/insert-import-after-react'),
  'Add rtl import after react',
)

// within
snapshotTest(
  transform,
  {},
  getInput('jest-prefer-screen-queries/query-within'),
  'Transform query with more than one parameter to within',
)
snapshotTest(
  transform,
  {},
  getInput('jest-prefer-screen-queries/screen-and-within'),
  'Add both screen and within if needed',
)
snapshotTest(
  transform,
  { memberExpressions: true },
  getInput('jest-prefer-screen-queries/keep-query-options'),
  'Keep multiple parameters if second is not string or regexp',
)


// memberExpressions: true
snapshotTest(
  transform,
  { memberExpressions: true },
  getInput('jest-prefer-screen-queries/replace-member-expressions'),
  'Replace render result value usages',
)
snapshotTest(
  transform,
  { memberExpressions: true },
  getInput('jest-prefer-screen-queries/keep-referenced-vars'),
  'Keep render result var if other props than queries used',
)
snapshotTest(
  transform,
  { memberExpressions: true },
  getInput('jest-prefer-screen-queries/respect-shadowed-vars'),
  'Keep shadowed variables',
)
