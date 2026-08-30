# 开源调研与产品取舍

> 最近核验：2026-08-30。Stars 只作方向信号；最终判断同时考虑许可、近期维护、安装摩擦、Issue 和降级能力。

## 结论

Agent 直接把普通 Markdown Vault 当作工作目录已经成为常见做法，因此“能让 AI 读写笔记”不是 Qingyan Vault 的护城河。真正值得投入的是：中文开箱体验、每天可继续的工作闭环、统一 Agent 契约、人的最终定稿权，以及重要改动时可选的冲突安全审核。

漂亮首页是采用门槛，不是护城河；第三方插件越多，安装、安全、升级和跨平台成本越高。Core 只允许一个可审计、无网络调用且可完全关闭的第一方动态首页。

## 高相关开源样本

| 项目 | 公开信号（2026-08-30） | 可借鉴 | 不照搬 |
| --- | --- | --- | --- |
| [kepano/obsidian-skills](https://github.com/kepano/obsidian-skills) | MIT，约 47.5k Stars，近期活跃 | Obsidian Markdown、Bases、Canvas 形成跨 Agent 可读技能 | 把宿主兼容本身包装成产品壁垒 |
| [YishenTu/claudian](https://github.com/YishenTu/claudian) | MIT，约 15k Stars，近期活跃 | 直接把 Claude Code、Codex 带入 Obsidian | 必须启动 Node 子进程的移动端和安装复杂度 |
| [logancyang/obsidian-copilot](https://github.com/logancyang/obsidian-copilot) | AGPL，约 7.6k Stars，持续维护 | 现有模型订阅、本地文件与 Agent 模式 | 大库索引、凭据、插件交互和托管后端复杂度 |
| [cavi-ai/claude-obsidian](https://github.com/cavi-ai/claude-obsidian) | MIT，新项目、低采用 | 每次写入确认、分块 Diff、来源—论点—草稿研究台 | 把插件界面和审核面当成已验证壁垒 |
| [louisfb01/obsidian-agent-vault-template](https://github.com/louisfb01/obsidian-agent-vault-template) | 开源模板、低安装摩擦 | 普通 Vault + Skills + Grounding + Feedback | 只靠模板目录宣称 Agent-native |
| [HiHeiBai/obsidian-ai-workflow-kit](https://github.com/HiHeiBai/obsidian-ai-workflow-kit) | 中英、本地文件工作流、低采用 | 无 App/插件/RAG，dry-run 更新与受管清单 | 在采用证据不足时扩大框架 |
| [kurtvalcorza/agentic-vault](https://github.com/kurtvalcorza/agentic-vault) | 36 Skills、Windows/PowerShell 偏重 | 完整 Agent 治理清单 | 默认就要求大量 Skills、日志和链接机制 |
| [SoRobby/ObsidianStarterVault](https://github.com/SoRobby/ObsidianStarterVault) | 约 382 Stars | 完整可工作的示例 Vault | Dataview/脚本成为首页的单点依赖 |
| [InlitX/Obsidian-Dashboard-Gallery](https://github.com/InlitX/Obsidian-Dashboard-Gallery) | 约 686 Stars | 首页视觉示例与可复制 CSS | 把可复制美化当成长期差异化 |
| [Vaultorial/obsidian-templates](https://github.com/Vaultorial/obsidian-templates) | 完整工作 Vault | 用真实合成示例代替空目录 | 同时提供太多互相竞争的信息架构 |
| [khoj-ai/khoj](https://github.com/khoj-ai/khoj) | AGPL，约 36.8k Stars | 本地、自托管 AI second brain 的需求信号 | 在模板仓内重造服务、聊天和检索平台 |
| [siyuan-note/siyuan](https://github.com/siyuan-note/siyuan) | AGPL，约 46k Stars | 完整本地优先知识产品和 CLI | 与成熟编辑器正面竞争 |
| [logseq/logseq](https://github.com/logseq/logseq) | AGPL，约 44.7k Stars | 文件优先、Daily 和连接式工作 | 另造编辑器或专有格式 |

## 反方证据

1. **普通 Vault + `AGENTS.md` 可能已经足够。** Qingyan 必须用更快的首页、完整合成任务、可降级配置和发行质量证明额外价值。
2. **严格审核会增加摩擦。** 所以它只用于重要或批量改动，日常流程不显示 hash、Evidence Ledger 或 Proposal。
3. **LWC 没有独立产品采用证据。** 技术 fixture 与宿主复跑证明契约，不证明自然复用、留存、安装或 Star 来源。
4. **社区插件扩大信任面。** Obsidian 官方明确提示社区插件执行第三方代码；Qingyan Core 不打包插件目录。
5. **主题和首页容易复制。** 视觉负责让用户愿意开始，日常“捕捉—继续项目—审核—回顾”才决定是否持续打开。

## LWC 裁决

LLM Wiki Canvas 独立产品进入维护冻结；不删除代码，不伪造失败，也不继续扩张 Workbench、图谱、多宿主和 Harness 产品面。Qingyan 只复用五项能力：

- 隔离草稿；
- 选定来源与来源变化检查；
- 精确改动 Diff；
- 目标冲突阻断；
- 人工接受或退回。

在出现第二个与 Qingyan 无关的真实消费者前，不拆公共 `review-core`。首发通过固定版本 `llm-wiki-canvas@0.2.0` 进行可选集成和故障测试。

## 产品边界

Core：Home、Inbox、Sources、Notes、Projects、MOCs、Review、Templates、Bases、Canvas、统一 Agent 契约、合成示例、主题、自检和发行包。

可选 Pack：Research、Creator、Project、Visual、Strict Review。只有公开问题或贡献证明需求后才开发。

明确不做：内置模型、聊天、RAG、同步、账户、遥测、插件全家桶、自动长期记忆和自动发布。

## 首发后的证据纪律

- 维护者测试记录为“产品与发行验收”，不冒充陌生用户留存。
- 下载、Star 只作方向信号；可复现 Issue、自然 Fork/贡献和公开任务复盘权重更高。
- 不要求用户上传私人 Vault；Issue 模板必须提醒脱敏。
- 记录每个被接纳 Agent 结果的审核分钟、错误、遗漏和运行成本。
