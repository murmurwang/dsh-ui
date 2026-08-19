# dsh-ui

DSH（DeepSeek Harness）的浏览器 UI 插件，三个功能：

- **划选追问**：在对话里划选一段文字就地追问，或一键把问题带进一个**携带原上下文的新分支对话**。
- **笔记**：划选文字一键**存为笔记**；侧栏「工作区 / 笔记 / 文件」三分栏；笔记是 **Notion 式所见即所得**文档（无 Markdown 源码、支持块级快捷输入），剪藏**保留格式**并作为灰色**回链文字**；在笔记里 **@小鲸鱼** 可新建携带笔记上下文的会话、或在当前会话追问、或**让 dsh 直接在笔记里工作**（整理表格、改写、汇总……通过 `notes` 工具把结果写回笔记）。
- **文件 / PDF（二期）**：上传 PDF 后在文件 tab 浏览——**原版式预览**（浏览器原生渲染）+ **可划线文字视图**（host 自动提取文字），文字上划选后同样可以追问 / 分支追问 / 存为笔记（回链指向文件）。

> 插件形态：`dsh-ui` 的 Node 半边承载笔记与文件的存储、Typert 远程服务（`notes` / `files`）与模型可见的 `notes` 工具；浏览器半边通过 `exports["./client"]` 与 package.json 的 `dsh.client` 声明注入前端。

## 功能一：划选追问

在对话页面上划选任意一段文字，选区上方浮出三个按钮（仅聊天区生效）：

| 按钮 | 行为 |
| --- | --- |
| **追问所选部分** | 把所选内容折成 Markdown 引用块，预填进**当前对话**的输入框并聚焦 |
| **在新分支中追问** | `session.fork` 新建**分支对话**（携带原上下文与标题序号），自动切过去并预填引用块 |
| **存为笔记** | 弹出笔记选择器（最近笔记 / 新建笔记），把选区保存为剪藏（带来源回链） |

细节：浮窗**锁存**（选区被清掉后仍保持，点击别处/Esc/滚动才收起）；引用块逐行 `> ` 引用；预填为追加语义（不覆盖已有草稿）；双语文案、跟随 DSH 主题（含深色模式）。

## 功能二：笔记

### 侧栏分栏

侧栏原「工作区」区域变为 **工作区 / 笔记 / 文件** 三分栏（tab 切换时右侧主区联动切换）：

- **工作区**：**官方 ui-workspace 的 WorkspaceBrowser 原样迁入**（搜索、分组/排序视图、折叠、拖拽排序、重命名/删除/分叉/归档菜单、状态点、hover 卡片），挂在本插件的子座位里，行为与原生一致。
- **笔记**：新建 + 列表（标题、剪藏数、**⋯ 菜单重命名/删除**），点击在右侧主区打开。
- **文件**：上传 PDF + 列表（⋯ 删除），点击在右侧主区打开。

### 笔记编辑器

右侧主区页面（不盖侧栏，精确覆盖对话列），**Notion 式所见即所得**：

- 无预览/编辑之分、无 Markdown 源码；标题/列表/表格/引用/代码块直接呈现；
- **块级快捷输入**：`# ` 标题、`- ` 列表（回车续行）、`1. ` 有序、`> ` 引用；
- **剪藏保留格式**（标题/加粗/列表等结构随选区序列化）：单行 = 整段**灰色回链文字**；多块 = 原格式追加 + 尾部「↩ 原对话」回链；
- 回链 hover 弹出「**查看原对话**」按钮（划选浮窗同款样式）；链接文字**可点入编辑、可划选、中间可换行**（换行分裂为两行完整回链）；
- **自动保存**：输入停顿 1.5s 落盘；离开/切 tab/关闭/页面隐藏全部兜底保存；乐观并发（版本号），dsh 写回时 3 秒轮询自动刷新界面（不打断你输入）。
- **@小鲸鱼**：正文输入 `@` 或点底部 🐋 按钮 —— ① 新建会话提问（笔记为上下文）② 在当前会话追问 ③ 让 dsh 在本笔记中工作（任务模板 + `notes` 工具读写写回）。

### 数据与工具

