/**
 * `workspace` namespace dictionaries: the browsing region (section header,
 * search, tree rows, dialogs) and the pick/add flow. Runtime failure
 * messages (wire error strings) pass through untranslated by policy.
 */
/** Simplified Chinese dictionary (the key-set source of truth). */
/** dsh-ui 工作区文案命名空间（键集照搬官方 workspace）。 */
export declare const NS: 'dsh-ui.workspace';
export declare const zh: {
    'group.ungrouped': string;
    'session.new': string;
    'section.workspaces': string;
    'section.sessions': string;
    'viewOptions.label': string;
    'groupBy.label': string;
    'groupBy.workspace': string;
    'groupBy.flat': string;
    'orderBy.label': string;
    'orderBy.manual': string;
    'orderBy.updated': string;
    'sessions.expand': string;
    'sessions.collapse': string;
    'empty.none': string;
    'empty.noMatches': string;
    'workspace.add': string;
    'search.sessions.aria': string;
    'search.placeholder': string;
    'search.clear': string;
    'search.results.aria': string;
    'search.pending': string;
    'search.unavailable': string;
    'search.noMatches': string;
    'search.hasMore': string;
    'menu.addWorkspace': string;
    'picker.loading': string;
    'conflict.named': string;
    'folderError.title': string;
    'folderError.retry': string;
    rename: string;
    'rename.workspace.title': string;
    'rename.session.title': string;
    'field.workspaceName': string;
    'field.sessionName': string;
    'delete.workspace': string;
    'delete.desc': string;
    'delete.pending': string;
    'menu.fork': string;
    'menu.archiveSession': string;
    'sessions.count.one': string;
    'sessions.count.other': string;
    'actions.workspace.aria': string;
    'actions.session.aria': string;
    'actions.newSession.aria': string;
    'status.running': string;
    'status.subagentsRunning.one': string;
    'status.subagentsRunning.other': string;
    'status.idle': string;
    'status.waitingApproval': string;
    'status.planReview': string;
    'status.waitingAnswer': string;
    'status.completed': string;
    'hover.created': string;
    'hover.copied': string;
    'date.ymd': string;
    'time.now': string;
    'time.minutes': string;
    'time.hours': string;
    'time.days': string;
    'time.months': string;
    'time.years': string;
    'time.ago': string;
};
/** The workspace namespace key union. */
export type WorkspaceKey = keyof typeof zh;
/** English dictionary, checked complete against the zh key set. */
export declare const en: {
    'group.ungrouped': string;
    'session.new': string;
    'section.workspaces': string;
    'section.sessions': string;
    'viewOptions.label': string;
    'groupBy.label': string;
    'groupBy.workspace': string;
    'groupBy.flat': string;
    'orderBy.label': string;
    'orderBy.manual': string;
    'orderBy.updated': string;
    'sessions.expand': string;
    'sessions.collapse': string;
    'empty.none': string;
    'empty.noMatches': string;
    'workspace.add': string;
    'search.sessions.aria': string;
    'search.placeholder': string;
    'search.clear': string;
    'search.results.aria': string;
    'search.pending': string;
    'search.unavailable': string;
    'search.noMatches': string;
    'search.hasMore': string;
    'menu.addWorkspace': string;
    'picker.loading': string;
    'conflict.named': string;
    'folderError.title': string;
    'folderError.retry': string;
    rename: string;
    'rename.workspace.title': string;
    'rename.session.title': string;
    'field.workspaceName': string;
    'field.sessionName': string;
    'delete.workspace': string;
    'delete.desc': string;
    'delete.pending': string;
    'menu.fork': string;
    'menu.archiveSession': string;
    'sessions.count.one': string;
    'sessions.count.other': string;
    'actions.workspace.aria': string;
    'actions.session.aria': string;
    'actions.newSession.aria': string;
    'status.running': string;
    'status.subagentsRunning.one': string;
    'status.subagentsRunning.other': string;
    'status.idle': string;
    'status.waitingApproval': string;
    'status.planReview': string;
    'status.waitingAnswer': string;
    'status.completed': string;
    'hover.created': string;
    'hover.copied': string;
    'date.ymd': string;
    'time.now': string;
    'time.minutes': string;
    'time.hours': string;
    'time.days': string;
    'time.months': string;
    'time.years': string;
    'time.ago': string;
};
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** dsh-ui 照搬的工作区浏览文案命名空间（键集与官方 workspace 一致）。 */
        'dsh-ui.workspace': WorkspaceKey;
    }
}
