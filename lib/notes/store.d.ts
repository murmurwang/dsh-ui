import type { InvalidArgumentError, Note, NoteClip, NoteListItem, NotesError, RpcResult } from "./contract";
/**
 * 笔记存储：单一 JSONL 文件（root/notes.jsonl），整文件原子替换写入。
 * 所有变更经同一串行队列，version 为每次变更递增的单调字符串，
 * 客户端 / agent 工具用 ifVersion 做乐观并发。
 */
export declare class NotesStore {
    readonly root: string;
    private notes;
    private tail;
    private loaded;
    private versionCounter;
    readonly file: string;
    constructor(root: string);
    /** 加载（幂等）；文件不存在时视为空库。 */
    load(): Promise<void>;
    private enqueue;
    private nextVersion;
    private persist;
    private require;
    /** 列表（按创建时间升序）。 */
    list(): Promise<RpcResult<{
        items: NoteListItem[];
    }, never>>;
    /** 读取整篇笔记（返回快照，后续内部变更不影响调用方持有的对象）。 */
    get(id: string): Promise<RpcResult<{
        note: Note;
    }, NotesError>>;
    /** 新建笔记。 */
    create(input: {
        title?: string;
    }): Promise<RpcResult<{
        note: Note;
    }, InvalidArgumentError>>;
    /**
     * 更新一篇笔记：title/body 整值替换；addClip 追加剪藏；removeClipId 删除剪藏。
     * ifVersion 必须匹配当前版本。
     */
    update(input: {
        id: string;
        ifVersion: string;
        title?: string;
        body?: string;
        addClip?: Omit<NoteClip, "id" | "createdAt">;
        removeClipId?: string;
    }): Promise<RpcResult<{
        note: Note;
    }, NotesError>>;
    /** 删除一篇笔记。 */
    remove(id: string): Promise<RpcResult<{
        ok: true;
    } | {
        absent: true;
    }, NotesError>>;
}
