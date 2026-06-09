# @1-/md : Extract Code Block Positions and Languages from Markdown

## Features

Provides Markdown text parsing capabilities.
Splits Markdown text by line, filtering trailing whitespace.
Identifies Markdown code blocks.
Extracts code block languages, recording starting and ending line numbers.
Supports identification and positioning of unclosed code blocks.

## Tech Stack

- **Runtime**: Bun / Node.js
- **Language**: JavaScript (ES Modules)
- **Linter/Formatter**: Oxlint / Oxfmt

## Directory Structure

```
.
├── src/
│   ├── const/
│   │   └── BT3.js       # Code block identifier constant
│   ├── code.js          # Code block extraction logic
│   └── li.js            # Line splitting and trimming logic
└── tests/
    ├── _.test.js        # Unit tests
    └── test.md          # Markdown file for testing
```

## Design thinking

System consists of line splitting module and code block extraction module.

1. Line splitting module normalizes line breaks, splits text into line array, and trims trailing whitespace.
2. Code block extraction module iterates through line array, using state machine to identify code block delimiters.
3. Records code block language and start line. Records end line upon matching ending delimiter or reaching end of text.

````mermaid
graph TD
    RawText[Raw Markdown Text] --> |li.js| LineArray[Line Array]
    LineArray --> |code.js Iteration| StateCheck{Inside Code Block?}
    StateCheck --> |No: Match ```lang| StartBlock[Record Start Line & Language]
    StateCheck --> |Yes: Match ```| EndBlock[Record End Line & Export]
    StateCheck --> |Yes: Reach EOF| EOFBlock[Record EOF Line & Export]
````

## Usage

```javascript
import li from "@1-/md/li.js";
import code from "@1-/md/code.js";

const markdownContent = `# Title

\`\`\`javascript
const val = 1;
\`\`\`
`;

// 1. Split text into lines
const lines = li(markdownContent);

// 2. Identify code block positions
const blocks = code(lines);

console.log(blocks);
// Output: [ [ 'javascript', 3, 5 ] ]
```

## Historical Trivia

Markdown was created in 2004 by John Gruber and Aaron Swartz.
The goal was to enable writing easy-to-read and easy-to-write plain text formatting, converting it into structurally valid XHTML or HTML.
Fenced code blocks were not part of the original Markdown specification. They were popularized by GitHub Flavored Markdown, greatly simplifying code inclusion in documentation, and eventually becoming an industry standard.
