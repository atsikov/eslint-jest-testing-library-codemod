import * as transform from '../prefer-presence-queries'
import { snapshotTest } from '../utils/testUtils'

snapshotTest(
  transform,
  {},
  'jest-prefer-presence-queries/truthy-queries',
  'Use getBy in truthy queries',
)
snapshotTest(
  transform,
  {},
  'jest-prefer-presence-queries/falsy-queries',
  'Use queryBy in falsy queries',
)
