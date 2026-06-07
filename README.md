<div align="center">

# 🔍 Skill Lens

**144 skills installed. Only 37 get auto-invoked. The other 107 are blind spots.**

**144 个技能装好了。只有 37 个会被自动调用。其余 107 个全是盲区。**

[![version](https://img.shields.io/badge/version-1.1.0-blue)](https://github.com/wujiajun4/skill-lens)
[![platform](https://img.shields.io/badge/platform-Claude%20Code%20%7C%20Agent%20Skills-purple)](https://skills.sh)
[![license](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![lang](https://img.shields.io/badge/lang-EN%20%7C%20%E4%B8%AD%E6%96%87-brightgreen)](#)
[![coverage](https://img.shields.io/badge/coverage-25.7%25%20%287%2F144%29-orange)](#)

<br/>

<code>npx skills add wujiajun4/skill-lens -g</code>

</div>

---

## About

> **You installed a skill. You forgot about it. It will never be called.**
> Skill Lens reads your skill directory and hot-trigger list, then tells you
> exactly which skills are invisible to the AI — and fixes them with one flag.

**The problem:** Claude Code shows all installed skills as a giant system reminder. The hot-trigger list
filters that down to a small set of reflexes. But when you install a new skill, nobody updates the
hot-trigger list. Result: the new skill sits on disk, fully installed, but never gets invoked.

**Skill Lens v1.1** runs a real audit (`lens.cjs` script), shows you three things:

- ✅ **Covered** — skills that will actually be auto-invoked
- ⚠️ **Blind Spots** — skills that are installed but invisible (with priority score)
- 👻 **Ghosts** — skills listed in hot triggers but no longer installed

Plus a **coverage %** metric and a `--apply` flag that auto-fixes top N blind spots.

---

## What's New in v1.1

| Feature | v1.0 | v1.1 |
|---------|------|------|
| Real coverage % | ❌ | ✅ |
| Auto-apply top N to hot list | ❌ | ✅ `--apply` |
| Priority scoring | ❌ | ✅ own products +40, baoyu- +25, gstack +15 |
| History tracking | ❌ | ✅ `~/.claude/.cache/skill-lens-history.json` |
| Multi-skill row handling | ❌ | ✅ `**a / b**` → 2 skills |
| Skip non-skill dirs | ❌ | ✅ Framework/ false-positive filter |
| Hardcoded numbers | ❌ 137/15 | ✅ Dynamic |

---

## Quick Start

```bash
# Install
npx skills add wujiajun4/skill-lens -g

# Just check
node ~/.claude/skills/skill-lens/lens.cjs

# Auto-fix top 10 blind spots (with backup)
node ~/.claude/skills/skill-lens/lens.cjs --apply

# Auto-fix top 5
node ~/.claude/skills/skill-lens/lens.cjs --apply --top 5
```

---

## Sample Output

```
## Skill Lens Report — 2026-06-07

📊 **Coverage: 25.7% (37/144)** ↑ 0.69% vs last run

✅ Covered:   37 skills
⚠️  Blind:    107 skills (installed but NOT auto-invoked)
👻 Ghosts:    0 skills (in hot list but NOT installed)

### ⚠️ Top 10 Blind Spots (by priority)
 1. baoyu-comic              (priority 75)
 2. baoyu-danger-gemini-web  (priority 75)
 3. baoyu-danger-x-to-markdown  (priority 75)
 4. baoyu-infographic        (priority 75)
 5. canary                   (priority 65)
 6. careful                  (priority 65)
 7. connect-chrome           (priority 65)
 8. artificial-analysis-compare (priority 50)
 9. benchmark                (priority 50)
10. benchmark-models         (priority 50)

👉 Run with --apply to auto-add top 10 to hot-trigger list.
```

---

## Triggers

| Trigger | What happens |
|---------|-------------|
| `skill-lens` / `check my skills` | Manual check |
| `检查盲区` / `有哪些 skill 漏了` | Chinese triggers |
| *(auto)* | After brain-sync completes |
| `lens --apply` | Auto-fix top 10 to hot-trigger list |
| `lens --apply --top 5` | Auto-fix top 5 |

---

## Pair with Your Stack

```
brain-sync   → Syncs Obsidian ↔ Memory MCP (keeps data consistent)
skill-lens   → Detects blind spots in hot-trigger list (keeps execution complete)
tool-eval    → Evaluates new tools before installing
preflight    → Checks your products before publishing
```

---

## How It Works

```
~/.claude/skills/              ~/.claude/CLAUDE.md
(144 skills)                   (35 hot-trigger rows)
       │                              │
       └────────── lens.cjs ──────────┘
                      │
              ┌───────┼───────┐
              ▼       ▼       ▼
          ✅ 37   ⚠️ 107  👻 0
          (covered) (blind) (ghosts)
                      │
                  --apply
                      │
              ┌───────▼──────┐
              │ +top 10 rows │
              │ to hot list  │
              │ backup saved │
              └──────────────┘
```

---

## Install

```bash
# Claude Code (one command / 一行命令)
mkdir -p ~/.claude/skills && git clone https://github.com/wujiajun4/skill-lens.git ~/.claude/skills/skill-lens

# Agent Skills (any platform / 全平台)
npx skills add wujiajun4/skill-lens -g
```

---

## Changelog

### v1.1.0 (2026-06-07)
- `lens.cjs` script with `--apply` auto-mode
- Coverage % metric with delta tracking
- History log + priority scoring
- Multi-skill row handling + framework filter
- Removed hardcoded numbers

### v1.0.0 (2026-05-XX)
- Initial release: markdown instructions, manual bash

---

## License

MIT — © 2026 wujiajun4
