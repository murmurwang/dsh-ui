/**
 * dsh-ui 插件的 Node（host）半边。
 *
 * 这是一个纯 UI 插件：`apply` 保持为空，只为让插件出现在 host 的
 * cordis 配置 / Loader 里；浏览器半边经由 `exports["./client"]` 发布，
 * 由 package.json 里的 `dsh.client` 声明被发现并注入前端。
 */
export declare function apply(): void;
