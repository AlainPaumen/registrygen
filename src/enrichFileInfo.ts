import { readFile } from "node:fs/promises";
import path from "node:path";

import { log } from "./clilog.js";
import type { ImportInfo } from "./getImportsArray.js";
import { getImportsArray } from "./getImportsArray.js";
import { getShadcnMeta } from "./getShadcnMeta.js";
import type { GeneratorConfig } from "./loadGeneratorConfig.types.js";
import type { FileEntry, ShadcnMeta } from "./scanDirectory.types.js";

export type FileRichInfo = Omit<FileEntry, "imports" | "shadcn"> & {
    imports: ImportInfo[];
    shadcnMeta: ShadcnMeta;
};

export async function enrichFileInfo(
    fileInfo: FileEntry[],
    generatorConfig: GeneratorConfig,
    dependenciesArray: string[],
    pathMappings: Record<string, string>[],
): Promise<FileRichInfo[]> {
    const fileRichInfo: FileRichInfo[] = [];

    for (const file of fileInfo) {
        if (!generatorConfig.allowedExtensions.includes(path.extname(file.path))) {
            log(`Skipping file ${file.path}`);
            continue;
        }

        log(`Enriching file ${file.path}`);
        const fileContent = await readFile(file.path, "utf-8");
        const imports = getImportsArray(
            file.path,
            fileContent,
            fileInfo,
            dependenciesArray,
            generatorConfig.knownRegistries,
            pathMappings,
        );
        const shadcnMeta = getShadcnMeta(file.path, fileContent);

        fileRichInfo.push({
            ...file,
            imports,
            shadcnMeta,
        });
    }

    return fileRichInfo;
}
