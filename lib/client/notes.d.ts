import type { ClientContext } from "@deepseek-ai/dsh-client-runtime/client";
import type { Note, NoteClip, NoteListItem, NotesError, RpcResult } from "../notes/contract";
/**
 * 客户端笔记面：把 host 的 `notes` Typert 远程挂进 `ctx.remote`，
 * 并用一个 React-free 的 NotesController 管理列表 / 打开笔记 / 保存 /
 * 剪藏 / 轮询（agent 写回后自动刷新）。
 */
export interface NotesRemoteFace {
    list(): Promise<RpcResult<{
        items: NoteListItem[];
    }, never>>;
    get(input: {
        id: string;
    }): Promise<RpcResult<{
        note: Note;
    }, NotesError>>;
    create(input: {
        title?: string;
    }): Promise<RpcResult<{
        note: Note;
    }, NotesError>>;
    update(input: {
        id: string;
        ifVersion: string;
        title?: string;
        body?: string;
        addClip?: {
            text: string;
            sessionId: string;
            sessionTitle?: string;
        };
        removeClipId?: string;
    }): Promise<RpcResult<{
        note: Note;
    }, NotesError>>;
    delete(input: {
        id: string;
    }): Promise<RpcResult<{
        ok?: true;
        absent?: true;
    }, NotesError>>;
}
/** $mount 客户端远程贡献；返回卸载函数。 */
export declare function mountNotesRemote(ctx: ClientContext): Promise<() => void>;
export interface NotesSnapshot {
    phase: "boot" | "ready" | "error";
    items: NoteListItem[];
    listError: string | null;
    /** 正在编辑的笔记 id / 全量。 */
    openId: string | null;
    openNote: Note | null;
    openError: string | null;
    saving: boolean;
    savedAt: number | null;
    saveError: string | null;
    /** 剪藏落点记忆（最近一次保存剪藏的笔记 id）。 */
    lastClipNoteId: string | null;
    /** 轻量 toast（底部提示）。 */
    toast: {
        text: string;
        seq: number;
    } | null;
}
export declare class NotesController {
    private remote;
    private state;
    private listeners;
    private pollTimer;
    private toastTimer;
    private toastSeq;
    /** 编辑器有未保存草稿时，轮询不覆盖打开中的笔记。 */
    private dirty;
    /** 编辑器告知是否有未保存改动。 */
    setDirty(value: boolean): void;
    getSnapshot: () => NotesSnapshot;
    subscribe: (fn: () => void) => (() => void);
    private publish;
    notifyToast(text: string): void;
    private face;
    /** $mount 完成后挂载 remote face 并拉取列表。 */
    attach(remote: NotesRemoteFace): Promise<void>;
    detach(): void;
    refresh(): Promise<void>;
    create(title: string): Promise<Note | null>;
    open(id: string): Promise<void>;
    close(): void;
    /** 读取打开中的笔记；有未保存草稿时不覆盖，避免打断用户输入。 */
    private loadOpen;
    private startPolling;
    private stopPolling;
    /** 保存标题 + 正文（乐观并发：冲突时重新载入并提示）。 */
    save(input: {
        title?: string;
        body?: string;
    }): Promise<boolean>;
    /** 把剪藏追加到指定笔记（若该笔记正打开，直接更新视图）。 */
    addClipTo(noteId: string, clip: Omit<NoteClip, "id" | "createdAt">): Promise<boolean>;
    removeClip(noteId: string, clipId: string): Promise<void>;
    removeNote(id: string): Promise<void>;
    /** 供剪藏选择器用：按最近更新排序的前若干条。 */
    recentItems(limit?: number): NoteListItem[];
}
