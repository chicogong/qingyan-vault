#!/usr/bin/env python3
"""Portable, read-only validation for the synthetic Qingyan Vault."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent

REQUIRED_DIRS = [
    "Inbox",
    "Sources",
    "Notes",
    "Projects",
    "MOCs",
    "Review",
    "Archive",
    "Templates",
    "Canvas",
    "Attachments",
    "Guides",
    "Agent/草稿",
    "Agent/交接",
    "Agent/反馈",
    "docs",
    ".github/assets",
]

REQUIRED_FILES = [
    "Home.md",
    "开始使用.md",
    "README.md",
    "README.en.md",
    "AGENTS.md",
    "CLAUDE.md",
    "ROADMAP.md",
    "CHANGELOG.md",
    "VERSION",
    "CONTRIBUTING.md",
    "SECURITY.md",
    "CODE_OF_CONDUCT.md",
    "Guides/用户使用手册.md",
    "Guides/Agent 使用手册.md",
    "Guides/严格审核.md",
    "Guides/插件与主题.md",
    "Guides/案例与设计取舍.md",
    "Guides/把它变成你的.md",
    "Agent/README.md",
    "Review/每日与每周节奏.md",
    "docs/PRODUCT.md",
    "docs/RESEARCH.md",
    "docs/OPEN_SOURCE_PLAN.md",
    "Canvas/夜航花园地图.canvas",
    "知识总览.base",
    ".obsidian/app.json",
    ".obsidian/appearance.json",
    ".obsidian/core-plugins.json",
    ".obsidian/snippets/qingyan-vault.css",
    ".obsidian/themes/Border/theme.css",
    ".obsidian/themes/Border/manifest.json",
    ".obsidian/themes/Border/LICENSE",
    "THIRD_PARTY_NOTICES.md",
    ".obsidian/workspace.json",
    ".github/assets/home-light.png",
    ".github/assets/home-dark.png",
]

REQUIRED_CORE_PLUGINS = {
    "global-search",
    "backlink",
    "bases",
    "templates",
    "daily-notes",
    "canvas",
    "bookmarks",
    "file-recovery",
}

DISABLED_CORE_PLUGINS = {"sync", "publish", "webviewer"}

FORBIDDEN_MARKERS = [
    "/Users/",
    "/home/",
    "C:\\Users\\",
    "haorangong",
    "BEGIN PRIVATE KEY",
    "BEGIN OPENSSH PRIVATE KEY",
]

INTENTIONAL_UNRESOLVED_LINKS = {"Inbox/My First Note"}
TEXT_SUFFIXES = {".md", ".json", ".canvas", ".base", ".css"}
IGNORED_PARTS = {".git", "dist", "__pycache__"}
SECRET_PATTERN = re.compile(
    r"(?i)\b(api[_-]?key|access[_-]?token|client[_-]?secret|password)"
    r"\s*[:=]\s*[\"']?[A-Za-z0-9_./+\-]{12,}"
)


def fail(message: str, failures: list[str]) -> None:
    failures.append(message)
    print(f"FAIL  {message}")


def passed(message: str) -> None:
    print(f"PASS  {message}")


def content_files() -> list[Path]:
    return [
        path
        for path in ROOT.rglob("*")
        if path.is_file()
        and path.suffix in TEXT_SUFFIXES
        and ".starter-tools" not in path.parts
        and not IGNORED_PARTS.intersection(path.relative_to(ROOT).parts)
    ]


def resolve_wikilink(target: str, markdown_files: list[Path]) -> bool:
    # Markdown tables escape the wikilink label separator as `\|`, while
    # Obsidian still interprets it as the normal `|` separator.
    target = target.replace("\\|", "|").split("|", 1)[0].split("#", 1)[0].strip()
    if not target or target in INTENTIONAL_UNRESOLVED_LINKS:
        return True
    candidate = ROOT / target
    if candidate.suffix:
        return candidate.exists()
    if candidate.with_suffix(".md").exists() or candidate.with_suffix(".canvas").exists():
        return True
    return any(path.stem == Path(target).name for path in markdown_files)


def main() -> int:
    failures: list[str] = []

    for relative in REQUIRED_DIRS:
        path = ROOT / relative
        if path.is_dir():
            passed(f"required directory: {relative}")
        else:
            fail(f"missing directory: {relative}", failures)

    for relative in REQUIRED_FILES:
        path = ROOT / relative
        if path.is_file() and path.stat().st_size > 0:
            passed(f"required file: {relative}")
        else:
            fail(f"missing or empty file: {relative}", failures)

    if (ROOT / ".git").exists():
        passed("source checkout Git metadata is ignored by release packaging")
    else:
        passed("no Git metadata in distributable Vault")

    plugins_dir = ROOT / ".obsidian" / "plugins"
    if plugins_dir.exists():
        fail("community plugin directory must not be packaged", failures)
    else:
        passed("no packaged community plugins")

    core_plugins_path = ROOT / ".obsidian" / "core-plugins.json"
    core_plugins = json.loads(core_plugins_path.read_text(encoding="utf-8"))
    for plugin in sorted(REQUIRED_CORE_PLUGINS):
        if core_plugins.get(plugin) is True:
            passed(f"required core plugin enabled: {plugin}")
        else:
            fail(f"required core plugin is not enabled: {plugin}", failures)
    for plugin in sorted(DISABLED_CORE_PLUGINS):
        if core_plugins.get(plugin) is False:
            passed(f"network or nonessential core plugin disabled: {plugin}")
        else:
            fail(f"core plugin must remain disabled: {plugin}", failures)

    app_config = json.loads((ROOT / ".obsidian" / "app.json").read_text(encoding="utf-8"))
    expected_app_config = {
        "defaultViewMode": "preview",
        "newFileLocation": "folder",
        "newFileFolderPath": "Inbox",
        "propertiesInDocument": "hidden",
        "attachmentFolderPath": "Attachments",
    }
    for key, expected in expected_app_config.items():
        if app_config.get(key) == expected:
            passed(f"app setting: {key}={expected}")
        else:
            fail(f"app setting mismatch: {key} must be {expected!r}", failures)

    expected_ignored_files = {
        "docs/",
        "AGENTS.md",
        "CLAUDE.md",
        "CODE_OF_CONDUCT.md",
        "CONTRIBUTING.md",
        "README.en.md",
        "ROADMAP.md",
        "SECURITY.md",
        "CHANGELOG.md",
        "VERSION",
    }
    ignored_files = set(app_config.get("userIgnoreFilters", []))
    if expected_ignored_files <= ignored_files:
        passed("repository governance excluded from the knowledge index")
    else:
        missing = sorted(expected_ignored_files - ignored_files)
        fail(f"repository governance missing from userIgnoreFilters: {missing}", failures)

    appearance = json.loads((ROOT / ".obsidian" / "appearance.json").read_text(encoding="utf-8"))
    if "qingyan-vault" in appearance.get("enabledCssSnippets", []):
        passed("Qingyan theme snippet enabled")
    else:
        fail("Qingyan theme snippet is not enabled", failures)

    if appearance.get("cssTheme") == "Border":
        passed("audited Border theme selected")
    else:
        fail("Border theme must be the selected visual base", failures)

    border_manifest_path = ROOT / ".obsidian" / "themes" / "Border" / "manifest.json"
    border_manifest = json.loads(border_manifest_path.read_text(encoding="utf-8"))
    if border_manifest.get("name") == "Border" and border_manifest.get("author") == "Akifyss":
        passed("Border theme manifest attribution")
    else:
        fail("Border theme manifest attribution is missing", failures)

    border_license = (ROOT / ".obsidian" / "themes" / "Border" / "LICENSE").read_text(
        encoding="utf-8"
    )
    if "MIT License" in border_license and "Copyright (c) 2022 Akifyss" in border_license:
        passed("Border theme MIT license retained")
    else:
        fail("Border theme MIT license or copyright notice is missing", failures)

    project_license = (ROOT / "LICENSE").read_text(encoding="utf-8")
    if "MIT License" in project_license and "Permission is hereby granted" in project_license:
        passed("Qingyan Vault MIT license")
    else:
        fail("Qingyan Vault root LICENSE must contain the full MIT grant", failures)

    readme = (ROOT / "README.md").read_text(encoding="utf-8")
    for screenshot in (".github/assets/home-light.png", ".github/assets/home-dark.png"):
        if screenshot in readme:
            passed(f"README references screenshot: {screenshot}")
        else:
            fail(f"README does not reference screenshot: {screenshot}", failures)

    home = (ROOT / "Home.md").read_text(encoding="utf-8")
    for marker in ("obsidian://daily", "task-todo:/./", "知识驾驶台", "Guides/把它变成你的"):
        if marker in home:
            passed(f"home cockpit marker: {marker}")
        else:
            fail(f"home cockpit marker missing: {marker}", failures)

    if "QINGYAN VAULT" in home and "OBSIDIAN AGENT STARTER" not in home:
        passed("Qingyan Vault home branding")
    else:
        fail("Home.md contains stale or missing product branding", failures)

    workspace = json.loads((ROOT / ".obsidian" / "workspace.json").read_text(encoding="utf-8"))
    workspace_text = json.dumps(workspace, ensure_ascii=False)
    if '"file": "Home.md"' in workspace_text and workspace.get("active") == "starter-home":
        passed("sanitized workspace opens Home.md")
    else:
        fail("workspace must open Home.md in the active starter tab", failures)
    for runtime_name in ("未命名.canvas", "未命名.base", "workspace-mobile.json"):
        if runtime_name in workspace_text:
            fail(f"workspace contains runtime scratch entry: {runtime_name}", failures)
    for source_only in ('"dist', '"docs', '".github'):
        if source_only in workspace_text:
            fail(f"workspace contains source-only or missing release entry: {source_only}", failures)

    symlinks = [
        path
        for path in ROOT.rglob("*")
        if path.is_symlink() and not IGNORED_PARTS.intersection(path.relative_to(ROOT).parts)
    ]
    if symlinks:
        fail(f"symlinks reduce portability: {symlinks}", failures)
    else:
        passed("no symlinks")

    risky_files = [
        path.relative_to(ROOT)
        for path in ROOT.rglob("*")
        if path.is_file() and (path.name == ".env" or path.suffix.lower() in {".pem", ".key", ".p12"})
        and not IGNORED_PARTS.intersection(path.relative_to(ROOT).parts)
    ]
    if risky_files:
        fail(f"credential-like files are not allowed: {risky_files}", failures)
    else:
        passed("no credential-like files")

    files = content_files()
    markdown_files = [path for path in files if path.suffix == ".md"]

    for path in files:
        text = path.read_text(encoding="utf-8")
        relative = path.relative_to(ROOT)
        for marker in FORBIDDEN_MARKERS:
            if marker in text:
                fail(f"forbidden private or credential marker in {relative}: {marker}", failures)

        if SECRET_PATTERN.search(text):
            fail(f"credential-like assignment in {relative}", failures)

        if ".obsidian/snippets" in relative.as_posix() and path.suffix == ".css":
            if re.search(r"@import|https?://|url\s*\(", text, re.I):
                fail(f"local CSS snippet references an external or embedded asset: {relative}", failures)

        if path.suffix == ".md":
            for target in re.findall(r"\[\[([^\]]+)\]\]", text):
                if not resolve_wikilink(target, markdown_files):
                    fail(f"unresolved wikilink in {relative}: [[{target}]]", failures)

        if path.suffix == ".json":
            try:
                json.loads(text)
            except json.JSONDecodeError as error:
                fail(f"invalid JSON file {relative}: {error}", failures)

    source_files = list((ROOT / "Sources").glob("*.md"))
    if source_files and all("synthetic: true" in path.read_text(encoding="utf-8") for path in source_files):
        passed("all example sources explicitly marked synthetic")
    else:
        fail("every example source must contain 'synthetic: true'", failures)

    for canvas_path in (ROOT / "Canvas").glob("*.canvas"):
        try:
            canvas = json.loads(canvas_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as error:
            fail(f"invalid JSON Canvas {canvas_path.name}: {error}", failures)
            continue
        if not canvas.get("nodes") or not canvas.get("edges"):
            fail(f"Canvas is an empty shell: {canvas_path.name}", failures)
        else:
            passed(f"non-empty JSON Canvas: {canvas_path.name}")
        for node in canvas.get("nodes", []):
            if node.get("type") == "file" and not (ROOT / node.get("file", "")).is_file():
                fail(f"Canvas file node is missing: {node.get('file')}", failures)

    if failures:
        print(f"\n{len(failures)} check(s) failed.")
        return 1

    print("\nAll checks passed for Qingyan Vault.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
