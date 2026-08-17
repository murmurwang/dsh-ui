/** locale 字典命名空间。 */
export declare const NS = "dsh-ui.selection";
export declare const zh: {
    readonly "action.here": "追问所选部分";
    readonly "action.here.title": "把所选内容作为引用，预填到当前对话的输入框";
    readonly "action.branch": "在新分支中追问";
    readonly "action.branch.title": "新建一个携带当前上下文的分支对话，并把所选内容预填进输入框";
    readonly "action.branch.busy": "正在创建分支…";
    readonly "bar.aria": "划选文字追问";
    readonly "error.noSession": "当前没有可用的对话";
    readonly "error.fork": "创建分支对话失败";
    readonly "error.input": "找不到该会话的输入框";
};
export declare const en: {
    readonly "action.here": "Ask about this here";
    readonly "action.here.title": "Quote the selection into the current composer";
    readonly "action.branch": "Ask in a new branch";
    readonly "action.branch.title": "Fork a branch carrying the current context and quote the selection into its composer";
    readonly "action.branch.busy": "Creating branch…";
    readonly "bar.aria": "Selection actions";
    readonly "error.noSession": "No active conversation";
    readonly "error.fork": "Failed to create branch";
    readonly "error.input": "Composer unavailable for this session";
};
/** 词典键集合（以 zh 为准），en 与之对齐。 */
export type SelectionKey = keyof typeof zh | keyof typeof en;
declare module "@deepseek-ai/dsh-client-ui-slots" {
    interface LocaleNamespaceMap {
        /** dsh-ui 划选浮窗文案。 */
        "dsh-ui.selection": SelectionKey;
    }
}
