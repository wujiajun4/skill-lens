<div align="center">

# 🔍 Skill Lens

**137 skills installed. Only 15 ever get called. The rest are blind spots.**

**137 个技能装好了。只有 15 个会被调用。其余全是盲区。**

[![version](https://img.shields.io/badge/version-1.0.0-blue)](https://github.com/wujiajun4/skill-lens)
[![platform](https://img.shields.io/badge/platform-Claude%20Code%20%7C%20Agent%20Skills-purple)](https://skills.sh)
[![license](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![lang](https://img.shields.io/badge/lang-EN%20%7C%20%E4%B8%AD%E6%96%87-brightgreen)](#)

</div>

---

## About

> **You installed a skill. You forgot about it. It will never be called.**
> Skill Lens reads your skill directory and hot-trigger list, then tells you
> exactly which skills are invisible to the AI.

**The problem:** Claude Code shows all 137 skills as a giant system reminder. The hot-trigger list
filters that down to 15 reflexes. But when you install a new skill, nobody updates the hot-trigger
list. Result: the new skill sits on disk, fully installed, but never gets invoked.

**Skill Lens** reads `skill-directory.md` (your complete skill catalog) and `CLAUDE.md`
(your hot-trigger reflexes), cross-references them, and shows you three things:

- ✅ **Covered** — skills that will actually be auto-invoked
- ⚠️ **Blind Spots** — skills that are installed but invisible
- 👻 **Ghosts** — skills listed in hot triggers but no longer installed

---

## Quick Example

```
## Skill Lens Report — 2026-06-06

### ✅ Covered (15 skills)
| # | Skill | Hot Trigger | Orchestra |
|---|-------|------------|-----------|
| 1 | tool-eval | Row 1 | ⑮ AI/ML |
| 2 | preflight | Row 2 | ⑮ AI/ML |
| 3 | brain-sync | Row 3 | ⑮ AI/ML |
| ... | ... | ... | ... |

### ⚠️ Blind Spots (3 skills — installed but NEVER auto-invoked)
| Skill | Row | Keywords | Orchestra |
|-------|-----|----------|-----------|
| readme | 16 | "生成README" · "优化文档" | ⑮ AI/ML |
| github-about | 17 | "update repo" · "topics" | ⑮ AI/ML |
| orchestra-intake | 18 | "归档" · "intake" · "新工具" | ⑮ AI/ML |

### 👻 Ghosts (0)

👉 Say "fix blind spots" and I'll update the hot-trigger list.
```

---

## How It Works

```
skill-directory.md (15+ skills)     CLAUDE.md hot-trigger (15 reflexes)
          │                                    │
          └────────── cross-reference ─────────┘
                            │
                    ┌───────┼───────┐
                    ▼       ▼       ▼
                ✅ Both  ⚠️ Dir  👻 Hot
                         only     only
```

---

## Install

```bash
# Claude Code (one command / 一行命令)
mkdir -p ~/.claude/skills && git clone https://github.com/wujiajun4/skill-lens.git ~/.claude/skills/skill-lens

# Agent Skills (any platform / 全平台)
npx skills add wujiajun4/skill-lens -g
```

| Trigger | What happens |
|---------|-------------|
| `skill-lens` / `check my skills` | Manual check |
| `检查盲区` / `有哪些 skill 漏了` | Chinese triggers |
| *(auto)* | After brain-sync completes |

---

## Pair with Your Stack

```
brain-sync   → Syncs Obsidian ↔ Memory MCP (keeps data consistent)
skill-lens   → Detects blind spots in hot-trigger list (keeps execution complete)
tool-eval    → Evaluates new tools before installing
preflight    → Checks your products before publishing
```

---

## License

MIT — © 2026 wujiajun4
