import * as React from "react";
import { markdownToHtml, serializeToMarkdown } from "./markdown";

export interface NoteBodyProps {
  /** Markdown 源码（存储与 agent 工具的权威格式）。 */
  source: string;
  /** 空正文占位提示。 */
  placeholder?: string;
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
export function NoteBody({ source, placeholder, onSourceChange, onSessionLink, onAtChange }: NoteBodyProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const renderedRef = React.useRef<string | null>(null);
  const focusedRef = React.useRef(false);

  // 外部（打开/轮询/保存回写）源码变化 → 重渲染；输入中不打断。
  React.useEffect(() => {
    const el = ref.current;
    if (el === null) return;
    if (renderedRef.current === source) return;
    if (focusedRef.current) return;
    el.innerHTML = markdownToHtml(source);
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
    // 链接文字本体点击 = 就地编辑（默认跳转被拦截）。
    const anchor = target.closest<HTMLAnchorElement>("a.dshui-link");
    if (anchor !== null) {
      ev.preventDefault();
    }
  };

  const onMouseDown = (ev: React.MouseEvent<HTMLDivElement>) => {
    // 返回按钮按下不移动光标（按钮 contenteditable=false 但仍会夺焦）。
    const target = ev.target as HTMLElement;
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
