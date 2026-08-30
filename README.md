<div align="center">
  <img src=".github/assets/qingyan-vault-lockup.svg" width="920" alt="Qingyan Vault — Agent-native Obsidian Vault">
  <p><strong>开箱即用的中文 Agent-native Obsidian Vault：Agent 起草，人来决定。</strong></p>
  <p>
    <a href="https://github.com/chicogong/qingyan-vault/actions/workflows/validate.yml"><img src="https://github.com/chicogong/qingyan-vault/actions/workflows/validate.yml/badge.svg" alt="Validation"></a>
    <a href="https://github.com/chicogong/qingyan-vault/releases"><img src="https://img.shields.io/github/v/release/chicogong/qingyan-vault?include_prereleases&color=245f5b" alt="Release"></a>
    <a href="LICENSE"><img src="https://img.shields.io/github/license/chicogong/qingyan-vault?color=b94d42" alt="MIT License"></a>
    <img src="https://img.shields.io/badge/data-local--first-245f5b" alt="Local-first">
    <img src="https://img.shields.io/badge/language-中文-a27632" alt="Chinese-first">
  </p>
  <p><a href="README.md">简体中文</a> · <a href="README.en.md">English</a></p>
</div>

![Qingyan Vault 中文浅色首页](.github/assets/home-light.png)

## 一分钟后，你已经在工作

