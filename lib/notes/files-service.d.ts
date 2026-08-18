import type { Context } from "@deepseek-ai/cordis";
import { TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
import type { FilesStore } from "./files-store";
/**
 * 文件 host 远程服务（`files`）：浏览器上传/浏览 PDF，
 * host 侧存原始字节并提取文字，供文字视图划选。
 */
export declare class FilesService extends TypertRemoteService {
    readonly store: FilesStore;
    constructor(ctx: Context, store: FilesStore);
    list(_request?: Record<string, never>): ReturnType<FilesStore["list"]>;
    upload(request: Parameters<FilesStore["upload"]>[0]): ReturnType<FilesStore["upload"]>;
    get(request: {
        id: string;
    }): ReturnType<FilesStore["get"]>;
    getBytes(request: {
        id: string;
    }): ReturnType<FilesStore["getBytes"]>;
    delete(request: {
        id: string;
    }): ReturnType<FilesStore["delete"]>;
}
