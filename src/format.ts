import prettier from 'prettier'

function format(source: string): string {
  return prettier.format(source, {
    parser: 'typescript',
    singleQuote: true,
    semi: false,
    trailingComma: 'all',
    printWidth: 90,
    arrowParens: 'avoid',
  })
}

export default format
