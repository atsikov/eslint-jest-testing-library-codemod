import { Transform } from 'jscodeshift'

import transformPreferScreen from './jest-prefer-screen'
import transformPreferPresenceQueries from './jest-prefer-presence-queries'
import transformNoManualCleanup from './jest-no-manual-cleanup'
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
