#!/usr/bin/env node
import path from "node:path";
import process from "node:process";

import { log, setVerboseLogging } from "./clilog.js";
import { findRootDirectory } from "./findRootDirectory.js";
import { getDependenciesArray } from "./getDependenciesArray.js";
import { getPathMappings } from "./getPathMappings.js";
import { loadGeneratorConfig } from "./loadGeneratorConfig.js";
import { parseArgs } from "./parseArgs.js";
import { readNearestFileJson } from "./readNearestFileJson.js";
import { scanDirectory } from "./scanDirectory.js";
import { CliError, ensureDirectoryExists } from "./util.js";

import { readFile } from "node:fs/promises";
import type { PackageInfo } from "./getDependenciesArray.js";
import { getImportsArray } from "./getImportsArray.js";
import { getShadcnMeta } from "./getShadcnMeta.js";
import type { GeneratorConfig } from "./loadGeneratorConfig.types.js";

async function waitForKeypress(message = "Press Enter to continue...") {
    if (!process.stdin.isTTY) {
        log("Non-interactive input detected, continuing without waiting for keypress.");
        return;
    }

    return new Promise<void>((resolve) => {
        process.stdout.write(`${message}\n`);
        process.stdin.resume();
        process.stdin.setEncoding("utf8");
        process.stdin.once("data", () => {
            process.stdin.pause();
            resolve();
        });
    });
}

async function main() {
    const { verbose, directory } = parseArgs(process.argv);
    setVerboseLogging(verbose);

    await ensureDirectoryExists(directory);

    // root directory of the project './src/...'
    const rootDirectory = findRootDirectory(directory);
    log(`Root directory: ${rootDirectory}`);


    // Get generator config and remove the current directory from known registries
    let generatorConfig: GeneratorConfig = await loadGeneratorConfig(directory);
    delete generatorConfig.knownRegistries[rootDirectory];
    log(generatorConfig);

    // Get all known packages dependencies
    const packageInfo: PackageInfo | null = await readNearestFileJson<PackageInfo>(directory, "package.json");
    log(packageInfo);
    if (!packageInfo) {
        throw new CliError("No package.json found");
    }

    const dependenciesArray = getDependenciesArray(packageInfo);
    log(dependenciesArray);

    // Get all path mappings from tsconfig
    const pathMappings = await getPathMappings(directory);
    log(pathMappings);

    const fileInfo = await scanDirectory(directory, generatorConfig);
    log(fileInfo);

    await waitForKeypress("Press Enter to start processing scanned files...");

    fileInfo.forEach(async (file) => {
        if (generatorConfig.allowedExtensions.includes(path.extname(file.path))) {
            const fileContent = await readFile(file.path, "utf-8");
            const imports = getImportsArray(file.path, fileContent, dependenciesArray, generatorConfig.knownRegistries, pathMappings);
            const shadcnMeta = getShadcnMeta(file.path, fileContent);
            log(file.path);
            log(imports);
            log(shadcnMeta);

            fileInfo.push({
                ...file,
                imports,
                shadcnMeta
            });
            console.log(JSON.stringify(fileInfo, null, 2));
        }
    });
}

main().catch((err) => {
    if (err instanceof CliError) {
        console.error(err.message);
    } else {
        console.error(err);
    }
    process.exit(1);
});
