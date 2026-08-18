import * as React from "react";
import type { TranslateNS } from "@deepseek-ai/dsh-client-ui-slots";
import type { NotesController } from "./notes";
import { MarkdownView } from "./markdown";
import { NS } from "./locales";

export interface NoteEditorProps {
  t: TranslateNS<typeof NS>;
  notes: NotesController;
  openSession: (sessionId: string) => void;
  /** 新建会话并把笔记内容预填为上下文。 */
  askInNewSession: (contextText: string) => void;
  /** 在当前会话追问（预填笔记内容）。 */
  askInCurrent: (contextText: string) => void;
  /** 让 dsh 在本笔记中工作（新会话 + 工具写回模板）。 */
  workInNote: (template: string) => void;
}

type ViewMode = "edit" | "preview";

/** 检测输入框光标前是否正处于 @ 触发状态。 */
function detectAtTrigger(text: string, caret: number): boolean {
  const prefix = text.slice(0, caret);
  return /(^|\s)@([\p{L}\p{N}_-]{0,16})$/u.test(prefix);
}

function clipContext(open: { title: string; id: string; body: string }): string {
  const parts: string[] = [`📓 笔记《${open.title}》（noteId: ${open.id}）`];
  if (open.body.trim() !== "") {
    parts.push(`正文：\n${open.body.slice(0, 12000)}`);
  }
  return parts.join("\n\n");
}

function workTemplate(open: { title: string; id: string }): string {
  return [
    `请在笔记《${open.title}》（noteId: ${open.id}）中完成下面的任务：`,
    `- 先用 notes 工具 read 读取本笔记；`,
    `- 完成任务后，用 notes 工具 write 把完整结果写回同一笔记（带上 read 得到的 ifVersion）；`,
    ``,
    `任务：`,
  ].join("\n");
}

/** 全屏笔记编辑器（覆盖在会话区之上）。 */
export function NoteEditor(props: NoteEditorProps) {
  const { t, notes } = props;
  const state = React.useSyncExternalStore(notes.subscribe, notes.getSnapshot, notes.getSnapshot);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [savedTitle, setSavedTitle] = React.useState("");
  const [savedBody, setSavedBody] = React.useState("");
  const [mode, setMode] = React.useState<ViewMode>("edit");
  const [atOpen, setAtOpen] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const open = state.openNote;
  const dirty = title !== savedTitle || body !== savedBody;

  // 外部（轮询/保存回写）更新时，未修改状态则同步草稿。
  React.useEffect(() => {
    if (open === null) return;
    if (dirty) return;
    setTitle(open.title);
    setBody(open.body);
    setSavedTitle(open.title);
    setSavedBody(open.body);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open?.version]);

  React.useEffect(() => {
    notes.setDirty(dirty);
  }, [dirty, notes]);

  // 编辑态：textarea 随内容自动长高（外层 body 滚动），长笔记可完整滚动。
  const resizeTextarea = React.useCallback(() => {
    const el = textareaRef.current;
    if (el === null) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`;
  }, []);

  React.useEffect(() => {
    if (mode !== "edit") return;
    resizeTextarea();
  }, [body, mode, open?.id, resizeTextarea]);

  // Esc 关闭。
  React.useEffect(() => {
    if (open === null) return;
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") notes.close();
      if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === "s") {
        ev.preventDefault();
        void saveNow();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open !== null, title, body]);

  if (open === null) return null;

  const saveNow = async () => {
    if (!dirty) return;
    const ok = await notes.save({ title, body });
    if (ok) {
      setSavedTitle(title);
      setSavedBody(body);
    }
  };

  const runAction = (action: () => void) => {
    setAtOpen(false);
    action();
  };

  const actions = [
    { key: "newSession", label: t("note.ask.newSession"), run: () => runAction(() => props.askInNewSession(clipContext(open))) },
    { key: "current", label: t("note.ask.current"), run: () => runAction(() => props.askInCurrent(clipContext(open))) },
    { key: "work", label: t("note.ask.work"), run: () => runAction(() => props.workInNote(workTemplate(open))) },
  ];

  return (
    <div className="dshui-note-shell" role="dialog" aria-label={t("note.aria")}>
      <div className="dshui-note-head">
        <button type="button" className="dshui-pop-btn" onClick={() => notes.close()}>
          ✕ {t("note.close")}
        </button>
        <input
          className="dshui-note-title"
          value={title}
          placeholder={t("note.title.placeholder")}
          onChange={(ev) => setTitle(ev.target.value)}
          onBlur={() => {
            if (title !== savedTitle && title.trim() !== "") void saveNow();
          }}
        />
        <div className="dshui-note-head-right">
          <span className="dshui-note-state">
            {state.saving ? t("note.saving") : dirty ? t("note.dirty") : state.savedAt !== null ? t("note.saved") : ""}
          </span>
          <button
            type="button"
            className={mode === "edit" ? "dshui-pop-btn dshui-pop-btn-primary" : "dshui-pop-btn"}
            onClick={() => setMode(mode === "edit" ? "preview" : "edit")}
          >
            {mode === "edit" ? t("note.view.preview") : t("note.view.edit")}
          </button>
        </div>
      </div>

      {state.saveError !== null ? (
        <div className="dshui-note-error" role="alert">
          {state.saveError}
        </div>
      ) : null}

      <div className="dshui-note-body">
        {mode === "edit" ? (
          <textarea
            ref={textareaRef}
            className="dshui-note-textarea"
            value={body}
            placeholder={t("note.body.placeholder")}
            onChange={(ev) => {
              setBody(ev.target.value);
              const caret = ev.target.selectionStart ?? ev.target.value.length;
              setAtOpen(detectAtTrigger(ev.target.value, caret));
            }}
            onKeyUp={(ev) => {
              const el = ev.currentTarget;
              const caret = el.selectionStart ?? el.value.length;
              setAtOpen(detectAtTrigger(el.value, caret));
            }}
          />
        ) : (
          <div
            className="dshui-note-preview dshui-markdown"
            onClick={(ev) => {
              const anchor = (ev.target as HTMLElement).closest?.("a[href^='dshui://']");
              if (anchor === null || anchor === undefined) return;
              ev.preventDefault();
              const href = anchor.getAttribute("href") ?? "";
              const sessionId = href.slice("dshui://session/".length);
              if (sessionId !== "") props.openSession(sessionId);
            }}
          >
            {open.body.trim() === "" ? (
              <span className="dshui-note-preview-empty">{t("note.preview.empty")}</span>
            ) : (
              <MarkdownView source={open.body} />
            )}
          </div>
        )}
      </div>

      <div className="dshui-note-foot">
        {atOpen ? (
          <div className="dshui-note-atmenu" role="menu">
            {actions.map((a) => (
              <button key={a.key} type="button" role="menuitem" className="dshui-note-atitem" onClick={a.run}>
                🐋 {a.label}
              </button>
            ))}
          </div>
        ) : null}
        <div className="dshui-note-foot-bar">
          <span className="dshui-note-hint">{t("note.hint")}</span>
          <div className="dshui-note-actions">
            {actions.map((a) => (
              <button key={a.key} type="button" className="dshui-pop-btn" onClick={a.run}>
                🐋 {a.label}
              </button>
            ))}
            <button type="button" className="dshui-pop-btn dshui-pop-btn-primary" disabled={!dirty || state.saving} onClick={() => void saveNow()}>
              {state.saving ? t("note.saving") : t("note.save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
