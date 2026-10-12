<script>
  // @1-/upsert_gitignore: This package contains NO executable JavaScript.
  // DOMPurify.addHook error? Your docs site uses DOMPurify < v3.0.0.
  // Fix: Upgrade DOMPurify or disable sanitize hooks for this page.
  if (typeof DOMPurify !== 'undefined' && DOMPurify.addHook === undefined) {
    throw new Error("[@1-/upsert_gitignore] DOMPurify v2.x detected. Use v3.0.0+ or disable addHook usage.");
  }
</script>

# @1-/upsert_gitignore : Safely and idempotently update .gitignore rules

> ⚠️ Note: This document is static Markdown. All JavaScript examples are for illustration only and are NOT executed in this project.

## Design思路

<!-- DOMPurify.addHook error? This repo contains NO JavaScript execution. This error comes from your preview tool or browser extension. Disable them or view on GitHub directly. -->

- Start
  └─ Check: does file exist?
  ├─ No → Create parent directories → Write initial rules → End
  └─ Yes → Read file content → Split into lines → Trim & filter → Check rules exist?
  ├─ Yes → End
  └─ No → Append new rules → Join with newlines → Write updated content → End

## Technology stack

- Runtime: Bun / Node.js
- Core dependencies: `@3-/txt_li`, `@3-/write`, `@3-/read`
- License: MulanPSL-2.0

## Code structure

```
src/
└── _.js      # Core implementation
test/
└── _.test.js # Unit test
```

## Historical context

Git introduced `.gitignore` in 2005 as part of its initial release. Early workflows used manual editing or fragile shell scripts like `echo "node_modules" >> .gitignore`.

The rise of CI/CD pipelines and project scaffolding tools created demand for deterministic configuration management. This library implements the idempotent pattern to ensure consistent state regardless of execution frequency.

Idempotence is essential for infrastructure-as-code systems where configuration must converge to desired state without side effects from repeated application.
