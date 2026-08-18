import * as React from "react";
import type { TranslateNS } from "@deepseek-ai/dsh-client-ui-slots";
import type { NotesController } from "./notes";
import { NS } from "./locales";
export interface NoteEditorProps {
    t: TranslateNS<typeof NS>;
    notes: NotesController;
    openSession: (sessionId: string) => void;
    /** 新建会话并把笔记内容预填为上下文。 */
    askInNewSession: (contextText: string) => void;
    /** 在当前会话追问（预填笔记内容）。 */
    askInCurrent: (contextText: string) => void;
    /** 让 dsh 在本笔记中工作（新会话 + 工具写回模板）。 */
    workInNote: (template: string) => void;
}
/** 全屏笔记编辑器（覆盖在会话区之上）。 */
export declare function NoteEditor(props: NoteEditorProps): React.JSX.Element | null;
