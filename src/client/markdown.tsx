/**
 * 笔记正文的 Markdown ↔ HTML 双向转换（Notion 式所见即所得编辑器的内核）。
 *
 * - markdownToHtml：把笔记正文（Markdown 源码）渲染成可编辑 HTML；
 *   dshui:// 回链渲染为「灰色链接 + hover 返回按钮」的包裹结构。
 * - serializeToMarkdown：把 contentEditable 里的 DOM 序列化回 Markdown，
 *   与 markdownToHtml 互为逆操作（覆盖本插件支持的块级/行内子集）。
 */

const ESCAPE_RE = /[&<>"]/g;
const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
};

function escapeHtml(text: string): string {
  return text.replace(ESCAPE_RE, (ch) => ESCAPES[ch]);
}

const INLINE_RE =
  /(\*\*[^*]+\*\*)|(\*[^*]+\*)|(__[^_]+__)|(_[^_]+_)|(~~[^~]+~~)|(`[^`]+`)|(\[[^\]]*\]\([^)]*\))/g;

const DSHUI_LINK_RE = /^dshui:\/\/session\/(.+)$/;

function renderInline(text: string, backLabel: string): string {
  let out = "";
  let last = 0;
  let match: RegExpExecArray | null;
  INLINE_RE.lastIndex = 0;
  while ((match = INLINE_RE.exec(text)) !== null) {
    if (match.index > last) out += escapeHtml(text.slice(last, match.index));
    const [whole, bold, italic, boldU, italicU, strike, code, link] = match;
    if (bold !== undefined || boldU !== undefined) {
      out += `<strong>${escapeHtml(whole.slice(2, -2))}</strong>`;
    } else if (italic !== undefined || italicU !== undefined) {
      out += `<em>${escapeHtml(whole.slice(1, -1))}</em>`;
    } else if (strike !== undefined) {
      out += `<del>${escapeHtml(whole.slice(2, -2))}</del>`;
    } else if (code !== undefined) {
      out += `<code>${escapeHtml(whole.slice(1, -1))}</code>`;
    } else if (link !== undefined) {
      const label = whole.slice(1, whole.indexOf("]("));
      const href = whole.slice(whole.indexOf("](") + 2, -1).trim();
      const session = DSHUI_LINK_RE.exec(href);
      if (session !== null) {
        out +=
          `<span class="dshui-link-wrap">` +
          `<a class="dshui-link" data-href="${escapeHtml(href)}">${escapeHtml(label)}</a>` +
          `<button class="dshui-link-back" type="button" contenteditable="false" data-session="${escapeHtml(session[1])}">${escapeHtml(backLabel)}</button>` +
          `</span>`;
      } else {
        out += `<a class="dshui-extlink" href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`;
      }
    }
    last = match.index + whole.length;
  }
  if (last < text.length) out += escapeHtml(text.slice(last));
  return out;
}

function renderTable(lines: string[], backLabel: string): string {
  if (lines.length < 2) return "";
  const split = (line: string) =>
    line
      .replace(/^\s*\|/, "")
      .replace(/\|\s*$/, "")
      .split("|")
      .map((cell) => cell.trim());
  const header = split(lines[0]);
  const sep = split(lines[1]);
  if (sep.length === 0 || !sep.every((cell) => /^:?-{1,}:?$/.test(cell))) return "";
  const aligns = sep.map((cell) =>
    cell.startsWith(":") && cell.endsWith(":")
      ? ' style="text-align:center"'
      : cell.endsWith(":")
        ? ' style="text-align:right"'
        : "",
  );
  const rows = lines.slice(2).map(split);
  let out = "<table><thead><tr>";
  for (let i = 0; i < header.length; i++) {
    out += `<th${aligns[i]}>${renderInline(header[i], backLabel)}</th>`;
  }
  out += "</tr></thead><tbody>";
  for (const row of rows) {
    out += "<tr>";
    for (let i = 0; i < header.length; i++) {
      out += `<td${aligns[i]}>${renderInline(row[i] ?? "", backLabel)}</td>`;
    }
    out += "</tr>";
  }
  out += "</tbody></table>";
  return out;
}

/** 列表：两级嵌套，返回 HTML 与消费的行数。 */
function renderList(lines: string[], start: number, ordered: boolean, backLabel: string): { html: string; next: number } {
  let html = "";
  let i = start;
  while (i < lines.length) {
    const line = lines[i];
    const match = ordered ? /^\s*(\d+)[.)]\s+(.*)$/.exec(line) : /^\s*([-*+])\s+(.*)$/.exec(line);
    if (match === null) break;
    const indent = /^\s*/.exec(line)?.[0].length ?? 0;
    const subLines: string[] = [];
    let j = i + 1;
    while (j < lines.length) {
      const subIndent = /^\s*/.exec(lines[j])?.[0].length ?? 0;
      if (subIndent <= indent && lines[j].trim() !== "") break;
      if (lines[j].trim() === "") {
        j += 1;
        continue;
      }
      subLines.push(lines[j].replace(/^\s{0,4}/, ""));
      j += 1;
    }
    let sub = "";
    if (/^\s*([-*+]|\d+[.)])\s+/.test(subLines[0] ?? "")) {
      const subOrdered = /^\s*\d+[.)]/.test(subLines[0]);
      sub = renderList(subLines, 0, subOrdered, backLabel).html;
    }
    html += `<li>${renderInline(match[2], backLabel)}${sub}</li>`;
    i = j;
  }
  return { html: ordered ? `<ol>${html}</ol>` : `<ul>${html}</ul>`, next: i };
}

export interface MarkdownHtmlOptions {
  /** 回链 hover 按钮文案。 */
  backLabel?: string;
}

/** Markdown → 可编辑 HTML 字符串。 */
export function markdownToHtml(source: string, options: MarkdownHtmlOptions = {}): string {
  const backLabel = options.backLabel ?? "↩";
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      i += 1;
      continue;
    }
    const fence = /^\s*(```|~~~)(\S*)\s*$/.exec(line);
    if (fence !== null) {
      const buf: string[] = [];
      i += 1;
      while (i < lines.length && !new RegExp(`^\\s*${fence[1]}\\s*$`).test(lines[i])) {
        buf.push(lines[i]);
        i += 1;
      }
      i += 1;
      blocks.push(`<pre><code>${escapeHtml(buf.join("\n"))}</code></pre>`);
      continue;
    }
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading !== null) {
      // 标题用带类的段落渲染（结构仍是 P，浏览器块操作稳定），
      // 序列化时按类还原为 "# " 前缀。
      blocks.push(`<p class="dshui-md-h${heading[1].length}">${renderInline(heading[2], backLabel)}</p>`);
      i += 1;
      continue;
    }
    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) {
      blocks.push("<hr/>");
      i += 1;
      continue;
    }
    if (/^\s*\|.*\|\s*$/.test(line)) {
      const tableLines: string[] = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) {
        tableLines.push(lines[i]);
        i += 1;
      }
      const table = renderTable(tableLines, backLabel);
      if (table !== "") blocks.push(table);
      else {
        i -= tableLines.length - 1;
        blocks.push(`<p>${renderInline(tableLines[0], backLabel)}</p>`);
      }
      continue;
    }
    if (/^\s*>/.test(line)) {
      const buf: string[] = [];
      while (
        i < lines.length &&
        (/^\s*>/.test(lines[i]) ||
          (lines[i].trim() === "" && i + 1 < lines.length && /^\s*>/.test(lines[i + 1])))
      ) {
        buf.push(lines[i].trim() === "" ? "" : lines[i].replace(/^\s*>\s?/, ""));
        i += 1;
      }
      blocks.push(`<blockquote>${markdownToHtml(buf.join("\n"))}</blockquote>`);
      continue;
    }
    const ordered = /^\s*\d+[.)]\s+/.test(line);
    const bullet = /^\s*[-*+]\s+/.test(line);
    if (ordered || bullet) {
      const result = renderList(lines, i, ordered, backLabel);
      blocks.push(result.html);
      i = result.next;
      continue;
    }
    const buf: string[] = [line];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{1,6})\s/.test(lines[i]) &&
      !/^\s*(```|~~~)/.test(lines[i]) &&
      !/^\s*>/.test(lines[i]) &&
      !/^\s*([-*+]|\d+[.)])\s+/.test(lines[i]) &&
      !/^\s*(\*\*\*|---|___)\s*$/.test(lines[i])
    ) {
      buf.push(lines[i]);
      i += 1;
    }
    blocks.push(`<p>${renderInline(buf.join("\n").replace(/\n/g, " "), backLabel)}</p>`);
  }
  // 空笔记给一个起始段落：保证输入始终落在真实块里（快捷输入依赖块结构）。
  if (blocks.length === 0) return "<p><br/></p>";
  return blocks.join("");
}

// ---------------------------------------------------------------------------
// DOM → Markdown 序列化（markdownToHtml 的逆操作）
// ---------------------------------------------------------------------------

function textOf(node: Node): string {
  return node.textContent ?? "";
}

/** 行内序列化：跳过返回按钮，链接还原为 [text](url)。 */
function inlineToMd(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.nodeValue ?? "";
  if (!(node instanceof Element)) return "";
  const tag = node.tagName;
  switch (tag) {
    case "BR":
      return "\n";
    case "STRONG":
      return `**${textOf(node)}**`;
    case "EM":
      return `*${textOf(node)}*`;
    case "DEL":
      return `~~${textOf(node)}~~`;
    case "CODE":
      return `\`${textOf(node)}\``;
    case "A": {
      const href = node.getAttribute("href") ?? node.getAttribute("data-href") ?? "";
      return `[${textOf(node)}](${href})`;
    }
    case "BUTTON":
      return ""; // 返回按钮不进入 Markdown
    case "SPAN": {
      if (node.classList.contains("dshui-link-wrap")) {
        const anchor = node.querySelector("a.dshui-link");
        const href = anchor?.getAttribute("data-href") ?? "";
        return `[${textOf(anchor ?? node)}](${href})`;
      }
      break;
    }
    default:
      break;
  }
  let out = "";
  for (const child of Array.from(node.childNodes)) out += inlineToMd(child);
  return out;
}

