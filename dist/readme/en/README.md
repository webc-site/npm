# @1-/dist : Minimalist monorepo package publishing and git sync tool

## Features

- **Static Analysis & Risk Control**
  Runs Knip static analysis before publishing to detect unused code, missing declarations, and redundant dependencies.

- **Metadata & Documentation Auto-Completion**
  Detects missing `description` or `keywords` in `package.json`.
  Invokes `opencode` LLM service to complete metadata and generate or update `README.md`.

- **Automatic Workspace Commit**
  Inspects Git working tree status.
  Automatically commits unstaged modifications via `gci` prior to publishing.

- **Publish Directory Sandbox Restructuring**
  Creates temporary directory under OS temp path.
  Copies only `src` source files.
  Strips development metadata (`devDependencies`, `scripts`, `files`, `lint-staged`) from `package.json`.
  Rewrites relative paths in fields like `exports`, `bin`, `main`, `module`, and `types`.

- **Mermaid Diagram SVG Rendering & CDN Hosting**
  Extracts Mermaid diagrams from `README.mdt`.
  Renders diagrams to SVG, uploads assets to S3 storage, and replaces diagram blocks with CDN URLs.
  Generates standard `README.md` locally and HTML-compatible Markdown with embedded SVG URLs in release directory.

- **Automated npm Publishing & Browser Preview**
  Executes public package publishing.
  Increments local patch version upon successful release.
  Automatically opens package release page in default browser.

- **Safe Multi-Branch Git Synchronization**
  Commits and pushes changes to `dev` branch.
  Clones local repository to a temporary path via `git clone --shared`.
  Merges branch safely to `main` and pushes updates to remote.

## Usage

Specify target package folder name under monorepo:

```bash
dist <pkg_folder>
```

Example:

```bash
dist walk
```

## Design

```mermaid
graph TD
    Start([Start]) --> Knip[Knip Static Check]
    Knip --> GenReadme[LLM Completes Metadata and README]
    GenReadme --> Gci[Gci Commits Unstaged Changes]
    Gci --> Prep[Create Temp Dir & Copy src Source]
    Prep --> CleanPkg[Clean & Rewrite package.json Export Paths]
    CleanPkg --> RenderReadme[Render Markdown & Upload S3 Assets]
    RenderReadme --> Pub[Run npm publish]
    Pub --> LocalVersion[Update Local package.json Version]
    LocalVersion --> GitSync[Git Commit and Push dev Branch]
    GitSync --> MergeMain[Clone Temp Repo, Merge & Push main Branch]
    MergeMain --> End([End])
```

## Tech Stack

- **Bun**: JS runtime and package manager
- **Simple Git**: Git command executor
- **Knip**: Unused exports and dependencies analyzer
- **Yargs**: Command-line parser
- **AWS S3 SDK**: Cloud storage client

## Code Structure

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

## History

In the early ecosystem of Node.js, `npm publish` packaged and uploaded the entire directory by default. This frequently caused accidental leaks of configuration files like `.env`, local credentials, private test files, and redundant build cache. Although features like `.npmignore` and the `files` array in `package.json` were introduced, configuring them remains manual, tedious, and error-prone.

Regarding version control, managing multi-branch synchronization in monorepos typically requires developers to manually run checkout, pull, merge, and push operations. Active development tasks with uncommitted local changes further complicate these commands, increasing risk of merge conflicts and dirty commits.

This tool resolves these issues by utilizing Git shared clones (`git clone --shared`) and sandboxed publish directory restructuring. By compiling code into temporary structures, it eliminates the risk of publishing local files, while automating the git workflow to ensure a zero-configuration, secure release pipeline.
