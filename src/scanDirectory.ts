import { readdir } from "node:fs/promises";
import path from "node:path";
import type { GeneratorConfig } from "./loadGeneratorConfig.types.js";
import type { FileEntry } from "./scanDirectory.types.js";

export async function scanDirectory(
    directory: string,
    generatorConfig: GeneratorConfig
): Promise<FileEntry[]> {
    const dirEntries = await readdir(directory, { withFileTypes: true });
    const files: FileEntry[] = [];

    for (const entry of dirEntries) {
        const entryPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
            if (generatorConfig.skipDirectories.includes(entry.name)) {
                continue;
            }

            const nestedFiles = await scanDirectory(entryPath, generatorConfig);
            files.push(...nestedFiles);
            continue;
        }

        if (entry.isFile()) {
            files.push({
                name: entry.name,
                path: entryPath,
            });
        }
    }

    return files;
}