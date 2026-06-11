# @1-/dist : Monorepo package publishing and Git synchronization automation

## Functionality

- **Static analysis**
  Execute Knip before publishing to detect unused exports, missing declarations, and redundant dependencies.

- **Metadata automation**
  Detect missing `description` or `keywords` in `package.json`.
  Generate or update `README.md` using LLM services.

- **Git working tree management**
  Inspect repository status.
  Commit unstaged modifications automatically before publishing.

- **Sandboxed publishing**
  Create temporary directory under OS temp path.
  Copy only `src` source files.
  Strip development metadata from `package.json`.
  Rewrite relative paths in `exports`, `bin`, `main`, `module`, and `types` fields.

- **Mermaid diagram processing**
  Extract Mermaid diagrams from `README.mdt`.
  Render diagrams to SVG and upload to S3 storage.
  Replace diagram blocks with CDN URLs.
  Generate standard `README.md` and HTML-compatible Markdown with embedded SVG URLs.

- **Automated publishing**
  Execute public npm package publishing.
  Increment local patch version upon successful release.
  Open package release page in default browser.

- **Multi-branch Git synchronization**
  Commit and push changes to `dev` branch.
  Use `git clone --shared` for safe merging.
  Merge to `main` and push updates to remote.

## Usage demo

Specify target package folder name under monorepo:

```bash
dist <pkg_folder>
```

Example:

```bash
dist walk
```

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

## Tech stack

- **Bun**: Runtime and package manager
- **Git CLI**: Version control operations
- **Knip**: Static analysis tool
- **Yargs**: Command-line argument parsing
- **AWS S3 SDK**: Cloud storage integration
- **Mermaid**: Diagram rendering

## Code structure

```text
src/
├── dist.js          # CLI entry point
├── exec.js          # Subprocess command executor
├── gci.js           # Git working tree inspector and committer
├── gitMerge.js      # Shared clone git merger
├── gitSync.js       # Git branch synchronization controller
├── knip.js          # Knip static analysis controller
├── pkgJsonClean.js  # Cleans package.json and rewrites export paths
├── prep.js          # Sandboxed folder preprocessor
├── publish.js       # npm publisher and browser opener
├── readme.js        # Markdown renderer and Mermaid processor
├── readmeGen.js     # LLM documentation and metadata generator
├── run.js           # Release process main controller
├── srcReplace.js    # Relative path rewriter
└── svg.js           # SVG renderer and uploader
```

## Historical story

Early Node.js package publishing relied on `npm publish` uploading entire directories, causing frequent leaks of sensitive files like `.env`, credentials, and test artifacts. While `.npmignore` and `files` arrays provided mitigation, configuration remained manual and error-prone.

Monorepo Git workflows required developers to manually manage multi-branch synchronization with `git checkout`, `pull`, `merge`, and `push` commands. Uncommitted local changes complicated these operations, increasing merge conflict risks and introducing dirty commits.

This tool addresses both challenges through Git shared clones (`git clone --shared`) and sandboxed publishing. Temporary directory isolation prevents accidental file inclusion, while automated Git synchronization ensures consistent, zero-configuration releases.