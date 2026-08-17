import type { NotesStore } from "./store";
/**
 * 模型可见的 `notes` 工具：让 agent 可以在用户的笔记里工作。
 *
 * - list 枚举笔记；read 读取整篇（含剪藏与版本号）；
 * - create 新建；write 整体替换正文；append 在正文后追加；
 * - write/append 用 ifVersion 做乐观并发，冲突时模型应重新 read 后重试。
 */
export declare function defineNotesTool(store: NotesStore): import("@deepseek-ai/dsh-tools").ToolDefinition;
