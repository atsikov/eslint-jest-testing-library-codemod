import { JSCodeshift, Collection, ImportSpecifier } from 'jscodeshift'

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