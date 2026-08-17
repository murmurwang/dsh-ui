import * as React from "react";
import type { TranslateNS } from "@deepseek-ai/dsh-client-ui-slots";
import { watchSelection, type SelectionSnapshot } from "./selection";
import { NS } from "./locales";

export interface SelectionBarProps {
  /** 命名空间绑定的翻译函数（slot 的 locale seat）。 */
  t: TranslateNS<typeof NS>;
  /** 当前是否存在可用的会话（无会话时浮窗不出现）。 */
  hasSession: () => boolean;
  /** 在当前对话中追问：把引用块预填进当前会话输入框。 */
  askHere: (quote: string) => void;
  /** 在新分支对话中追问：fork 当前会话并打开子分支，再预填引用块。 */
  askInBranch: (quote: string) => Promise<void>;
}

const PAD = 8;

/**
 * 划选文字浮窗：随选区出现，提供两个动作按钮。
 *
 * - 划选后浮窗停靠在选区上方（空间不足时转到下方），水平居中并夹在视口内；
 * - 点击浮窗内按钮不会折叠选区（pointerdown preventDefault）；
 * - 选区消失、点击浮窗外、Escape、滚动或窗口尺寸变化时关闭；
 * - 新建分支期间按钮置忙，失败时在浮窗内展示错误。
 */
export function SelectionBar({
  t,
  hasSession,
  askHere,
  askInBranch,
}: SelectionBarProps) {
  const popRef = React.useRef<HTMLDivElement | null>(null);
  const snapRef = React.useRef<SelectionSnapshot | null>(null);
  const [snap, setSnap] = React.useState<SelectionSnapshot | null>(null);
  const [pos, setPos] = React.useState<{ left: number; top: number } | null>(null);
  const [forking, setForking] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const update = React.useCallback((next: SelectionSnapshot | null) => {
    snapRef.current = next;
    setSnap(next);
    setError(null);
  }, []);

  /** 关闭浮窗；`clearSelection` 为 true 时顺带清掉选区。 */
  const close = React.useCallback((clearSelection: boolean) => {
    update(null);
    setPos(null);
    setForking(false);
    if (clearSelection) window.getSelection()?.removeAllRanges();
  }, [update]);

  // 划选监听。
  React.useEffect(() => {
    return watchSelection((next) => {
      if (next === null || !hasSession()) {
        update(null);
        setPos(null);
        return;
      }
      update(next);
    }, () => popRef.current);
  }, [hasSession, update]);

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
  }, [snap, forking, error]);

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
    </div>
  );
}
