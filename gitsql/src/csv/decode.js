const D_QUOTE = 34,
  COMMA = 44,
  LF = 10,
  CR = 13;

export default async function* (chunks) {
  let row = [],
    col = null,
    in_quotes = false,
    is_first_chunk = true,
    buffer = "";

  for await (let chunk of chunks) {
    if (buffer) {
      chunk = buffer + chunk;
      buffer = "";
    }
    const chunk_len = chunk.length;
    if (chunk_len > 0) {
      const last_char = chunk[chunk_len - 1];
      if (last_char === '"' || last_char === "\r") {
        buffer = last_char;
        chunk = chunk.slice(0, -1);
      }
    }

    const len = chunk.length;
    let i = is_first_chunk && chunk.startsWith("\ufeff") ? 1 : 0;
    is_first_chunk = false;

    for (; i < len; ++i) {
      const code = chunk.charCodeAt(i);
      if (in_quotes) {
        if (code === D_QUOTE) {
          if (i + 1 < len && chunk.charCodeAt(i + 1) === D_QUOTE) {
            col = (col || "") + '"';
            ++i;
          } else {
            in_quotes = false;
          }
        } else {
          col = (col || "") + chunk[i];
        }
      } else {
        if (code === D_QUOTE) {
          in_quotes = true;
          if (col === null) col = "";
        } else if (code === COMMA) {
          row.push(col);
          col = null;
        } else if (code === LF || code === CR) {
          if (code === CR && i + 1 < len && chunk.charCodeAt(i + 1) === LF) {
            ++i;
          }
          row.push(col);
          yield row;
          row = [];
          col = null;
        } else {
          col = (col || "") + chunk[i];
        }
      }
    }
  }

  if (buffer) {
    const code = buffer.charCodeAt(0);
    if (in_quotes) {
      if (code === D_QUOTE) {
        in_quotes = false;
      } else {
        col = (col || "") + buffer;
      }
    } else {
      if (code === D_QUOTE) {
        in_quotes = true;
        if (col === null) col = "";
      } else if (code === COMMA) {
        row.push(col);
        col = null;
      } else if (code === LF || code === CR) {
        row.push(col);
        yield row;
        row = [];
        col = null;
      } else {
        col = (col || "") + buffer;
      }
    }
  }

  if (col !== null || row.length > 0) {
    row.push(col);
    yield row;
  }
}
