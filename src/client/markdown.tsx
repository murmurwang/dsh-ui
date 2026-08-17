import * as React from "react";

/**
 * 轻量 Markdown 渲染器（无外部依赖，仅预览用）：
 * 标题、段落、引用、有序/无序列表（两级嵌套）、围栏代码块、
 * 分隔线、GFM 表格、行内加粗/斜体/删除线/行内代码/链接。
 * 输出走 React 文本节点，天然转义原始 HTML。
 */

type InlineNode = string | React.ReactElement;

const INLINE_RE = /(\*\*[^*]+\*\*)|(\*[^*]+\*)|(__[^_]+__)|(_[^_]+_)|(~~[^~]+~~)|(`[^`]+`)|(\[[^\]]*\]\([^)]*\))/g;

function renderInline(text: string, keyBase: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  INLINE_RE.lastIndex = 0;
  let i = 0;
  while ((match = INLINE_RE.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const [whole, bold, italic, boldU, italicU, strike, code, link] = match;
    const key = `${keyBase}-${i++}`;
    if (bold !== undefined || boldU !== undefined) {
      nodes.push(<strong key={key}>{whole.slice(2, -2)}</strong>);
    } else if (italic !== undefined || italicU !== undefined) {
      nodes.push(<em key={key}>{whole.slice(1, -1)}</em>);
    } else if (strike !== undefined) {
      nodes.push(<del key={key}>{whole.slice(2, -2)}</del>);
    } else if (code !== undefined) {
      nodes.push(<code key={key}>{whole.slice(1, -1)}</code>);
    } else if (link !== undefined) {
      const label = whole.slice(1, whole.indexOf("]("));
      const href = whole.slice(whole.indexOf("](") + 2, -1).trim();
      nodes.push(
        <a key={key} href={href} target="_blank" rel="noreferrer">
          {label}
        </a>,
      );
    }
    last = match.index + whole.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function renderTable(lines: string[], keyBase: string): React.ReactElement | null {
  if (lines.length < 2) return null;
  const split = (line: string) =>
    line
      .replace(/^\s*\|/, "")
      .replace(/\|\s*$/, "")
      .split("|")
      .map((cell) => cell.trim());
  const header = split(lines[0]);
  const sep = split(lines[1]);
  if (sep.length === 0 || !sep.every((cell) => /^:?-{1,}:?$/.test(cell))) return null;
  const aligns = sep.map((cell) =>
    cell.startsWith(":") && cell.endsWith(":") ? "center" : cell.endsWith(":") ? "right" : "left",
  );
  const rows = lines.slice(2).map(split);
  return (
    <table key={keyBase}>
      <thead>
        <tr>
          {header.map((cell, i) => (
            <th key={i} style={{ textAlign: aligns[i] ?? "left" }}>
              {renderInline(cell, `${keyBase}-h${i}`)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri}>
            {header.map((_, ci) => (
              <td key={ci} style={{ textAlign: aligns[ci] ?? "left" }}>
                {renderInline(row[ci] ?? "", `${keyBase}-r${ri}c${ci}`)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function renderList(lines: string[], start: number, ordered: boolean, keyBase: string) {
  const items: React.ReactNode[] = [];
  let i = start;
  let k = 0;
  while (i < lines.length) {
    const line = lines[i];
    const match = ordered ? /^\s*(\d+)[.)]\s+(.*)$/.exec(line) : /^\s*[-*+]\s+(.*)$/.exec(line);
    if (match === null) break;
    const indent = /^\s*/.exec(line)?.[0].length ?? 0;
    // 仅支持两级嵌套：收集更深的子行。
    const subLines: string[] = [];
    let j = i + 1;
    while (j < lines.length) {
      const subIndent = /^\s*/.exec(lines[j])?.[0].length ?? 0;
      if (subIndent <= indent && !/^\s*$/.test(lines[j])) break;
      if (lines[j].trim() === "") {
        j += 1;
        continue;
      }
      subLines.push(lines[j].replace(/^\s{0,4}/, ""));
      j += 1;
    }
    const isSubList = /^\s*([-*+]|\d+[.)])\s+/.test(subLines[0] ?? "");
    const sub = isSubList
      ? renderList(subLines, 0, /^\s*\d+[.)]/.test(subLines[0]), `${keyBase}-sub${k}`).items
      : null;
    items.push(
      <li key={k++}>
        {renderInline(match[2], `${keyBase}-l${k}`)}
        {sub}
      </li>,
    );
    i = j;
  }
  return { items, next: i };
}

function renderBlocks(source: string): React.ReactNode[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
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
      blocks.push(
        <pre key={key++}>
          <code>{buf.join("\n")}</code>
        </pre>,
      );
      continue;
    }
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading !== null) {
      const level = heading[1].length;
      const children = renderInline(heading[2], `k${key}`);
      blocks.push(React.createElement(`h${level}`, { key: key++ }, children));
      i += 1;
      continue;
    }
    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) {
      blocks.push(<hr key={key++} />);
      i += 1;
      continue;
    }
    if (/^\s*\|.*\|\s*$/.test(line)) {
      const tableLines: string[] = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) {
        tableLines.push(lines[i]);
        i += 1;
      }
      const table = renderTable(tableLines, `k${key}`);
      if (table !== null) blocks.push(table);
      else {
        // 无效表格：首行按段落处理，其余行回退到主循环。
        i -= tableLines.length - 1;
        blocks.push(<p key={key++}>{renderInline(tableLines[0], `k${key}`)}</p>);
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
      blocks.push(
        <blockquote key={key++}>{renderBlocks(buf.join("\n"))}</blockquote>,
      );
      continue;
    }
    const ordered = /^\s*\d+[.)]\s+/.test(line);
    const bullet = /^\s*[-*+]\s+/.test(line);
    if (ordered || bullet) {
      const { items, next } = renderList(lines, i, ordered, `k${key}`);
      blocks.push(ordered ? <ol key={key++}>{items}</ol> : <ul key={key++}>{items}</ul>);
      i = next;
      continue;
    }
    // 段落：收集到空行或块级起始。
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
    blocks.push(<p key={key++}>{renderInline(buf.join("\n").replace(/\n/g, " "), `k${key}`)}</p>);
  }
  return blocks;
}

export interface MarkdownViewProps {
  source: string;
}

/** 预览用 Markdown 视图。 */
export function MarkdownView({ source }: MarkdownViewProps): React.ReactElement {
  return <>{renderBlocks(source)}</>;
}
