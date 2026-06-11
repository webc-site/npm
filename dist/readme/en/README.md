# @1-/dist : Monorepo package publishing and Git synchronization automation

## Functionality

- **Knip static analysis**
  Execute Knip before publishing to detect unused exports, missing declarations, redundant dependencies, and other issues across 23 issue categories including `files`, `dependencies`, `exports`, `types`, and `duplicates`.

- **LLM-powered metadata generation**
  Detect missing `description` or `keywords` in `package.json`.
  Use Cersei LLM service with OpenAI-compatible API configuration to generate documentation and complete metadata.
  Load prompts from `src/prompt/readme.md` and `src/prompt/package.md`.

- **Git working tree management**
  Use `simple-git` to inspect repository status.
  Automatically commit unstaged modifications via `gci` before publishing.

- **Sandboxed publishing environment**
  Create isolated temporary directory using `os.tmpdir()` with cryptographically random name.
  Copy only `src` directory contents recursively.
  Clean `package.json` by removing `devDependencies`, `scripts`, `files`, and `lint-staged` fields.
  Rewrite relative paths in `exports`, `bin`, `main`, `module`, and `types` fields using `srcReplace`.

- **Mermaid diagram processing**
  Extract Mermaid diagrams from `README.mdt` files.
  Render diagrams to SVG format and upload to S3 storage.
  Replace diagram blocks with CDN URLs in generated Markdown.

- **Automated npm publishing**
  Execute `npm publish --access public` in temporary directory.
  Increment patch version (e.g., `1.2.3` → `1.2.4`) upon successful release.
  Open npm package page in default browser using platform-appropriate commands (`open`, `cmd.exe`, or `xdg-open`).

- **Multi-branch Git synchronization**
  Commit and push changes to `dev` branch with version commit message `"v1.2.4"`.
  Use `git clone --shared` for efficient, safe merging.
  Clone local repository to temporary path, checkout `main`, pull latest, merge `dev`, then push to remote.

## Usage demo

Specify target package folder name under monorepo:

```bash
dist <pkg_folder>
```

Example:

```bash
dist walk
```

The CLI uses yargs for argument parsing and requires exactly one positional argument specifying the package directory name.

## Design rationale

```mermaid
graph TD
    Start([Start]) --> Knip[Knip Static Analysis]
    Knip --> Metadata[LLM Metadata Generation]
    Metadata --> Gci[Git Working Tree Commit]
    Gci --> Prep[Sandbox Preparation]
    Prep --> Clean[package.json Cleanup]
    Clean --> Readme[README Processing]
    Readme --> Publish[npm Publish]
    Publish --> Version[Version Update]
    Version --> Dev[Push to dev Branch]
    Dev --> Main[Merge to main Branch]
    Main --> End([End])
```

The workflow follows strict sequential execution with error handling at each stage. Knip failures cause immediate process exit with detailed error reporting. All temporary directories are cleaned up in `finally` blocks.

## Tech stack

- **Bun**: Runtime and package manager (replaces Node.js)
- **Simple Git**: Git operations library
- **Knip**: Static analysis tool for JavaScript/TypeScript projects
- **Yargs**: Command-line argument parsing
- **AWS S3 SDK**: Cloud storage integration for diagram hosting
- **Mermaid**: Diagram rendering engine
- **Cersei**: LLM service wrapper for OpenAI-compatible APIs
- **Simple Git**: Git operations library

## Code structure

```text
src/
├── dist.js          # CLI entry point with yargs parsing
├── exec.js          # Subprocess command executor for shell commands
├── gci.js           # Git working tree inspector using simple-git
├── gitMerge.js      # Shared clone git merger with .tmp directory isolation
├── gitSync.js       # Git branch synchronization controller
├── knip.js          # Knip static analysis controller with 23 issue category detection
├── pkgJsonClean.js  # Cleans package.json and rewrites export paths
├── prep.js          # Sandboxed folder preprocessor with crypto.randomUUID()
├── publish.js       # npm publisher with cross-platform browser opening
├── readme.js        # Markdown renderer and Mermaid processor
├── readmeGen.js     # LLM documentation generator with Cersei integration
├── run.js           # Release process main controller
├── srcReplace.js    # Relative path rewriter for package.json fields
└── svg.js           # SVG renderer and uploader for Mermaid diagrams
```

## Historical story

Early Node.js package publishing relied on `npm publish` uploading entire directories, causing frequent leaks of sensitive files like `.env`, credentials, and test artifacts. While `.npmignore` and `files` arrays provided mitigation, configuration remained manual and error-prone.

Monorepo Git workflows required developers to manually manage multi-branch synchronization with `git checkout`, `pull`, `merge`, and `push` commands. Uncommitted local changes complicated these operations, increasing merge conflict risks and introducing dirty commits.

This tool addresses both challenges through Git shared clones (`git clone --shared`) and sandboxed publishing. Temporary directory isolation prevents accidental file inclusion, while automated Git synchronization ensures consistent, zero-configuration releases. The architecture evolved from simple shell script wrappers to a modular Bun-based system with dedicated modules for each concern, enabling reliable monorepo publishing at scale.