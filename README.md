# registrygen

Generate `registry.json` files for shadcn/ui-style registries and bootstrap new projects with a guided config wizard.

## Installation

```bash
npm install -g registrygen
# or
npx registrygen --help
```

## Commands

```bash
registrygen [options] <directory>
```

### Options

| Option | Description |
| --- | --- |
| `--init`, `-i` | Create a `registrygen-config.json` in the project root (directory above `src`). Prompts for registry prefix and homepage and prints the resulting config. |
| `-v` | Verbose mode with extra logging and pause points between passes. |
| `-n <name>` | Override the computed registry name (defaults to `registryPrefix + <directory-name>`). |
| `-w <homepage>` | Override the homepage URL used in the generated `registry.json`. |

### Typical workflow

1. Initialize the config once per project root:

   ```bash
   registrygen --init ./src/@registry/layout
   ```

2. Generate `registry.json` for a registry directory:

   ```bash
   registrygen ./src/@registry/layout
   ```

The CLI executes three passes:

1. Scan directories respecting `allowedExtensions` and `skipDirectories`.
2. Enrich files by tracking imports, local dependencies, and cross-registry references.
3. Build and validate `registry.json`, writing it beside the target directory.

## Configuration

`registrygen-config.json` lives one level above `src/` and supports:

```jsonc
{
  "registryPrefix": "@hoogin-",
  "homePage": "https://hoogin.be",
  "allowedExtensions": [".ts", ".tsx"],
  "skipDirectories": ["node_modules", "dist"],
  "knownRegistries": {
    "./src/components/ui": {
      "prefix": "@shadcn",
      "url": "https://example.com/r/@shadcn"
    }
  }
}
```

Use `knownRegistries` to map source paths to remote registry catalogs; the generator validates imports by fetching each registry’s `registry.json`.

## Development

```bash
npm install
npm run dev    # tsx watch
npm run build  # tsc -> dist/
```

During local testing you can run `npx tsx src/index.ts <dir>` directly. The published package exposes the `registrygen` binary via the `bin` field in `package.json`.

## License

ISC © Hoogin bv
