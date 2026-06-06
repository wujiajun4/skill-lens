---
name: skill-lens
version: "1.0.0"
description: >-
  L1: Finds blind spots — which of your 137 installed skills are NOT in the
  hot-trigger list and will never be auto-invoked. L2: full comparison + fix
  suggestions. Run after brain-sync or anytime to check coverage.
argument-hint: "skill-lens | check my skills | 检查盲区 | 有哪些skill漏了"
allowed-tools: Read, Write, Bash, Grep
user-invocable: true
tags: [meta, skill-management, coverage, blind-spot, routing]

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
---

<!-- LEVEL 1 — Read this first (15 lines) -->

| What | Action |
|------|--------|
| **Goal** | Find skills that exist but are NEVER auto-invoked because they're missing from the hot-trigger list |
| **Input** | `skill-directory.md` (all skills) + `CLAUDE.md` hot-trigger list (covered skills) |
| **Output** | 3-section table: ✅ Covered · ⚠️ Blind Spots · 👻 Ghosts |
| **Suggestion** | For each blind spot: which row to insert into hot-trigger list + keyword hint |
| **Manual trigger** | "skill-lens" / "check my skills" / "检查盲区" / "有哪些 skill 漏了" |
| **Auto-trigger** | After brain-sync completes |

---

<!-- LEVEL 2 — Full pipeline starts here -->

# Skill Lens — "Your hot-trigger list has blind spots."

## The Problem

You have 100+ skills installed. Only 15 are in the hot-trigger list that actually gets auto-invoked.
The other 120+ are **installed but invisible** — they exist on disk but will never be called because:

1. The AI doesn't see them in the hot-trigger checklist
2. They're buried in the 137-name system reminder
3. You forgot you installed them

## What It Does

Reads two files, compares them, tells you what's missing:

```
skill-directory.md          CLAUDE.md hot-trigger list
      │                              │
      ▼                              ▼
  all known skills             15 auto-invoked skills
      │                              │
      └──────── cross-reference ─────┘
                     │
                     ▼
        ┌────────────┼────────────┐
        ▼            ▼            ▼
   ✅ Covered    ⚠️ Blind     👻 Ghosts
   in both      in directory  in hot list
                but NOT in    but NOT in
                hot list      directory
```

## Pipeline

### Step 1: Extract

Read two sources:

```bash
# Source A: All known skills
grep "^# " ~/obsidian/knowledge-base/projects/skill-directory.md | \
  grep -v "技能目录\|快速索引" | \
  sed 's/^# //'

# Source B: Skills in hot-trigger list
sed -n '/Hot Trigger List/,/If none of the 15/p' ~/.claude/CLAUDE.md | \
  grep -oP '\*\*\K[a-z][a-z0-9_-]*[a-z0-9]\*\*' | sort -u
```

Parse both into clean skill name lists.

### Step 2: Compare

Build three sets:

| Set | Definition | Meaning |
|-----|-----------|---------|
| **✅ Covered** | In BOTH directory AND hot list | Will be auto-invoked |
| **⚠️ Blind Spots** | In directory BUT NOT in hot list | Installed, will NEVER auto-fire |
| **👻 Ghosts** | In hot list BUT NOT in directory | Listed but no longer installed |

### Step 3: Suggest Fixes

For each blinding spot, suggest a row to add to the hot-trigger list:

```
Format:
  ⚠️ {skill-name}
     → Suggested position: Row {N}
     → Keyword hint: "{keywords}"
     → Why: {one-line justification}
```

Priority order for suggestions:
1. User's own products (tool-eval, preflight, brain-sync, skill-lens itself)
2. Skills used in today's session
3. Skills with high orchestra rank (First Chair > Section)
4. Everything else

### Step 4: Output Report

```
## Skill Lens Report — {date}

### ✅ Covered ({N} skills)
| # | Skill | Hot Trigger # | Orchestra |
|---|-------|--------------|-----------|
| 1 | tool-eval | 1 | ⑮ AI/ML |
| 2 | preflight | 2 | ⑮ AI/ML |
| ... | ... | ... | ... |

### ⚠️ Blind Spots ({M} skills — installed but NOT auto-invoked)
| Skill | Suggested Row | Keyword Hint | Orchestra |
|-------|--------------|-------------|-----------|
| readme | 16 | "generate README" · "优化README" · "文档" | ⑮ AI/ML |
| github-about | 17 | "update repo" · "topics" · "repo描述" | ⑮ AI/ML |
| ... | ... | ... | ... |

### 👻 Ghosts ({K} listed but missing)
(usually empty — only shows if hot list references removed skills)

### Fix Instructions
To add a blind spot to the hot-trigger list, edit `~/.claude/CLAUDE.md`:
1. Find `## Skill Auto-Discovery — Hot Trigger List`
2. Insert new rows before `**If none of the 15 match:**`
3. Bump the row numbers

Or say "add {skill} to hot trigger" and I'll do it.
```

## Rules

- **Run after every brain-sync.** Auto-triggered by `brain-sync-complete` event.
- **Don't just list — suggest.** Every blind spot comes with a row number and keyword hint.
- **Prioritize by importance.** Your own products first, then high-orchestra skills.
- **Update counts.** The `## Skill Auto-Discovery — Hot Trigger List (NON-NEGOTIABLE)` title includes "(NON-NEGOTIABLE)" — keep it.
