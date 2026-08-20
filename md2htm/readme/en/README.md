# md2htm : Lightweight Markdown-to-HTML Converter

## Functionality

Converts Markdown text to semantic HTML output. Supports standard Markdown syntax plus extensions including admonition blocks (`[!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]`), math notation (`<c-math>`), and GitHub-style tables with alignment support.

## Usage Example

```javascript
import md2htm from "@1-/md2htm";

const markdown = "# Hello\n\nThis is **bold** text.\n\n[!NOTE]\nThis is an admonition block.";
const html = md2htm(markdown);
// Returns semantic HTML with proper class attributes and structure
```

## Design Approach

The converter implements a three-stage pipeline:

```mermaid
graph TD
    A[Markdown Text] --> B[Streaming Parser]
    B --> C[Compact AST Representation]
    C --> D[Semantic HTML Renderer]
    D --> E[Safe HTML Output]
```

Key implementation features:

- Memory-efficient AST using integer-based node types (`T_H=2`, `T_P=3`, etc.)
- Streaming parsing that processes text line-by-line
- Custom HTML encoding/decoding with comprehensive entity support
- Admonition block detection and semantic class generation (`<blockquote class="q note">`)
- Math notation support with `<c-math>` custom elements
- GitHub-style table alignment support (`left`, `center`, `right`)

## Technology Stack

- Pure JavaScript ES modules (no external dependencies)
- Custom AST-based parsing engine
- Semantic HTML generation with accessibility considerations
- Comprehensive HTML entity decoding (17+ entities supported)
- Safe URL encoding with RFC-compliant handling

## Code Structure

```
src/
├── _.js          # Main entry point with default export
├── ast.js        # Core parser with streaming architecture
├── lib.js        # AST-to-HTML coordinator
├── renderBlock.js # Block-level renderer
├── htmD.js       # HTML decoder with entity mappings and punctuation handling
└── htmE.js       # HTML encoder with 4-character entity escaping
```

## Historical Context

Markdown was created by John Gruber in 2004 to enable easy-to-read, easy-to-write plain text formatting. Aaron Swartz provided critical feedback on its syntax design. This md2htm implementation continues that tradition with modern optimizations, using integer-based AST nodes for memory efficiency and streaming parsing for performance.