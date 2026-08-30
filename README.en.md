# Qingyan Vault

[简体中文](README.md) · English

**A ready-to-use, agent-native Obsidian vault where agents draft and people decide.**

Everything remains local Markdown. The release archive needs no account, network connection, model, or community plugin: unzip it and open the folder in Obsidian.

![Qingyan Vault light home](.github/assets/home-light.png)

## The missing first layer

Many Obsidian templates stop at folders and appearance. Many agent vaults begin with skills, memory, Git automation, semantic search, or heavy governance. Qingyan Vault starts with a complete daily loop and keeps advanced controls optional.

```text
capture → connect → isolated agent draft → human acceptance → reuse
```

## Start in 60 seconds

1. Download and unzip the latest archive from [Releases](https://github.com/chicogong/qingyan-vault/releases).
2. Open the extracted folder as an Obsidian vault.
3. The Home note opens automatically; follow `开始使用.md`.
4. Point a file-based agent at the folder and ask it to read `AGENTS.md` before doing anything.

## Included

- A Chinese-first Home cockpit, templates, synthetic sources, notes, projects, maps, reviews, Bases, and Canvas.
- A canonical `AGENTS.md`, a thin Claude adapter, isolated drafts, handoffs, and reusable feedback.
- The MIT-licensed Border theme plus a Qingyan visual layer with light, dark, narrow-window, keyboard-focus, and reduced-motion support.
- An optional Strict Review workflow powered by LLM Wiki Canvas for source-bound, conflict-safe changes.
- Portable checks and a reproducible release-archive builder.

## Boundaries

Markdown stays the source of truth. Qingyan Vault ships no LLM, chat UI, vector database, cloud sync, executable community plugin, or opaque automatic memory. Agents do not silently rewrite accepted knowledge. Strict Review is an optional engine, not a second user-facing product.

## Verify

```sh
./.starter-tools/self-check.sh
./.starter-tools/build-release.py --check
```

See the [Chinese README](README.md), [product thesis](docs/PRODUCT.md), [roadmap](ROADMAP.md), and [security policy](SECURITY.md) for the complete contract.

## License

MIT. The bundled Border theme retains its original MIT license and attribution. Obsidian is governed by its own license.
