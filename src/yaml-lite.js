/**
 * A deliberately small, safe YAML reader for the solution-hypergraph schema.
 * It supports mappings, sequences, quoted/plain scalars, inline arrays/maps,
 * and literal/folded block strings. Tags, aliases, and executable types are
 * intentionally unsupported.
 */
export function parseYaml(source) {
  if (typeof source !== "string") throw new TypeError("YAML source must be text.");
  const lines = preprocess(source);
  if (!lines.length) return null;
  const [value, next] = parseBlock(lines, 0, lines[0].indent);
  if (next < lines.length) throw syntaxError(lines[next], "Unexpected indentation.");
  return value;
}

function preprocess(source) {
  const raw = source.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").split("\n");
  const lines = [];
  for (let index = 0; index < raw.length; index += 1) {
    if (/^\s*$/.test(raw[index]) || /^\s*#/.test(raw[index])) continue;
    if (/\t/.test(raw[index].match(/^\s*/)?.[0] ?? "")) throw new Error(`Line ${index + 1}: tabs cannot be used for indentation.`);
    const indent = raw[index].match(/^ */)[0].length;
    let text = stripComment(raw[index].slice(indent)).trimEnd();
    const block = text.match(/^(.*?):\s*([>|])([+-]?)\s*$/);
    if (block) {
      const content = [];
      let cursor = index + 1;
      let contentIndent = null;
      while (cursor < raw.length) {
        const nextRaw = raw[cursor];
        if (/^\s*$/.test(nextRaw)) {
          content.push("");
          cursor += 1;
          continue;
        }
        const nextIndent = nextRaw.match(/^ */)[0].length;
        if (nextIndent <= indent) break;
        if (contentIndent === null) contentIndent = nextIndent;
        content.push(nextRaw.slice(Math.min(contentIndent, nextIndent)));
        cursor += 1;
      }
      const value = block[2] === ">" ? foldBlock(content) : content.join("\n");
      const chomped = block[3] === "-" ? value.replace(/\n+$/, "") : value;
      text = `${block[1]}: ${JSON.stringify(chomped)}`;
      index = cursor - 1;
    }
    lines.push({ indent, text, line: index + 1 });
  }
  return lines;
}

function foldBlock(lines) {
  let result = "";
  lines.forEach((line, index) => {
    if (index === 0) result = line;
    else if (line === "" || lines[index - 1] === "") result += `\n${line}`;
    else result += ` ${line}`;
  });
  return result;
}

function stripComment(text) {
  let quote = null;
  let escaped = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (escaped) { escaped = false; continue; }
    if (char === "\\" && quote === '"') { escaped = true; continue; }
    if ((char === '"' || char === "'") && (!quote || quote === char)) { quote = quote ? null : char; continue; }
    if (char === "#" && !quote && (index === 0 || /\s/.test(text[index - 1]))) return text.slice(0, index).trimEnd();
  }
  return text;
}

function parseBlock(lines, start, indent) {
  const line = lines[start];
  if (!line || line.indent < indent) return [null, start];
  return line.text.startsWith("- ") || line.text === "-"
    ? parseSequence(lines, start, indent)
    : parseMapping(lines, start, indent);
}

function parseMapping(lines, start, indent) {
  const result = {};
  let index = start;
  while (index < lines.length) {
    const line = lines[index];
    if (line.indent < indent) break;
    if (line.indent > indent) throw syntaxError(line, "Unexpected indentation in mapping.");
    if (line.text.startsWith("- ") || line.text === "-") break;
    const [key, rawValue] = splitPair(line);
    if (Object.prototype.hasOwnProperty.call(result, key)) throw syntaxError(line, `Duplicate key “${key}”.`);
    if (rawValue === "") {
      const next = lines[index + 1];
      if (next && next.indent > indent) {
        const parsed = parseBlock(lines, index + 1, next.indent);
        result[key] = parsed[0];
        index = parsed[1];
      } else {
        result[key] = null;
        index += 1;
      }
    } else {
      result[key] = parseScalar(rawValue, line);
      index += 1;
    }
  }
  return [result, index];
}

function parseSequence(lines, start, indent) {
  const result = [];
  let index = start;
  while (index < lines.length) {
    const line = lines[index];
    if (line.indent < indent) break;
    if (line.indent !== indent || !(line.text.startsWith("- ") || line.text === "-")) break;
    const rest = line.text === "-" ? "" : line.text.slice(2).trim();
    if (!rest) {
      const next = lines[index + 1];
      if (!next || next.indent <= indent) { result.push(null); index += 1; continue; }
      const parsed = parseBlock(lines, index + 1, next.indent);
      result.push(parsed[0]);
      index = parsed[1];
      continue;
    }
    if (findColon(rest) >= 0) {
      const synthetic = { ...line, text: rest, indent: indent + 2 };
      const [key, rawValue] = splitPair(synthetic);
      const item = {};
      item[key] = rawValue === "" ? null : parseScalar(rawValue, line);
      index += 1;
      if (index < lines.length && lines[index].indent > indent) {
        const childIndent = lines[index].indent;
        const parsed = parseMapping(lines, index, childIndent);
        Object.assign(item, parsed[0]);
        index = parsed[1];
      }
      result.push(item);
    } else {
      result.push(parseScalar(rest, line));
      index += 1;
    }
  }
  return [result, index];
}

