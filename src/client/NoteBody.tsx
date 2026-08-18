import * as React from "react";
import { markdownToHtml, serializeToMarkdown } from "./markdown";

/** 光标所在的最外层块（父节点为编辑根的元素）。 */
function topBlock(node: Node | null, root: HTMLElement): HTMLElement | null {
  let current: Node | null = node;
  while (current !== null && current !== root) {
    if (current instanceof Element && current.parentElement === root) {
      return current as HTMLElement;
    }
    current = current.parentNode;
  }
  return null;
}

function setCaretEnd(el: HTMLElement): void {
  const sel = window.getSelection();
  if (sel === null) return;
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}

/** 把光标放到指定元素的第 offset 个字符处。 */
function setCaretAt(el: HTMLElement, offset: number): void {
  const sel = window.getSelection();
  if (sel === null) return;
  const range = document.createRange();
  const first = el.firstChild;
  if (first !== null && first.nodeType === Node.TEXT_NODE) {
    const textLen = (first.nodeValue ?? "").length;
    range.setStart(first, Math.max(0, Math.min(offset, textLen)));
    range.collapse(true);
  } else {
    range.selectNodeContents(el);
    range.collapse(false);
  }
  sel.removeAllRanges();
  sel.addRange(range);
}

/** 找到容器内第一个文本节点。 */
function firstTextNode(container: Node): Text | null {
  if (container.nodeType === Node.TEXT_NODE) return container as Text;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  return walker.nextNode() as Text | null;
}

/**
 * 块级快捷转换（浏览器原生编辑操作，光标与撤销栈由浏览器托管）：
 * 1. 用 Range.deleteContents() 删除行首标记；
 * 2. execCommand("formatBlock") 把当前块转为目标块类型。
 */
