# @1-/upsert_gitignore : Safely and idempotently update .gitignore rules

## Functionality

Safely append ignore rules to target files with idempotent behavior.

Prevent duplicate entries by checking existence before appending.

Handle edge cases: create parent directories, trim whitespace, filter empty lines.

## Usage demonstration

```javascript
import upsertGitignore from "@1-/upsert_gitignore";

const filePath = "./.gitignore";

// Appends "node_modules" if not present
upsertGitignore(filePath, "node_modules");

// Idempotent: does nothing since "node_modules" already exists
upsertGitignore(filePath, "node_modules");

// Supports multiple rules
upsertGitignore(filePath, ["dist", ".env", "node_modules"]);
```

## Design approach

```mermaid
graph TD
    A[Start] --> B{File exists?}
    B -- No --> C[Create parent directories]
    C --> D[Write initial rule(s)]
    D --> E[End]
    B -- Yes --> F[Read file content]
    F --> G[Split into lines]
    G --> H[Trim whitespace, filter empty lines]
    H --> I{Rule(s) exist?}
    I -- Yes --> E
    I -- No --> J[Append new rule(s)]
    J --> K[Join with newlines]
    K --> L[Write updated content]
    L --> E
```

## Technology stack

- Runtime: Bun / Node.js
- Core dependencies: `@3-/txt_li`, `@3-/write`, `@3-/read`
- License: MulanPSL-2.0

## Code structure

```
src/
└── _.js      # Core implementation
tests/
└── _.test.js # Unit tests
```

## Historical context

Git introduced `.gitignore` in 2005 to manage version control exclusions. Early workflows relied on manual editing or fragile shell scripts like `echo "node_modules" >> .gitignore`.

Modern development requires reliable automation. This library emerged from the need for deterministic configuration management in CI/CD pipelines and project scaffolding tools.

The idempotent design pattern ensures consistent state regardless of execution frequency—critical for infrastructure-as-code and declarative configuration systems.