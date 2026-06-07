#!/usr/bin/env node
// lens.cjs - Skill coverage auditor v1.1
// Cross-references installed skills vs hot-trigger list
// Generates coverage report + history tracking + optional auto-apply
//
// Usage:
//   node lens.cjs            # show report
//   node lens.cjs --apply    # auto-add top 10 blind spots to hot-trigger list
//   node lens.cjs --top N    # change number added (default 10)

const fs = require('fs');
const path = require('path');

const HOME = process.env.HOME;
const SKILLS_DIR = path.join(HOME, '.claude/skills');
const CLAUDE_MD = path.join(HOME, '.claude/CLAUDE.md');
const CACHE_DIR = path.join(HOME, '.claude/.cache');
const HISTORY_FILE = path.join(CACHE_DIR, 'skill-lens-history.json');
const BACKUP_DIR = path.join(CACHE_DIR, 'skill-lens-backups');

const args = process.argv.slice(2);
const APPLY_MODE = args.includes('--apply');
const topIdx = args.indexOf('--top');
const TOP_N = topIdx > -1 ? parseInt(args[topIdx + 1]) || 10 : 10;

// Step 1: Extract installed skills (real source of truth)
function getInstalledSkills() {
  if (!fs.existsSync(SKILLS_DIR)) return [];
  return fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter(e => (e.isDirectory() || e.isSymbolicLink()) && !e.name.startsWith('_') && !e.name.startsWith('.'))
    .filter(e => fs.existsSync(path.join(SKILLS_DIR, e.name, 'SKILL.md')))
    .map(e => e.name)
    .sort();
}

// Step 2: Extract hot-trigger list from CLAUDE.md
// Handles "**skill**" and "**skill-a / skill-b**" multi-skill rows
function getHotTriggerSkills() {
  if (!fs.existsSync(CLAUDE_MD)) return { skills: [], totalRows: 0 };
  const md = fs.readFileSync(CLAUDE_MD, 'utf8');

  const headerMatch = md.match(/\*\*If none of the (\d+) match/);
  if (!headerMatch) return { skills: [], totalRows: 0 };
  const totalRows = parseInt(headerMatch[1]);

  const start = md.indexOf('Hot Trigger List');
  const end = md.indexOf(`**If none of the ${totalRows} match`);
  if (start < 0 || end < 0) return { skills: [], totalRows };
  const section = md.substring(start, end);

  const skills = new Set();
  // Match **name** or **name-a / name-b**
  const re = /\*\*([a-z][a-z0-9_-]+)(?:\s*\/\s*([a-z][a-z0-9_-]+))?\*\*/g;
  let m;
  while ((m = re.exec(section)) !== null) {
    skills.add(m[1]);
    if (m[2]) skills.add(m[2]);
  }
  return { skills: [...skills].sort(), totalRows };
}

// Step 3: Three-set comparison
function compare(installed, hotSet) {
  return {
    covered: installed.filter(s => hotSet.has(s)),
    blind: installed.filter(s => !hotSet.has(s)),
    ghosts: [...hotSet].filter(s => !installed.includes(s))
  };
}

// Step 4: Priority score for blind spots (higher = more important)
function priorityScore(skill) {
  let score = 50;
  // User's own products
  const own = ['tool-eval','preflight','brain-sync','skill-lens','orchestra-intake','skill-creator','context-save','context-restore','codex'];
  if (own.includes(skill)) score += 40;
  // baoyu- high-frequency
  if (skill.startsWith('baoyu-')) score += 25;
  // gstack curated suite
  if (['browse','canary','careful','connect-chrome','make-pdf','codex'].includes(skill)) score += 15;
  return score;
}

