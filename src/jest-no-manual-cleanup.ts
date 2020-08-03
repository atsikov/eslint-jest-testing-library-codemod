import {
  Identifier,
  Transform,
  CallExpression,
} from 'jscodeshift'
import { getDeclarationScopePath, getParentScopePath, removeUnusedImport } from './utils'
import { hasImport } from './helpers'

const RTL_MODULES_PREFIX = '@testing-library/'
const CLEANUP_FUNCTION = 'cleanup'
const JEST_LIFECYCLE_METHODS = [
  'beforeEach',
  'beforeAll',
  'afterEach',
  'afterAll',
]

const transform: Transform = (fileInfo, api) => {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  if (hasImport(j, root, RTL_MODULES_PREFIX, CLEANUP_FUNCTION)) {
    root
      .find(
        j.Identifier,
        {
          name: CLEANUP_FUNCTION,
        },
      )
      .filter(path => {
        const declarationScopePath = getDeclarationScopePath(j, path, CLEANUP_FUNCTION)
        return j(declarationScopePath).isOfType(j.Program)
      })
      .forEach(path => {
        // 'cleanup()' could be called
        if (
          j(path.parentPath).isOfType(j.CallExpression)
          && (path.parentPath.value as CallExpression).callee === path.value
        ) {
          const cleanupCall = path.parentPath as CallExpression
          const parentScope = getParentScopePath(j, path)

          j(cleanupCall).remove()

          // 'cleanup()' is the only call in the scope, and was called from jest lifecycle method
          if (!parentScope.value.body.length) {
            const parentScopeFunction = parentScope.parentPath
            if (
              j(parentScopeFunction).isOfType(j.ArrowFunctionExpression)
              || j(parentScopeFunction).isOfType(j.FunctionExpression)
            ) {
              // Check if function is a jest lyfecycle method callback
              const parentCallExpression = parentScopeFunction.parentPath.parentPath
              if (
                j(parentCallExpression).isOfType(j.CallExpression)
                && j((parentCallExpression.value as CallExpression).callee).isOfType(j.Identifier)
                && JEST_LIFECYCLE_METHODS.includes(
                  ((parentCallExpression.value as CallExpression).callee as Identifier).name,
                )
              ) {
                j(parentCallExpression).remove()
              }
            }
          }
        }
      })
      .forEach(path => {
        // 'cleanup' could be passed directly to jest lifecycle method as an argument
        const parent = path.parentPath.parentPath
        if (
          j(parent).isOfType(j.CallExpression)
          && (parent.value as CallExpression).arguments.length === 1
          && (parent.value as CallExpression).arguments[0] === path.value
          && j((parent.value as CallExpression).callee).isOfType(j.Identifier)
          && JEST_LIFECYCLE_METHODS.includes(
            ((parent.value as CallExpression).callee as Identifier).name,
          )
        ) {
          j(parent).remove()
        }

      })

    removeUnusedImport(j, root.paths()[0], CLEANUP_FUNCTION)
  }

  return root.toSource()
}

export const parser = 'tsx'
export default transform
