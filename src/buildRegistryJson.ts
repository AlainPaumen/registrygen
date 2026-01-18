import { log } from "./clilog.js";
import type { FileRichInfo } from "./enrichFileInfo.js";
import type { ShadcnMeta } from "./scanDirectory.types.js";
import { mapToRootPath } from "./util.js";

export type RegistryItem = {
    name?: string;
    type?: ShadcnMeta["type"];
    title?: string;
    description?: string;
    categories?: string[];
    dependencies: string[];
    registryDependencies: string[];
    files: { path: string; type?: ShadcnMeta["type"]; target?: string }[];
};

export type RegistryJsonDocument = {
    $schema: string;
    name: string;
    homepage?: string;
    items: RegistryItem[];
};

export function buildRegistryJson(registryName: string, homepage: string | undefined, fileRichInfo: FileRichInfo[]): RegistryJsonDocument {
    const registryJson: RegistryJsonDocument = {
        $schema: "https://ui.shadcn.com/schema/registry.json",
        name: registryName,
        homepage,
        items: [],
    };
    const fileMap = new Map(fileRichInfo.map((file) => [file.rootPath, file]));

    fileRichInfo.forEach((file) => {
        if (!file.shadcnMeta?.isRoot) {
            return;
        }

        const item: RegistryItem = {
            name: file.shadcnMeta?.name,
            type: file.shadcnMeta?.type,
            title: file.shadcnMeta?.title,
            description: file.shadcnMeta?.description,
            categories: file.shadcnMeta?.category,
            dependencies: [],
            registryDependencies: [],
            files: [],
        };
        const accumulatedFiles = new Set<string>(); //dependencies 'files' that need to be scanned

        // add startfile to dependencies files
        item.files.push({ path: file.rootPath, type: file.shadcnMeta?.type, target: file.rootPath.replace('.', '~') });

        file.imports.forEach((importItem) => {
            if (importItem.dependencies) {
                item.dependencies.push(importItem.dependencies);
            } else if (importItem.registryDependencies) {
                item.registryDependencies.push(importItem.registryDependencies);
            } else if (importItem.files) {
                importItem.files.forEach((filePath) => {
                    const referencedFile = fileMap.get(filePath);
                    item.files.push({ path: filePath, type: referencedFile?.shadcnMeta?.type, target: filePath.replace('.', '~') });
                    accumulatedFiles.add(filePath);
                });
            }
        });
        log('---', file.rootPath, accumulatedFiles);
        accumulatedFiles.forEach(value => {
            log('+', value);
            const file = fileMap.get(value);
            if (file) {
                file.imports.forEach((importItem) => {
                    if (importItem.dependencies) {
                        item.dependencies.push(importItem.dependencies);
                    } else if (importItem.registryDependencies) {
                        item.registryDependencies.push(importItem.registryDependencies);
                    } else if (importItem.files) {
                        importItem.files.forEach((filePath) => {
                            const referencedFile = fileMap.get(filePath);
                            item.files.push({
                                path: filePath, type: referencedFile?.shadcnMeta?.type, target: filePath.replace('.', '~')
                            });
                            accumulatedFiles.add(filePath);
                            log('-', filePath);
                        });
                    }
                })
            }
        });

        // add resources to files
        file.shadcnMeta.resources.forEach((resource) => {
            let resourceFile = mapToRootPath(resource, file.rootPath);
            item.files.push({ path: resourceFile, type: "registry:file", target: resourceFile.replace('.', '~') });
        });

        item.dependencies = Array.from(new Set(item.dependencies));
        item.registryDependencies = Array.from(new Set(item.registryDependencies));
        item.files = Array.from(new Map(item.files.map((fileEntry) => [fileEntry.path, fileEntry])).values());




        registryJson.items.push(item);
    });

    return registryJson;
}

