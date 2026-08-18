# dsh-ui

DSH（DeepSeek Harness）的浏览器 UI 插件。当前功能：

- **划选追问**：在对话里划选一段文字就地追问，或一键把问题带进一个**携带原上下文的新分支对话**。
- **笔记（一期）**：划选文字一键**存为笔记**；侧栏变为「工作区 / 笔记 / 文件」三分栏；笔记是 Markdown 文档（编辑/预览），剪藏可以**回链原会话**、可以继续写；在笔记里 **@小鲸鱼** 可新建携带笔记上下文的会话、或在当前会话追问、或**让 dsh 直接在笔记里工作**（整理表格、改写、汇总……并通过 `notes` 工具把结果写回笔记）。

> 插件形态：`dsh-ui` 的 Node 半边承载笔记存储、Typert 远程服务（`notes`）与模型可见的 `notes` 工具；浏览器半边通过 `exports["./client"]` 与 package.json 的 `dsh.client` 声明注入前端。

## 功能一：划选追问

在对话页面上用鼠标划选任意一段文字，选区上方浮出三个按钮：

| 按钮 | 行为 |
| --- | --- |
| **追问所选部分** | 把所选内容折成 Markdown 引用块，预填进**当前对话**的输入框并聚焦 |
| **在新分支中追问** | 调用 `session.fork` 新建**分支对话**（携带原上下文与标题序号），自动切过去并预填引用块 |
| **存为笔记** | 弹出笔记选择器（最近笔记 / 新建笔记），把选区保存为**剪藏**（带来源会话链接） |

细节：引用块逐行 `> ` 引用，多段落不断开；预填为追加语义（不覆盖已有草稿）；浮窗跟随选区、Esc/点击别处/滚动收起；双语文案、跟随 DSH 主题（含深色模式）。

## 功能二：笔记（一期）

### 侧栏分栏

侧栏原「工作区」区域变为 **工作区 / 笔记 / 文件** 三个分栏（收起时显示短标签）：

- **工作区**：基于公开 API（`useWorkspaces` / `useSessions` / `ctx.workspaces`）重实现的工作区列表 —— 分组、未归组、运行中/待确认状态点、点击工作区标题进入、添加工作区。⚠️ 原内建列表的**拖拽排序与归档操作**暂未复刻（后续版本补回）。
- **笔记**：新建笔记 + 列表（标题、剪藏数、⋯ 菜单重命名/删除），点击在右侧主区打开。
- **文件**：二期上线（占位）。

### 笔记编辑器

**Notion 式所见即所得**编辑页（右侧主区，不盖侧栏）：标题 + 正文直接书写，无编辑/预览之分、无 Markdown 源码；支持标题/列表/表格/引用/代码块；**块级快捷输入**（`# ` 标题、`- ` 列表、`1. ` 有序、`> ` 引用，列表内回车续行）；剪藏**保留原文格式**（标题/加粗/列表等 Markdown 结构随选区序列化），作为正文里的**灰色回链文字**（整段可点、可继续编辑，多块内容尾部附「↩ 原对话」回链），hover 弹出「查看原对话」按钮；底部 🐋 操作条。

- 保存：按钮 / ⌘S（正文以 Markdown 存储，与 dsh 的 notes 工具互通）；保存走乐观并发（版本号），冲突时自动载入最新内容并提示。
- 同步：编辑器打开时每 3 秒轮询 —— **dsh 在笔记里写完，界面自动更新**（有未保存草稿时不打扰）。
- **@小鲸鱼**：正文中输入 `@` 或点底部 🐋 按钮：
  - **新建会话提问**：新建会话并把笔记内容（含剪藏）预填为上下文；
  - **在当前会话追问**：把笔记内容预填进当前输入框；
  - **让 dsh 在本笔记中工作**：新建会话并预填任务模板（含 `notes` 工具使用说明与 noteId），dsh 读取笔记 → 完成工作 → `write` 写回 → 编辑器自动刷新。

### 数据与工具

- 存储：`$DSH_HOME/notes/notes.jsonl`（每行一篇笔记，原子替换写入；可用插件配置 `root` 覆盖）。
- `notes` 工具（模型可见）：`list` / `read` / `create` / `write` / `append`，写操作带 `ifVersion` 乐观并发；dsh 靠它读笔记、把结果写回。
- 跨页签：无实时推送，切换/聚焦时以 host 存储为准刷新。

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
npm test          # 存储单测 + Typert 清单/服务冒烟 + 客户端 bundle 冒烟（mock ctx + 假 DOM）
npm run typecheck # host / client 两个面各自的 tsconfig
```

热更新：`npm run watch` 保持运行，改完重新构建 `lib/client.js` 后，DSH 的 client HMR 链路会把新 bundle 推给已打开的页面，**无需刷新**（host 侧 / 配置行的变化仍需重启 dsh）。

### 实现要点

- **远程接口**：host 侧 `NotesService extends TypertRemoteService`（`@Remote` 方法），`exports["./typert"]` 提供 TYPERT 清单（dsh-typert-loader 自动发现校验）；client 侧 `ctx.remote.$mount({ package, descriptors })` 挂载后获得 `remote.notes` 命名空间。wire 契约（zod v4 schema + descriptors）由 `src/notes/wire.ts` 双面共享。
- **agent 工具**：`defineTool` 注册 `notes` 工具（`ctx.tools.register`），与远程服务共享同一存储实例。
- **挂载点**：`shell.overlay`（划选浮窗 / 笔记编辑器 / toast）、`sidebar.workspaces`（三分栏）。
- **类型**：devDependencies 引用 `@deepseek-ai/dsh-*@0.1.0-rc.6` 仅用于类型合并；构建产物运行时零 dsh 依赖（host 侧运行时依赖 zod + dsh-home-paths 等少数声明在 `dependencies` 的包）。

## 路线图

- [x] 划选追问（当前对话 / 新分支）
- [x] 笔记一期：划线剪藏、侧栏分栏、Markdown 编辑/预览、回链原会话、@小鲸鱼（新会话提问 / 当前会话追问 / 在笔记中工作并写回）
- [ ] 笔记二期：**文件 / PDF** —— 上传后在笔记 tab 浏览，原版式预览 + 可划线文字视图，划选后同样可以 @小鲸鱼提问
- [ ] 工作区列表补齐：拖拽排序、归档操作
- [ ] 划选浮窗更多动作：翻译、搜索、复制为引用
- [ ] 追问模板（解释 / 翻译 / 找问题…）

## License

MIT
