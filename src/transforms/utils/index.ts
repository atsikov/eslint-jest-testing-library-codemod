import {
  ASTPath,
  BlockStatement,
  Identifier,
  JSCodeshift,
  Node,
  Program,
  VariableDeclarator,
  ObjectPattern,
  FunctionDeclaration,
  Collection,
  AssignmentExpression,
  ImportDeclaration,
  TSTypeReference,
  ImportSpecifier,
} from 'jscodeshift'

export function getParentScopePath(
  j: JSCodeshift,
  path: ASTPath,
): ASTPath<BlockStatement> | ASTPath<Program> {
  const isGlobalScope = path.scope.isGlobal
  const scopeType = isGlobalScope ? j.Program : j.BlockStatement

  let scopePath = path.parentPath
  while (scopePath) {
    if (j(scopePath).isOfType(scopeType)) {
      return scopePath.parentPath
    }

    scopePath = scopePath.parentPath
  }

  return scopePath.parentPath
}

export function isScopeType(
  j: JSCodeshift,
  path: ASTPath,
): path is ASTPath<Program> | ASTPath<BlockStatement> {
  return j(path).isOfType(j.Program) || j(path).isOfType(j.BlockStatement)
}

export function getDeclarationScopePath(
  j: JSCodeshift,
  path: ASTPath,
  name: string,
): ASTPath<BlockStatement> | ASTPath<Program> {
  let scopePath = path
  while (scopePath) {
    if (isScopeType(j, scopePath) && findDeclarationInScope(j, scopePath, name)) {
      return scopePath
    }
    scopePath = scopePath.parentPath
  }

  return scopePath
}

export function getIdentifierDeclaration(
  j: JSCodeshift,
  path: ASTPath<Identifier>,
): ASTPath | null {
  const idName = path.value.name

  let scopePath = path
  while (scopePath) {
    const declaration = isScopeType(j, scopePath)
      && findDeclarationInScope(j, scopePath, idName)
    if (declaration) {
      return declaration
    }
    scopePath = scopePath.parentPath
  }

  return scopePath
}

type DeclarationPath =
  | ASTPath<VariableDeclarator>
  | ASTPath<ObjectPattern>
  | ASTPath<FunctionDeclaration>

export function findDeclarationInScope(
  j: JSCodeshift,
  scope: ASTPath<BlockStatement> | ASTPath<Program>,
  declarationName: string,
): DeclarationPath | null {
  const identifierFilter = {
    type: 'Identifier',
    name: declarationName,
  }

  const variableDeclarator = j(scope)
    .find(
      j.VariableDeclarator,
      {
        id: identifierFilter,
      },
    )

  const objectPattern = j(scope)
    .find(j.ObjectPattern)
    .find(
      j.ObjectProperty,
      {
        value: identifierFilter,
      },
    )

  const funcitonDeclaration = j(scope)
    .find(
      j.FunctionDeclaration,
      {
        id: identifierFilter,
      },
    )

  const importDeclaration = j(scope)
    .find(
      j.ImportSpecifier,
      {
        local: identifierFilter,
      },
    )

  const suitableCollection = [
    variableDeclarator,
    objectPattern,
    funcitonDeclaration,
    importDeclaration,
  ]
    .find(collection => collection.size() > 0) ?? null

  return (suitableCollection as Collection)
      ?.filter(path => getParentScopePath(j, path) === scope)
      .paths()[0] ?? null

}

export function replaceMethodNames(
  j: JSCodeshift,
  root: ASTPath,
  replaceFrom: string,
  replaceWith: Node,
): boolean {
  return !!j(root)
    .find(j.Identifier, { name: replaceFrom })
    // Avoid replacing shadowed identifiers
    .filter(path => root === getDeclarationScopePath(j, path, path.value.name))
    .filter(path => j(path.parentPath).isOfType(j.CallExpression))
    .replaceWith(() => replaceWith)
    .size()
}

export function isVariableReferenced(
  j: JSCodeshift,
  root: ASTPath,
  name: string,
): boolean {
  return !!j(root)
    .find(j.Identifier, { name })
    // Avoid replacing shadowed identifiers
    .filter(path => root === getDeclarationScopePath(j, path, path.value.name))
    // Filter out variable declaration
    .filter(path => !(
      j(path.parentPath.value).isOfType(j.AssignmentExpression)
      && ((path.parentPath.value as AssignmentExpression).left === path.value)
    ))
    .filter(path => !(
      j(path.parentPath).isOfType(j.VariableDeclarator)
      && j(path.parentPath.value.id).isOfType(j.Identifier)
      && path.parentPath.value.id.name === name
    ))
    .size()
}

