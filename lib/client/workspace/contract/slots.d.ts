/**
 * dsh-ui 版工作区浏览器契约（官方 ui-workspace 的照搬适配）。
 *
 * 官方 WorkspaceBrowser 原注册在 sidebar.workspaces；本插件把该座位改为
 * 三分栏，工作区 tab 内再挂一个子座位 'sidebar.workspaces.browser'，
 * 官方组件以相同机制（store / inject / locale / 目录流洞）注册其中，
 * 行为与原版逐一致。
 */
import type { HostObservable, PropsRenderSlots, PropsRuntime, PropsStore, SnapshotSelectorHook, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots';
import type { SessionId, SessionSearchResultItem, WorkspaceId, WorkspaceView } from '@deepseek-ai/dsh-client-runtime/client';
import type { createWorkspaceViewStore } from '../stores.ts';
import type { WorkspaceKey } from '../locales.ts';
/** Owner share of the directory-flow holes (官方契约原样)。 */
export interface DirectoryFlowOwnerProps {
    /** True while a picking interaction is requested; flipping back to false withdraws the request. */
    open: boolean;
    /** True while the owner adopts a picked path (`createWorkspace` in flight). */
    busy: boolean;
    /** The operator picked a directory (absolute host path); the owner adopts it. */
    onPicked: (path: string) => void;
    /** The operator dismissed the interaction; the owner just closes the flow. */
    onCancel: () => void;
    /** The interaction itself failed (chooser missing, listing denied). */
    onError: (message: string) => void;
}
/** The two directory-flow holes (官方契约原样)。 */
export type DirectoryFlowSlotName = 'conversation.hero.workspace.directoryFlow' | 'sidebar.workspaces.directoryFlow';
/** Directory-picking share（官方契约原样）。 */
export type DirectoryPickingInjected = {
    hooks: {
        /** True while this surface's directory-flow hole is occupied. */
        directoryFlow: HostObservable<boolean>;
    };
};
/** Component-side view of the picking share. */
export type DirectoryPickingHooks = {
    /** Selector hook over this surface's directory-flow occupancy. */
    useDirectoryFlow: SnapshotSelectorHook<boolean>;
};
/** Browser 注入的业务动作面（官方契约原样 + 原生目录选择）。 */
export type WorkspaceBrowserInjected = {
    startSession: (workspaceId?: WorkspaceId) => void;
    open: (sessionId: SessionId) => void;
    searchSessions: (query: string, signal: AbortSignal) => Promise<{
        items: readonly SessionSearchResultItem[];
        hasMore: boolean;
    }>;
    searchResultLimit: number;
    renameSession: (sessionId: SessionId, title: string) => Promise<void>;
    forkSession: (sessionId: SessionId) => void;
    renameWorkspace: (workspaceId: WorkspaceId, title: string) => Promise<void>;
    deleteWorkspace: (workspaceId: WorkspaceId) => Promise<void>;
    insertWorkspaceBefore: (workspaceId: WorkspaceId, beforeWorkspaceId?: WorkspaceId) => Promise<void>;
    archiveSession: (sessionId: SessionId) => Promise<void>;
    insertSessionBefore: (workspaceId: WorkspaceId, sessionId: SessionId, beforeSessionId?: SessionId) => Promise<void>;
    createWorkspace: (input: {
        path: string;
    }) => Promise<WorkspaceView>;
    /** dsh-ui 照搬版：直接原生目录选择（替代目录流洞）。 */
    pickWorkspacePath: () => Promise<string | null>;
};
/** Picker 注入面（官方契约原样；本插件不注册 picker，仅保留类型）。 */
export type WorkspacePickerInjected = DirectoryPickingInjected & {
    createWorkspace: (input: {
        path: string;
    }) => Promise<WorkspaceView>;
};
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface SlotMap {
        /** dsh-ui 三分栏内的工作区浏览子座位（官方 WorkspaceBrowser 的宿主）。 */
        'sidebar.workspaces.browser': {
            kind: 'single';
            scope: 'root';
            owner: {
                wide: boolean;
                expandSidebar: () => void;
            };
        };
    }
}
/** 完整 browser props（store / inject / locale 全套）。 */
export type WorkspaceBrowserProps = PropsRuntime<'sidebar.workspaces.browser'> & PropsStore<ReturnType<typeof createWorkspaceViewStore>> & WorkspaceBrowserInjected & {
    t: TranslateNS<'dsh-ui.workspace'>;
    keys?: WorkspaceKey;
};
/** 完整 picker props（类型保留）。 */
export type WorkspacePickerProps = PropsRuntime<'conversation.hero.workspace'> & PropsRenderSlots<'conversation.hero.workspace.directoryFlow'> & Omit<WorkspacePickerInjected, 'hooks'> & DirectoryPickingHooks & {
    t: TranslateNS<'dsh-ui.workspace'>;
};
