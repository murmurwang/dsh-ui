/** 一次有效划选的快照。 */
export interface SelectionSnapshot {
  /** 选中的纯文本（trim 后）。 */
  text: string;
  /** 选区 DOM 序列化成的 Markdown（保留标题/加粗/列表等格式，用于存笔记）。 */
  markdown: string;
  /** 选区包围盒（视口坐标），用于浮窗定位。 */
  rect: DOMRect;
  /** 选区起止节点，用于排除判断。 */
  anchorNode: Node | null;
  focusNode: Node | null;
}

import { serializeToMarkdown } from "./markdown";

const EDITABLE_SELECTOR =
  "textarea, input, [contenteditable='true'], [contenteditable='']";

/** 节点是否落在可编辑元素内部（textarea/input/contenteditable）。 */
export function isInsideEditable(node: Node | null): boolean {
  if (node === null) return false;
  const el = node instanceof Element ? node : node.parentElement;
  if (el === null) return false;
  return el.matches(EDITABLE_SELECTOR) || el.closest(EDITABLE_SELECTOR) !== null;
}

/** 节点是否落在聊天区域（会话滚动视口 data-conversation-scroll）内部。 */
export function isInsideChatArea(node: Node | null): boolean {
  if (node === null) return false;
  const el = node instanceof Element ? node : node.parentElement;
  if (el === null) return false;
  return el.closest("[data-conversation-scroll]") !== null;
}

/**
 * 读取当前文档选区；不满足展示条件时返回 null：
 * - 选区折叠 / 内容为空；
 * - 起止节点落在可编辑元素（如输入框）里；
 * - 选区与给定的排除容器（浮窗自身）重叠；
 * - 提供了 `allowed` 且起止节点不满足（如：只在聊天区域生效）；
 * - 包围盒不可见（宽或高为 0）。
 *
 * @param excluded - 需要排除的容器（浮窗 DOM），可为 null。
 * @param allowed - 可选的白名单判定；不满足时不展示。
 */
export function readSelection(
  excluded: Element | null,
  allowed?: (node: Node | null) => boolean,
): SelectionSnapshot | null {
  const sel = window.getSelection();
  if (sel === null || sel.isCollapsed) return null;
  const text = sel.toString().trim();
  if (text === "") return null;
  const anchorNode = sel.anchorNode;
  const focusNode = sel.focusNode;
  if (isInsideEditable(anchorNode) || isInsideEditable(focusNode)) return null;
  if (
    excluded !== null &&
    (excluded.contains(anchorNode) || excluded.contains(focusNode))
  ) {
    return null;
  }
  if (allowed !== undefined && (!allowed(anchorNode) || !allowed(focusNode))) {
    return null;
  }
  if (sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;
  // 格式保留：把选区 DOM 片段序列化成 Markdown（克隆不影响原文档）。
  let markdown = text;
  try {
    const fragment = range.cloneContents();
    const md = serializeToMarkdown(fragment as unknown as Element).trim();
    if (md !== "") markdown = md;
  } catch {
    markdown = text;
  }
  return { text, markdown, rect, anchorNode, focusNode };
}

/**
 * 监听划选：`selectionchange` + mouseup/keyup 兜底轮询。
 *
 * @param handler - 每次选区变化时回调（null 表示当前没有有效选区）。
 * @param excluded - 返回需要排除的浮窗容器（惰性读取）。
 * @param allowed - 可选白名单（如仅聊天区域）。
 * @returns 取消监听函数。
 */
export function watchSelection(
  handler: (snapshot: SelectionSnapshot | null) => void,
  excluded: () => Element | null,
  allowed?: (node: Node | null) => boolean,
): () => void {
  const poll = () => handler(readSelection(excluded(), allowed));
  // mouseup 之后选区才稳定，延迟一拍读取。
  const onMouseUp = () => {
    setTimeout(poll, 0);
  };
  document.addEventListener("selectionchange", poll);
  window.addEventListener("mouseup", onMouseUp);
  window.addEventListener("keyup", poll);
  return () => {
    document.removeEventListener("selectionchange", poll);
    window.removeEventListener("mouseup", onMouseUp);
    window.removeEventListener("keyup", poll);
  };
}
