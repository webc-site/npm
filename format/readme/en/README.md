# @1-/format : Lightweight modular code formatter for JavaScript, Stylus, and SVG

## Functionality
Format code consistently across multiple languages. Supports JavaScript, Stylus, and SVG files with language-specific formatting rules.

## Usage demonstration
Install globally:
```bash
npm install -g @1-/format
```

Format files:
```bash
format file.js file.styl image.svg
```

Or use as a module:
```javascript
import format from '@1-/format';

const formatted = await format('path/to/file.js');
```

## Design philosophy
The formatter follows a modular architecture where each file type has its dedicated processor. This enables focused, language-specific formatting without cross-contamination.

```mermaid
graph TD
    A[CLI Entry] --> B[File Extension Detection]
    B --> C[JavaScript Processor]
    B --> D[Stylus Processor]
    B --> E[SVG Processor]
    C --> F[@1-/fix Rules]
    D --> G[@1-/stylus Parser/Formatter]
    E --> H[@3-/svgo Minifier]
```

## Technology stack
- Runtime: Node.js
- Core dependencies: @1-/fix, @1-/stylus, @3-/svgo
- CLI framework: yargs
- Utility libraries: @3-/read, @3-/write, @3-/log

## Code structure
```
src/
├── _.js          # Main entry point and dispatcher
├── bin.js        # CLI executable
├── js.js         # JavaScript formatter
├── styl.js       # Stylus formatter
└── svg.js        # SVG formatter
```

## Historical context
Code formatting tools evolved from simple indentation utilities in the 1970s to sophisticated, language-aware formatters. The modular approach of @1-/format reflects modern trends toward composable, single-responsibility tools rather than monolithic solutions. This design enables precise control over formatting behavior while maintaining simplicity and performance.