import * as React from "react";
import type { TranslateNS } from "@deepseek-ai/dsh-client-ui-slots";
import type { NotesController } from "./notes";
import { NS } from "./locales";
export interface SidebarRegionProps {
    /** SidebarRoot 传入的 owner props。 */
    wide: boolean;
    expandSidebar: () => void;
    /** locale seat。 */
    t: TranslateNS<typeof NS>;
    /** 工作区浏览子座位（官方 WorkspaceBrowser 的宿主）。 */
    renderSlot: (name: "sidebar.workspaces.browser", owner: {
        wide: boolean;
        expandSidebar: () => void;
    }) => React.ReactNode;
    /** inject 注入的业务面。 */
    notes: NotesController;
    openSession: (sessionId: string) => void;
}
/** 侧栏工作区座位的新占有者：工作区 / 笔记 / 文件 三分栏。
 *  工作区 tab 直接渲染官方 WorkspaceBrowser（经子座位，全套官方机制）。 */
export declare function SidebarRegion(props: SidebarRegionProps): React.JSX.Element;
