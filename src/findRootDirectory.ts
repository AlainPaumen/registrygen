const SRC_MARKER = "/src";

/**
 * Returns the portion of `fullPath` starting from the first "/src".
 * If no "/src" segment exists, the original path is returned.
 */
export function findRootDirectory(fullPath: string): string {
    const srcIndex = fullPath.indexOf(SRC_MARKER);
    if (srcIndex === -1) {
        return fullPath;
    }
    return `.${fullPath.slice(srcIndex)}`;
}
