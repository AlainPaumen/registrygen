import { readFile } from "node:fs/promises";
import path from "node:path";

// find the nearest file indicated by fileName starting from startDir and going up the directory tree
export async function readNearestFileJson<T>(
    startDir: string,
    fileName: string,
): Promise<T | null> {
    let currentDir = startDir;

    while (true) {
        const filePath = path.join(currentDir, fileName);
        try {
            const file = await readFile(filePath, "utf8");
            const parsed = JSON.parse(file) as T;
            return parsed;
        } catch (error) {
            if (!isFileMissing(error)) {
                throw new Error(
                    `Failed to read ${fileName} at ${filePath}: ${(error as Error).message}`
                );
            }
        }

        const parent = path.dirname(currentDir);
        if (parent === currentDir) {
            break;
        }
        currentDir = parent;
    }

    return null;
}

function isFileMissing(error: unknown): error is NodeJS.ErrnoException {
    return (
        Boolean(error && typeof error === "object" && "code" in error) &&
        ["ENOENT", "ENOTDIR", "EISDIR"].includes((error as NodeJS.ErrnoException).code ?? "")
    );
}
