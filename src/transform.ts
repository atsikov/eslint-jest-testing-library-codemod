import { Transform } from 'jscodeshift'

import format from './format'

const transform: Transform = (fileInfo, api, options) => {
  const fixers = options.fix
  if (!fixers) {
    // eslint-disable-next-line no-console
    console.error('Fixers list should be provided with --fix argument')
    process.exit(1)
  }

  const fixersList: string[] = typeof fixers === 'object' && 'length' in fixers
    ? fixers
    : fixers.split(',')

  const transforms = fixersList.map(
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    fixerName => require(`./transforms/${fixerName.trim()}`).default,
  )

  const transformedSource = transforms.reduce((source: string, t) => {
    return t({ ...fileInfo, source }, api, options) || ''
  }, fileInfo.source)

  return format(transformedSource)
}

export const parser = 'tsx'
export default transform
