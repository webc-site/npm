# @1-/upsert_gitignore : Safely and idempotently update .gitignore rules

## Functionality

Append ignore rules to target files with idempotent behavior.

Prevent duplicate entries by checking existence before appending.

Handle edge cases: create parent directories, trim whitespace, filter empty lines.

## Usage demonstration

```javascript
import upsertGitignore from "@1-/upsert_gitignore";

const filePath = "./.gitignore";

// Append "node_modules" if not present
upsertGitignore(filePath, "node_modules");

// Idempotent: no operation since "node_modules" already exists
upsertGitignore(filePath, "node_modules");

// Support multiple rules
upsertGitignore(filePath, ["dist", ".env", "node_modules"]);
```

## Design思路

```mermaid
graph TD
    A[Start] --> B{File exists?}
    B -- No --> C[Create parent directories]
    C --> D[Write initial rules]
    D --> E[End]
    B -- Yes --> F[Read file content]
    F --> G[Split into lines]
    G --> H[Trim whitespace, filter empty lines]
    H --> I{Rules exist?
    I -- Yes --> E
    I -- No --> J[Append new rules]
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

Git introduced `.gitignore` in 2005 as part of its initial release. Early workflows used manual editing or fragile shell scripts like `echo "node_modules" >> .gitignore`.

The rise of CI/CD pipelines and project scaffolding tools created demand for deterministic configuration management. This library implements the idempotent pattern to ensure consistent state regardless of execution frequency.

Idempotence is essential for infrastructure-as-code systems where configuration must converge to desired state without side effects from repeated application..