/** 块级序列化。 */
function blockToMd(el: Element): string {
  const tag = el.tagName;
  switch (tag) {
    case "P": {
      const cls = el.getAttribute("class") ?? "";
      const h = /(?:^|\s)dshui-md-h([1-6])(?:\s|$)/.exec(cls);
      if (h !== null) return `${"#".repeat(Number(h[1]))} ${inlineToMd(el).trim()}`;
      if (/(?:^|\s)dshui-md-ul(?:\s|$)/.test(cls)) return `- ${inlineToMd(el).trim()}`;
      if (/(?:^|\s)dshui-md-ol(?:\s|$)/.test(cls)) return `1. ${inlineToMd(el).trim()}`;
      if (/(?:^|\s)dshui-md-quote(?:\s|$)/.test(cls)) return `> ${inlineToMd(el).trim()}`;
      return inlineToMd(el).trim();
    }
    case "H1":
    case "H2":
    case "H3":
    case "H4":
    case "H5":
    case "H6": {
      const level = Number(tag[1]);
      return `${"#".repeat(level)} ${inlineToMd(el).trim()}`;
    }
    case "UL":
    case "OL":
      return listToMd(el, tag === "OL");
    case "BLOCKQUOTE": {
      const inner = Array.from(el.childNodes)
        .map((child) => (child instanceof Element ? blockToMd(child) : ""))
        .filter((s) => s !== "")
        .join("\n");
      return inner
        .split("\n")
        .map((l) => `> ${l}`)
        .join("\n");
    }
    case "PRE": {
      const code = el.querySelector("code") ?? el;
      return "```\n" + textOf(code).replace(/\n$/, "") + "\n```";
    }
    case "HR":
      return "---";
    case "TABLE":
      return tableToMd(el);
    case "DIV":
    case "SECTION":
    case "SPAN": {
      // 浏览器编辑可能产生裸 DIV：按段落处理其行内内容。
      const parts: string[] = [];
      for (const child of Array.from(el.childNodes)) {
        if (child instanceof Element) parts.push(blockToMd(child));
        else if (child.nodeType === Node.TEXT_NODE && (child.nodeValue ?? "").trim() !== "") {
          parts.push((child.nodeValue ?? "").trim());
        }
      }
      return parts.filter((s) => s !== "").join("\n\n");
    }
    default:
      return inlineToMd(el).trim();
  }
}

