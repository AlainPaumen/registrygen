import { resolve } from "node:path";

import { CliError } from "./util.js";

const USAGE = `Usage: registrygen [-v] <directory>

Options:
  -v    Enable verbose logging.`;

export type ParsedArgs = {
    verbose: boolean;
    directory: string;
};

export function parseArgs(argv: string[]): ParsedArgs {
    const args = argv.slice(2);
    let verbose = false;
    let directory: string | undefined;

    for (const arg of args) {
        if (arg === "-v") {
            verbose = true;
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

    return { verbose, directory: resolve(directory) };
}
