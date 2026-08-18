import * as React from "react";
import type { TranslateNS } from "@deepseek-ai/dsh-client-ui-slots";
import { watchSelection, isInsideChatArea, type SelectionSnapshot } from "./selection";
import { NS } from "./locales";
import type { NotesController } from "./notes";

export interface SelectionBarProps {
  /** 命名空间绑定的翻译函数（slot 的 locale seat）。 */
  t: TranslateNS<typeof NS>;
  /** 当前是否存在可用的会话（无会话时浮窗不出现）。 */
  hasSession: () => boolean;
  /** 在当前对话中追问：把引用块预填进当前会话输入框。 */
  askHere: (quote: string) => void;
  /** 在新分支对话中追问：fork 当前会话并打开子分支，再预填引用块。 */
  askInBranch: (quote: string) => Promise<void>;
  /** 笔记控制器（剪藏落点选择）。 */
  notes: NotesController;
  /** 把选区文本存为指定笔记的剪藏。 */
  saveClip: (noteId: string, text: string) => Promise<boolean>;
}

const PAD = 8;

/**
 * 划选文字浮窗：随选区出现，提供追问 / 存为笔记动作。
 *
 * - 划选后浮窗停靠在选区上方（空间不足时转到下方），水平居中并夹在视口内；
 * - 点击浮窗内按钮不会折叠选区（pointerdown preventDefault）；
 * - 选区消失、点击浮窗外、Escape、滚动或窗口尺寸变化时关闭；
 * - 新建分支期间按钮置忙，失败时在浮窗内展示错误；
 * - “存为笔记”切换到笔记选择面板（最近笔记 + 新建）。
 */
export function SelectionBar({
  t,
  hasSession,
  askHere,
  askInBranch,
  notes,
  saveClip,
}: SelectionBarProps) {
  const popRef = React.useRef<HTMLDivElement | null>(null);
  const snapRef = React.useRef<SelectionSnapshot | null>(null);
  const [snap, setSnap] = React.useState<SelectionSnapshot | null>(null);
  const [pos, setPos] = React.useState<{ left: number; top: number } | null>(null);
  const [forking, setForking] = React.useState(false);
  const [picking, setPicking] = React.useState(false);
  const [clipping, setClipping] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const notesState = React.useSyncExternalStore(notes.subscribe, notes.getSnapshot, notes.getSnapshot);

  /** 锁存最近一次有效选区：选区被浏览器/应用清掉后浮窗仍保持。 */
  const latch = React.useCallback((next: SelectionSnapshot | null) => {
    if (next === null) return; // 选区消失不关闭（latch 语义）
    snapRef.current = next;
    setSnap(next);
    setError(null);
    setPicking(false);
    setForking(false);
  }, []);

  /** 关闭浮窗；`clearSelection` 为 true 时顺带清掉选区。 */
  const close = React.useCallback(
    (clearSelection: boolean) => {
      snapRef.current = null;
      setSnap(null);
      setPos(null);
      setClipping(false);
      if (clearSelection) window.getSelection()?.removeAllRanges();
    },
    [],
  );

  // 划选监听：出现有效选区就锁存并展示；选区消失不关闭。
  React.useEffect(() => {
    return watchSelection(
      (next) => {
        if (next === null || !hasSession()) return;
        latch(next);
      },
      () => popRef.current,
      isInsideChatArea,
    );
  }, [hasSession, latch]);

  // 依据选区包围盒与浮窗实际尺寸计算停靠位置。
  React.useLayoutEffect(() => {
    const el = popRef.current;
    const current = snapRef.current;
    if (snap === null || current === null || el === null) {
      setPos(null);
      return;
    }
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const left = Math.min(
      Math.max(current.rect.left + current.rect.width / 2 - w / 2, PAD),
      window.innerWidth - w - PAD,
    );
    let top = current.rect.top - h - PAD;
    if (top < PAD) top = current.rect.bottom + PAD;
    setPos({ left, top });
  }, [snap, forking, picking, clipping, error, notesState.items]);

  // 选区存在期间：滚动 / 窗口变化 → 关闭。
  React.useEffect(() => {
    if (snap === null) return;
    const onScrollOrResize = () => close(false);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [snap, close]);

  // 选区存在期间：浮窗外按下 / Escape → 关闭。
  React.useEffect(() => {
    if (snap === null) return;
    const onPointerDown = (ev: PointerEvent) => {
      if (
        popRef.current !== null &&
        ev.target instanceof Node &&
        popRef.current.contains(ev.target)
      ) {
        return;
      }
      close(false);
    };
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") close(true);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [snap, close]);

  if (snap === null) return null;

  const onBranch = () => {
    setForking(true);
    askInBranch(snap.text).then(
      () => close(true),
      (err: unknown) => {
        setForking(false);
        setError(t("error.fork"));
        console.error("[dsh-ui] branch ask failed:", err);
      },
    );
  };

  const onPickNote = async (noteId: string) => {
    setClipping(true);
    const ok = await saveClip(noteId, snap.markdown || snap.text);
    setClipping(false);
    if (ok) close(true);
    else setError(t("error.clip"));
  };

  const onCreateAndPick = async () => {
    setClipping(true);
    const note = await notes.create("");
    if (note === null) {
      setClipping(false);
      setError(t("error.clip"));
      return;
    }
    const ok = await saveClip(note.id, snap.markdown || snap.text);
    setClipping(false);
    if (ok) close(true);
    else setError(t("error.clip"));
  };

  const recent = notes.recentItems(5);

  return (
    <div
      ref={popRef}
      className="dshui-pop"
      style={
        pos === null
          ? { visibility: "hidden", left: 0, top: 0 }
          : { left: pos.left, top: pos.top }
      }
      role="toolbar"
      aria-label={t("bar.aria")}
      onPointerDown={(ev) => ev.preventDefault()}
    >
      {error !== null ? (
        <span className="dshui-pop-error" role="alert">
          {error}
        </span>
      ) : null}
      {picking ? (
        <div className="dshui-clip-picker" role="menu" aria-label={t("clip.pick.aria")}>
          {recent.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              className="dshui-pop-btn dshui-clip-note"
              disabled={clipping}
              onClick={() => void onPickNote(item.id)}
            >
              {item.title}
              {item.clipCount > 0 ? <span className="dshui-clip-count">{item.clipCount}</span> : null}
            </button>
          ))}
          {recent.length === 0 ? <span className="dshui-pop-error">{t("clip.none")}</span> : null}
          <button
            type="button"
            role="menuitem"
            className="dshui-pop-btn dshui-clip-new"
            disabled={clipping}
            onClick={() => void onCreateAndPick()}
          >
            ＋ {t("clip.new")}
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            className="dshui-pop-btn"
            disabled={forking}
            title={t("action.here.title")}
            onClick={() => {
              askHere(snap.text);
              close(true);
            }}
          >
            {t("action.here")}
          </button>
          <button
            type="button"
            className="dshui-pop-btn dshui-pop-btn-primary"
            disabled={forking}
            title={t("action.branch.title")}
            onClick={onBranch}
          >
            {forking ? t("action.branch.busy") : t("action.branch")}
          </button>
          <button
            type="button"
            className="dshui-pop-btn"
            disabled={forking}
            title={t("action.clip.title")}
            onClick={() => setPicking(true)}
          >
            {t("action.clip")}
          </button>
        </>
      )}
    </div>
  );
}
