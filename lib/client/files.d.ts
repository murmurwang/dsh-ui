import type { ClientContext } from "@deepseek-ai/dsh-client-runtime/client";
import type { NotesError, RpcResult } from "../notes/contract";
/** 文件元数据（wire 形状）。 */
export interface FileMeta {
    id: string;
    name: string;
    mime: string;
    size: number;
    uploadedAt: number;
}
export interface StoredFile extends FileMeta {
    text?: string;
}
export interface FilesRemoteFace {
    list(request?: Record<string, never>): Promise<RpcResult<{
        items: FileMeta[];
    }, never>>;
    upload(input: {
        name: string;
        mime: string;
        bytesBase64: string;
    }): Promise<RpcResult<{
        file: StoredFile;
    }, NotesError>>;
    get(input: {
        id: string;
    }): Promise<RpcResult<{
        file: StoredFile;
    }, NotesError>>;
    getBytes(input: {
        id: string;
    }): Promise<RpcResult<{
        bytesBase64: string;
    }, NotesError>>;
    delete(input: {
        id: string;
    }): Promise<RpcResult<{
        ok?: true;
        absent?: true;
    }, NotesError>>;
}
export declare function filesFaceOf(ns: {
    list(request?: Record<string, never>): Promise<RpcResult<RpcResult<{
        items: FileMeta[];
    }, never>, never>>;
    upload(input: unknown): Promise<RpcResult<RpcResult<{
        file: StoredFile;
    }, NotesError>, never>>;
    get(input: {
        id: string;
    }): Promise<RpcResult<RpcResult<{
        file: StoredFile;
    }, NotesError>, never>>;
    getBytes(input: {
        id: string;
    }): Promise<RpcResult<RpcResult<{
        bytesBase64: string;
    }, NotesError>, never>>;
    delete(input: {
        id: string;
    }): Promise<RpcResult<RpcResult<{
        ok?: true;
        absent?: true;
    }, NotesError>, never>>;
}): FilesRemoteFace;
/** $mount 全部远程贡献（notes + files）；返回卸载函数。 */
export declare function mountDshUiRemotes(ctx: ClientContext): Promise<() => void>;
export interface FilesSnapshot {
    phase: "boot" | "ready" | "error";
    items: FileMeta[];
    listError: string | null;
    /** 正在查看的文件。 */
    openId: string | null;
    openFile: StoredFile | null;
    openError: string | null;
    /** 预览原始字节（打开时加载一次）。 */
    previewUrl: string | null;
    toast: {
        text: string;
        seq: number;
    } | null;
}
export declare class FilesController {
    private remote;
    private state;
    private listeners;
    private toastTimer;
    private toastSeq;
    getSnapshot: () => FilesSnapshot;
    subscribe: (fn: () => void) => (() => void);
    private publish;
    notifyToast(text: string): void;
    private face;
    attach(remote: FilesRemoteFace): Promise<void>;
    detach(): void;
    private revokePreview;
    refresh(): Promise<void>;
    /** 上传（浏览器 File → base64）。 */
    upload(file: File): Promise<boolean>;
    open(id: string): Promise<void>;
    close(): void;
    remove(id: string): Promise<void>;
}
