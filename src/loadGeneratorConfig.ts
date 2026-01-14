import type { GeneratorConfig } from "./loadGeneratorConfig.types.js";
import { readNearestFileJson } from "./readNearestFileJson.js";

const CONFIG_FILE_NAME = "registrygen-config.json";
const DEFAULT_ALLOWED_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx"];
const DEFAULT_SKIP_DIRECTORIES = ["node_modules", ".git", "dist", ".dist"];

export async function loadGeneratorConfig(startDir: string): Promise<GeneratorConfig> {
    const generatorConfig = await readNearestFileJson<GeneratorConfig>(startDir, CONFIG_FILE_NAME);
    const config: GeneratorConfig = {
        allowedExtensions: generatorConfig?.allowedExtensions || DEFAULT_ALLOWED_EXTENSIONS,
        skipDirectories: generatorConfig?.skipDirectories || DEFAULT_SKIP_DIRECTORIES,
        knownRegistries: generatorConfig?.knownRegistries || {}
    };
    return config;
}   