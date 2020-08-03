import {
  Identifier,
  Transform,
  JSCodeshift,
  MemberExpression,
  CallExpression,
} from 'jscodeshift'
import prettier from 'prettier'

const JEST_TRUTHY_ASSERTIONS = [
  '.not.toBeNull',
  '.toBeTruthy',
  '.not.toBeFalsy',
  '.toBeInTheDocument',
  '.toBeDefined',
]

const JEST_FALSY_ASSERTIONS = [
  '.toBeNull',
  '.not.toBeTruthy',
  '.toBeFalsy',
  '.not.toBeInTheDocument',
  '.not.toBeDefined',
]

const RTL_QUERIES = [
  'LabelText',
  'PlaceholderText',
  'Text',
  'AltText',
  'Title',
  'DisplayValue',
  'Role',
  'TestId',
]

const RTL_TRUTHY_QUERY_PREFIX = 'getBy'
const RTL_FALSY_QUERY_PREFIX = 'queryBy'

const RTL_QUERY_METHODS = [
  ...RTL_QUERIES.map(query => `${RTL_TRUTHY_QUERY_PREFIX}${query}`),
  ...RTL_QUERIES.map(query => `${RTL_FALSY_QUERY_PREFIX}${query}`),
]

const EXPECT_FUNCTION = 'expect'

function getCalleeName(j: JSCodeshift, node: CallExpression): string | null {
  let nameNode = node.callee
  while (nameNode && nameNode.type != 'Identifier') {
    if (nameNode.type === 'MemberExpression') {
      nameNode = (nameNode as MemberExpression).property
    } else {
      return null
    }
  }

  if (
    nameNode
    && nameNode.type === 'Identifier'
  ) {
    return nameNode.name
  }

  return null
}

const transform: Transform = (fileInfo, api) => {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  root
    .find(
      j.MemberExpression,
      {
        object: {
          type: 'CallExpression',
          callee: {
            type: 'Identifier',
            name: EXPECT_FUNCTION,
          },
        },
      },
    )
    .filter(path => (path.value.object as CallExpression).arguments.length === 1)
    .filter(path => {
      const { arguments: args } = path.value.object as CallExpression
      const firstArgument = args[0]
      // Callee could be an Identifier 'expect(getByText(...))' or member expression
      // 'expect(screen.getByText(...))'
      const calleeName = j(firstArgument).isOfType(j.CallExpression)
        && getCalleeName(j, firstArgument as CallExpression)
      return !!calleeName && RTL_QUERY_METHODS.includes(calleeName)
    })
    .forEach(path => {
      let jestAssertionName = `.${(path.value.property as Identifier).name}`
      let parentPath = path.parentPath
      while (
        j(parentPath).isOfType(j.MemberExpression)
        && j(parentPath.value.property).isOfType(j.Identifier)
      ) {
        const name = ((parentPath.value as MemberExpression).property as Identifier).name
        jestAssertionName += `.${name}`
        parentPath = parentPath.parentPath
      }

      const firstArgument = (path.value.object as CallExpression).arguments[0]
      const calleeName = j(firstArgument).isOfType(j.CallExpression)
        && getCalleeName(j, firstArgument as CallExpression)

      const calleeIdentifierPath = j(
        (path.value.object as CallExpression).arguments,
      )
        .find(
          j.Identifier,
          {
            name: calleeName,
          },
        )


      if (
        calleeName
        && calleeName.startsWith(RTL_TRUTHY_QUERY_PREFIX)
        && JEST_FALSY_ASSERTIONS.includes(jestAssertionName)
      ) {
        calleeIdentifierPath
          .replaceWith(
            j.identifier(
              `${RTL_FALSY_QUERY_PREFIX}${calleeName.slice(RTL_TRUTHY_QUERY_PREFIX.length)}`,
            ),
          )
      }

      if (
        calleeName
        && calleeName.startsWith(RTL_FALSY_QUERY_PREFIX)
        && JEST_TRUTHY_ASSERTIONS.includes(jestAssertionName)
      ) {
        calleeIdentifierPath
          .replaceWith(
            j.identifier(
              `${RTL_TRUTHY_QUERY_PREFIX}${calleeName.slice(RTL_FALSY_QUERY_PREFIX.length)}`,
            ),
          )
      }
    })

  return prettier.format(root.toSource(), {
    parser: 'typescript',
    singleQuote: true,
    semi: false,
    trailingComma: 'all',
    printWidth: 90,
    arrowParens: 'avoid',
  })
}

export const parser = 'tsx'
export default transform
