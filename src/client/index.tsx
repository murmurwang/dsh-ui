import type { SessionId } from "@deepseek-ai/dsh-api-remotes/client";
import type { ClientContext } from "@deepseek-ai/dsh-client-runtime/client";
// 仅类型导入：合并 Context 服务面（sessions / slots / locale / conversation）
// 与 SlotMap 的 "shell.overlay" 声明，运行时全部被擦除。
import type {} from "@deepseek-ai/dsh-client-locale/client";
import type {} from "@deepseek-ai/dsh-client-ui-layout/client";
import type {} from "@deepseek-ai/dsh-client-ui-conversation/client";
import { SelectionBar } from "./SelectionBar";
import { en, zh, NS } from "./locales";
import { quoteBlock } from "./quote";

/** 客户端 bundle id（即包名），也用于 HMR 的样式标签归属。 */
const BUNDLE_ID = "dsh-ui";

/** 输入框预填后，用户问题与引用块之间的空行数。 */
const TRAILING_BLANK_LINES = 2;

const css = `
.dshui-pop{position:fixed;z-index:1000;display:flex;align-items:center;gap:4px;padding:4px;border-radius:10px;background:var(--dsw-alias-bg-base,#fff);border:1px solid var(--dsw-alias-border-l2,#e2e4e9);box-shadow:var(--dsw-shadow-lv2,0 6px 24px rgba(15,23,42,.14));font-family:var(--dsw-font-family,system-ui)}
.dshui-pop-btn{border:1px solid transparent;background:transparent;color:var(--dsw-alias-label-primary,#1f2329);cursor:pointer;border-radius:7px;padding:4px 10px;font-size:12px;line-height:18px;white-space:nowrap}
.dshui-pop-btn:hover{background:var(--dsw-alias-interactive-bg-hover-solid,#eef0f3)}
.dshui-pop-btn:disabled{opacity:.55;cursor:default}
.dshui-pop-btn-primary{background:var(--dsw-static-deepseek-500,#4d6bfe);color:#fff}
.dshui-pop-btn-primary:hover{background:color-mix(in srgb,var(--dsw-static-deepseek-500,#4d6bfe) 88%,#000)}
.dshui-pop-error{color:var(--dsw-alias-state-error-primary,#d03050);font-size:11px;line-height:16px;padding:0 4px;max-width:220px}
`;

/** 注入样式；带 data-plugin 归属，配合 dsh-client-hmr 的样式清理。 */
function injectStyles(): void {
  if (typeof document === "undefined") return;
  const tagId = `${BUNDLE_ID}/selection-bar.css`;
  if (
    document.querySelector(`style[data-plugin-css=${JSON.stringify(tagId)}]`) !== null
  ) {
    return;
  }
  const tag = document.createElement("style");
  tag.dataset.plugin = BUNDLE_ID;
  tag.dataset.pluginCss = tagId;
  tag.textContent = css;
  document.head.appendChild(tag);
}

/** 插件依赖的 ctx 服务（cordis fiber inject）。 */
export const inject = ["slots", "sessions", "locale", "conversation"];

/** 预填引用块：与既有草稿拼接（不覆盖用户已输入的内容）。 */
function composedDraft(quote: string, existing: string): string {
  const tail = "\n".repeat(TRAILING_BLANK_LINES);
  if (existing.trim() === "") return `${quote}${tail}`;
  return `${existing.replace(/\s+$/, "")}\n\n${quote}${tail}`;
}

/** 把焦点放到当前会话的输入框并把光标移到末尾。 */
function focusComposer(): void {
  requestAnimationFrame(() => {
    const textarea = document.querySelector<HTMLTextAreaElement>(
      "[data-conversation-scroll] textarea",
    );
    if (textarea === null) return;
    textarea.focus();
    const end = textarea.value.length;
    textarea.setSelectionRange(end, end);
  });
}

/**
 * 客户端插件主体：注册词典，并把划选浮窗挂进 shell.overlay。
 * @param ctx - 客户端根上下文。
 */
export function apply(ctx: ClientContext): void {
  injectStyles();
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "dsh-ui: dictionaries");

  const sessions = ctx.sessions;
  const conversation = ctx.conversation;

  /** 解析某会话的输入面（SessionInputResolver.for 需要一个带 scope 的 ctx）。 */
  const inputFor = (sessionId: SessionId) => {
    const actx =
      sessions.scope(sessionId) ?? sessions.binding(sessionId)?.ctx;
    if (actx === undefined) {
      throw new Error(`dsh-ui: session "${String(sessionId)}" has no resolvable scope`);
    }
    return conversation.input.for(actx);
  };

  /** 在既有草稿后追加引用块并聚焦输入框。 */
  const prefill = (sessionId: SessionId, quote: string): void => {
    const input = inputFor(sessionId);
    const draft = input.state.getSnapshot().draft ?? "";
    input.setDraft(composedDraft(quote, draft));
    focusComposer();
  };

  /** 当前会话 id；无会话时返回 undefined。 */
  const currentSessionId = (): SessionId | undefined =>
    sessions.list.getSnapshot().current;

  /** 动作一：在当前对话追问 —— 引用块预填进当前输入框。 */
  const askHere = (quote: string): void => {
    const id = currentSessionId();
    if (id === undefined) throw new Error("dsh-ui: no current session");
    prefill(id, quoteBlock(quote));
  };

  /** 动作二：在新分支对话追问 —— fork 当前会话、打开子分支，再预填引用块。 */
  const askInBranch = async (quote: string): Promise<void> => {
    const sourceId = currentSessionId();
    if (sourceId === undefined) throw new Error("dsh-ui: no current session");
    // fork 携带源会话的完整历史（最近一个已完成的 turn 边界），子分支随即进入列表。
    const childId = await sessions.fork({
      sessionId: sourceId,
      increaseTitle: true,
    });
    sessions.open(childId);
    // 子分支 scope 随列表行出生；罕见时序下补几轮重试。
    let lastError: unknown;
    for (let attempt = 0; attempt < 20; attempt++) {
      try {
        prefill(childId, quoteBlock(quote));
        return;
      } catch (err) {
        lastError = err;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }
    throw lastError;
  };

  // shell.overlay 是布局声明的根级浮层座位：挂载我们的浮窗，不替换任何既有条目。
  ctx.slots.inject("shell.overlay", () =>
    ctx.slots.register(
      {
        name: "shell.overlay",
        id: "dsh-ui.selection-bar",
        locale: NS,
        inject: () => ({
          hasSession: () => currentSessionId() !== undefined,
          askHere,
          askInBranch,
        }),
      },
      SelectionBar,
    ),
  );
}
