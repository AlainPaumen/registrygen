export function getRegistryDependency(path: string, knownRegistries: Record<string, string>) {
    const registry = Object.keys(knownRegistries).find((key) => path.startsWith(key));
    //console.log(path, registry, registry ? path.replace(registry, '') : null, registry ? knownRegistries[registry] : null);

    // return registry ? knownRegistries[registry] : null;
    return registry ? path.replace(registry, '') : null;
}