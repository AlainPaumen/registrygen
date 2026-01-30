import { resolve } from "node:path";

import { CliError } from "./util.js";

const USAGE = `Usage: registrygen [--init] [-v] [-n <name>] [-w <homepage>] <directory>

Options:
  --init Initialize a registrygen-config.json file for the project.
  -v    Enable verbose logging.
  -n    Specify registry name.
  -w    Specify registry homepage URL.`;

export type ParsedArgs = {
    verbose: boolean;
    directory: string;
    registryName?: string;
    homePage?: string;
    init: boolean;
};

export function parseArgs(argv: string[]): ParsedArgs {
    const args = argv.slice(2);
    let verbose = false;
    let directory: string | undefined;
    let registryName: string | undefined;
    let homePage: string | undefined;
    let init = false;

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === "--init" || arg === "-i") {
            init = true;
            continue;
        }
        if (arg === "-v") {
            verbose = true;
            continue;
        }

        if (arg === "-n") {
            const value = args[++i];
            if (!value || value.startsWith("-")) {
                throw new CliError(`Missing registry name after -n.\n\n${USAGE}`);
            }
            registryName = value;
            continue;
        }

        if (arg === "-w") {
            const value = args[++i];
            if (!value || value.startsWith("-")) {
                throw new CliError(`Missing homepage URL after -w.\n\n${USAGE}`);
            }
            homePage = value;
            continue;
        }

        if (arg.startsWith("-")) {
            throw new CliError(`Unknown option: ${arg}\n\n${USAGE}`);
        }

        if (directory) {
            throw new CliError(`Too many arguments provided.\n\n${USAGE}`);
        }

        directory = arg;
    }

    if (!directory) {
        throw new CliError(`Missing directory argument.\n\n${USAGE}`);
    }

    return { verbose, directory: resolve(directory), registryName, homePage, init };
}
