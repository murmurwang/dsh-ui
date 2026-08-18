import * as React from "react";
import type { TranslateNS } from "@deepseek-ai/dsh-client-ui-slots";
import type { FilesController } from "./files";
import type { NotesController } from "./notes";
import { NS } from "./locales";
export interface FileViewProps {
    t: TranslateNS<typeof NS>;
    files: FilesController;
    notes: NotesController;
    /** 剪藏落点（file 链接）。 */
    saveClip: (noteId: string, text: string, fileLink: string) => Promise<boolean>;
    askHere: (quote: string) => void;
    askInBranch: (quote: string) => Promise<void>;
}
/**
 * 文件页（右侧主区）：原版式预览（浏览器原生 PDF）+ 可划线文字视图。
 * 文字视图里划选 → 浮窗：存为笔记 / 追问所选部分 / 在新分支中追问。
 */
export declare function FileView({ t, files, notes, saveClip, askHere, askInBranch }: FileViewProps): React.JSX.Element | null;
