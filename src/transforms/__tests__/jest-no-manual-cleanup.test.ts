import * as transform from '../no-manual-cleanup'
import { snapshotTest } from '../utils/testUtils'

snapshotTest(
  transform,
  {},
  'jest-no-manual-cleanup/cleanup-as-argument',
  "Remove lifecycle method call if 'cleanup' is used as argument",
)
snapshotTest(
  transform,
  {},
  'jest-no-manual-cleanup/keep-lifecycle-method',
  "Keep lifecycle method call if 'cleanup' not the only call",
)
snapshotTest(
  transform,
  {},
  'jest-no-manual-cleanup/remove-cleanup-call',
  "Remove 'cleanup' call in non-lifecycle method",
)
snapshotTest(
  transform,
  {},
  'jest-no-manual-cleanup/remove-lifecycle-method',
  "Remove lifecycle method call if 'cleanup' is the only call in callback",
)
