import * as transform from '../jest-prefer-screen-queries'
import { snapshotTest } from '../testUtils'

snapshotTest(
  transform,
  {},
  'jest-prefer-screen-queries/empty-destructure',
  'Remove empty destructure',
)
snapshotTest(
  transform,
  {},
  'jest-prefer-screen-queries/non-empty-destructure',
  'Keep non empty destructure',
)
snapshotTest(
  transform,
  {},
  'jest-prefer-screen-queries/destructure-and-unused-local-var',
  'Remove destructure and unused local var',
)
snapshotTest(
  transform,
  {},
  'jest-prefer-screen-queries/destructure-and-unused-global-var',
  'Remove destructure and unused global var',
)
snapshotTest(
  transform,
  {},
  'jest-prefer-screen-queries/named-destructure',
  'Handled named destructure',
)
snapshotTest(
  transform,
  {},
  'jest-prefer-screen-queries/named-imports',
  'Handled named imports',
)
snapshotTest(
  transform,
  {},
  'jest-prefer-screen-queries/keep-other-imports',
  'Keep non query methods imports',
)
snapshotTest(
  transform,
  {},
  'jest-prefer-screen-queries/reuse-existing-import',
  'Add screen to existing rtl import',
)
snapshotTest(
  transform,
  {},
  'jest-prefer-screen-queries/keep-object-props',
  'Keep object properties with rtl query names',
)
snapshotTest(
  transform,
  {},
  'jest-prefer-screen-queries/insert-import-after-react',
  'Add rtl import after react',
)

// within
snapshotTest(
  transform,
  {},
  'jest-prefer-screen-queries/query-within',
  'Transform query with more than one parameter to within',
)
snapshotTest(
  transform,
  {},
  'jest-prefer-screen-queries/screen-and-within',
  'Add both screen and within if needed',
)
snapshotTest(
  transform,
  { memberExpressions: true },
  'jest-prefer-screen-queries/keep-query-options',
  'Keep multiple parameters if second is not string or regexp',
)


// memberExpressions: true
snapshotTest(
  transform,
  { memberExpressions: true },
  'jest-prefer-screen-queries/replace-member-expressions',
  'Replace render result value usages',
)
snapshotTest(
  transform,
  { memberExpressions: true },
  'jest-prefer-screen-queries/keep-referenced-vars',
  'Keep render result var if other props than queries used',
)
snapshotTest(
  transform,
  { memberExpressions: true },
  'jest-prefer-screen-queries/respect-shadowed-vars',
  'Keep shadowed variables',
)