function listToMd(el: Element, ordered: boolean): string {
  const items: string[] = [];
  let n = 0;
  for (const li of Array.from(el.querySelectorAll(":scope > li"))) {
    n += 1;
    const inner: string[] = [];
    let childList = "";
    for (const child of Array.from(li.childNodes)) {
      if (child instanceof Element && (child.tagName === "UL" || child.tagName === "OL")) {
        childList = listToMd(child, child.tagName === "OL");
      } else {
        const part = child instanceof Element ? blockToMd(child) : (child.nodeValue ?? "");
        if (part.trim() !== "") inner.push(part.trim());
      }
    }
    const line = `${ordered ? `${n}.` : "-"} ${inner.join(" ")}`;
    items.push(line);
    if (childList !== "") {
      for (const sub of childList.split("\n")) items.push(`  ${sub}`);
    }
  }
  return items.join("\n");
}

function tableToMd(el: Element): string {
  const rows: string[] = [];
  const trs = Array.from(el.querySelectorAll("tr"));
  if (trs.length === 0) return "";
  const rowOf = (tr: Element): string[] => {
    const cells: string[] = [];
    for (const cell of Array.from(tr.children)) {
      cells.push(inlineToMd(cell).replace(/\|/g, "\\|").trim());
    }
    return cells;
  };
  const header = rowOf(trs[0]);
  rows.push(`| ${header.join(" | ")} |`);
  rows.push(`| ${header.map(() => "---").join(" | ")} |`);
  for (const tr of trs.slice(1)) {
    rows.push(`| ${rowOf(tr).join(" | ")} |`);
  }
  return rows.join("\n");
}

/** contentEditable DOM → Markdown 源码。 */
export function serializeToMarkdown(root: Element): string {
  const parts: string[] = [];
  for (const child of Array.from(root.childNodes)) {
    if (child instanceof Element) {
      const md = blockToMd(child).trim();
      if (md !== "") parts.push(md);
    } else if (child.nodeType === Node.TEXT_NODE && (child.nodeValue ?? "").trim() !== "") {
      parts.push((child.nodeValue ?? "").trim());
    }
  }
  return parts.join("\n\n") + (parts.length > 0 ? "\n" : "");
}
