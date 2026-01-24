export type knownRegistries = {
    [key: string]: {
        prefix: string;
        url?: string;
        headers?: { "Authorization": string };
    };
}
export type GeneratorConfig = {
    allowedExtensions: string[];
    skipDirectories: string[];
    knownRegistries: knownRegistries;
    registryPrefix: string;
    homePage: string;
};