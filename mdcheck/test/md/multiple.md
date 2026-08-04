# Multiple Mermaid Blocks

First block is valid:

```mermaid
flowchart LR
  Start --> Stop
```

Second block is invalid:

```mermaid
sequenceDiagram
  Alice->>Bob: Hello
  Trash line here!!!
```
