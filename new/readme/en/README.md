# @1-/new : Template-based project initializer with name replacement

Generates target directory structure by copying templates and replacing placeholders.

## Features

- **Directory Copy**: Copies template directory to destination path.
- **Name Replacement**: Scans copied files and replaces `tmpl` placeholder in text content with project name.
- **Git Integration**: Executes `git add .` in destination directory to stage files.
- **Template Resolution**: Resolves default template directory from Git root `_tmpl` or package structure. Supports custom template paths.

## Design Flow

```mermaid
graph TD
    A[Start: CLI / API Call] --> B{Custom template path?}
    B -- Yes --> C[Use specified template path]
    B -- No --> D[Locate _tmpl in Git root or package directory]
    C --> E[Copy template directory to destination]
    D --> E
    E --> F[Walk through files in destination]
    F --> G{Is file?}
    G -- Yes --> H[Read content and replace tmpl placeholder]
    G -- No --> I[Skip]
    H --> J[Write modified content back]
    I --> K[Check if walk complete]
    J --> K
    K -- No --> F
    K -- Yes --> L[Execute git add]
    L --> M[End]
```

## Tech Stack

- **Runtime**: Bun
- **Dependencies**: `@1-/walk`, `@1-/findgit`, `@3-/log`, `yargs`
- **APIs**: `node:fs/promises` (`cp`, `readFile`, `writeFile`), `node:child_process` (`exec`)

## Directory Structure

```
.
├── src/
│   ├── _.js       # API implementation
│   └── new.js     # CLI entry point
├── tests/
│   └── _.test.js  # Test suite
└── package.json   # Package metadata
```

## Usage

### CLI

Initialize project via command line:

```bash
bun x @1-/new <PROJECT_NAME>
```

If destination path exists, program logs warning and exits.

### API

```javascript
import newProj from "@1-/new";

await newProj("destination/path", "project-name", "optional/template/path");
```

## History

In 2004, Ruby on Rails introduced "Convention over Configuration" philosophy, utilizing generators to scaffold model, view, and controller structures.

In 2012, Yeoman project was introduced at Google I/O, establishing template scaffolding standards for JavaScript client-side development.

Modern architectures demand reduced overhead. `@1-/new` focuses on core directory copying and placeholder replacement.
