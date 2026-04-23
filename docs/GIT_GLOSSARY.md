# Git glossary (for a non-technical founder)

Every git term Chiku is likely to hit, in plain English. Kept short on
purpose — the goal is recognition, not expertise.

## The four places your code can live
| Place | What it means | When to worry |
| --- | --- | --- |
| **Working tree** | The files on your disk right now. | Change not yet captured anywhere. Losing the folder loses the change. |
| **Stash** | A temporary pocket on your local machine. Nothing in it is on GitHub. | April 11 lived here for 3 months. Check regularly: `git stash list`. |
| **Local branch** | A named snapshot sequence on your machine only. | Not on GitHub until you `git push`. |
| **Remote branch** | A named snapshot sequence on GitHub. | Safer than local. Still gone if the GitHub repo is deleted — use the mirror. |

## Verbs
- **commit** — save a snapshot with a message. Does not touch GitHub.
- **push** — send your local commits to GitHub.
- **pull** — download GitHub's commits onto your local branch.
- **fetch** — download GitHub's commits but don't merge them in yet.
- **merge** — combine two branches into one.
- **rebase** — replay your commits on top of another branch. Rewrites
  history; risky on shared branches.
- **reset** — move your branch pointer. `--hard` throws away work that
  isn't committed somewhere safe. Always stash or commit first.
- **revert** — create a new commit that undoes an old one. Safe.
- **cherry-pick** — copy one specific commit from branch A onto branch B.
- **stash** — shove uncommitted changes into a pocket. `pop` takes them
  back out.
- **rewind / force-push** — overwrite GitHub history. **Dangerous.** Only
  do this if you're 100% sure and have a mirror.

## Statuses you'll see
- **untracked** — file git has never seen.
- **modified** — file git knows about, you changed it.
- **staged** — change queued to go into the next commit.
- **ahead N** — your branch has N commits GitHub doesn't have yet
  (i.e., not pushed).
- **behind N** — GitHub has N commits your branch doesn't have.
- **detached HEAD** — you are looking at a commit, not a branch. Nothing
  you commit here has a name. Before doing anything, make a branch:
  `git switch -c rescue/YYYY-MM-DD`.

## The three scariest commands (and what they really do)
1. `git reset --hard <something>` — moves your branch to `<something>`
   and **throws away every uncommitted change**. If you stashed first,
   you can get them back with `git stash pop`.
2. `git push --force` (or `--force-with-lease`) — overwrites GitHub with
   your local version. If teammates had commits, they're gone.
3. `git clean -fd` — deletes every untracked file. Useful for clearing
   generated output; brutal if you forgot a file was untracked.

## What to do when something feels wrong
1. **STOP.** Do not close the terminal. Do not delete the folder.
2. Run `git status`, `git stash list`, and `git reflog` and paste the
   output into the Claude session, or into `ROLLBACK_PLAYBOOK.md`
   instructions.
3. `git reflog` is a time machine for your local repo — every HEAD
   movement in the last ~90 days, even after a hard reset. If it's in
   reflog, it's recoverable.

## Healthy-week signals
- `git status` clean on every repo at end of day.
- `git stash list` empty (or intentionally short and labeled).
- GitHub shows no branch older than 14 days with unmerged commits
  (the stale-branch GitHub Action opens an issue if so).
