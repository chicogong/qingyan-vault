# Qingyan Vault｜青砚知识库

[简体中文](README.md) · [English](README.en.md)

**开箱即用的 Agent-native Obsidian Vault：人负责判断与定稿，Agent 负责检索、整理和起草。**

内容始终保存在本地 Markdown 中。无需账号、无需网络、无需模型、无需社区插件；下载 Release ZIP 后，用 Obsidian 打开文件夹即可使用。

![Qingyan Vault 中文浅色首页](.github/assets/home-light.png)

## 为什么做 Qingyan Vault

普通 Obsidian 模板往往只有目录和外观；许多 Agent Vault 又从 Skills、记忆、Git、向量检索和复杂治理开始。Qingyan Vault 提供中间缺失的一层：第一分钟就能工作，同时为长期迁移和 Agent 协作保留清楚边界。

```text
捕捉 → 连接到来源与项目 → Agent 隔离起草 → 人工接纳 → 再次使用
```

它不把“AI 能写文件”当作卖点。真正的产品承诺是：换模型、换 Agent、换电脑之后，你的知识仍然可读；Agent 的改动仍然可检查、可拒绝、可回退。

## 60 秒开始

1. 从 [Releases](https://github.com/chicogong/qingyan-vault/releases) 下载 `qingyan-vault-*.zip` 并解压。
2. 在 Obsidian 选择**打开本地仓库**，选中解压后的文件夹。
3. 首页会自动打开；点击[[开始使用|用 60 秒跑通一次]]。
4. 写下一条想法，把它连接到项目或知识地图，再从首页重新找到它。

如果你使用 Git，也可以克隆仓库后直接用 Obsidian 打开根目录。

## 里面有什么

- **每天可用的首页**：今日入口、Inbox、项目下一步、知识总览与回顾。
- **完整合成示例**：从来源、自己的判断、项目到知识地图和每周回顾。
- **中文模板**：每日笔记、来源、知识笔记、项目、知识地图和每周回顾。
- **Agent 协作协议**：统一 `AGENTS.md`、Claude 轻量适配、隔离草稿、交接与反馈。
- **本地视觉系统**：MIT Border 主题加 Qingyan Vault 视觉层，支持浅色、深色、窄窗口、键盘焦点和减少动态效果。
- **可选严格审核**：重要改动可使用 LLM Wiki Canvas 的来源绑定、精确 Diff、冲突阻断和人工接受/拒绝。

## 给普通用户

- `Inbox/` 先捕捉，不急着分类。
- `Sources/` 保存出处，`Notes/` 写自己的判断。
- `Projects/` 只保留明确结果和下一步。
- `MOCs/` 负责导航，`Review/` 让知识重新产生作用。

完整说明见[用户使用手册](Guides/%E7%94%A8%E6%88%B7%E4%BD%BF%E7%94%A8%E6%89%8B%E5%86%8C.md)和[10 分钟个性化设置](Guides/%E6%8A%8A%E5%AE%83%E5%8F%98%E6%88%90%E4%BD%A0%E7%9A%84.md)。

## 给 Agent

- Codex 从根目录读取 `AGENTS.md`；Claude Code 通过 `CLAUDE.md` 指向同一规则。
- 默认 R0 只读；不确定或多文件内容先写入 `Agent/草稿/`。
- 来源事实、模型推断和待验证内容必须分开。
- Agent 不得静默改正式知识、目录结构或 `.obsidian/`。
- 提交、推送、联网、安装插件和公开发布始终需要独立授权。

完整说明见[Agent 使用手册](Guides/Agent%20%E4%BD%BF%E7%94%A8%E6%89%8B%E5%86%8C.md)。

## 可选 Strict Review

日常小改动使用隔离草稿和人工接纳即可。批量、重要或有来源约束的改动，按[严格审核手册](Guides/严格审核.md)接入 `llm-wiki-canvas`：

```text
选定来源 → 隔离草稿 → 查看依据与改动 → 人工接受/退回 → 正式 Markdown
```

Qingyan Vault 是唯一面向用户的知识产品；LWC 在这里承担可替换的审核引擎，不要求新用户先理解 hash、Evidence Ledger 或 Proposal。

## 为什么默认不装社区插件

插件全家桶会增加安装、权限、联网、升级和跨平台风险。Qingyan Core 只使用 Obsidian 核心能力；所有可选增强都必须写明权限、维护状态、卸载方式和关闭后的降级行为。关闭主题或不使用任何 Pack 后，Markdown、WikiLinks、Bases 和 Canvas 仍然可读。

## 验证

```sh
./.starter-tools/self-check.sh
./.starter-tools/build-release.py --check
```

检查覆盖目录、核心设置、WikiLinks、Canvas、合成来源、绝对路径、凭据特征、第三方许可、社区插件缺失、工作区首页和发行包内容。GitHub Actions 会在每次提交和 PR 中运行同一检查。

当前验证证明仓库和发行包可复制、可降级，并在本机 Obsidian 中打开；发布后的 Issue、下载和复现证据将用于继续校正产品，不虚构用户留存。

![Qingyan Vault 中文深色首页](.github/assets/home-dark.png)

## 边界

- 不内置模型、聊天界面、向量数据库或云同步。
- 不上传 Vault，不自动建立不透明的长期记忆。
- 不把大量插件、漂亮首页或图谱包装成护城河。
- 不读取、发布或用真实私人 Vault 作为演示数据。

更多信息：[产品主旨](docs/PRODUCT.md) · [路线图](ROADMAP.md) · [开源规划](docs/OPEN_SOURCE_PLAN.md) · [安全策略](SECURITY.md) · [贡献指南](CONTRIBUTING.md)

## License

MIT。内置 Border 主题保留原 MIT License 与归因；Obsidian 本体受其自身许可约束。
