import * as React from "react";
import type { TranslateNS } from "@deepseek-ai/dsh-client-ui-slots";
import type { NotesController } from "./notes";
import { NoteBody } from "./NoteBody";
import { NS } from "./locales";

export interface NoteEditorProps {
  t: TranslateNS<typeof NS>;
  notes: NotesController;
  openSession: (sessionId: string) => void;
  openFile: (fileId: string) => void;
  /** 新建会话并把笔记内容预填为上下文。 */
  askInNewSession: (contextText: string) => void;
  /** 在当前会话追问（预填笔记内容）。 */
  askInCurrent: (contextText: string) => void;
  /** 让 dsh 在本笔记中工作（新会话 + 工具写回模板）。 */
  workInNote: (template: string) => void;
}

function clipContext(open: { title: string; id: string; body: string }, t: NoteEditorProps["t"]): string {
  const parts: string[] = [t("ctx.clipTitle", { title: open.title, id: open.id })];
  if (open.body.trim() !== "") {
    parts.push(`${t("ctx.bodyPrefix")}\n${open.body.slice(0, 12000)}`);
  }
  return parts.join("\n\n");
}

function workTemplate(open: { title: string; id: string }, t: NoteEditorProps["t"]): string {
  return t("ctx.work", { title: open.title, id: open.id });
}

/** 笔记页：右侧主区、Notion 式所见即所得（无预览/编辑之分）。 */
export function NoteEditor(props: NoteEditorProps) {
  const { t, notes } = props;
  const state = React.useSyncExternalStore(notes.subscribe, notes.getSnapshot, notes.getSnapshot);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [savedTitle, setSavedTitle] = React.useState("");
  const [savedBody, setSavedBody] = React.useState("");
  const [atOpen, setAtOpen] = React.useState(false);

  const open = state.openNote;
  const dirty = title !== savedTitle || body !== savedBody;
  const [bounds, setBounds] = React.useState<{ left: number; width: number } | null>(null);
  const prevOpenRef = React.useRef<{ id: string; version: string } | null>(null);

  // 切换笔记：先把上一篇的未保存草稿按旧版本号兜底保存，
  // 再无条件把编辑器重置为新笔记内容（否则 dirty 保护会卡在旧内容）。
  React.useEffect(() => {
    const prev = prevOpenRef.current;
    prevOpenRef.current = open === null ? null : { id: open.id, version: open.version };
    if (prev === null || open === null || prev.id === open.id) return;
    if (title !== savedTitle || body !== savedBody) {
      void notes.saveAs(prev, { title, body });
    }
    setTitle(open.title);
    setBody(open.body);
    setSavedTitle(open.title);
    setSavedBody(open.body);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open?.id]);

  // 笔记页覆盖对话中心列：以 [data-conversation-scroll] 为锚测量左缘与宽度，
  // 侧栏保持可见可点；侧栏折叠/窗口变化经 ResizeObserver + resize 重测。
  React.useEffect(() => {
    if (open === null) return;
    const measure = () => {
      const el = document.querySelector("[data-conversation-scroll]");
      if (el === null) return;
      const rect = el.getBoundingClientRect();
      setBounds({ left: rect.left, width: rect.width });
    };
    measure();
    const el = document.querySelector("[data-conversation-scroll]");
    const observer = el !== null ? new ResizeObserver(measure) : null;
    if (el !== null && observer !== null) observer.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [open !== null]);

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

  // —— 自动保存：输入停顿后落盘；离开/关闭/切 tab/页面隐藏时兜底 ——
  const openRef = React.useRef(open);
  const dirtyRef = React.useRef(dirty);
  const titleRef = React.useRef(title);
  const bodyRef = React.useRef(body);
  openRef.current = open;
  dirtyRef.current = dirty;
  titleRef.current = title;
  bodyRef.current = body;

  // 停顿 1.5s 自动保存（有未保存改动时）。
  React.useEffect(() => {
    if (open === null || !dirty) return;
    const timer = window.setTimeout(() => {
      void saveNow();
    }, 1500);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body, title, dirty]);

  // 组件卸载（关闭/切 tab）时兜底保存未保存改动（用旧快照版本，不误写他处）。
  React.useEffect(() => {
    return () => {
      const snapshot = openRef.current;
      if (snapshot !== null && dirtyRef.current) {
        void notes.saveAs(
          { id: snapshot.id, version: snapshot.version },
          { title: titleRef.current, body: bodyRef.current },
        );
      }
    };
  }, [notes]);

  // 页面隐藏/刷新前尽力保存（异步 RPC 尽力而为）。
  React.useEffect(() => {
    const onPageHide = () => {
      const snapshot = openRef.current;
      if (snapshot !== null && dirtyRef.current) {
        void notes.saveAs(
          { id: snapshot.id, version: snapshot.version },
          { title: titleRef.current, body: bodyRef.current },
        );
      }
    };
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, [notes]);

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
    { key: "newSession", label: t("note.ask.newSession"), run: () => runAction(() => props.askInNewSession(clipContext(open, t))) },
    { key: "current", label: t("note.ask.current"), run: () => runAction(() => props.askInCurrent(clipContext(open, t))) },
    { key: "work", label: t("note.ask.work"), run: () => runAction(() => props.workInNote(workTemplate(open, t))) },
  ];

  return (
    <div
      className="dshui-note-shell"
      role="dialog"
      aria-label={t("note.aria")}
      style={
        bounds === null
          ? { visibility: "hidden" }
          : { left: bounds.left, width: bounds.width }
      }
    >
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
        </div>
      </div>

      {state.saveError !== null ? (
        <div className="dshui-note-error" role="alert">
          {state.saveError}
        </div>
      ) : null}

      <div className="dshui-note-body">
        <NoteBody
          key={open.id}
          source={body}
          placeholder={t("note.body.placeholder")}
          backLabel={t("clip.back")}
          onSourceChange={setBody}
          onSessionLink={(href) => {
            // 回链按钮的 data-session 可能是 file/<id>（文件剪藏）。
            if (href.startsWith("file/")) {
              props.openFile(href.slice("file/".length));
              return;
            }
            props.openSession(href);
          }}
          onAtChange={setAtOpen}
        />
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
