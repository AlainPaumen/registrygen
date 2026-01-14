import * as ts from "typescript";
import { findRootDirectory } from "./findRootDirectory.js";
import { getRegistryDependency } from "./getRegistryDependecy.js";
import { getModuleSpecifier } from "./handleFileContent.js";
import { mapToRootPath, resolvePathMapping } from "./util.js";

export function getImportsArray(filePath: string, fileContent: string, dependenciesArray: string[], knownRegistries: Record<string, string>, pathMappings: Record<string, string>[]) {
    const source = ts.createSourceFile(filePath, fileContent, ts.ScriptTarget.Latest, true);
    const imports: { statement: string; moduleSpecifier: string; dependencies: string | null }[] = [];

    source.forEachChild((node) => {
        if (ts.isImportDeclaration(node) || ts.isImportEqualsDeclaration(node)) {
            let moduleSpecifier = getModuleSpecifier(node);

            if (!moduleSpecifier) {
                return;
            }
            // get rid of ./ and ../
            moduleSpecifier = findRootDirectory(mapToRootPath(moduleSpecifier, filePath));
            const resolvedPath = resolvePathMapping(moduleSpecifier, pathMappings);

            const importData = {
                statement: node.getText(source).trim(),
                moduleSpecifier,
                resolvedPath,
                dependencies: dependenciesArray.includes(moduleSpecifier) ? moduleSpecifier : null,
                registryDependencies: getRegistryDependency(resolvedPath, knownRegistries)
            };



            imports.push(importData);
        }
    })

    return imports;
}

