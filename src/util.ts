import { stat } from "node:fs/promises";

export class CliError extends Error { }

export async function ensureDirectoryExists(directory: string) {
    try {
        const stats = await stat(directory);
        if (!stats.isDirectory()) {
            throw new CliError(`Provided path is not a directory: ${directory}`);
        }
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") {
            throw new CliError(`Directory not found: ${directory}`);
        }
        throw err;
    }
}

export function resolvePathMapping(filePath: string, pathMappings: Record<string, string>[]) {
    if (!pathMappings || pathMappings.length === 0) {
        return filePath;
    }

    for (const mapping of pathMappings) {
        const key = Object.keys(mapping)[0];
        const value = mapping[key];
        if (filePath.startsWith(key)) {
            return filePath.replace(key, value);
        }
    }
    return filePath;
}

//  Take an relative path (../types or ./types), the current file ./src/@regsitry/auth/lib/test.ts and build filename with full path
export function mapToRootPath(filePath: string, currentFile: string) {
    // Get the directory of the current file
    const currentDir = currentFile.substring(0, currentFile.lastIndexOf('/'));
    if (filePath.startsWith('./')) {
        return currentDir + '/' + filePath.substring(2);
    }

    if (filePath.startsWith('../')) {
        // Count the number of ../
        const count = filePath.match(/^\.\.\//g)?.length || 0;
        // Remove the ../ from the path
        const path = filePath.substring(count * 3);
        // Go up the directory tree
        const dir = currentDir.split('/').slice(0, -count).join('/');
        return dir + '/' + path;
    }

    return filePath;
}
