import * as React from "react";
import type { TranslateNS } from "@deepseek-ai/dsh-client-ui-slots";
import type { SessionListState, WorkspaceListState } from "@deepseek-ai/dsh-client-runtime/client";
import type { NotesController } from "./notes";
import { NS } from "./locales";
export type SnapshotSelectorHook<S> = <R>(selector: (s: S) => R) => R;
export interface SidebarRegionProps {
    /** SidebarRoot 传入的 owner props。 */
    wide: boolean;
    expandSidebar: () => void;
    /** locale seat。 */
    t: TranslateNS<typeof NS>;
    /** 标准全局 kit。 */
    useWorkspaces: SnapshotSelectorHook<WorkspaceListState>;
    useSessions: SnapshotSelectorHook<SessionListState>;
    /** inject 注入的业务面。 */
    notes: NotesController;
    openSession: (sessionId: string) => void;
    openWorkspace: (workspaceId: string) => void;
    addWorkspace: () => void;
}
/** 侧栏工作区座位的新占有者：工作区 / 笔记 / 文件 三分栏。 */
export declare function SidebarRegion(props: SidebarRegionProps): React.JSX.Element;
