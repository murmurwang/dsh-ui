import type { RpcResult } from "./contract";
/** 支持的文件类型（v1：PDF）。 */
export declare const FILE_MIME_WHITELIST: Set<string>;
export declare const MAX_FILE_BYTES: number;
export interface StoredFileMeta {
    id: string;
    name: string;
    mime: string;
    size: number;
    uploadedAt: number;
}
export interface StoredFile extends StoredFileMeta {
    /** PDF 提取文本（缺失表示尚未提取）。 */
    text?: string;
}
/**
 * 文件存储：DSH_HOME/notes/files/ 下每文件一个目录
 *   <id>/blob（原始字节） + <id>/meta.json + <id>/text.txt（提取文本）
 */
export declare class FilesStore {
    readonly root: string;
    private tail;
    constructor(root: string);
    private enqueue;
    private fileDir;
    private loadMeta;
    init(): Promise<void>;
    /** 列出所有文件（含提取文本；列表接口不吐正文，这里只做元数据）。 */
    list(): Promise<RpcResult<{
        items: StoredFileMeta[];
    }, never>>;
    /**
     * 保存上传文件（base64 字节），PDF 同时提取文本。
     */
    upload(input: {
        name: string;
        mime: string;
        bytesBase64: string;
    }): Promise<RpcResult<{
        file: StoredFile;
    }, {
        code: "invalid-argument";
        message: string;
    }>>;
    /** 读取文件（元数据 + 提取文本；原始字节单独接口）。 */
    get(id: string): Promise<RpcResult<{
        file: StoredFile;
    }, {
        code: "not-found";
        id: string;
    }>>;
    /** 原始字节（base64），用于浏览器原版式预览。 */
    getBytes(id: string): Promise<RpcResult<{
        bytesBase64: string;
    }, {
        code: "not-found";
        id: string;
    }>>;
    delete(id: string): Promise<RpcResult<{
        ok?: true;
        absent?: true;
    }, {
        code: "not-found";
        id: string;
    }>>;
}
/** 临时导出供后续改名复用。 */
export declare function sanitizeFileName(name: string): string;
