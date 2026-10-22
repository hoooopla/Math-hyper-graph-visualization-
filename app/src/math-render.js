/**
 * Safely render mixed prose/LaTeX from the canonical solution-graph schema.
 * Canonical: $...$ inline and \[...\] display.
 * Legacy \( ... \) inline is read-only compatibility for old graphs.
 */
export function renderMath(value, katex) {
  const source = String(value ?? "");
  let cursor = 0;
  let output = "";

  while (cursor < source.length) {
    const opening = findOpening(source, cursor);
    if (!opening) {
      output += escapeText(source.slice(cursor));
      break;
    }
    output += escapeText(source.slice(cursor, opening.index));
    const contentStart = opening.index + opening.open.length;
    const closeAt = findClosing(source, contentStart, opening.close);
    if (closeAt < 0) {
      // Never interpret an unterminated delimiter as markup.
      output += escapeText(source.slice(opening.index, contentStart));
      cursor = contentStart;
      continue;
    }
    const tex = source.slice(contentStart, closeAt);
    const raw = source.slice(opening.index, closeAt + opening.close.length);
    if (katex && typeof katex.renderToString === "function") {
      try {
        output += katex.renderToString(tex, {
          displayMode: opening.display,
          throwOnError: false,
          trust: false,
          strict: "ignore",
          maxExpand: 1000,
          maxSize: 20,
          output: "htmlAndMathml",
        });
      } catch {
        output += escapeText(raw);
      }
    } else {
      output += '<span class="tex-fallback">' + escapeText(raw) + "</span>";
    }
    cursor = closeAt + opening.close.length;
  }
  return output;
}

function isEscaped(source, index) {
  let count = 0;
  for (let p = index - 1; p >= 0 && source[p] === "\\"; p -= 1) count += 1;
  return count % 2 === 1;
}

function findOpening(source, start) {
  for (let i = start; i < source.length; i += 1) {
    if (source[i] === "$" && !isEscaped(source, i)) {
      // The schema deliberately reserves $$ for literal prose, not display math.
      if (source[i + 1] === "$" || source[i - 1] === "$") continue;
      return { index: i, open: "$", close: "$", display: false };
    }
    if (source[i] === "\\" && !isEscaped(source, i)) {
      if (source.startsWith("\\[", i)) {
        return { index: i, open: "\\[", close: "\\]", display: true };
      }
      if (source.startsWith("\\(", i)) {
        return { index: i, open: "\\(", close: "\\)", display: false };
      }
    }
  }
  return null;
}

function findClosing(source, from, closing) {
  for (let i = from; i < source.length; i += 1) {
    if (source.startsWith(closing, i) && !isEscaped(source, i)) return i;
  }
  return -1;
}

function escapeText(value) {
  return value.replace(/\\\$/g, "$").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[char]).replace(/\n/g, "<br>");
}
