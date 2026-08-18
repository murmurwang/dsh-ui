import type { Context } from "@deepseek-ai/cordis";
import { Remote, TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
import type { NotesStore } from "./store";

/**
 * 笔记 host 远程服务：作为 cordis Service（键 `notes`）注册，
 * 同时把同一键绑定到 Typert Gateway（直接调用）。
 */
export class NotesService extends TypertRemoteService {
  /** 存储实例由 apply 注入，与 agent 工具共享。 */
  readonly store: NotesStore;

  constructor(ctx: Context, store: NotesStore) {
    super(ctx, "notes");
    this.store = store;
  }

  @Remote("list")
  list(_request: Record<string, never> = {}): ReturnType<NotesStore["list"]> {
    return this.store.list();
  }

  @Remote("get")
  get(request: { id: string }): ReturnType<NotesStore["get"]> {
    return this.store.get(request.id);
  }

  @Remote("create")
  create(request: { title?: string }): ReturnType<NotesStore["create"]> {
    return this.store.create(request);
  }

  @Remote("update")
  update(request: Parameters<NotesStore["update"]>[0]): ReturnType<NotesStore["update"]> {
    return this.store.update(request);
  }

  @Remote("delete")
  delete(request: { id: string }): ReturnType<NotesStore["remove"]> {
    return this.store.remove(request.id);
  }
}
