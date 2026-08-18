/**
 * 笔记正文的 Markdown ↔ HTML 双向转换（Notion 式所见即所得编辑器的内核）。
 *
 * - markdownToHtml：把笔记正文（Markdown 源码）渲染成可编辑 HTML；
 *   dshui:// 回链渲染为「灰色链接 + hover 返回按钮」的包裹结构。
 * - serializeToMarkdown：把 contentEditable 里的 DOM 序列化回 Markdown，
 *   与 markdownToHtml 互为逆操作（覆盖本插件支持的块级/行内子集）。
 */
export interface MarkdownHtmlOptions {
    /** 回链 hover 按钮文案。 */
    backLabel?: string;
}
/** Markdown → 可编辑 HTML 字符串。 */
export declare function markdownToHtml(source: string, options?: MarkdownHtmlOptions): string;
/** contentEditable DOM → Markdown 源码。 */
export declare function serializeToMarkdown(root: Element): string;
