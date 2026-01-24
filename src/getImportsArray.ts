import * as ts from "typescript";
import { findRootDirectory } from "./findRootDirectory.js";
import { getRegistryDependency } from "./getRegistryDependency.js";
import { getModuleSpecifier } from "./handleFileContent.js";
import type { knownRegistries } from "./loadGeneratorConfig.types.js";
import type { FileEntry } from "./scanDirectory.types.js";
import { mapToRootPath, resolvePathMapping } from "./util.js";

export type ImportInfo = {
    statement: string;
    moduleSpecifier: string;
    imported: string[];
    dependencies: string | null;
    registryDependencies: string | null;
    resolvedPath: string;
    files: string[] | null;
};

export async function getImportsArray(filePath: string, fileContent: string, fileInfo: FileEntry[], dependenciesArray: string[], knownRegistries: knownRegistries, pathMappings: Record<string, string>[]): Promise<ImportInfo[]> {
    const source = ts.createSourceFile(filePath, fileContent, ts.ScriptTarget.Latest, true);
    const imports: ImportInfo[] = [];
    const importNodes: (ts.ImportDeclaration | ts.ImportEqualsDeclaration)[] = [];

    source.forEachChild((node) => {
        if (ts.isImportDeclaration(node) || ts.isImportEqualsDeclaration(node)) {
            importNodes.push(node);
        }
    });

    for (const node of importNodes) {
        const moduleData = getModuleSpecifier(node);
        let moduleSpecifier = moduleData.moduleSpecifier;

        if (!moduleSpecifier) {
            continue;
        }
        // get rid of ./ and ../
        moduleSpecifier = findRootDirectory(mapToRootPath(moduleSpecifier, filePath));
        const resolvedPath = resolvePathMapping(moduleSpecifier, pathMappings);

        const registryDependency = await getRegistryDependency(resolvedPath, knownRegistries, moduleData);

        const importData: ImportInfo = {
            statement: node.getText(source).trim(),
            moduleSpecifier,
            imported: moduleData.imported,
            resolvedPath,
            dependencies: dependenciesArray.includes(moduleSpecifier) ? moduleSpecifier : null,
            registryDependencies: registryDependency,
            files: null,
        };

        // if no dependencies or registry dependencies, add files that are contain 'resolvedPath' in their full path
        // implication:  a/b/c.ts, a/b/c.xyz.tsx a/b/c/index.ts, a/b/c/index.xyz.tsx are all considered
        if (!importData.dependencies && !importData.registryDependencies) {
            importData.files = fileInfo
                .filter((file) => file.path.includes(resolvedPath.replace(/^\.\//, "")))
                .map((file) => findRootDirectory(file.path));
        }

        imports.push(importData);
    }

    return imports;
}