function applyBlockShortcut(root: HTMLElement): boolean {
  const sel = window.getSelection();
  if (sel === null || sel.rangeCount === 0) return false;
  const node = sel.anchorNode;
  if (node === null) return false;

  const block = topBlock(node, root);
  let container: HTMLElement;
  if (block !== null) {
    if (block.tagName !== "P" && block.tagName !== "DIV") return false;
    container = block;
  } else if (node.parentNode === root) {
    container = root;
  } else {
    return false;
  }
  // keydown 时机：当前行文本恰好是标记本身（空格尚未插入）。
  const text = container.textContent ?? "";

  const firstText = firstTextNode(container);
  if (firstText === null) return false;
  // 选中标记并用原生 delete 命令删除：浏览器视为用户删除，光标由它托管。
  const deleteMarker = (markerLen: number): void => {
    const sel = window.getSelection();
    if (sel === null) return;
    const range = document.createRange();
    range.setStart(firstText, 0);
    range.setEnd(firstText, Math.min(markerLen, (firstText.nodeValue ?? "").length));
    sel.removeAllRanges();
    sel.addRange(range);
    document.execCommand("delete");
  };

  // 标题：不换元素 —— 有块就删标记加类；裸文本根则包进带标题类的 P。
  const heading = /^(#{1,6})$/.exec(text);
  if (heading !== null) {
    deleteMarker(heading[0].length);
    const cls = `dshui-md-h${heading[1].length}`;
    if (block !== null) {
      block.className = cls;
    } else {
      const p = document.createElement("p");
      p.className = cls;
      while (container.firstChild !== null) p.appendChild(container.firstChild);
      container.appendChild(p);
    }
    return true;
  }

  // 列表/引用同样不改元素：删标记 + 视觉类（CSS 呈现、序列化还原）。
  let markerLen = 0;
  let cls = "";
  if (text === "-") {
    markerLen = 1;
    cls = "dshui-md-ul";
  } else if (text === "1.") {
    markerLen = 2;
    cls = "dshui-md-ol";
  } else if (text === ">") {
    markerLen = 1;
    cls = "dshui-md-quote";
  } else {
    return false;
  }
  deleteMarker(markerLen);
  if (block !== null) block.className = cls;
  return true;
}

export interface NoteBodyProps {
  /** Markdown 源码（存储与 agent 工具的权威格式）。 */
  source: string;
  /** 空正文占位提示。 */
  placeholder?: string;
  /** 回链 hover 按钮文案。 */
  backLabel?: string;
  /** 用户输入后回写 Markdown 源码。 */
  onSourceChange: (markdown: string) => void;
  /** 点击回链返回按钮。 */
  onSessionLink: (sessionId: string) => void;
  /** @ 触发状态（正文中输入 @ 唤起小鲸鱼菜单）。 */
  onAtChange: (open: boolean) => void;
}

/**
 * Notion 式正文：contentEditable 里渲染 Markdown（所见即所得），
 * 输入时把 DOM 序列化回 Markdown 上抛；无预览/编辑之分。
 * - 外部源码变化才重渲染（用户输入中不打断光标）；
 * - dshui:// 回链为灰色文字 + hover 返回按钮（按钮不可编辑、点击回原会话）；
 * - 点击链接文字本体 = 就地编辑，不跳转。
 */
export function NoteBody({ source, placeholder, backLabel, onSourceChange, onSessionLink, onAtChange }: NoteBodyProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const renderedRef = React.useRef<string | null>(null);
  const focusedRef = React.useRef(false);

  // 外部（打开/轮询/保存回写）源码变化 → 重渲染；输入中不打断。
  React.useEffect(() => {
    const el = ref.current;
    if (el === null) return;
    if (renderedRef.current === source) return;
    if (focusedRef.current) return;
    el.innerHTML = markdownToHtml(source, { backLabel });
    renderedRef.current = source;
  }, [source]);

  const emit = () => {
    const el = ref.current;
    if (el === null) return;
    const md = serializeToMarkdown(el);
    renderedRef.current = md;
    onSourceChange(md);
  };

  const onInput = () => {
    emit();
  };

  /**
   * 块级快捷输入：在空格 keydown 拦截（preventDefault 阻止空格进入文档，
   * 从而避开 input 事件中修改 DOM 导致浏览器吞掉后续输入的竞态）。
   * 转换只做两件浏览器无感的事：Range 删标记 + 段落加类 / formatBlock。
   */
  const onKeyDown = (ev: React.KeyboardEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (el === null) return;
    if (ev.key === " ") {
      if (!applyBlockShortcut(el)) return;
      ev.preventDefault();
      emit();
      return;
    }
    if (ev.key === "Enter") {
      // 回链内按 Enter：不撕开链接，光标移到链接包裹之后。
      const selBefore = window.getSelection();
      const caret = selBefore?.anchorNode ?? null;
      const inLink =
        caret !== null &&
        (caret instanceof Element ? caret : caret.parentElement)?.closest?.(
          ".dshui-link-wrap, a.dshui-link",
        ) != null;
      if (inLink) {
        ev.preventDefault();
        const wrap =
          (caret instanceof Element ? caret : caret.parentElement)?.closest?.(
            ".dshui-link-wrap",
          ) ?? null;
        if (wrap !== null && selBefore !== null) {
          const range = document.createRange();
          range.setStartAfter(wrap);
          range.collapse(true);
          selBefore.removeAllRanges();
          selBefore.addRange(range);
        }
        return;
      }
      // 标题类段落末尾按 Enter：新段落不带标题类（Chromium 会复制类）。
      const sel = window.getSelection();
      if (sel === null || sel.rangeCount === 0) return;
      const node = sel.anchorNode;
      if (node === null) return;
      const block = topBlock(node, el);
      if (block === null || !/(?:^|\s)dshui-md-h[1-6](?:\s|$)/.test(block.className)) return;
      const range = sel.getRangeAt(0);
      const atEnd =
        node.nodeType === Node.TEXT_NODE
          ? range.endOffset >= (node.nodeValue ?? "").length
          : node === block
            ? range.endOffset >= block.childNodes.length
            : false;
      if (!atEnd) return;
      ev.preventDefault();
      const p = document.createElement("p");
      p.appendChild(document.createElement("br"));
      block.after(p);
      const next = document.createRange();
      next.selectNodeContents(p);
      next.collapse(true);
      sel.removeAllRanges();
      sel.addRange(next);
      emit();
    }
  };


  const downPosRef = React.useRef<{ x: number; y: number } | null>(null);

  const onClick = (ev: React.MouseEvent<HTMLDivElement>) => {
    const target = ev.target as HTMLElement;
    const back = target.closest<HTMLButtonElement>(".dshui-link-back");
    if (back !== null) {
      ev.preventDefault();
      ev.stopPropagation();
      const sessionId = back.getAttribute("data-session");
      if (sessionId !== null && sessionId !== "") onSessionLink(sessionId);
      return;
    }
    // 单击回链（非拖选）：手动放置光标 —— WebKit 对无 href 的 <a> 放光标不可靠。
    const anchor = target.closest<HTMLAnchorElement>("a.dshui-link");
    if (anchor === null) return;
    const down = downPosRef.current;
    const moved =
      down !== null &&
      (Math.abs(ev.clientX - down.x) > 4 || Math.abs(ev.clientY - down.y) > 4);
    if (moved) return; // 拖选，交给原生行为
    const sel = window.getSelection();
    const el = ref.current;
    if (sel === null || el === null) return;
    el.focus();
    const pointCaret = document.caretRangeFromPoint?.(ev.clientX, ev.clientY) ?? null;
    if (pointCaret !== null && anchor.contains(pointCaret.startContainer)) {
      sel.removeAllRanges();
      sel.addRange(pointCaret);
      return;
    }
    const range = document.createRange();
    range.selectNodeContents(anchor);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  };

  const onMouseDown = (ev: React.MouseEvent<HTMLDivElement>) => {
    downPosRef.current = { x: ev.clientX, y: ev.clientY };
    const target = ev.target as HTMLElement;
    // 返回按钮按下不移动光标（按钮 contenteditable=false 但仍会夺焦）。
    // 链接本体不拦截按下：保留原生拖选。
    if (target.closest(".dshui-link-back") !== null) ev.preventDefault();
  };

  const onKeyUp = () => {
    const sel = window.getSelection();
    if (sel === null || sel.rangeCount === 0) {
      onAtChange(false);
      return;
    }
    const node = sel.anchorNode;
    const offset = sel.anchorOffset;
    const textBefore = (node?.textContent ?? "").slice(0, offset);
    onAtChange(/(^|\s)@([\p{L}\p{N}_-]{0,16})$/u.test(textBefore));
  };

  return (
    <div
      ref={ref}
      className="dshui-note-editable dshui-markdown"
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      onInput={onInput}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      onFocus={() => {
        focusedRef.current = true;
      }}
      onBlur={() => {
        focusedRef.current = false;
        emit();
      }}
      data-placeholder={placeholder ?? ""}
    />
  );
}
