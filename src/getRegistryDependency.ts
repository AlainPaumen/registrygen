import { ModuleSpecifierResult } from "./handleFileContent.js";
import type { knownRegistries } from "./loadGeneratorConfig.types.js";
import { searchRegistry } from "./searchRegistry.js";

export async function getRegistryDependency(path: string, knownRegistries: knownRegistries, moduleData: ModuleSpecifierResult) {
    const registrySourcePath = Object.keys(knownRegistries).find((key) => path.startsWith(key));

    if (!registrySourcePath) {
        return null;
    }

    const registryConfig = knownRegistries[registrySourcePath];
    if (!registryConfig?.prefix) {
        return null;
    }

    let registryDependency = path.replace(registrySourcePath, registryConfig.prefix);
    if (!registryDependency) {
        return null;
    }
    if (registryDependency.startsWith('/')) {
        registryDependency = registryDependency.substring(1);
    }

    // Check if importedComponent exists in registryDependency component
    const cleanRegistryDependency = await searchRegistry(registryDependency, moduleData, knownRegistries);
    return cleanRegistryDependency;
}