// Step 5: Apply mode - add top N to CLAUDE.md
function applyChanges(blindSpots, topN, currentRows) {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const backup = path.join(BACKUP_DIR, `CLAUDE.md.${Date.now()}.bak`);
  fs.copyFileSync(CLAUDE_MD, backup);

  let md = fs.readFileSync(CLAUDE_MD, 'utf8');
  const top = blindSpots
    .map(s => ({ skill: s, score: priorityScore(s) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  // Generate new rows
  const newRows = top.map((item, i) => {
    const row = currentRows + i + 1;
    return `| ${row} | "${item.skill}" | **${item.skill}** | auto-added by skill-lens (priority ${item.score}) |`;
  }).join('\n');

  const insertPoint = md.indexOf(`**If none of the ${currentRows} match`);
  if (insertPoint < 0) return { error: 'insertion point not found' };

  md = md.substring(0, insertPoint) + newRows + '\n\n' + md.substring(insertPoint);

  const newCount = currentRows + top.length;
  md = md.replace(
    new RegExp(`\\*\\*If none of the ${currentRows} match\\*\\*`),
    `**If none of the ${newCount} match**`
  );

  fs.writeFileSync(CLAUDE_MD, md);
  return { backup, added: top.length, newCount, addedSkills: top.map(t => t.skill) };
}

// Step 6: History tracking
function saveHistory(coverage, total, covered) {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
  let history = [];
  if (fs.existsSync(HISTORY_FILE)) {
    try { history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8')); } catch (_) {}
  }
  const last = history[history.length - 1];
  const delta = last ? parseFloat((coverage - last.coverage).toFixed(2)) : null;
  const entry = {
    date: new Date().toISOString().split('T')[0],
    timestamp: Date.now(),
    total,
    covered,
    coverage: parseFloat(coverage.toFixed(2)),
    delta
  };
  history.push(entry);
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  return delta;
}

// Main
function main() {
  const installed = getInstalledSkills();
  const { skills: hot, totalRows } = getHotTriggerSkills();
  const hotSet = new Set(hot);
  const { covered, blind, ghosts } = compare(installed, hotSet);

  const total = installed.length;
  const coverage = total > 0 ? (covered.length / total * 100) : 0;
  const delta = saveHistory(coverage, total, covered.length);

  console.log(`## Skill Lens Report — ${new Date().toISOString().split('T')[0]}\n`);
  const deltaStr = delta !== null ? ` ${delta > 0 ? '↑' : delta < 0 ? '↓' : '±'} ${Math.abs(delta)}% vs last run` : ' (first run)';
  console.log(`📊 **Coverage: ${coverage.toFixed(1)}% (${covered.length}/${total})**${deltaStr}\n`);
  console.log(`✅ Covered:   ${covered.length} skills`);
  console.log(`⚠️  Blind:    ${blind.length} skills (installed but NOT auto-invoked)`);
  console.log(`👻 Ghosts:    ${ghosts.length} skills (in hot list but NOT installed)\n`);

  if (blind.length > 0) {
    console.log(`### ⚠️ Top ${Math.min(TOP_N, blind.length)} Blind Spots (by priority)\n`);
    const top = blind
      .map(s => ({ skill: s, score: priorityScore(s) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_N);
    top.forEach((item, i) => {
      console.log(`${String(i+1).padStart(2)}. **${item.skill}** (priority ${item.score})`);
    });
    console.log();
  }

  if (APPLY_MODE) {
    if (blind.length === 0) {
      console.log('✅ No blind spots, nothing to apply.\n');
    } else {
      console.log(`🚀 APPLY MODE: Adding top ${TOP_N} to CLAUDE.md hot-trigger list (${totalRows} → ${totalRows + Math.min(TOP_N, blind.length)})\n`);
      const result = applyChanges(blind, TOP_N, totalRows);
      if (result.error) {
        console.error(`❌ Apply failed: ${result.error}\n`);
      } else {
        console.log(`✅ Added ${result.added} skills to hot-trigger list`);
        console.log(`📦 Backup: ${result.backup}\n`);
        console.log(`Added: ${result.addedSkills.join(', ')}`);
      }
    }
  } else if (blind.length > 0) {
    console.log(`👉 Run with --apply to auto-add top ${TOP_N} to hot-trigger list.`);
    console.log(`   Or --apply --top N to change the number.\n`);
  }
}

main();
