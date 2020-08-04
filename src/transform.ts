import { Transform } from 'jscodeshift'

import transformPreferScreen from './transforms/prefer-screen-queries'
import transformPreferPresenceQueries from './transforms/prefer-presence-queries'
import transformNoManualCleanup from './transforms/no-manual-cleanup'
import format from './format'

const transform: Transform = (fileInfo, api, options) => {
  const transforms = [
    transformPreferScreen,
    transformPreferPresenceQueries,
    transformNoManualCleanup,
  ]

  const transformedSource = transforms.reduce((source: string, t) => {
    return t({ ...fileInfo, source }, api, options) || ''
  }, fileInfo.source)

  return format(transformedSource)
}

export const parser = 'tsx'
export default transform
