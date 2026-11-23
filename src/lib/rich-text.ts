import DOMPurify from "dompurify";

const escapeHtml = (value: unknown) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");

function decodeEntities(value: string): string {
  return value
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&#x0*3c;|&#60;/gi, "<")
    .replace(/&#x0*3e;|&#62;/gi, ">")
    .replace(/&#x0*26;|&#38;/gi, "&")
    .replace(/&amp;/gi, "&");
}

function plainTextToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function marksToHtml(text: string, marks: unknown): string {
  let html = escapeHtml(text);
  if (!Array.isArray(marks)) return html;
  for (const mark of marks) {
    if (!mark || typeof mark !== "object") continue;
    const m = mark as { type?: string; attrs?: Record<string, unknown> };
    if (m.type === "bold") html = `<strong>${html}</strong>`;
    if (m.type === "italic") html = `<em>${html}</em>`;
    if (m.type === "underline") html = `<u>${html}</u>`;
    if (m.type === "strike") html = `<s>${html}</s>`;
    if (m.type === "code") html = `<code>${html}</code>`;
    if (m.type === "link" && typeof m.attrs?.href === "string") {
      const href = escapeHtml(m.attrs.href);
      html = `<a href="${href}" rel="noopener noreferrer">${html}</a>`;
    }
  }
  return html;
}

function tiptapNodeToHtml(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as { type?: string; text?: string; attrs?: Record<string, unknown>; content?: unknown[]; marks?: unknown };
  if (n.type === "text") return marksToHtml(n.text ?? "", n.marks);
  const content = Array.isArray(n.content) ? n.content.map(tiptapNodeToHtml).join("") : "";
  const attrs = n.attrs ?? {};
  switch (n.type) {
    case "doc": return content;
    case "paragraph": return `<p>${content}</p>`;
    case "heading": {
      const level = Number(attrs.level);
      const safeLevel = level === 1 ? 2 : level === 3 ? 3 : 2;
      return `<h${safeLevel}>${content}</h${safeLevel}>`;
    }
    case "bulletList": return `<ul>${content}</ul>`;
    case "orderedList": return `<ol>${content}</ol>`;
    case "listItem": return `<li>${content}</li>`;
    case "blockquote": return `<blockquote>${content}</blockquote>`;
    case "codeBlock": return `<pre><code>${content}</code></pre>`;
    case "horizontalRule": return "<hr>";
    case "hardBreak": return "<br>";
    case "image": {
      const src = typeof attrs.src === "string" ? escapeHtml(attrs.src) : "";
      const alt = typeof attrs.alt === "string" ? escapeHtml(attrs.alt) : "";
      return src ? `<img src="${src}" alt="${alt}" loading="lazy">` : "";
    }
    case "table": return `<table>${content}</table>`;
    case "tableRow": return `<tr>${content}</tr>`;
    case "tableHeader": return `<th>${content}</th>`;
    case "tableCell": return `<td>${content}</td>`;
    default: return content;
  }
}

function normalizeRichText(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object") return tiptapNodeToHtml(parsed);
    } catch {
      // Fall through and treat malformed JSON as text/HTML.
    }
  }

  const decoded = decodeEntities(trimmed);
  if (!/<[a-z][\s\S]*>/i.test(decoded)) return plainTextToHtml(decoded);

  // A description containing H1 is legacy/editor data. Promote it to H2.
  return decoded
    .replace(/<\s*h1\b[^>]*>/gi, "<h2>")
    .replace(/<\s*\/\s*h1\s*>/gi, "</h2>");
}

export function sanitizeRichText(html: string | null | undefined): string {
  if (!html) return "";
  const source = normalizeRichText(html);

  if (typeof window === "undefined") {
    return source
      .replace(/<\s*(script|style|iframe|object|embed)[^>]*>.*?<\s*\/\s*\1\s*>/gis, "")
      .replace(/<\s*(script|style|iframe|object|embed)[^>]*>/gis, "")
      .replace(/\s(?:on[a-z]+|style|srcdoc)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
      .replace(/\s+href\s*=\s*["']\s*(javascript|data|vbscript):[^"']*["']/gi, ' href="#"')
      .replace(/\s+src\s*=\s*["']\s*(javascript|data:text\/html|vbscript):[^"']*["']/gi, '');
  }

  return DOMPurify.sanitize(source, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["h1", "script", "style", "iframe", "object", "embed", "form"],
    FORBID_ATTR: ["style", "srcdoc", "onload", "onerror", "onclick"],
    ADD_TAGS: ["table", "thead", "tbody", "tfoot", "tr", "th", "td"],
  });
}
