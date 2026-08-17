/** 一次有效划选的快照。 */
export interface SelectionSnapshot {
    /** 选中的纯文本（trim 后）。 */
    text: string;
    /** 选区包围盒（视口坐标），用于浮窗定位。 */
    rect: DOMRect;
    /** 选区起止节点，用于排除判断。 */
    anchorNode: Node | null;
    focusNode: Node | null;
}
/** 节点是否落在可编辑元素内部（textarea/input/contenteditable）。 */
export declare function isInsideEditable(node: Node | null): boolean;
/**
 * 读取当前文档选区；不满足展示条件时返回 null：
 * - 选区折叠 / 内容为空；
 * - 起止节点落在可编辑元素（如输入框）里；
 * - 选区与给定的排除容器（浮窗自身）重叠；
 * - 包围盒不可见（宽或高为 0）。
 *
 * @param excluded - 需要排除的容器（浮窗 DOM），可为 null。
 */
export declare function readSelection(excluded: Element | null): SelectionSnapshot | null;
/**
 * 监听划选：`selectionchange` + mouseup/keyup 兜底轮询。
 *
 * @param handler - 每次选区变化时回调（null 表示当前没有有效选区）。
 * @param excluded - 返回需要排除的浮窗容器（惰性读取）。
 * @returns 取消监听函数。
 */
export declare function watchSelection(handler: (snapshot: SelectionSnapshot | null) => void, excluded: () => Element | null): () => void;
