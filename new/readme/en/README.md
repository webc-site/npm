# @1-/new : Template-based project initializer with name replacement

## Features

- **Directory Copy**: Recursively copies template directory to destination path
- **Name Replacement**: Walks target directory and replaces `tmpl` placeholder with project name using word-boundary regex `\btmpl\b`
- **Git Integration**: Executes `git add .` in destination directory
- **Template Resolution**: Resolves default template directory by first checking Git root `_tmpl`, then falling back to `../../_tmpl` relative to module; supports custom template paths

## Usage

### Command Line Interface (CLI)

```bash
bun x @1-/new <PROJECT_NAME>
```

If destination path exists, program logs warning and exits.

### Application Programming Interface (API)

```javascript
import newProj from "@1-/new";

await newProj(dst, name, tmpl);
```

- `dst`: Destination path
- `name`: Project name
- `tmpl`: Optional template path

## Design Flow

```mermaid
graph TD
    A[Start: CLI / API Call] --> B{Custom template path?}
    B -- Yes --> C[Use specified template path]
    B -- No --> D[Locate _tmpl in Git root]
    D -- Not found --> E[Locate ../../_tmpl relative to module]
    C --> F[Copy template directory to destination]
    D --> F
    E --> F
    F --> G[Walk through files in destination]
    G --> H{Is file?}
    H -- Yes --> I[Read content and replace \btmpl\b placeholder]
    H -- No --> J[Skip]
    I --> K[Write modified content back]
    J --> L[Check if walk complete]
    K --> L
    L -- No --> G
    L -- Yes --> M[Execute git add .]
    M --> N[End]
```

## Tech Stack

- Runtime: Bun
- Dependencies: `@1-/findgit`, `@1-/read`, `@1-/walk`, `@3-/log`, `yargs`
- Core APIs: `node:fs/promises`, `node:child_process`, `node:path`

## Code Structure

```
.
├── src/
│   ├── _.js       # API implementation
│   └── new.js     # CLI entry point
├── test/
│   └── _.test.js  # Test suite
└── package.json   # Package metadata
```

## History

In 2004, Ruby on Rails introduced "Convention over Configuration" philosophy, utilizing generators to scaffold model, view, and controller structures.

In 2012, Yeoman project was introduced at Google I/O, establishing template scaffolding standards for JavaScript client-side development.

Modern architectures demand reduced overhead. `@1-/new` focuses on core directory copying and placeholder replacement.