import * as React from "react";
export interface NoteBodyProps {
    /** Markdown 源码（存储与 agent 工具的权威格式）。 */
    source: string;
    /** 空正文占位提示。 */
    placeholder?: string;
    /** 回链 hover 按钮文案。 */
    backLabel?: string;
    /** 用户输入后回写 Markdown 源码。 */
    onSourceChange: (markdown: string) => void;
    /** 点击回链返回按钮。 */
    onSessionLink: (sessionId: string) => void;
    /** @ 触发状态（正文中输入 @ 唤起小鲸鱼菜单）。 */
    onAtChange: (open: boolean) => void;
}
/**
 * Notion 式正文：contentEditable 里渲染 Markdown（所见即所得），
 * 输入时把 DOM 序列化回 Markdown 上抛；无预览/编辑之分。
 * - 外部源码变化才重渲染（用户输入中不打断光标）；
 * - dshui:// 回链为灰色文字 + hover 返回按钮（按钮不可编辑、点击回原会话）；
 * - 点击链接文字本体 = 就地编辑，不跳转。
 */
export declare function NoteBody({ source, placeholder, backLabel, onSourceChange, onSessionLink, onAtChange }: NoteBodyProps): React.JSX.Element;
