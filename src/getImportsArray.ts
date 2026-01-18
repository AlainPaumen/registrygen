import * as ts from "typescript";
import { findRootDirectory } from "./findRootDirectory.js";
import { getRegistryDependency } from "./getRegistryDependecy.js";
import { getModuleSpecifier } from "./handleFileContent.js";
import type { FileEntry } from "./scanDirectory.types.js";
import { mapToRootPath, resolvePathMapping } from "./util.js";

export type ImportInfo = {
    statement: string;
    moduleSpecifier: string;
    dependencies: string | null;
    registryDependencies: string | null;
    resolvedPath: string;
    files: string[] | null;
};

export function getImportsArray(filePath: string, fileContent: string, fileInfo: FileEntry[], dependenciesArray: string[], knownRegistries: Record<string, string>, pathMappings: Record<string, string>[]): ImportInfo[] {
    const source = ts.createSourceFile(filePath, fileContent, ts.ScriptTarget.Latest, true);
    const imports: ImportInfo[] = [];

    source.forEachChild((node) => {
        if (ts.isImportDeclaration(node) || ts.isImportEqualsDeclaration(node)) {
            let moduleSpecifier = getModuleSpecifier(node);

            if (!moduleSpecifier) {
                return;
            }
            // get rid of ./ and ../
            moduleSpecifier = findRootDirectory(mapToRootPath(moduleSpecifier, filePath));
            const resolvedPath = resolvePathMapping(moduleSpecifier, pathMappings);

            const importData: ImportInfo = {
                statement: node.getText(source).trim(),
                moduleSpecifier,
                resolvedPath,
                dependencies: dependenciesArray.includes(moduleSpecifier) ? moduleSpecifier : null,
                registryDependencies: getRegistryDependency(resolvedPath, knownRegistries),
                files: null,
            };

            // if no dependencies or registry dependencies, add files that are contain 'resolvedPath' in their full path
            // implication:  a/b/c.ts, a/b/c.xyz.tsx a/b/c/index.ts, a/b/c/index.xyz.tsx are all considered
            if (!importData.dependencies && !importData.registryDependencies) {
                importData.files = fileInfo.filter((file) => file.path.includes(resolvedPath.replace(/^\.\//, ""))).map((file) => findRootDirectory(file.path));
            }

            imports.push(importData);
        }
    })

    return imports;
}