function splitPair(line) {
  const colon = findColon(line.text);
  if (colon < 1) throw syntaxError(line, "Expected a ‘key: value’ pair.");
  const rawKey = line.text.slice(0, colon).trim();
  const key = unquote(rawKey, line);
  if (typeof key !== "string" || !key) throw syntaxError(line, "Mapping key must be a non-empty string.");
  return [key, line.text.slice(colon + 1).trim()];
}

function findColon(text) {
  let quote = null;
  let square = 0;
  let curly = 0;
  let escaped = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (escaped) { escaped = false; continue; }
    if (char === "\\" && quote === '"') { escaped = true; continue; }
    if ((char === '"' || char === "'") && (!quote || quote === char)) { quote = quote ? null : char; continue; }
    if (quote) continue;
    if (char === "[") square += 1;
    if (char === "]") square -= 1;
    if (char === "{") curly += 1;
    if (char === "}") curly -= 1;
    if (char === ":" && square === 0 && curly === 0) return index;
  }
  return -1;
}

function parseScalar(raw, line) {
  const value = raw.trim();
  if (value.startsWith("[") || value.startsWith("{")) return parseInline(value, line);
  if (value.startsWith('"') || value.startsWith("'")) return unquote(value, line);
  if (/^(null|~)$/i.test(value)) return null;
  if (/^(true|false)$/i.test(value)) return value.toLowerCase() === "true";
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)) return Number(value);
  if (/^[!&*]/.test(value)) throw syntaxError(line, "YAML tags, anchors, and aliases are not supported.");
  return value;
}

function parseInline(value, line) {
  const array = value[0] === "[";
  const end = array ? "]" : "}";
  if (!value.endsWith(end)) throw syntaxError(line, "Unclosed inline sequence or mapping.");
  const body = value.slice(1, -1).trim();
  if (!body) return array ? [] : {};
  const items = splitInlineItems(body, line);
  if (array) return items.map((item) => parseScalar(item, line));
  const mapping = {};
  for (const item of items) {
    const colon = findColon(item);
    if (colon < 0) throw syntaxError(line, "Expected key: value in inline mapping.");
    const rawKey = item.slice(0, colon).trim();
    const key = rawKey.startsWith("'") || rawKey.startsWith('"') ? unquote(rawKey, line) : rawKey;
    if (!key || Object.prototype.hasOwnProperty.call(mapping, key))
      throw syntaxError(line, `Invalid or duplicate inline key “${key}”.`);
    mapping[key] = parseScalar(item.slice(colon + 1).trim(), line);
  }
  return mapping;
}

function splitInlineItems(body, line) {
  const chunks = [];
  let quote = null;
  let escaped = false;
  let square = 0;
  let curly = 0;
  let from = 0;
  for (let i = 0; i < body.length; i += 1) {
    const char = body[i];
    if (escaped) { escaped = false; continue; }
    if (char === "\\" && quote === '"') { escaped = true; continue; }
    if ((char === "'" || char === '"') && (!quote || quote === char)) {
      // YAML doubles single-quote characters within single-quoted scalars.
      if (char === "'" && quote === "'" && body[i + 1] === "'") { i += 1; continue; }
      quote = quote ? null : char;
      continue;
    }
    if (quote) continue;
    if (char === "[") square += 1;
    if (char === "]") square -= 1;
    if (char === "{") curly += 1;
    if (char === "}") curly -= 1;
    if (square < 0 || curly < 0) throw syntaxError(line, "Unbalanced inline brackets.");
    if (char === "," && square === 0 && curly === 0) {
      const item = body.slice(from, i).trim();
      if (!item) throw syntaxError(line, "Empty inline item.");
      chunks.push(item);
      from = i + 1;
    }
  }
  if (quote || square !== 0 || curly !== 0) throw syntaxError(line, "Unbalanced inline quotes or brackets.");
  const last = body.slice(from).trim();
  // Allow YAML trailing commas in flow collections.
  if (last) chunks.push(last);
  return chunks;
}
function unquote(value, line) {
  if (value.startsWith("'")) {
    if (!value.endsWith("'")) throw syntaxError(line, "Unterminated single-quoted string.");
    return value.slice(1, -1).replace(/''/g, "'");
  }
  if (value.startsWith('"')) {
    try { return JSON.parse(value); }
    catch { throw syntaxError(line, "Invalid double-quoted string; backslashes must use JSON-style escapes."); }
  }
  return value;
}

function syntaxError(line, message) {
  return new Error(`Line ${line.line}: ${message}`);
}
