const { ItemView, Notice, Plugin, TFile, setIcon } = require("obsidian");

const VIEW_TYPE = "qingyan-homepage";
const PRODUCT_NAME = "Qingyan Vault";
const CONTENT_PREFIXES = [
  "Inbox/",
  "Sources/",
  "Notes/",
  "Projects/",
  "MOCs/",
  "Review/",
];

function isKnowledgeFile(file) {
  return file instanceof TFile
    && file.extension === "md"
    && file.basename !== "README"
    && CONTENT_PREFIXES.some((prefix) => file.path.startsWith(prefix));
}

function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatClock(date) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatDate(date) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(date);
}

function greetingFor(date) {
  const hour = date.getHours();
  if (hour < 6) return "夜深了";
  if (hour < 11) return "早上好";
  if (hour < 14) return "中午好";
  if (hour < 18) return "下午好";
  return "晚上好";
}

function relativeTime(timestamp) {
  const elapsed = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (elapsed < minute) return "刚刚";
  if (elapsed < hour) return `${Math.floor(elapsed / minute)} 分钟前`;
  if (elapsed < day) return `${Math.floor(elapsed / hour)} 小时前`;
  if (elapsed < 7 * day) return `${Math.floor(elapsed / day)} 天前`;
  return new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric" })
    .format(new Date(timestamp));
}

