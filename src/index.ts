import type { Context } from "@deepseek-ai/cordis";
import { join } from "node:path";
import { dshHomePath } from "@deepseek-ai/dsh-home-paths";
import { NotesService } from "./notes/service";
import { NotesStore } from "./notes/store";
import { FilesService } from "./notes/files-service";
import { FilesStore } from "./notes/files-store";
import { defineNotesTool } from "./notes/tool";

/**
 * dsh-ui 插件 Node（host）半边。
 *
 * - 笔记存储：DSH_HOME/notes（可用插件配置 root 覆盖）；
 * - `notes` Typert 远程服务（浏览器客户端经 Typert Gateway 调用）；
 * - 模型可见的 `notes` 工具（agent 在笔记中工作并写回）。
 *
 * 浏览器半边经由 `exports["./client"]` 发布。
 */

export const inject = ["tools"];

export { NotesService } from "./notes/service";
export { NotesStore } from "./notes/store";
export { FilesService } from "./notes/files-service";
export { FilesStore } from "./notes/files-store";
export type { Note, NoteClip, NoteListItem } from "./notes/contract";

export interface DshUiHostConfig {
  /** 笔记存储根目录，默认 dshHomePath('notes')。 */
  root?: string;
}

export function apply(ctx: Context, config: DshUiHostConfig = {}): void {
  const root = config.root ?? dshHomePath("notes");
  const store = new NotesStore(root);

  // Typert 远程服务（自身注册为 cordis Service `notes`）。
  new NotesService(ctx, store);

  // 文件/PDF 远程服务（与笔记同根目录下的 files/ 子目录）。
  const filesStore = new FilesStore(join(root, "files"));
  new FilesService(ctx, filesStore);

  // agent 工具：与远程服务共享同一存储。
  const notesTool = defineNotesTool(store);
  ctx.tools.register(notesTool);
}
