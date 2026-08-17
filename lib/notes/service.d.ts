import type { Context } from "@deepseek-ai/cordis";
import { TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
import type { NotesStore } from "./store";
/**
 * 笔记 host 远程服务：作为 cordis Service（键 `notes`）注册，
 * 同时把同一键绑定到 Typert Gateway（直接调用）。
 */
export declare class NotesService extends TypertRemoteService {
    /** 存储实例由 apply 注入，与 agent 工具共享。 */
    readonly store: NotesStore;
    constructor(ctx: Context, store: NotesStore);
    list(): ReturnType<NotesStore["list"]>;
    get(request: {
        id: string;
    }): ReturnType<NotesStore["get"]>;
    create(request: {
        title?: string;
    }): ReturnType<NotesStore["create"]>;
    update(request: Parameters<NotesStore["update"]>[0]): ReturnType<NotesStore["update"]>;
    delete(request: {
        id: string;
    }): ReturnType<NotesStore["remove"]>;
}