export function removeUnusedIdentifierDeclaration(
  j: JSCodeshift,
  root: ASTPath,
  name: string,
): void {
  // Find declaration and remove if it is not referenced
  const declarationScopePath = getDeclarationScopePath(j, root, name)
  const hasReferences = isVariableReferenced(j, declarationScopePath, name)
  if (!hasReferences) {
    const declarationPath = findDeclarationInScope(j, declarationScopePath, name)
    if (declarationPath && j(declarationPath).isOfType(j.VariableDeclarator)) {
      const { init, id } = declarationPath.value as VariableDeclarator
      let identifierTypeName: string | undefined
      if (j(id).isOfType(Identifier)) {
        const typeAnnotation = (id as Identifier).typeAnnotation

        if (
          typeAnnotation
          && j(typeAnnotation.typeAnnotation).isOfType(TSTypeReference)
          && j((typeAnnotation.typeAnnotation as TSTypeReference).typeName).isOfType(Identifier)
        ) {
          identifierTypeName =
            ((typeAnnotation.typeAnnotation as TSTypeReference).typeName as Identifier).name
        }
      }
      if (init) {
        j(declarationPath.parentPath.parentPath).replaceWith(
          j.expressionStatement(init),
        )
      } else {
        // Variable declaration with no assignment
        j(declarationPath.parentPath.parentPath).remove()
      }

      if (identifierTypeName) {
        // Check if type can be removed from import
        let parentPath = root
        while (!j(parentPath).isOfType(Program)) {
          parentPath = parentPath.parentPath
        }

        if (parentPath) {
          removeUnusedImport(j, parentPath as ASTPath<Program>, identifierTypeName)
        }
      }
    }

    // Assignments to removed variable could still be left
    j(declarationScopePath)
      .find(
        j.AssignmentExpression,
        {
          left: {
            type: 'Identifier',
            name: name,
          },
        })
      .filter(assignmentPath =>
        (assignmentPath.value.left as Identifier).name === name,
      )
      .filter(assignmentPath => !getDeclarationScopePath(j, assignmentPath, name))
      .forEach(assignmentPath => j(assignmentPath).replaceWith(
        j.expressionStatement(assignmentPath.value.right)),
      )
  }
}

export function removeUnusedImport(j: JSCodeshift, root: ASTPath<Program>, name: string): void {
  const hasReferences = !!j(root)
    .find(j.Identifier, { name })
    .filter(path => !j(path.parentPath).isOfType(j.ImportSpecifier))
    .size()

  if (!hasReferences) {
    j(root)
      .find(
        j.ImportSpecifier,
        {
          local: {
            type: 'Identifier',
            name,
          },
        },
      )
      .forEach(path => {
        const importDeclaration = path.parentPath.parentPath
        j(path).remove()

        if (!(importDeclaration.value as ImportDeclaration).specifiers.length) {
          j(importDeclaration).remove()
        }
      })
  }
}

export function insertImport(
  j: JSCodeshift,
  root: Collection,
  moduleName: string,
  importedName: string,
  afterModuleName?: string,
): void {
  // Add imported to existing module
  const existingImportPath = root
    .find(
      j.ImportDeclaration,
      {
        source: {
          type: 'StringLiteral',
          value: moduleName,
        },
      },
    )
    .filter(path => path.value.specifiers.every(
      specifier => j(specifier).isOfType(j.ImportSpecifier)
        && (specifier as ImportSpecifier).imported.name !== importedName,
    ))
    .forEach(path => path.value.specifiers.push(
      j.importSpecifier(j.identifier(importedName)),
    ))

  if (!existingImportPath.size()) {
    // Module import was not found, need to add new import
    const addedImportDeclaration = j.importDeclaration(
      [j.importSpecifier(j.identifier(importedName))],
      j.stringLiteral(moduleName),
    )

    const hasAddAfterImport = root
      .find(
        j.ImportDeclaration,
        {
          source: {
            type: 'StringLiteral',
            value: afterModuleName,
          },
        },
      )
      .insertAfter(addedImportDeclaration)

    // Cannot add after desired import, adding as a first line
    if (!hasAddAfterImport.size()) {
      root
        .find(j.Program)
        .forEach(path => path.value.body.unshift(addedImportDeclaration))
    }
  }
}

export function hasImport(
  j: JSCodeshift,
  root: Collection,
  moduleNamePrefix: string,
  importedName: string,
): boolean {
  return !!root
    .find(j.ImportDeclaration)
    .filter(path => !!path.value.source.value?.toString().startsWith(moduleNamePrefix))
    .find(
      j.ImportSpecifier,
      {
        imported: {
          type: 'Identifier',
          name: importedName,
        },
      },
    )
    .size()
}
