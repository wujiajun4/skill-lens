---
name: skill-lens
version: "1.1.0"
description: >-
  L1: Finds blind spots — installed skills that are NOT in the hot-trigger list and will never be auto-invoked. L2: full report with coverage % + top priority suggestions + optional auto-apply. Run after brain-sync or anytime to check coverage. | 中文触发：技能。 Use this skill when the user mentions skill / 工具 / 插件 / find skills / plugin.
allowed-tools: Read, Write, Bash, Grep
user-invocable: true
tags: [meta, skill-management, coverage, blind-spot, routing, discovery, audit, gap-analysis]
argument-hint: "skill-lens | check my skills | 检查盲区 | 有哪些skill漏了"

progressive_disclosure:
  enabled: true
  level1_tokens: 120
  level2_tokens: 3000

triggers:
  keywords:
    - "check my skills"
    - "检查盲区"
    - "有哪些 skill 漏了"
    - "skill-lens"
    - "blindspot"
    - "coverage check"
  events:
    - "brain-sync-complete"
    - "hot-trigger-list-updated"
  phases:
    - "extract"
    - "compare"
    - "suggest"
    - "apply"
---

<!-- LEVEL 1 — Read this first (15 lines) -->

| What | Action |
|------|--------|
| **Goal** | Find installed skills that NEVER auto-invoke because they're missing from the hot-trigger list |
| **Input** | `~/.claude/skills/` (real) + `~/.claude/CLAUDE.md` hot-trigger list |
| **Output** | Coverage report: ✅ Covered · ⚠️ Blind Spots · 👻 Ghosts + coverage % |
| **Optional** | `--apply` flag auto-adds top 10 blind spots to hot-trigger list |
| **Manual trigger** | "skill-lens" / "check my skills" / "检查盲区" / "有哪些 skill 漏了" |
| **Auto-trigger** | After brain-sync completes |

---

<!-- LEVEL 2 — Full pipeline starts here -->

# Skill Lens v1.1 — "Your hot-trigger list has blind spots."

## The Problem

You have 100+ skills installed. Only a fraction are in the hot-trigger list that actually gets auto-invoked.
The rest are **installed but invisible** — they exist on disk but will never be called because:

1. The AI doesn't see them in the hot-trigger checklist
2. They're buried in the system reminder (144 skills = 200+ tokens)
3. You forgot you installed them

## What It Does

Cross-references installed skills (`~/.claude/skills/`) against the hot-trigger list in `~/.claude/CLAUDE.md`:

```
~/.claude/skills/              CLAUDE.md hot-trigger list
      │                                  │
      ▼                                  ▼
  installed skills                auto-invoked skills
      │                                  │
      └────────── cross-reference ───────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
   ✅ Covered    ⚠️ Blind     👻 Ghosts
   in both      in skills    in hot list
                but NOT in   but NOT in
                hot list     installed
```

## Quick Run

```bash
# Show report only
node ~/.claude/skills/skill-lens/lens.cjs

# Auto-apply top 10 to hot-trigger list (with backup)
node ~/.claude/skills/skill-lens/lens.cjs --apply

# Auto-apply top N
node ~/.claude/skills/skill-lens/lens.cjs --apply --top 5
```

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
 3. baoyu-infographic        (priority 75)
 4. canary                   (priority 65)
 5. careful                  (priority 65)
 6. connect-chrome           (priority 65)
 ...
```

## What the Script Does (for LLM understanding)

The `lens.cjs` script handles all the dirty work so you don't have to:

| Step | What it does | Why |
|------|-------------|-----|
| 1. Extract | `ls ~/.claude/skills/` filtered by SKILL.md existence | Real source of truth, not docs.md |
| 2. Extract | Parse CLAUDE.md hot-trigger section, split multi-skill rows (`**a / b**`) | Avoid double-counting |
| 3. Compare | Three-set: covered / blind / ghosts | Standard Venn diagram |
| 4. Score | Priority = 50 (base) + 40 (own product) + 25 (baoyu-) + 15 (gstack) | Rank by importance |
| 5. Apply (opt) | Backup CLAUDE.md → insert top N rows → update "If none of the {N} match" | Reversible |
| 6. History | Append to `~/.claude/.cache/skill-lens-history.json` | Track coverage over time |

## Pipeline (if you want to do it manually)

### Step 1: Extract

```bash
# Source A: All installed skills (real)
ls ~/.claude/skills/ | grep -v "^_\|^\."

# Source B: Skills in hot-trigger list
sed -n '/Hot Trigger List/,/If none of the {N} match/p' ~/.claude/CLAUDE.md | \
  grep -oP '\*\*[a-z][a-z0-9_-]*[a-z0-9]\*\*' | sort -u
```

### Step 2: Compare

Build three sets using `comm`:
- **✅ Covered**: in BOTH
- **⚠️ Blind**: in skills, NOT in hot list
- **👻 Ghosts**: in hot list, NOT in skills

### Step 3: Prioritize

Sort blind spots by:
1. User's own products (tool-eval, preflight, brain-sync, skill-lens, skill-creator)
2. `baoyu-*` high-frequency skills
3. `gstack` curated suite (browse, canary, careful, codex, etc.)
4. Everything else

### Step 4: Apply (manual)

To add a blind spot to the hot-trigger list, edit `~/.claude/CLAUDE.md`:
1. Find `## Skill Auto-Discovery — Hot Trigger List`
2. Insert new rows before `**If none of the {N} match:**`
3. Update the `{N}` in the "If none of" line

Or just run: `node lens.cjs --apply`

## History Tracking

Each run appends to `~/.claude/.cache/skill-lens-history.json`:

```json
[
  {"date": "2026-06-07", "total": 144, "covered": 36, "coverage": 25.0, "delta": null},
  {"date": "2026-06-07", "total": 144, "covered": 37, "coverage": 25.7, "delta": 0.69}
]
```

Use this to spot regressions (coverage drop = someone removed hot-trigger rows).

## Rules

- **Run after every brain-sync.** Auto-triggered by `brain-sync-complete` event.
- **Don't just list — prioritize.** Every blind spot comes with a priority score.
- **Backup before apply.** The `--apply` mode auto-backs up to `~/.claude/.cache/skill-lens-backups/`.
- **Skip docs.** Skills without `SKILL.md` are not counted (avoids framework/ repo false positives).
- **Source of truth = `~/.claude/skills/`.** skill-directory.md is documentation, not config.

## Changelog

### v1.1.0 (2026-06-07)
- **NEW**: `lens.cjs` script with `--apply` auto-mode
- **NEW**: Coverage % metric with delta tracking
- **NEW**: History log at `~/.claude/.cache/skill-lens-history.json`
- **NEW**: Priority scoring (own products +40, baoyu- +25, gstack +15)
- **NEW**: Multi-skill row handling (`**a / b**` → 2 skills)
- **NEW**: Skip skills without SKILL.md (framework/ false positive filter)
- **FIX**: Removed hardcoded 137/15 numbers (now dynamic)
- **FIX**: Tags expanded: discovery, audit, gap-analysis
- **FIX**: argument-hint moved to dedicated frontmatter field

### v1.0.0 (2026-05-XX)
- Initial release: markdown instructions, manual bash extraction
