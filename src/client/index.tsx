import type { SessionId, WorkspaceId } from "@deepseek-ai/dsh-api-remotes/client";
import type { ClientContext } from "@deepseek-ai/dsh-client-runtime/client";
// 仅类型导入：合并 Context 服务面（sessions / slots / locale / conversation /
// workspaces / remote）与 SlotMap 声明，运行时全部被擦除。
import type {} from "@deepseek-ai/dsh-client-locale/client";
import type {} from "@deepseek-ai/dsh-client-ui-layout/client";
import type {} from "@deepseek-ai/dsh-client-ui-conversation/client";
import type {} from "@deepseek-ai/dsh-client-ui-sidebar/client";
import type {} from "@deepseek-ai/dsh-api-gateway/client";
import { SelectionBar } from "./SelectionBar";
import { SidebarRegion } from "./SidebarRegion";
import { NoteEditor } from "./NoteEditor";
import { Toast } from "./Toast";
import { NotesController, mountNotesRemote, notesFaceOf } from "./notes";
import { en, zh, NS } from "./locales";
import { quoteBlock } from "./quote";
// 官方 ui-workspace 照搬
import type {} from "./workspace/contract/slots";
import { workspaceCss } from "./workspace/_workspaceCss";
import { WorkspaceBrowser } from "./workspace/WorkspaceBrowser";
import { createWorkspaceViewStore } from "./workspace/stores";
import type { WorkspaceBrowserInjected } from "./workspace/contract/slots";
import { NS as WS_NS, en as wsEn, zh as wsZh } from "./workspace/locales";

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
.dshui-clip-picker{display:flex;flex-direction:column;gap:2px;min-width:180px;max-width:260px}
.dshui-clip-note{display:flex;justify-content:space-between;gap:8px;text-align:left}
.dshui-clip-count{color:var(--dsw-alias-label-caption,#8a919f);font-size:11px}
.dshui-clip-new{text-align:left;color:var(--dsw-alias-label-secondary,#4e5969)}
/* 侧栏分栏 */
.dshui-side{display:flex;flex-direction:column;gap:6px;min-height:0}
.dshui-side-tabs{display:flex;gap:2px;padding:2px;border-radius:8px;background:var(--dsw-alias-bg-layer-2,#f2f3f5)}
.dshui-side-tab{flex:1;border:none;background:transparent;color:var(--dsw-alias-label-secondary,#4e5969);cursor:pointer;border-radius:6px;padding:4px 0;font-size:12px;line-height:16px}
.dshui-side-tab-active{background:var(--dsw-alias-bg-base,#fff);color:var(--dsw-alias-label-primary,#1f2329);box-shadow:0 1px 2px rgba(15,23,42,.08)}
.dshui-side-pane{display:flex;flex-direction:column;gap:2px;overflow-y:auto;min-height:0}
.dshui-side-add{display:flex;align-items:center;gap:6px;padding:6px 8px;border-radius:8px;color:var(--dsw-alias-label-secondary,#4e5969);font-size:12px;line-height:16px;cursor:pointer}
.dshui-side-add:hover{background:var(--dsw-alias-interactive-bg-hover-solid,#eef0f3)}
.dshui-side-add-plus{font-size:14px;line-height:16px;color:var(--dsw-alias-label-tertiary,#8a919f)}
.dshui-side-row{display:flex;align-items:center;gap:6px;width:100%;text-align:left;border:none;background:transparent;color:var(--dsw-alias-label-primary,#1f2329);cursor:pointer;border-radius:6px;padding:5px 8px;font-size:12px;line-height:16px}
.dshui-side-row:hover{background:var(--dsw-alias-interactive-bg-hover-solid,#eef0f3)}
.dshui-side-row-current{background:var(--dsw-alias-interactive-bg-hover-solid,#eef0f3);color:var(--dsw-static-deepseek-500,#4d6bfe)}
.dshui-side-row-title{flex:1;min-width:0;text-overflow:ellipsis;white-space:nowrap;overflow:hidden}
.dshui-side-meta{color:var(--dsw-alias-label-caption,#8a919f);font-size:11px}
.dshui-side-empty{padding:10px 8px;color:var(--dsw-alias-label-tertiary,#8a919f);font-size:12px;line-height:18px}
/* 笔记编辑器 */
.dshui-note-shell{position:fixed;inset:0;z-index:900;display:flex;flex-direction:column;background:var(--dsw-alias-bg-base,#fff);font-family:var(--dsw-font-family,system-ui)}
.dshui-note-head{display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--dsw-alias-border-l1,#e5e6eb)}
.dshui-note-title{flex:1;border:none;background:transparent;outline:none;font-size:18px;font-weight:600;color:var(--dsw-alias-label-primary,#1f2329);min-width:0}
.dshui-note-head-right{display:flex;align-items:center;gap:8px}
.dshui-note-state{font-size:11px;line-height:16px;color:var(--dsw-alias-label-caption,#8a919f)}
.dshui-note-error{padding:6px 16px;font-size:12px;line-height:16px;color:var(--dsw-alias-state-error-primary,#d03050);background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#d03050) 8%,transparent)}
.dshui-note-body{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:12px;padding:16px;max-width:860px;width:100%;margin:0 auto}
.dshui-note-clips{display:flex;flex-direction:column;gap:8px}
.dshui-note-clip{border:1px solid var(--dsw-alias-border-l1,#e5e6eb);border-radius:10px;padding:10px 12px;background:var(--dsw-alias-bg-layer-2,#f7f8fa)}
.dshui-note-clip-meta{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px}
.dshui-note-clip-src{font-size:11px;line-height:16px;color:var(--dsw-alias-label-caption,#8a919f)}
.dshui-note-clip-actions{display:flex;gap:6px}
.dshui-link-btn{border:none;background:transparent;color:var(--dsw-static-deepseek-500,#4d6bfe);cursor:pointer;font-size:11px;line-height:16px;padding:0}
.dshui-link-btn:disabled{opacity:.45;cursor:default}
.dshui-note-clip-text{margin:0;color:var(--dsw-alias-label-secondary,#4e5969);font-size:13px;line-height:20px;white-space:pre-wrap;overflow-wrap:anywhere;border-left:2px solid var(--dsw-alias-border-l2,#e2e4e9);padding-left:10px}
.dshui-note-textarea{flex:none;min-height:calc(100vh - 260px);overflow-y:hidden;resize:none;border:1px solid var(--dsw-alias-border-l1,#e5e6eb);border-radius:10px;padding:12px;font:var(--dsw-font-markdown-code-block-small,13px/20px ui-monospace,SFMono-Regular,Menlo,monospace);color:var(--dsw-alias-label-primary,#1f2329);background:transparent;outline:none}
.dshui-note-preview{flex:1;overflow-y:auto;border:1px solid var(--dsw-alias-border-l1,#e5e6eb);border-radius:10px;padding:12px 16px;font-size:14px;line-height:22px;color:var(--dsw-alias-label-primary,#1f2329)}
.dshui-note-preview-empty{color:var(--dsw-alias-label-tertiary,#8a919f)}
.dshui-markdown h1,.dshui-markdown h2,.dshui-markdown h3{margin:14px 0 8px;line-height:1.3}
.dshui-markdown p{margin:6px 0}
.dshui-markdown ul,.dshui-markdown ol{margin:6px 0;padding-left:22px}
.dshui-markdown blockquote{margin:6px 0;padding-left:10px;border-left:3px solid var(--dsw-alias-border-l2,#e2e4e9);color:var(--dsw-alias-label-secondary,#4e5969)}
.dshui-markdown code{font:var(--dsw-font-markdown-code-block-small,12px/18px ui-monospace,SFMono-Regular,Menlo,monospace);background:var(--dsw-alias-markdown-code-block,#f2f3f5);border-radius:4px;padding:1px 5px}
.dshui-markdown pre{background:var(--dsw-alias-markdown-code-block,#f2f3f5);border-radius:8px;padding:10px 12px;overflow:auto}
.dshui-markdown pre code{background:transparent;padding:0}
.dshui-markdown table{border-collapse:collapse;margin:8px 0;width:100%}
.dshui-markdown th,.dshui-markdown td{border:1px solid var(--dsw-alias-border-l1,#e5e6eb);padding:5px 10px;text-align:left;font-size:13px}
.dshui-markdown th{background:var(--dsw-alias-bg-layer-2,#f7f8fa)}
.dshui-markdown a{color:var(--dsw-static-deepseek-500,#4d6bfe)}
.dshui-note-foot{flex:none;padding:8px 16px;border-top:1px solid var(--dsw-alias-border-l1,#e5e6eb);background:var(--dsw-alias-bg-base,#fff)}
.dshui-note-foot-bar{display:flex;align-items:center;gap:10px}
.dshui-note-hint{flex:1;font-size:11px;line-height:16px;color:var(--dsw-alias-label-caption,#8a919f)}
.dshui-note-actions{display:flex;gap:4px}
.dshui-note-atmenu{position:absolute;bottom:calc(100% + 6px);left:16px;display:flex;flex-direction:column;gap:2px;min-width:220px;padding:4px;border-radius:10px;border:1px solid var(--dsw-alias-border-l2,#e2e4e9);background:var(--dsw-alias-bg-base,#fff);box-shadow:var(--dsw-shadow-lv2,0 6px 24px rgba(15,23,42,.14))}
.dshui-note-foot{position:relative}
.dshui-note-atitem{border:none;background:transparent;text-align:left;color:var(--dsw-alias-label-primary,#1f2329);cursor:pointer;border-radius:7px;padding:6px 10px;font-size:12px;line-height:18px}
.dshui-note-atitem:hover{background:var(--dsw-alias-interactive-bg-hover-solid,#eef0f3)}
/* toast */
.dshui-toast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:1200;background:var(--dsw-alias-bg-overlay,#fff);color:var(--dsw-alias-label-primary,#1f2329);border:1px solid var(--dsw-alias-border-l2,#e2e4e9);border-radius:999px;padding:7px 16px;font-size:12px;line-height:18px;box-shadow:var(--dsw-shadow-lv2,0 6px 24px rgba(15,23,42,.14))}
` + workspaceCss + `
`;

/** 注入样式；带 data-plugin 归属，配合 dsh-client-hmr 的样式清理。 */
function injectStyles(): void {
  if (typeof document === "undefined") return;
  const tagId = `${BUNDLE_ID}/dsh-ui.css`;
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
export const inject = [
  "slots",
  "sessions",
  "workspaces",
  "locale",
  "conversation",
  "remote",
];

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
 * 客户端插件主体。
 * @param ctx - 客户端根上下文。
 */
export function apply(ctx: ClientContext): void {
  injectStyles();
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "dsh-ui: dictionaries");
  ctx.effect(() => ctx.locale.register(WS_NS, { zh: wsZh, en: wsEn }), "dsh-ui: workspace dictionaries");

  const sessions = ctx.sessions;
  const workspaces = ctx.workspaces;
  const conversation = ctx.conversation;

  /** 解析某会话的输入面（SessionInputResolver.for 需要一个带 scope 的 ctx）。 */
  const inputFor = (sessionId: SessionId) => {
    const actx = sessions.scope(sessionId) ?? sessions.binding(sessionId)?.ctx;
    if (actx === undefined) {
      throw new Error(`dsh-ui: session "${String(sessionId)}" has no resolvable scope`);
    }
    return conversation.input.for(actx);
  };

  /** 在既有草稿后追加文本并聚焦输入框。 */
  const prefill = (sessionId: SessionId, text: string): void => {
    const input = inputFor(sessionId);
    const draft = input.state.getSnapshot().draft ?? "";
    input.setDraft(composedDraft(text, draft));
    focusComposer();
  };

  /** 当前会话 id；无会话时返回 undefined。 */
  const currentSessionId = (): SessionId | undefined =>
    sessions.list.getSnapshot().current;

  /** 预填当前会话（无会话时抛错）。 */
  const prefillCurrent = (text: string): void => {
    const id = currentSessionId();
    if (id === undefined) throw new Error("dsh-ui: no current session");
    prefill(id, text);
  };

  /** 新建会话并预填（startSession 之后等 scope 就绪再写入）。 */
  const prefillNewSession = async (text: string): Promise<void> => {
    workspaces.startSession();
    let lastError: unknown;
    for (let attempt = 0; attempt < 30; attempt++) {
      try {
        prefillCurrent(text);
        return;
      } catch (err) {
        lastError = err;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    throw lastError;
  };

  // —— 功能一：划选追问 ——

  const askHere = (quote: string): void => {
    prefillCurrent(quoteBlock(quote));
  };

  const askInBranch = async (quote: string): Promise<void> => {
    const sourceId = currentSessionId();
    if (sourceId === undefined) throw new Error("dsh-ui: no current session");
    // fork 携带源会话的完整历史（最近一个已完成的 turn 边界），子分支随即进入列表。
    const childId = await sessions.fork({
      sessionId: sourceId,
      increaseTitle: true,
    });
    sessions.open(childId);
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

  // —— 功能二：笔记 ——

  const notes = new NotesController();

  // 挂载 notes 远程贡献（Typert gateway → host NotesService）。
  // 命名空间服务由 gateway 以动态 fiber 提供为 "remote.notes"；
  // 通过 ctx.get（隔离层读取，无 inject 要求）取得 face —— 与官方
  // “挂载者与消费者分离”的模式对齐（本插件两者一体，不能自注入）。
  ctx.effect(() => {
    let disposed = false;
    let unmount: (() => void) | null = null;
    void mountNotesRemote(ctx)
      .then(async (dispose) => {
        if (disposed) {
          await dispose();
          return;
        }
        unmount = dispose;
        const ns = ctx.get("remote.notes") as Parameters<typeof notesFaceOf>[0] | undefined;
        if (ns === undefined) {
          throw new Error("remote.notes namespace was not provided after mount");
        }
        const face = notesFaceOf(ns);
        await notes.attach(face);
      })
      .catch((err: unknown) => {
        console.error("[dsh-ui] notes remote mount failed:", err);
        const detail = err instanceof Error ? err.message : String(err);
        notes.notifyToast(`笔记服务不可用：${detail}`);
      });
    return () => {
      disposed = true;
      notes.detach();
      if (unmount !== null) void unmount();
    };
  }, "dsh-ui: notes remote");

  /** 剪藏落点：当前会话 id + 标题。 */
  const saveClip = (noteId: string, text: string): Promise<boolean> => {
    const id = currentSessionId();
    if (id === undefined) {
      notes.notifyToast("当前没有可用的对话");
      return Promise.resolve(false);
    }
    const summary = sessions.list.getSnapshot().byId[id];
    return notes.addClipTo(noteId, {
      text,
      sessionId: id,
      ...(summary !== undefined ? { sessionTitle: summary.displayTitle } : {}),
    });
  };

  const openSession = (sessionId: string): void => {
    if (sessions.list.getSnapshot().byId[sessionId as SessionId] === undefined) {
      notes.notifyToast("原会话已不存在");
      return;
    }
    sessions.open(sessionId as SessionId);
    notes.close();
  };

  const sessionExists = (sessionId: string): boolean =>
    sessions.list.getSnapshot().byId[sessionId as SessionId] !== undefined;

  // 侧栏：接管工作区座位，三分栏（工作区 / 笔记 / 文件）。
  // 工作区 tab 经子座位渲染官方 WorkspaceBrowser（store/inject/locale 全套照搬）。
  ctx.slots.inject("sidebar.workspaces", () =>
    ctx.slots.register(
      {
        name: "sidebar.workspaces",
        // 官方内置工作区面板默认注册在 priority 0；single 槽位同优先级会抛错。
        // 用更低的 -1 注册以遮蔽内置面板（槽位规则：数值最低的注册负责渲染）。
        priority: -1,
        children: {
          "sidebar.workspaces.browser": { kind: "single", scope: "root" },
        },
        locale: NS,
        inject: () => ({
          notes,
          openSession,
        }),
      },
      SidebarRegion,
    ),
  );

  // 官方浏览器注入面（与官方 apply 一致的接线，目录流洞换成原生 picker）。
  const browserInjected = (): WorkspaceBrowserInjected => ({
    startSession: (workspaceId) => {
      ctx.workspaces.startSession(workspaceId);
    },
    open: (sessionId) => {
      ctx.sessions.open(sessionId);
    },
    searchSessions: async (query, signal) => {
      const result = await ctx.sessions.search(query, signal);
      if (!result.ok) throw new Error(result.error.message);
      return result.value;
    },
    searchResultLimit: ctx.sessions.searchResultLimit,
    renameSession: async (sessionId, title) => {
      const session = ctx.sessions.binding(sessionId)?.session;
      if (session === undefined) throw new Error(`unknown session "${String(sessionId)}"`);
      const result = await session.rename(title);
      if (!result.ok) throw new Error(result.error.message);
    },
    forkSession: (sessionId) => {
      void ctx.sessions
        .fork({ sessionId, increaseTitle: true })
        .then((childId) => {
          ctx.sessions.open(childId);
        })
        .catch(() => {
          // Fork 或子标题失败：保持当前选择。
        });
    },
    renameWorkspace: async (workspaceId, title) => {
      await ctx.workspaces.rename(workspaceId, title);
    },
    deleteWorkspace: async (workspaceId) => {
      await ctx.workspaces.delete(workspaceId);
    },
    insertWorkspaceBefore: async (workspaceId, beforeWorkspaceId) => {
      await ctx.workspaces.insertBefore(workspaceId, beforeWorkspaceId);
    },
    archiveSession: async (sessionId) => {
      await ctx.workspaces.archiveSession(sessionId);
    },
    insertSessionBefore: async (workspaceId, sessionId, beforeSessionId) => {
      await ctx.workspaces.insertSessionBefore(workspaceId, sessionId, beforeSessionId);
    },
    createWorkspace: (input) => ctx.workspaces.create(input),
    pickWorkspacePath: () => ctx.workspaces.pickDirectory(),
  });

  ctx.slots.inject("sidebar.workspaces.browser", () =>
    ctx.slots.register(
      {
        name: "sidebar.workspaces.browser",
        store: createWorkspaceViewStore(),
        inject: browserInjected,
        locale: WS_NS,
      },
      WorkspaceBrowser,
    ),
  );

  // 笔记编辑器与 toast：全屏覆盖层。
  ctx.slots.inject("shell.overlay", () => [
    ctx.slots.register(
      {
        name: "shell.overlay",
        id: "dsh-ui.selection-bar",
        locale: NS,
        inject: () => ({
          hasSession: () => currentSessionId() !== undefined,
          askHere,
          askInBranch,
          notes,
          saveClip,
        }),
      },
      SelectionBar,
    ),
    ctx.slots.register(
      {
        name: "shell.overlay",
        id: "dsh-ui.note-editor",
        locale: NS,
        inject: () => ({
          notes,
          openSession,
          sessionExists,
          askInNewSession: (contextText: string) => {
            notes.close();
            void prefillNewSession(contextText);
          },
          askInCurrent: (contextText: string) => {
            notes.close();
            prefillCurrent(contextText);
          },
          workInNote: (template: string) => {
            notes.close();
            void prefillNewSession(template);
          },
        }),
      },
      NoteEditor,
    ),
    ctx.slots.register(
      {
        name: "shell.overlay",
        id: "dsh-ui.toast",
        locale: NS,
        inject: () => ({ notes }),
      },
      Toast,
    ),
  ]);
}
