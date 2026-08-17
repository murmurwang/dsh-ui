/** locale 字典命名空间。 */
export const NS = "dsh-ui.selection";

export const zh = {
  "action.here": "追问所选部分",
  "action.here.title": "把所选内容作为引用，预填到当前对话的输入框",
  "action.branch": "在新分支中追问",
  "action.branch.title": "新建一个携带当前上下文的分支对话，并把所选内容预填进输入框",
  "action.branch.busy": "正在创建分支…",
  "bar.aria": "划选文字追问",
  "error.noSession": "当前没有可用的对话",
  "error.fork": "创建分支对话失败",
  "error.input": "找不到该会话的输入框",
} as const;

export const en = {
  "action.here": "Ask about this here",
  "action.here.title": "Quote the selection into the current composer",
  "action.branch": "Ask in a new branch",
  "action.branch.title": "Fork a branch carrying the current context and quote the selection into its composer",
  "action.branch.busy": "Creating branch…",
  "bar.aria": "Selection actions",
  "error.noSession": "No active conversation",
  "error.fork": "Failed to create branch",
  "error.input": "Composer unavailable for this session",
} as const;

/** 词典键集合（以 zh 为准），en 与之对齐。 */
export type SelectionKey = keyof typeof zh | keyof typeof en;

declare module "@deepseek-ai/dsh-client-ui-slots" {
  interface LocaleNamespaceMap {
    /** dsh-ui 划选浮窗文案。 */
    "dsh-ui.selection": SelectionKey;
  }
}
