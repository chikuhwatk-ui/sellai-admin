# Rollback playbook

You hit a bad state. Follow these steps **in order** — don't skip ahead.
Every step is reversible until the very last one.

## Rule 0: Do not delete. Do not `git reset --hard`. Do not close the terminal.

Everything below assumes you have your local clone and a terminal. Those
two things are the recovery material. Treat them as precious until this
playbook says otherwise.

---

## Scenario A — "I think I lost work"

### A1. See what's there
```sh
git status
git stash list
git log --oneline -20
git reflog | head -40
```
Paste all four outputs into a Claude session, or read them yourself.

### A2. Check the stash
If `git stash list` has entries, **do not discard**. Try:
```sh
git stash show -p stash@{0}   # preview the top stash
git stash show -p stash@{1}   # preview the next one, etc.
```
If the diff looks like your missing work:
```sh
git stash apply stash@{0}     # apply without removing
```
`apply` is safer than `pop` — the stash entry survives even if the
apply fails mid-way.

### A3. Use the reflog
`git reflog` shows every HEAD movement. A rewound main still shows up
here. To recover commit `abc1234`:
```sh
git branch rescue/abc1234 abc1234
git switch rescue/abc1234
```
Push it to GitHub immediately so it's not just on your laptop:
```sh
git push -u origin rescue/abc1234
```

---

## Scenario B — "`main` on GitHub was rewound"

### B1. Do not pull. Pulling merges their broken state into yours.
Your local clone probably still has the old main as a ref. Check:
```sh
git fetch
git log --oneline origin/main -10
git reflog origin/main | head -20
```

### B2. Recover the old main
```sh
git switch -c restore/main-YYYY-MM-DD <old-sha>
git push -u origin restore/main-YYYY-MM-DD
```
Now the old main exists on GitHub as a named branch. Nothing is lost.

### B3. Decide what main should be
Open a PR from `restore/main-YYYY-MM-DD` to `main` so the contents are
reviewable. Do NOT force-push main back yourself — use a PR, even if
it's a "PR of one" that you merge immediately.

---

## Scenario C — "The push was rejected as non-fast-forward"

Someone else pushed while you worked. Do NOT use `--force`.
```sh
git fetch origin
git rebase origin/main   # or: git merge origin/main
git push
```
If rebase gets stuck, `git rebase --abort` puts you back where you were.

---

## Scenario D — "I pushed secrets (token, key, password)"

1. **Rotate the secret immediately.** Deleting the commit does NOT
   invalidate the credential — GitHub indexes show up fast.
2. Revoke and reissue the key on the provider side (Firebase, Google,
   Stripe, etc.).
3. Only after rotation, scrub git history with `git filter-repo` or
   BFG. This is a destructive rewrite — take a mirror first (see
   `SELLAI_OPS.md`).

---

## Scenario E — "I don't know which client I just broke"

See `CLAUDE.md` → "Know which client you're in". If a backend change
broke something:
```sh
cd ../backend
bash scripts/lint-cross-client.sh <the-route>
```
That tells you which client(s) still call the route you changed.

---

## Last resort: the mirror

If the GitHub repo is gone, corrupted, or rewritten and you can't
recover from your clone — restore from the mirror (setup in
`SELLAI_OPS.md`). A mirror is a second remote that gets every push. It
exists specifically for this scenario.
