#!/usr/bin/env node
import path from "node:path";
import process from "node:process";

import { buildRegistryJson } from "./buildRegistryJson.js";
import { log, setVerboseLogging } from "./clilog.js";
import { enrichFileInfo } from "./enrichFileInfo.js";
import { findRootDirectory } from "./findRootDirectory.js";
import { getDependenciesArray } from "./getDependenciesArray.js";
import { getPathMappings } from "./getPathMappings.js";
import { loadGeneratorConfig } from "./loadGeneratorConfig.js";
import { parseArgs } from "./parseArgs.js";
import { readNearestFileJson } from "./readNearestFileJson.js";
import { scanDirectory } from "./scanDirectory.js";
import { CliError, ensureDirectoryExists } from "./util.js";
import { validateRegistryJson } from "./validateRegistryJson.js";

import { writeFile } from "node:fs/promises";
import type { PackageInfo } from "./getDependenciesArray.js";
import type { GeneratorConfig } from "./loadGeneratorConfig.types.js";

async function waitForKeypress(message = "Press Enter to continue...", enabled = false) {
    if (!enabled) {
        return;
    }
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
    const { verbose, directory, registryName, homePage } = parseArgs(process.argv);
    setVerboseLogging(verbose);

    await ensureDirectoryExists(directory);

    // root directory of the project './src/...'
    const rootDirectory = findRootDirectory(directory);
    log(`Root directory: ${rootDirectory}`);

    // Get generator config and remove the current directory from known registries
    let generatorConfig: GeneratorConfig = await loadGeneratorConfig(directory);
    delete generatorConfig.knownRegistries[rootDirectory];
    log(generatorConfig);

    // Get registry name
    const rootDirTailIndex = rootDirectory.lastIndexOf("/");
    const rootDirTailRaw = rootDirTailIndex >= 0 ? rootDirectory.slice(rootDirTailIndex + 1) : rootDirectory;
    const rootDirTail = rootDirTailRaw || path.basename(directory);
    const defaultRegistryName = `${generatorConfig.registryPrefix}${rootDirTail}`;
    const defaultHomePage = generatorConfig.homePage;

    const resolvedRegistryName = registryName ?? defaultRegistryName;
    const resolvedHomePage = homePage ?? defaultHomePage;

    log(`Arg registry name: ${registryName}`);
    log(`Default registry name: ${defaultRegistryName}`);
    log(`Resolved registry name: ${resolvedRegistryName}`);
    log(`Arg homepage: ${homePage}`);
    log(`Default homepage: ${defaultHomePage}`);
    log(`Resolved homepage: ${resolvedHomePage}`);

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

    console.log("Pass 1: Scanning Directory...")
    const fileInfo = await scanDirectory(directory, generatorConfig);
    log(fileInfo);

    await waitForKeypress("Press Enter to continue...", verbose);

    console.log("Pass 2: Enrich scanned files...")
    const fileRichInfo = await enrichFileInfo(
        fileInfo,
        generatorConfig,
        dependenciesArray,
        pathMappings,
    );

    await waitForKeypress("Press Enter to continue...", verbose);
    log(JSON.stringify(fileRichInfo, null, 2));

    await waitForKeypress("Press Enter to continue...", verbose);

    console.log(`Pass 3: Building registry.json for ${resolvedRegistryName} on ${resolvedHomePage}...`)

    const registryJson = buildRegistryJson(resolvedRegistryName, resolvedHomePage, fileRichInfo);
    const validationResult = await validateRegistryJson(registryJson);

    if (!validationResult.valid) {
        console.error("Registry JSON failed schema validation. Errors:");
        validationResult.errors.forEach((error) => {
            console.error(`- ${error.instancePath || "/"} ${error.message ?? "Unknown error"}`);
        });
        throw new CliError("Registry JSON validation failed; registry.json was not written.");
    }

    await writeFile(path.join(directory, "registry.json"), JSON.stringify(registryJson, null, 2));
}


main().catch((err) => {
    if (err instanceof CliError) {
        console.error(err.message);
    } else {
        console.error(err);
    }
    process.exit(1);
});
