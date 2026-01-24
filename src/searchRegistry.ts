import type { RegistryJsonDocument } from "./buildRegistryJson.js";
import type { ModuleSpecifierResult } from "./handleFileContent.js";
import type { knownRegistries } from "./loadGeneratorConfig.types.js";

type RegistryCatalog = RegistryJsonDocument["items"];

const registryCatalogCache = new Map<string, Promise<RegistryCatalog | null>>();

export async function searchRegistry(
    registryDependency: string,
    moduleData: ModuleSpecifierResult,
    knownRegistries: knownRegistries,
): Promise<string | null> {
    if (!registryDependency) {
        return null;
    }

    // For shadcn components, remove the prefix @shadcn/ and return the rest
    if (registryDependency.startsWith("@shadcn/")) {
        return registryDependency.replace("@shadcn/", "");
    }

    const registryConfig = findRegistryConfig(registryDependency, knownRegistries);
    if (!registryConfig?.url) {
        return null;
    }

    const catalog = await loadRegistryCatalog(registryConfig.url, registryConfig.headers);
    if (!catalog?.length) {
        return null;
    }

    const dependencyComponentName = extractDependencyComponentName(registryDependency);
    const candidateNames = buildCandidateNames(dependencyComponentName, moduleData);
    if (!candidateNames.size) {
        return null;
    }

    for (const item of catalog) {
        if (!item?.name) {
            continue;
        }

        if (item.name && candidateNames.has(item.name)) {
            return composeCleanRegistryDependency(registryConfig.prefix, item.name);
        }
    }

    return null;
}

function findRegistryConfig(registryDependency: string, knownRegistries: knownRegistries) {
    return Object.values(knownRegistries).find((config) =>
        matchesRegistryPrefix(registryDependency, config.prefix),
    );
}

function matchesRegistryPrefix(registryDependency: string, prefix: string) {
    return registryDependency === prefix || registryDependency.startsWith(`${prefix}/`);
}

function buildCandidateNames(
    dependencyComponentName: string | null,
    moduleData: ModuleSpecifierResult,
) {
    const candidates = new Set<string>();

    if (dependencyComponentName) {
        candidates.add(dependencyComponentName);
    }

    return candidates;
}

function extractDependencyComponentName(registryDependency: string) {
    if (!registryDependency) {
        return null;
    }
    const lastSlash = registryDependency.lastIndexOf("/");
    const componentName = lastSlash === -1 ? registryDependency : registryDependency.slice(lastSlash + 1);
    return componentName;
    s
}

function composeCleanRegistryDependency(registryName: string, componentName: string) {
    const normalizedRegistry = registryName.replace(/\/+$/, "");
    const normalizedComponent = componentName.replace(/^\/+/, "");
    return `${normalizedRegistry}/${normalizedComponent}`;
}

function stripExtension(value: string | undefined) {
    if (!value) {
        return "";
    }
    const lastDot = value.lastIndexOf(".");
    return lastDot === -1 ? value : value.slice(0, lastDot);
}

function parseImportedComponentNames(entry: string) {
    const names: string[] = [];
    if (!entry) {
        return names;
    }
    const trimmed = entry.trim();
    if (!trimmed || trimmed.startsWith("* as")) {
        return names;
    }

    if (trimmed.startsWith("default as ")) {
        names.push(trimmed.slice("default as ".length));
        return names;
    }

    const parts = trimmed.split(/\s+as\s+/i);
    if (parts.length === 2) {
        names.push(parts[0].trim());
        names.push(parts[1].trim());
    } else {
        names.push(trimmed);
    }

    return names;
}

function normalizeComponentName(value: string | undefined | null) {
    if (!value) {
        return null;
    }
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }
    const withoutExt = stripExtension(trimmed);
    return withoutExt
        .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
        .replace(/[_\s]+/g, "-")
        .replace(/-+/g, "-")
        .toLowerCase();
}

async function loadRegistryCatalog(url: string, headers?: Record<string, string>) {
    const normalizedUrl = normalizeRegistryUrl(url);
    const cached = registryCatalogCache.get(normalizedUrl);
    if (cached) {
        return cached;
    }

    const requestPromise = (async () => {
        try {
            const response = await fetch(normalizedUrl, { headers });
            if (!response.ok) {
                console.warn(
                    `searchRegistry: Failed to download registry catalog from ${normalizedUrl}: ${response.status} ${response.statusText}`,
                );
                return null;
            }
            const document = (await response.json()) as RegistryJsonDocument;
            return document.items ?? [];
        } catch (error) {
            console.warn(`searchRegistry: Unable to download registry catalog from ${normalizedUrl}`, error);
            return null;
        }
    })();

    registryCatalogCache.set(normalizedUrl, requestPromise);
    return requestPromise;
}

function normalizeRegistryUrl(url: string) {
    if (!url) {
        return url;
    }
    const trimmed = url.replace(/\/+$/, "");
    if (trimmed.endsWith("registry.json")) {
        return trimmed;
    }
    return `${trimmed}/registry.json`;
}
