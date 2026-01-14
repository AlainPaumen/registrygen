export function getRegistryDependency(path: string, knownRegistries: Record<string, string>) {
    const registry = Object.keys(knownRegistries).find((key) => path.startsWith(key));
    return registry ? knownRegistries[registry] : null;
}