// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore no such function in typings
import { defineSnapshotTest } from 'jscodeshift/src/testUtils'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { Transform, Options } from 'jscodeshift'

import * as transform from '../jest-prefer-screen'

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
  getInput('jest-prefer-screen/empty-destructure'),
  'Remove empty destructure',
)
snapshotTest(
  transform,
  {},
  getInput('jest-prefer-screen/non-empty-destructure'),
  'Keep non empty destructure',
)
snapshotTest(
  transform,
  {},
  getInput('jest-prefer-screen/destructure-and-unused-local-var'),
  'Remove destructure and unused local var',
)
snapshotTest(
  transform,
  {},
  getInput('jest-prefer-screen/destructure-and-unused-global-var'),
  'Remove destructure and unused global var',
)
snapshotTest(
  transform,
  {},
  getInput('jest-prefer-screen/named-destructure'),
  'Handled named destructure',
)
snapshotTest(
  transform,
  {},
  getInput('jest-prefer-screen/named-imports'),
  'Handled named imports',
)
snapshotTest(
  transform,
  {},
  getInput('jest-prefer-screen/keep-other-imports'),
  'Keep non query methods imports',
)
snapshotTest(
  transform,
  {},
  getInput('jest-prefer-screen/reuse-existing-import'),
  'Add screen to existing rtl import',
)
snapshotTest(
  transform,
  {},
  getInput('jest-prefer-screen/keep-object-props'),
  'Keep object properties with rtl query names',
)
snapshotTest(
  transform,
  {},
  getInput('jest-prefer-screen/insert-import-after-react'),
  'Add rtl import after react',
)

// within
snapshotTest(
  transform,
  {},
  getInput('jest-prefer-screen/query-within'),
  'Transform query with more than one parameter to within',
)
snapshotTest(
  transform,
  {},
  getInput('jest-prefer-screen/screen-and-within'),
  'Add both screen and within if needed',
)

// memberExpressions: true
snapshotTest(
  transform,
  { memberExpressions: true },
  getInput('jest-prefer-screen/replace-member-expressions'),
  'Replace render result value usages',
)
snapshotTest(
  transform,
  { memberExpressions: true },
  getInput('jest-prefer-screen/keep-referenced-vars'),
  'Keep render result var if other props than queries used',
)
snapshotTest(
  transform,
  { memberExpressions: true },
  getInput('jest-prefer-screen/respect-shadowed-vars'),
  'Keep shadowed variables',
)
