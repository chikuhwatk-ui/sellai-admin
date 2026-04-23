# Sellai ops — one-time setup Chiku must do

Most of the controls I've added are automated (CLAUDE.md, pre-push hooks,
GitHub Actions, PR templates, changelogs, cross-client lint script).
**Five things** require a human — you — to click or run a command once
per repo. This doc walks through them.

If any step is unclear, paste its heading to a Claude session and ask.

## Repos this applies to
- `mobile-native` (this repo)
- `backend`
- `admin`
- `sellai-business`

Do each step in **all four**. It takes ~15 minutes total.

---

## 1. Enable the pre-push hook (per clone, 5 sec)

In each repo, run this **once**:
```sh
git config core.hooksPath .githooks
```
That tells git to use the hooks committed in the repo (which run `tsc`
before every push). You'll know it's working because `git push` prints
`[pre-push] Running tsc --noEmit...`

If you ever clone the repo fresh on a new laptop, run this command again
on that laptop.

---

## 2. Turn on branch protection on GitHub (per repo, 2 min)

In the GitHub web UI for each repo:

1. **Settings → Branches → Add branch protection rule**.
2. Branch name pattern: `main`.
3. Enable:
   - [x] Require a pull request before merging
   - [x] Require status checks to pass (pick `Typecheck` / `CI` once it
         has run at least once)
   - [x] Require branches to be up to date before merging
   - [x] Do not allow bypassing the above settings
   - [x] Restrict who can push (set to you + anyone you explicitly trust)
   - [x] **Do not allow force pushes**
   - [x] **Do not allow deletions**

This prevents future rewrites of main like the April 11 incident.

---

## 3. Add a mirror remote (per repo, 5 min)

A mirror is a second GitHub remote that gets every push. If the primary
ever gets nuked, the mirror has a full copy.

Pick a second host — a second GitHub account, GitLab, or Codeberg, all
free. Create an empty repo there called `sellai-<name>-mirror`, then in
each local clone:
```sh
git remote add mirror <the-ssh-or-https-url>
git push mirror --all
git push mirror --tags
```

To keep it in sync automatically, add this line to `.git/hooks/post-push`
or just run this at end-of-day:
```sh
git push mirror --all && git push mirror --tags
```

(Optional upgrade, later: GitHub Actions workflow that syncs on every
push to main.)

---

## 4. Schedule a local "uncommitted-work check" (per laptop, 5 min)

GitHub can't see your laptop's stash or working tree. This is the gap
that caused April 11. Schedule a daily check.

### Windows (Task Scheduler, 1x per laptop)
Open Task Scheduler → Create Task:
- Trigger: daily at 17:30 (or whenever you stop coding).
- Action: `powershell.exe` with arguments:
  ```
  -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem C:\Users\chiku\Downloads\Sellai_v5 -Directory | ForEach-Object { cd $_.FullName; if (Test-Path .git) { Write-Host ('=== ' + $_.Name + ' ==='); git status --short; git stash list } }"
  ```
- Run whether logged in or not: no (so it only fires when you're using
  the laptop).
- On firing, it'll pop a terminal showing modified files + stash entries
  across all 4 repos. 10 seconds to read. If anything shows, commit + push
  before you close the laptop.

### macOS / Linux
Add to crontab (`crontab -e`):
```
30 17 * * * for d in ~/Sellai_v5/*/; do cd "$d"; [ -d .git ] && echo "=== $d ===" && git status --short && git stash list; done | tee ~/sellai-eod.log
```
Check the log at `~/sellai-eod.log` before closing the laptop.

---

## 5. Schedule a weekly Friday Claude session (calendar, 2 min)

Create a recurring 30-minute calendar event **Friday 16:00**:

**Friday Claude session — Sellai health check**

Do these in order:
1. Open each of the 4 repos in Claude Code.
2. Paste: "Run a 5-minute health check — `git status`, `git stash list`,
   `git log origin/main..HEAD`, recent GitHub Actions failures, any open
   stale-branch issues. Summarize in plain English."
3. Clear anything that needs clearing.
4. Write a one-paragraph update to yourself of what shipped this week
   (copy from CHANGELOGs is fine).

This is the single most important control. Even if everything else
lapses, a weekly human review catches drift.

---

## What good looks like after setup
- Pushing broken TS is impossible (hook blocks it, CI blocks the merge).
- `main` cannot be rewritten or deleted (branch protection).
- A second copy of every commit exists on the mirror.
- Every evening, a window tells you if anything is stuck on your laptop.
- Every Friday, you do a 30-minute review with Claude.

No single control catches everything. The layering is the point.
