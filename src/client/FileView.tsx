import * as React from "react";
import type { TranslateNS } from "@deepseek-ai/dsh-client-ui-slots";
import type { FilesController } from "./files";
import type { NotesController } from "./notes";
import { NS } from "./locales";
import { watchSelection, type SelectionSnapshot } from "./selection";
import { quoteBlock } from "./quote";

export interface FileViewProps {
  t: TranslateNS<typeof NS>;
  files: FilesController;
  notes: NotesController;
  /** 剪藏落点（file 链接）。 */
  saveClip: (noteId: string, text: string, fileLink: string) => Promise<boolean>;
  askHere: (quote: string) => void;
  askInBranch: (quote: string) => Promise<void>;
}

const PAD = 8;

/**
 * 文件页（右侧主区）：原版式预览（浏览器原生 PDF）+ 可划线文字视图。
 * 文字视图里划选 → 浮窗：存为笔记 / 追问所选部分 / 在新分支中追问。
 */
export function FileView({ t, files, notes, saveClip, askHere, askInBranch }: FileViewProps) {
  const state = React.useSyncExternalStore(files.subscribe, files.getSnapshot, files.getSnapshot);
  const notesState = React.useSyncExternalStore(notes.subscribe, notes.getSnapshot, notes.getSnapshot);
  const [bounds, setBounds] = React.useState<{ left: number; width: number } | null>(null);
  const [view, setView] = React.useState<"preview" | "text">("text");
  const [snap, setSnap] = React.useState<SelectionSnapshot | null>(null);
  const [pos, setPos] = React.useState<{ left: number; top: number } | null>(null);
  const [picking, setPicking] = React.useState(false);
  const [clipping, setClipping] = React.useState(false);
  const textRef = React.useRef<HTMLDivElement | null>(null);
  const popRef = React.useRef<HTMLDivElement | null>(null);

  const open = state.openFile;

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

  // 切换文件时回到文字视图（默认可划选）。
  React.useEffect(() => {
    setView("text");
  }, [open?.id]);

  // 文字视图划选（锁存语义：选区消失浮窗保持）。
  React.useEffect(() => {
    if (view !== "text" || open === null) return;
    return watchSelection(
      (next) => {
        if (next === null) return;
        setSnap(next);
      },
      () => popRef.current,
      (node) => textRef.current?.contains(node ?? null) ?? false,
    );
  }, [view, open !== null]);

  React.useLayoutEffect(() => {
    const el = popRef.current;
    if (snap === null || el === null) {
      setPos(null);
      return;
    }
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const left = Math.min(
      Math.max(snap.rect.left + snap.rect.width / 2 - w / 2, PAD),
      window.innerWidth - w - PAD,
    );
    let top = snap.rect.top - h - PAD;
    if (top < PAD) top = snap.rect.bottom + PAD;
    setPos({ left, top });
  }, [snap, picking, clipping]);

  React.useEffect(() => {
    if (snap === null) return;
    const onPointerDown = (ev: PointerEvent) => {
      if (popRef.current !== null && ev.target instanceof Node && popRef.current.contains(ev.target)) return;
      setSnap(null);
    };
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") {
        setSnap(null);
        window.getSelection()?.removeAllRanges();
      }
    };
    const onScroll = () => setSnap(null);
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [snap]);

  if (open === null) return null;

  const closeSnap = () => {
    setSnap(null);
    window.getSelection()?.removeAllRanges();
  };

  const onPickNote = async (noteId: string) => {
    setClipping(true);
    const ok = await saveClip(noteId, snap?.markdown || snap?.text || "", `file/${open.id}`);
    setClipping(false);
    if (ok) closeSnap();
  };

  const recent = notes.recentItems(5);

  const toolbar =
    snap === null ? null : (
      <div
        ref={popRef}
        className="dshui-pop"
        style={
          pos === null
            ? { visibility: "hidden", left: 0, top: 0 }
            : { left: pos.left, top: pos.top }
        }
        role="toolbar"
        onPointerDown={(ev) => ev.preventDefault()}
      >
        {picking ? (
          <div className="dshui-clip-picker" role="menu">
            {recent.map((item) => (
              <button key={item.id} type="button" role="menuitem" className="dshui-pop-btn dshui-clip-note" disabled={clipping} onClick={() => void onPickNote(item.id)}>
                {item.title}
              </button>
            ))}
            <button
              type="button"
              role="menuitem"
              className="dshui-pop-btn dshui-clip-new"
              disabled={clipping}
              onClick={() => {
                void notes.create("").then((note) => {
                  if (note !== null) void onPickNote(note.id);
                });
              }}
            >
              ＋ {t("clip.new")}
            </button>
          </div>
        ) : (
          <>
            <button type="button" className="dshui-pop-btn" onClick={() => { askHere(quoteBlock(snap.text)); closeSnap(); }}>
              {t("action.here")}
            </button>
            <button type="button" className="dshui-pop-btn dshui-pop-btn-primary" onClick={() => { void askInBranch(quoteBlock(snap.text)).then(closeSnap); }}>
              {t("action.branch")}
            </button>
            <button type="button" className="dshui-pop-btn" onClick={() => setPicking(true)}>
              {t("action.clip")}
            </button>
          </>
        )}
      </div>
    );

  return (
    <div
      className="dshui-file-shell"
      role="dialog"
      aria-label={t("files.aria")}
      style={bounds === null ? { visibility: "hidden" } : { left: bounds.left, width: bounds.width }}
    >
      <div className="dshui-note-head">
        <button type="button" className="dshui-pop-btn" onClick={() => files.close()}>
          ✕ {t("files.close")}
        </button>
        <span className="dshui-file-title">{open.name}</span>
        <div className="dshui-note-head-right">
          <button type="button" className={view === "text" ? "dshui-pop-btn dshui-pop-btn-primary" : "dshui-pop-btn"} onClick={() => setView("text")}>
            {t("files.view.text")}
          </button>
          <button type="button" className={view === "preview" ? "dshui-pop-btn dshui-pop-btn-primary" : "dshui-pop-btn"} onClick={() => setView("preview")}>
            {t("files.view.preview")}
          </button>
        </div>
      </div>
      <div className="dshui-file-body">
        {view === "preview" ? (
          state.previewUrl !== null ? (
            <iframe className="dshui-file-frame" src={state.previewUrl} title={open.name} />
          ) : (
            <div className="dshui-side-empty">{t("files.preview.loading")}</div>
          )
        ) : open.text !== undefined && open.text.trim() !== "" ? (
          <div ref={textRef} className="dshui-file-text">
            {open.text}
          </div>
        ) : (
          <div className="dshui-side-empty">{t("files.text.empty")}</div>
        )}
      </div>
      {toolbar}
    </div>
  );
}
