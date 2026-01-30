# registrygen – Developer Guide

This document dives into the architecture and design decisions behind the registry generator CLI.

## High-level flow

1. **Argument parsing** – `src/parseArgs.ts` handles `--init`, `-v`, `-n`, `-w`, validating inputs and returning an absolute directory path.
2. **Initialization (optional)** – If `--init` is supplied, `runInit` (in `src/index.ts`) prompts for `registryPrefix` and `homePage`, writes `registrygen-config.json` one level above `src/`, and prints the resulting JSON.
3. **Generation pipeline** – Without `--init`, the CLI executes three passes:
   - `scanDirectory` crawls the target directory respecting `allowedExtensions` and `skipDirectories` from the config. It records each file’s shadcn metadata and path info.
   - `enrichFileInfo` re-reads each file to collect imports. It resolves module specifiers, maps shadcn registry dependencies, and builds a per-file import graph. Known registrations in `registrygen-config.json` allow cross-registry validation via HTTP fetches.
   - `buildRegistryJson` and `validateRegistryJson` collapse the enriched data into a schema-compliant `registry.json`, deduplicating dependencies and files.

## Key modules

| Module | Responsibility |
| --- | --- |
| `src/index.ts` | CLI entrypoint. Coordinates init, scanning, enrichment, JSON build, and validation. |
| `src/loadGeneratorConfig.ts` | Locates `registrygen-config.json` (via `readNearestFileJson`) and fills defaults. Exports constants used by init. |
| `src/findRootDirectory.ts` | Canonicalizes paths relative to the first `/src` segment so imports align with shadcn expectations. |
| `src/getImportsArray.ts` | Uses the TypeScript compiler API to parse import declarations, resolve path mappings, and detect registry dependencies. |
| `src/searchRegistry.ts` | Fetches remote registry catalogs, normalizes component names, and confirms that referenced components exist. |
| `src/buildRegistryJson.ts` | Aggregates per-file info into registry items, assembling dependencies/files recursively. |
| `src/validateRegistryJson.ts` | Runs AJV validation against the shadcn registry schema, failing early on errors. |

## Data structures

- **`FileEntry` / `FileRichInfo`** (`src/enrichFileInfo.ts`) – represent files found during scanning and their resolved imports, dependencies, and shadcn metadata.
- **`GeneratorConfig`** (`src/loadGeneratorConfig.types.ts`) – canonical config shape consumed across modules.
- **`RegistryItem`** (`src/buildRegistryJson.ts`) – schema structure for each item written into `registry.json`.

## Registry validation

When an import resolves inside a known registry path, `getRegistryDependency` rewrites the path with the registry prefix (e.g., `./src/components/ui/card` -> `@shadcn/card`) and hands it to `searchRegistry`. That module downloads the registry’s `registry.json`, caches results, and matches on the final path segment plus imported names to ensure the dependency exists.

## Development workflow

```bash
npm install
npm run dev    # tsx --watch src/index.ts
npm run build  # tsc -p tsconfig.json (also runs via npm prepare)
```

- Use `npm run start` or `npx tsx src/index.ts <dir>` for manual runs. The repository’s `start` script targets a sample project.
- `npm run build` must succeed before publishing; `npm run prepare` ensures `dist/` is regenerated whenever the package is installed from git or published to npm.

## Testing ideas

- Add fixtures representing sample registries to validate scanning and registry verification logic without hitting real HTTP endpoints (by mocking `fetch`).
- Integration test harness could run the CLI against `examples/` directories and snapshot the resulting `registry.json`.

## Publishing checklist

1. Update `package.json` version and changelog notes.
2. `npm run build`
3. `npm publish` (or `npm publish --access public`)
4. Verify via `npx registrygen --help` from a clean environment.

Happy hacking!
