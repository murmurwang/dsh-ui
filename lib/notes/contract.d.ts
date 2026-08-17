/** dsh-ui 笔记领域类型（host 存储 / 客户端 / agent 工具共享的形状描述）。 */
/** 一条剪藏：从会话里划选并保存到笔记的原文片段。 */
export interface NoteClip {
    /** 客户端生成的稳定 id。 */
    id: string;
    /** 剪藏原文。 */
    text: string;
    /** 来源会话 id（回链目标）。 */
    sessionId: string;
    /** 剪藏时的会话标题（供展示，可能过期）。 */
    sessionTitle?: string;
    createdAt: number;
}
/** 一篇笔记。 */
export interface Note {
    id: string;
    title: string;
    /** Markdown 正文（用户书写 + dsh 写回的内容）。 */
    body: string;
    clips: NoteClip[];
    /** 乐观并发版本：每次变更递增。 */
    version: string;
    createdAt: number;
    updatedAt: number;
}
/** 笔记列表条目（不含 body/clips 全文）。 */
export interface NoteListItem {
    id: string;
    title: string;
    clipCount: number;
    bodyLength: number;
    version: string;
    createdAt: number;
    updatedAt: number;
}
export type RpcOk<T> = {
    ok: true;
    value: T;
};
export type RpcRejected<E> = {
    ok: false;
    error: E;
};
export type RpcResult<T, E> = RpcOk<T> | RpcRejected<E>;
export interface NotFoundError {
    code: "not-found";
    id: string;
}
export interface VersionConflictError {
    code: "version-conflict";
    current: Note | null;
}
export interface InvalidArgumentError {
    code: "invalid-argument";
    message: string;
}
export type NotesError = NotFoundError | VersionConflictError | InvalidArgumentError;