- 存储：`$DSH_HOME/notes/notes.jsonl`（每行一篇，原子替换写入；插件配置 `root` 可覆盖）。
- `notes` 工具（模型可见）：`list` / `read` / `create` / `write` / `append`，写操作带 `ifVersion` 乐观并发。

## 功能三：文件 / PDF（二期）

- 上传：文件 tab「＋ 上传 PDF」（50MB 上限，v1 仅 PDF）；host 侧 `pdf-parse` 提取文字（失败不阻断上传，仅提示用原版式查看）。
- 文件页：**文字视图**（默认，可划选）+ **原版式预览**（浏览器原生 PDF，iframe）切换。
- 文字划选浮窗：追问所选部分 / 新分支追问 / 存为笔记——存笔记的回链为 `dshui://file/<id>`，在笔记里点击打开对应文件页。
- 存储：`$DSH_HOME/notes/files/<id>/`（blob + meta.json + text.txt）。

## 安装

要求 DSH ≥ `0.1.0-rc.6`（web profile）。

```sh
# 方式一：从 GitHub 安装（需要 pnpm，dsh plugin 会转发给 pnpm）
dsh plugin --profile web add github:murmurwang/dsh-ui

# 方式二：本地开发/试用 —— 直接安装到 profile 目录
cd "$DSH_HOME/profiles/web"
npm install /path/to/dsh-ui
```

然后在 `$DSH_HOME/profiles/web/cordis.patch.yml` 里插入插件行（`insert` 列表是 profile 补丁层添加新条目的方式）：

```yaml
- insert:
    - id: ui-selection-ask
      name: 'dsh-ui'
```

重启 `dsh web` 后生效（插件配置在启动时解析；新增 typert 导出同样需要重启）。可以先 `dsh --profile web --dump-config` 确认配置树里出现 `ui-selection-ask → dsh-ui`。

## 开发

```sh
npm install
npm run build     # lib/index.js（host）+ lib/typert.js（Typert 清单）+ lib/client.js（client bundle）+ d.ts
npm test          # 存储/文件单测 + Typert 清单校验 + 客户端冒烟 + Markdown 转换 + 组件渲染
npm run typecheck # host / client 两个面各自的 tsconfig
```

热更新：`npm run watch` 保持运行，改完重新构建 `lib/client.js` 后，DSH 的 client HMR 链路会把新 bundle 推给已打开的页面，**无需刷新**（host 侧 / 配置行的变化仍需重启 dsh）。

### 实现要点

- **远程接口**：host 侧 `NotesService` / `FilesService extends TypertRemoteService`，`exports["./typert"]` 提供 TYPERT 清单（dsh-typert-loader 自动发现校验）；client 侧 `ctx.remote.$mount({ package, descriptors })` 挂载后用 `ctx.get("remote.<ns>")` 取得命名空间（wire 返回双层信封，face 层拆包）。契约（zod v4 schema + descriptors）由 `src/notes/wire.ts` 双面共享。
- **agent 工具**：`defineTool` 注册 `notes` 工具（`ctx.tools.register`），与远程服务共享存储。
- **所见即所得内核**：contentEditable + `markdownToHtml` / `serializeToMarkdown` 双向转换；块级快捷输入走"空格 keydown 拦截 + 原生 `execCommand('delete')` + 段落视觉类"，避免浏览器选区/撤销竞态。
- **挂载点**：`shell.overlay`（划选浮窗 / 笔记页 / 文件页 / toast）、`sidebar.workspaces`（三分栏 + 官方浏览器子座位）。
- **类型**：devDependencies 引用 `@deepseek-ai/dsh-*@0.1.0-rc.6` 仅用于类型合并；运行时 host 侧依赖 `zod` / `dsh-home-paths` / `pdf-parse`（`dependencies` 声明）。

## 路线图

- [x] 划选追问（当前对话 / 新分支）
- [x] 笔记：划线剪藏、侧栏分栏、所见即所得编辑、回链、@小鲸鱼（三动作）、自动保存
- [x] 文件/PDF：上传、原版式预览 + 可划线文字视图、划选动作与文件回链
- [ ] 文件支持更多格式（docx/md 等）
- [ ] 划选浮窗更多动作：翻译、搜索、复制为引用
- [ ] 笔记快捷输入扩展：任务列表、代码块围栏、表格

## License

MIT