function cleanTaskText(text) {
  return text
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\*\*|__|`/g, "")
    .trim();
}

function createIcon(parent, iconName) {
  const icon = parent.createSpan({ cls: "qy-dashboard-icon" });
  setIcon(icon, iconName);
  return icon;
}

class QingyanHomepageView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.clockTimer = null;
    this.refreshTimer = null;
  }

  getViewType() {
    return VIEW_TYPE;
  }

  getDisplayText() {
    return PRODUCT_NAME;
  }

  getIcon() {
    return "layout-dashboard";
  }

  async onOpen() {
    await this.render();
    this.clockTimer = window.setInterval(() => this.updateClock(), 30 * 1000);
  }

  async onClose() {
    if (this.clockTimer) window.clearInterval(this.clockTimer);
    if (this.refreshTimer) window.clearTimeout(this.refreshTimer);
  }

  scheduleRefresh() {
    if (this.refreshTimer) window.clearTimeout(this.refreshTimer);
    this.refreshTimer = window.setTimeout(() => this.render(), 180);
  }

  updateClock() {
    const now = new Date();
    this.contentEl.querySelectorAll("[data-qy-clock]").forEach((element) => {
      element.setText(formatClock(now));
    });
    this.contentEl.querySelectorAll("[data-qy-date]").forEach((element) => {
      element.setText(formatDate(now));
    });
  }

  async render() {
    const root = this.contentEl;
    root.empty();
    root.addClass("qy-dashboard");

    const files = this.app.vault.getMarkdownFiles().filter(isKnowledgeFile);
    const recent = [...files]
      .sort((a, b) => b.stat.mtime - a.stat.mtime)
      .slice(0, 6);
    const inboxFiles = files
      .filter((file) => file.path.startsWith("Inbox/"))
      .sort((a, b) => b.stat.mtime - a.stat.mtime)
      .slice(0, 5);
    const revisit = files
      .filter((file) => file.path.startsWith("Notes/") || file.path.startsWith("Sources/"))
      .sort((a, b) => a.stat.mtime - b.stat.mtime)
      .slice(0, 3);
    const projectTasks = await this.collectProjectTasks();

    this.renderHeader(root);
    this.renderQuickActions(root);
    this.renderStats(root, files, inboxFiles, projectTasks);

    const grid = root.createDiv({ cls: "qy-dashboard-grid" });
    const primary = grid.createDiv({ cls: "qy-dashboard-column qy-dashboard-primary" });
    const secondary = grid.createDiv({ cls: "qy-dashboard-column qy-dashboard-secondary" });

    this.renderFileSection(primary, "最近编辑", "你刚刚留下的工作痕迹", recent, "history");
    this.renderTaskSection(primary, projectTasks);
    this.renderFileSection(secondary, "Inbox", "还没决定去向的线索", inboxFiles, "inbox");
    this.renderFileSection(secondary, "重新遇见", "让旧知识回到眼前", revisit, "sparkles");

    const footer = root.createDiv({ cls: "qy-dashboard-footer" });
    footer.createSpan({ text: "LOCAL MARKDOWN" });
    footer.createSpan({ text: "·" });
    footer.createSpan({ text: "NO NETWORK" });
    footer.createSpan({ text: "·" });
    footer.createSpan({ text: "HUMAN DECIDES" });
  }

  renderHeader(root) {
    const now = new Date();
    const header = root.createEl("header", { cls: "qy-dashboard-header" });
    const brandRow = header.createDiv({ cls: "qy-brand-row" });
    const brand = brandRow.createDiv({ cls: "qy-brand" });
    brand.createSpan({ cls: "qy-brand-mark", text: "Q" });
    const brandText = brand.createDiv();
    brandText.createEl("strong", { text: PRODUCT_NAME });
    brandText.createSpan({ text: "Agent-native Obsidian Vault" });

    const time = brandRow.createDiv({ cls: "qy-dashboard-time" });
    time.createEl("strong", { text: formatClock(now), attr: { "data-qy-clock": "" } });
    time.createSpan({ text: formatDate(now), attr: { "data-qy-date": "" } });

    const statement = header.createDiv({ cls: "qy-dashboard-statement" });
    statement.createSpan({ text: greetingFor(now) });
    statement.createEl("h1", { text: "今天从哪一条线索开始？" });
    statement.createEl("p", {
      text: "捕捉一件事，推进一个结果，或让一条旧知识重新产生作用。",
    });
  }

  renderQuickActions(root) {
    const actions = root.createDiv({ cls: "qy-quick-actions" });
    this.createAction(actions, "square-pen", "捕捉线索", "写入 Inbox", () => this.plugin.captureNote());
    this.createAction(actions, "calendar-days", "写今天", "打开每日笔记", () => this.plugin.openDailyNote());
    this.createAction(actions, "database", "知识总览", "打开 Bases", () => this.plugin.openKnowledgeBase());
    this.createAction(actions, "search", "搜索", "查找全部笔记", () => this.plugin.openSearch());
  }

  createAction(parent, iconName, label, caption, handler) {
    const button = parent.createEl("button", {
      cls: "qy-quick-action",
      attr: { type: "button", "aria-label": `${label}：${caption}` },
    });
    createIcon(button, iconName);
    const copy = button.createDiv();
    copy.createEl("strong", { text: label });
    copy.createSpan({ text: caption });
    button.addEventListener("click", handler);
  }

  renderStats(root, files, inboxFiles, projectTasks) {
    const stats = root.createDiv({ cls: "qy-dashboard-stats" });
    this.createStat(stats, String(files.length), "知识条目");
    this.createStat(stats, String(inboxFiles.length), "待整理");
    this.createStat(stats, String(projectTasks.length), "项目下一步");
    this.createStat(stats, String(files.filter((file) => file.path.startsWith("Sources/")).length), "来源");
  }

  createStat(parent, value, label) {
    const stat = parent.createDiv({ cls: "qy-dashboard-stat" });
    stat.createEl("strong", { text: value });
    stat.createSpan({ text: label });
  }

  createSection(parent, title, caption, iconName) {
    const section = parent.createEl("section", { cls: "qy-dashboard-section" });
    const heading = section.createDiv({ cls: "qy-section-heading" });
    createIcon(heading, iconName);
    const copy = heading.createDiv();
    copy.createEl("h2", { text: title });
    copy.createEl("p", { text: caption });
    return section;
  }

  renderFileSection(parent, title, caption, files, iconName) {
    const section = this.createSection(parent, title, caption, iconName);
    const list = section.createDiv({ cls: "qy-file-list" });
    if (!files.length) {
      this.renderEmpty(list, title === "Inbox" ? "Inbox 现在是空的。" : "还没有可显示的内容。");
      return;
    }
    files.forEach((file) => {
      const button = list.createEl("button", {
        cls: "qy-file-row",
        attr: { type: "button", "aria-label": `打开 ${file.basename}` },
      });
      const copy = button.createDiv();
      copy.createEl("strong", { text: file.basename });
      copy.createSpan({ text: file.parent?.path || "Vault" });
      button.createSpan({ cls: "qy-file-time", text: relativeTime(file.stat.mtime) });
      createIcon(button, "arrow-up-right");
      button.addEventListener("click", () => this.plugin.openFile(file));
    });
  }

  renderTaskSection(parent, tasks) {
    const section = this.createSection(parent, "项目下一步", "只显示尚未完成的动作", "circle-check-big");
    const list = section.createDiv({ cls: "qy-task-list" });
    if (!tasks.length) {
      this.renderEmpty(list, "当前项目没有未完成动作。");
      return;
    }
    tasks.slice(0, 6).forEach((task) => {
      const button = list.createEl("button", {
        cls: "qy-task-row",
        attr: { type: "button", "aria-label": `打开项目 ${task.file.basename}` },
      });
      button.createSpan({ cls: "qy-task-check", text: "○" });
      const copy = button.createDiv();
      copy.createEl("strong", { text: task.text });
      copy.createSpan({ text: task.file.basename });
      button.addEventListener("click", () => this.plugin.openFile(task.file));
    });
  }

  renderEmpty(parent, text) {
    const empty = parent.createDiv({ cls: "qy-dashboard-empty" });
    createIcon(empty, "circle-dashed");
    empty.createSpan({ text });
  }

  async collectProjectTasks() {
    const projects = this.app.vault.getMarkdownFiles()
      .filter((file) => file.path.startsWith("Projects/"))
      .sort((a, b) => b.stat.mtime - a.stat.mtime);
    const collected = [];
    for (const file of projects) {
      const content = await this.app.vault.cachedRead(file);
      const matcher = /^\s*-\s*\[ \]\s+(.+)$/gm;
      let match;
      while ((match = matcher.exec(content)) !== null) {
        collected.push({ file, text: cleanTaskText(match[1]) });
      }
    }
    return collected;
  }
}

class QingyanHomepagePlugin extends Plugin {
  async onload() {
    this.registerView(VIEW_TYPE, (leaf) => new QingyanHomepageView(leaf, this));

    this.addRibbonIcon("layout-dashboard", `打开 ${PRODUCT_NAME}`, () => this.activateHomepage());
    this.addCommand({
      id: "open-qingyan-vault-homepage",
      name: `打开 ${PRODUCT_NAME} 动态首页`,
      callback: () => this.activateHomepage(),
    });
    this.addCommand({
      id: "open-qingyan-vault-fallback-home",
      name: "打开静态 Home.md",
      callback: () => this.openStaticHome(),
    });

    ["create", "delete", "modify", "rename"].forEach((eventName) => {
      this.registerEvent(this.app.vault.on(eventName, () => this.refreshViews()));
    });

    this.app.workspace.onLayoutReady(() => {
      const activeFile = this.app.workspace.getActiveFile();
      if (activeFile?.path === "Home.md") {
        window.setTimeout(() => this.activateHomepage(), 120);
      }
    });
  }

  onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE);
  }

  refreshViews() {
    this.app.workspace.getLeavesOfType(VIEW_TYPE).forEach((leaf) => {
      leaf.view?.scheduleRefresh?.();
    });
  }

  async activateHomepage() {
    const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (existing) {
      await this.app.workspace.revealLeaf(existing);
      return;
    }
    const leaf = this.app.workspace.getLeaf(false);
    await leaf.setViewState({ type: VIEW_TYPE, active: true });
    await this.app.workspace.revealLeaf(leaf);
  }

  async openFile(file) {
    if (!(file instanceof TFile)) return;
    await this.app.workspace.getLeaf(false).openFile(file);
  }

  async openStaticHome() {
    const file = this.app.vault.getAbstractFileByPath("Home.md");
    if (file instanceof TFile) await this.openFile(file);
  }

  async openKnowledgeBase() {
    const file = this.app.vault.getAbstractFileByPath("知识总览.base");
    if (file instanceof TFile) {
      await this.openFile(file);
    } else {
      new Notice("没有找到知识总览.base");
    }
  }

  openSearch() {
    this.app.commands.executeCommandById("global-search:open");
  }

  openDailyNote() {
    const executed = this.app.commands.executeCommandById("daily-notes");
    if (!executed) new Notice("日记核心插件尚未启用");
  }

  async captureNote() {
    const folder = "Inbox";
    if (!this.app.vault.getAbstractFileByPath(folder)) {
      await this.app.vault.createFolder(folder);
    }
    const now = new Date();
    const date = localDateKey(now);
    const time = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
    let path = `${folder}/${date} ${time} — 新线索.md`;
    let suffix = 2;
    while (this.app.vault.getAbstractFileByPath(path)) {
      path = `${folder}/${date} ${time} — 新线索 ${suffix}.md`;
      suffix += 1;
    }
    const content = `---\ntype: inbox\ncreated: ${now.toISOString()}\n---\n\n# 新线索\n\n`;
    const file = await this.app.vault.create(path, content);
    await this.openFile(file);
    new Notice("已在 Inbox 新建一条线索");
  }
}

module.exports = QingyanHomepagePlugin;
