export type GeneratorConfig = {
    allowedExtensions: string[];
    skipDirectories: string[];
    knownRegistries: Record<string, string>;
    registryPrefix: string;
    homePage: string;
};