1. 从 [Releases](https://github.com/chicogong/qingyan-vault/releases) 下载并解压 `qingyan-vault-*.zip`。
2. 在 Obsidian 选择**打开本地仓库**，选中解压后的文件夹。
3. 信任并启用内置的第一方首页插件；不启用也能继续使用静态 `Home.md`。
4. 点击**捕捉线索**，写下一句话；回到首页，它已经出现在 Inbox。

无需账号、无需网络、无需模型，也无需先配置插件。使用 Git 的人也可以直接克隆仓库并打开根目录。

## 它补上了哪一层

普通模板常停在目录和外观；AI 知识工具常从聊天、索引、Skills 或复杂自动化开始。Qingyan Vault 先交付一个完整的日常闭环，再把高级能力留成可选层。

```text
捕捉 → 保留来源 → 形成判断 → Agent 隔离起草 → 人工接纳 → 回到项目与回顾
```

| 你真正关心的事 | Qingyan Vault 的做法 |
| --- | --- |
| 第一次打开会不会迷路 | 中文首页、语义目录、合成示例和 60 秒闭环已经配置好 |
| AI 会不会改坏知识 | 默认只读；草稿隔离；事实、推断、待验证分开；正式知识由人接纳 |
| 换模型或工具怎么办 | Markdown、WikiLinks、YAML、Bases 与 Canvas 是事实源，不绑定单一 Agent |
| 不想运行插件怎么办 | 关闭第一方首页后，静态 Home、搜索、Bases、Canvas 和全部内容仍可用 |
| 数据会去哪里 | 默认只读本地文件；无账号、无网络调用、无遥测、无内置模型 |
| Vault 变大后如何治理 | 可选接入 LLM Wiki Canvas 做来源绑定、精确 Diff、冲突阻断和人工审核 |

**核心优势不是“AI 帮你多写”，而是换模型、换工具、换电脑后，知识仍可读，改动仍可解释、拒绝和撤回。**

## 不只是一张首页

<table>
  <tr>
    <td width="50%"><img src=".github/assets/workspace-shelf.png" alt="带语义标记的 Qingyan Vault 左侧目录"><br><sub><b>知识书架</b>：收、源、知、事、图、省与 Agent 草稿分区一眼可辨。</sub></td>
    <td width="50%"><img src=".github/assets/capture-flow.png" alt="Qingyan Vault 捕捉线索编辑界面"><br><sub><b>捕捉即写</b>：点击后直接进入当前工作面，不堆标签、不再补点编辑器。</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src=".github/assets/knowledge-base.png" alt="Qingyan Vault 知识总览 Bases"><br><sub><b>核心 Bases</b>：按 Inbox、来源、长期知识和项目查看，不依赖 Dataview。</sub></td>
    <td width="50%"><img src=".github/assets/home-dark.png" alt="Qingyan Vault 中文深色首页"><br><sub><b>完整明暗主题</b>：目录、首页、正文、表格、任务与键盘焦点使用同一视觉语言。</sub></td>
  </tr>
</table>

## 目录就是工作流

| 目录 | 只负责一件事 |
| --- | --- |
| `Inbox/` | 先捕捉，还没想好归属也没关系 |
| `Sources/` | 保存出处、日期、范围与可追溯摘要 |
| `Notes/` | 用自己的话形成长期判断 |
| `Projects/` | 把知识连接到有完成标准的结果 |
| `MOCs/` | 给主题建立导航，不复制正文 |
| `Review/` | 让旧知识在每日与每周节奏里重新产生作用 |
| `Agent/草稿/` | 隔离 Agent 生成但尚未接纳的内容 |
| `Templates/` | 来源、知识、项目、地图、日记与周回顾模板 |

完整操作见[用户使用手册](Guides/%E7%94%A8%E6%88%B7%E4%BD%BF%E7%94%A8%E6%89%8B%E5%86%8C.md)和[10 分钟个性化设置](Guides/%E6%8A%8A%E5%AE%83%E5%8F%98%E6%88%90%E4%BD%A0%E7%9A%84.md)。

## Agent-native，不是 AI 接管

- Codex 从根目录读取 `AGENTS.md`；Claude Code 通过 `CLAUDE.md` 读取同一规则。
- WorkBuddy、Qoder 等文件型 Agent 显式引用 `AGENTS.md` 即可共享边界。
- 权限从 R0 只读、R1 隔离草稿、R2 定点写入到 R3 结构变更逐级授权。
- 来源事实、模型推断和待验证内容必须分开；Agent 不静默移动、删除或发布。
- 批量或重要改动可使用[严格审核](Guides/严格审核.md)，日常使用不暴露工程术语。

示例指令：

```text
先读 AGENTS.md、Home.md，以及与“夜航花园”直接相关的项目和来源。
不要修改文件。列出已有事实、推断、待验证和最小建议。
```

完整协议见[Agent 使用手册](Guides/Agent%20%E4%BD%BF%E7%94%A8%E6%89%8B%E5%86%8C.md)。

## 克制的插件策略

发行包只启用一个经过审计的第一方插件 `Qingyan Vault Homepage`：它读取本地文件元数据和 Markdown，点击捕捉时才写入 `Inbox/`，没有网络调用、模型请求或遥测。Obsidian 会对随 Vault 分发的可执行插件显示首次信任提示；请只从本仓库 Release 下载，或用安全模式使用静态版。

Border 主题负责成熟应用外壳，Qingyan CSS 负责首页、知识书架和正文视觉；所有归因保留在 `THIRD_PARTY_NOTICES.md`。社区插件按真实摩擦再添加，建议见[插件与主题](Guides/插件与主题.md)。

## 验证与开源边界

```sh
./.starter-tools/self-check.sh
./.starter-tools/build-release.py --check
```

检查覆盖目录、核心设置、WikiLinks、Canvas、合成来源、绝对路径、凭据特征、第三方许可、第一方插件白名单与无网络调用、工作区首页、截图和发行包内容。GitHub Actions 在每次提交与 PR 运行同一检查。

- 仓库演示全部是合成内容，不使用真实私人 Vault。
- 不内置聊天界面、向量数据库、云同步或不透明长期记忆。
- 当前证据是本机 Obsidian 与干净发行包闭环；Windows、Linux、移动端及真实长期采用仍待验证。

更多信息：[产品主旨](docs/PRODUCT.md) · [路线图](ROADMAP.md) · [开源规划](docs/OPEN_SOURCE_PLAN.md) · [安全策略](SECURITY.md) · [贡献指南](CONTRIBUTING.md)

## License

MIT。内置 Border 主题保留原 MIT License 与归因；Obsidian 本体受其自身许可约束。
