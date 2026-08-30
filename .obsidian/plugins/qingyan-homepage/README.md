# Qingyan Vault Homepage

`Qingyan Vault` 的第一方动态首页插件。它借鉴 Homepage Enhanced 的产品形态，但只保留知识工作需要的部分：

- 当前时间、日期和问候。
- 捕捉线索、每日笔记、知识总览和搜索快捷入口。
- 本地知识、Inbox、项目下一步和来源统计。
- 最近编辑、Inbox 队列、项目待办和知识重访。

首页与内容区组成一个稳定的双标签工作台：所有内容动作复用同一个工作标签页。捕捉后会直接进入正文编辑位置；Inbox 与项目任务会打开到可继续写作的位置；知识总览只覆盖知识生产目录。

插件只读取当前 Vault 的本地文件元数据与 Markdown；只有用户点击“捕捉线索”时才会在 `Inbox/` 新建文件。它不联网、不读取凭据、不调用模型、不建立向量索引，也不发送遥测。

关闭插件后，`Home.md`、WikiLinks、Bases、Canvas 和全部 Markdown 仍可继续使用。

首次打开包含本插件的 Vault 时，Obsidian 会显示标准插件信任提示。只有从 `chicogong/qingyan-vault` 官方 Release 获取时才启用；否则先用安全模式检查 Markdown 内容。
