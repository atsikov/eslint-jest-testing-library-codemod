import {
  Identifier,
  Transform,
  JSCodeshift,
  MemberExpression,
  ImportDeclaration,
  Options,
} from 'jscodeshift'
import prettier from 'prettier'
import {
  getParentScopePath,
  replaceMethodNames,
  getDeclarationScopePath,
  removeUnusedIdentifierDeclaration,
} from './utils'
import { insertImport, hasImport } from './helpers'

export interface TransformOptions extends Options {
  memberExpressions?: boolean | string
}

const RTL_VARIANTS = [
  'getBy',
  'getAllBy',
  'queryBy',
  'queryAllBy',
  'findBy',
  'findAllBy',
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

const SCREEN_OBJECT_NAME = 'screen'
const WITHIN_METHOD_NAME = 'within'
const RTL_MODULES_PREFIX = '@testing-library/'
const RTL_SOURCE_MODULE = `${RTL_MODULES_PREFIX}react`
const APPEND_RTL_IMPORT_AFTER_MODULE = 'react'

export const RTL_QUERY_METHODS = RTL_VARIANTS.reduce(
  (methods, variant) => {
    RTL_QUERIES.forEach(query => methods.push(`${variant}${query}`))
    return methods
  },
  [] as string[],
)

const getScreenMemberExpression = (j: JSCodeshift, propName: string): MemberExpression =>
  j.memberExpression(
    j.identifier(SCREEN_OBJECT_NAME),
    j.identifier(propName),
  )

const transform: Transform = (fileInfo, api, options: TransformOptions) => {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  let hasScreenTransformations = false
  let hasWithinTransformation = false

  // Find all destructured properties with rtl query method names
  root
    .find(
      j.VariableDeclarator,
      {
        id: {
          type: 'ObjectPattern',
        },
      })
    .forEach(path => {
      let replacedNames = false
      j(path)
        .find(j.ObjectProperty)
        .filter(opPath => j(opPath.value.key).isOfType(j.Identifier))
        .filter(opPath => RTL_QUERY_METHODS.includes(
          (opPath.value.key as Identifier).name),
        )
        .forEach(opPath => {
          const propName = (opPath.value.key as Identifier).name
          const localName = (opPath.value.value as Identifier).name
          // Replace with screen.<method> call
          replacedNames = replaceMethodNames(
            j,
            getParentScopePath(j, opPath),
            localName,
            getScreenMemberExpression(j, propName),
          )
        })
        .forEach(opPath => j(opPath).remove())

      hasScreenTransformations = hasScreenTransformations || replacedNames
    })

  if (hasScreenTransformations) {
    // Cleanup empty destructure assignments and unused variables
    root
      .find(
        j.VariableDeclarator,
        {
          id: {
            type: 'ObjectPattern',
          },
        })
      .forEach(path => {
        // Remove empty destructures
        if (!j(path.value.id).find(j.ObjectProperty).size()) {
          const { init } = path.value
          if (init) {
            // Replace with right assignmnet part
            const replaced = j(path.parentPath.parentPath).replaceWith(
              j.expressionStatement(init),
            ).paths()[0]

            if (j(replaced.value.expression).isOfType(j.Identifier)) {
              // render() result was assigned to identifier
              // Remove identifier declaration if it is not used
              const parentPath = replaced.parentPath
              const idName = (replaced.value.expression as Identifier).name

              j(replaced).remove()
              removeUnusedIdentifierDeclaration(j, parentPath, idName)
            }
          }
        }
      })
  }

  if (options.memberExpressions === true || options.memberExpressions === 'true') {
    // Find all rtl queries, called from render result
    // Example:
    // const result = render();
    // expect(render.getByText('text')).toBeInTheDocument()
    root
      .find(
        j.CallExpression,
        {
          callee: {
            type: 'MemberExpression',
            object: {
              type: 'Identifier',
            },
            property: {
              type: 'Identifier',
            },
          },
        },
      )
      .filter(path => RTL_QUERY_METHODS.includes(
        ((path.value.callee as MemberExpression).property as Identifier).name,
      ))
      .forEach(path => {
        const objectName = ((path.value.callee as MemberExpression).object as Identifier).name
        const objectScope = getDeclarationScopePath(j, path, objectName)
        if (objectScope) {
          // Replace all references with screen
          j(objectScope)
            .find(
              j.CallExpression,
              {
                callee: {
                  type: 'MemberExpression',
                  object: {
                    name: objectName,
                    type: 'Identifier',
                  },
                },
              },
            )
            .filter(referencePath =>
              getDeclarationScopePath(j, referencePath, objectName) === objectScope,
            )
            .forEach(referencePath => {
              const propName =
                ((referencePath.value.callee as MemberExpression).property as Identifier).name
              j(referencePath).replaceWith(
                j.callExpression(
                  j.memberExpression(j.identifier(SCREEN_OBJECT_NAME), j.identifier(propName)),
                  referencePath.value.arguments,
                ),
              )

              hasScreenTransformations = true
            })

          // Remove declaration
          removeUnusedIdentifierDeclaration(j, path, objectName)
        }
      })
  }

  // Find and replace rtl query named imports
  root
    .find(j.ImportSpecifier)
    .filter(path => j(path.parentPath.parentPath.value).isOfType(j.ImportDeclaration))
    .filter(path => !!(path.parentPath.parentPath.value as ImportDeclaration)
      .source
      .value
      ?.toString()
      .startsWith(RTL_MODULES_PREFIX),
    )
    .filter(path => RTL_QUERY_METHODS.includes(path.value.imported.name))
    .forEach(path => {
      const importedName = path.value.imported.name
      const localName = path.value.local?.name ?? importedName

      const transformedNodes = root
        .find(j.Identifier, { name: localName })
        .filter(idPath => {
          return j(getDeclarationScopePath(j, idPath, localName)).isOfType(j.Program)
        })
        .filter(idPath => j(idPath.parentPath).isOfType(j.CallExpression))
        .forEach(idPath => j(idPath).replaceWith(getScreenMemberExpression(j, importedName)))

      hasScreenTransformations = hasScreenTransformations || !!transformedNodes.size()

      j(path).remove()
    })

  if (hasScreenTransformations) {
    // Remove empty imports
    root
      .find(j.ImportDeclaration)
      .filter(path => !!path.value.source.value?.toString().startsWith(RTL_MODULES_PREFIX))
      .filter(path => !path.value.specifiers.length)
      .forEach(path => j(path).remove())
  }

  // Check screen.* methods parameters
  root
    .find(
      j.CallExpression,
      {
        callee: {
          type: 'MemberExpression',
          object: {
            type: 'Identifier',
            name: SCREEN_OBJECT_NAME,
          },
          property: {
            type: 'Identifier',
          },
        },
      },
    )
    .filter(path => RTL_QUERY_METHODS.includes(
      ((path.value.callee as MemberExpression).property as Identifier).name,
    ))
    .filter(path => path.value.arguments.length === 2)
    .filter(path => {
      // Some screen.* methods accepts more than one argument
      // but these are objects or undefined
      const secondArgument = path.value.arguments[1]
      return j(secondArgument).isOfType(j.StringLiteral)
        || j(secondArgument).isOfType(j.RegExpLiteral)
    })
    .forEach(path => {
      const methodName = ((path.value.callee as MemberExpression).property as Identifier).name
      const args = path.value.arguments
      j(path).replaceWith(
        j.callExpression(
          j.memberExpression(
            j.callExpression(j.identifier(WITHIN_METHOD_NAME), [args[0]]),
            j.identifier(methodName),
          ),
          args.slice(1),
        ),
      )
      hasWithinTransformation = true
    })

  // Check if file still has screen usages (all could be replaced with within())
  const hasScreenReferences = !!root
    .find(
      j.CallExpression,
      {
        callee: {
          type: 'MemberExpression',
          object: {
            type: 'Identifier',
            name: SCREEN_OBJECT_NAME,
          },
          property: {
            type: 'Identifier',
          },
        },
      },
    )
    .filter(path => RTL_QUERY_METHODS.includes(
      ((path.value.callee as MemberExpression).property as Identifier).name,
    ))
    .size()

  const needScreenImport = hasScreenTransformations
    && hasScreenReferences
    && !hasImport(j, root, RTL_MODULES_PREFIX, SCREEN_OBJECT_NAME)
  const needWithinImport = hasWithinTransformation
    && !hasImport(j, root, RTL_MODULES_PREFIX, WITHIN_METHOD_NAME)

  if (needScreenImport) {
    insertImport(j, root, RTL_SOURCE_MODULE, SCREEN_OBJECT_NAME, APPEND_RTL_IMPORT_AFTER_MODULE)
  }

  if (needWithinImport) {
    insertImport(j, root, RTL_SOURCE_MODULE, WITHIN_METHOD_NAME, APPEND_RTL_IMPORT_AFTER_MODULE)
  }

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
