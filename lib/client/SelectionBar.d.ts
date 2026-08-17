import * as React from "react";
import type { TranslateNS } from "@deepseek-ai/dsh-client-ui-slots";
import { NS } from "./locales";
export interface SelectionBarProps {
    /** 命名空间绑定的翻译函数（slot 的 locale seat）。 */
    t: TranslateNS<typeof NS>;
    /** 当前是否存在可用的会话（无会话时浮窗不出现）。 */
    hasSession: () => boolean;
    /** 在当前对话中追问：把引用块预填进当前会话输入框。 */
    askHere: (quote: string) => void;
    /** 在新分支对话中追问：fork 当前会话并打开子分支，再预填引用块。 */
    askInBranch: (quote: string) => Promise<void>;
}
/**
 * 划选文字浮窗：随选区出现，提供两个动作按钮。
 *
 * - 划选后浮窗停靠在选区上方（空间不足时转到下方），水平居中并夹在视口内；
 * - 点击浮窗内按钮不会折叠选区（pointerdown preventDefault）；
 * - 选区消失、点击浮窗外、Escape、滚动或窗口尺寸变化时关闭；
 * - 新建分支期间按钮置忙，失败时在浮窗内展示错误。
 */
export declare function SelectionBar({ t, hasSession, askHere, askInBranch, }: SelectionBarProps): React.JSX.Element | null;
