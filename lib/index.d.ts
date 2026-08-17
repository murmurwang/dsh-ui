import type { Context } from "@deepseek-ai/cordis";
/**
 * dsh-ui 插件 Node（host）半边。
 *
 * - 笔记存储：DSH_HOME/notes（可用插件配置 root 覆盖）；
 * - `notes` Typert 远程服务（浏览器客户端经 Typert Gateway 调用）；
 * - 模型可见的 `notes` 工具（agent 在笔记中工作并写回）。
 *
 * 浏览器半边经由 `exports["./client"]` 发布。
 */
export declare const inject: string[];
export { NotesService } from "./notes/service";
export { NotesStore } from "./notes/store";
export type { Note, NoteClip, NoteListItem } from "./notes/contract";
export interface DshUiHostConfig {
    /** 笔记存储根目录，默认 dshHomePath('notes')。 */
    root?: string;
}
export declare function apply(ctx: Context, config?: DshUiHostConfig): void;
