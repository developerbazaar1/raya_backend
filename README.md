# Contributing Guide

Welcome! This document explains how we work with Git in this project. **Please read this end-to-end before pushing your first commit.** Following these rules keeps our codebase clean, our deployments safe, and our teammates unblocked.

---

## Table of Contents

1. [Branch Structure](#branch-structure)
2. [Golden Rules](#golden-rules)
3. [Starting a New Feature](#starting-a-new-feature)
4. [Daily Workflow](#daily-workflow)
5. [Opening a Pull Request](#opening-a-pull-request)
6. [Keeping Your Branch in Sync](#keeping-your-branch-in-sync)
7. [Handling Merge Conflicts](#handling-merge-conflicts)
8. [Branch Naming Convention](#branch-naming-convention)
9. [Commit Message Convention](#commit-message-convention)
10. [Hotfixes (Production Emergencies)](#hotfixes-production-emergencies)
11. [Releases (Staging → Production)](#releases-staging--production)
12. [Common Scenarios](#common-scenarios)
13. [Cheat Sheet](#cheat-sheet)

---

## Branch Structure

We use a three-tier branching model:

```
main          →  production code (deployed to api.tryswann.com)
  ↑
staging       →  pre-production (deployed to staging-api.tryswann.com)
  ↑
feature/*     →  your work-in-progress branches
```

**What each branch is for:**

| Branch | Purpose | Who can push? |
|---|---|---|
| `main` | Live production code. Mirrors what's running on prod. | Nobody directly — only via PR from `staging` |
| `staging` | Pre-release. All features land here for testing. | Nobody directly — only via PR from feature branches |
| `feature/*` | Your work in progress. | You |
| `hotfix/*` | Urgent production fixes. | The person fixing the bug |

---

## Golden Rules

These are non-negotiable. Branch protection enforces most of them automatically.

1. **Never push directly to `main` or `staging`.** Always go through a Pull Request.
2. **Always branch from `staging`** (except hotfixes, which branch from `main`).
3. **Always rebase on `staging` before opening a PR.** Your branch must be up-to-date.
4. **One feature = one branch = one PR.** Don't bundle unrelated work.
5. **Keep PRs small.** Under ~400 lines is ideal. Split large work into multiple PRs.
6. **Never force-push to shared branches** (`main`, `staging`). Use `--force-with-lease` only on your own feature branches.
7. **Delete your branch after merge.** Keep the repo tidy.

---

## Starting a New Feature

Before writing any code, sync `staging` and create a new branch from it:

```bash
# 1. Switch to staging and pull the latest
git checkout staging
git pull origin staging

# 2. Create your feature branch from staging
git checkout -b feature/your-feature-name

# 3. Push it to GitHub so others can see it
git push -u origin feature/your-feature-name
```

You now have a fresh branch based on the latest staging. Start coding.

---

## Daily Workflow

While working on your feature:

```bash
# Commit often with clear messages
git add .
git commit -m "feat(auth): add JWT validation middleware"

# Push to your remote branch regularly (at least once a day)
git push origin feature/your-feature-name
```

**Sync with `staging` daily** — even if you're not ready to open a PR. This catches conflicts early when they're small:

```bash
git fetch origin
git rebase origin/staging
git push origin feature/your-feature-name --force-with-lease
```

---

## Opening a Pull Request

When your feature is ready:

### 1. Rebase on the latest `staging`

```bash
git checkout staging
git pull origin staging

git checkout feature/your-feature-name
git rebase staging
```

If there are conflicts, [resolve them](#handling-merge-conflicts).

### 2. Push your rebased branch

```bash
git push origin feature/your-feature-name --force-with-lease
```

> ⚠️ **Use `--force-with-lease`, never `--force`.** It prevents you from accidentally overwriting someone else's work.

### 3. Open the PR on GitHub

- **Base branch:** `staging`
- **Compare branch:** `feature/your-feature-name`
- Fill out the PR template completely
- Link related tickets/issues
- Request review from a teammate (or CODEOWNERS will auto-assign)

### 4. Wait for CI and review

- All CI checks must pass (green ✅)
- At least 1 approving review required
- Address all review comments before merging

### 5. Merge using **Squash and Merge**

This keeps `staging`'s history clean — one PR = one commit. After merge, **delete the branch** (GitHub will offer a button).

---

## Keeping Your Branch in Sync

### When `staging` moves ahead while you're working

This happens constantly when multiple people are merging features. Here's how to stay current:

```bash
# Fetch latest from remote
git fetch origin

# Rebase your branch on top of latest staging
git rebase origin/staging

# If conflicts, resolve them, then continue
git add <resolved-files>
git rebase --continue

# Push your updated branch
git push origin feature/your-feature-name --force-with-lease
```

### Why we rebase instead of merge

| Approach | Result |
|---|---|
| `git merge staging` | Adds a "Merge branch 'staging'" commit. History gets cluttered. |
| `git rebase staging` ✅ | Replays your commits cleanly on top of latest staging. Linear, easy-to-read history. |

We use **rebase + squash merge** so every PR shows as a single clean commit on `staging`.

### Do I need to pull `main` locally?

**Almost never.** `main` is only updated during releases (via PR from `staging`). Since `staging` is always ahead of or equal to `main`, syncing `staging` is enough.

The only times you need `main` locally:
- Creating a hotfix
- Investigating a production-only bug
- Performing a release

---

## Handling Merge Conflicts

Conflicts happen. Here's how to deal with them:

### During a rebase

```bash
git rebase staging
# Git pauses and tells you which files have conflicts
```

1. Open each conflicted file. You'll see markers like:
   ```
   <<<<<<< HEAD
   their code (from staging)
   =======
   your code (from your feature branch)
   >>>>>>> your-commit-hash
   ```
2. Edit the file to keep what should stay. Remove the `<<<<<<<`, `=======`, `>>>>>>>` markers.
3. Mark the file as resolved:
   ```bash
   git add path/to/conflicted-file.js
   ```
4. Continue the rebase:
   ```bash
   git rebase --continue
   ```
5. Repeat for each conflicted commit until rebase finishes.

### If things go wrong

Abort and start over:

```bash
git rebase --abort
```

This restores your branch to the state it was in before you started the rebase. No harm done.

### When in doubt, ask

If a conflict involves code you don't fully understand, **ping the original author on Slack before resolving**. It's better to ask than to silently break someone else's feature.

---

## Branch Naming Convention

Use descriptive, lowercase, hyphenated names with a type prefix:

| Prefix | When to use | Example |
|---|---|---|
| `feature/` | New functionality | `feature/user-profile-page` |
| `bugfix/` | Non-urgent bug fix | `bugfix/login-button-alignment` |
| `hotfix/` | Urgent production fix | `hotfix/payment-gateway-crash` |
| `chore/` | Maintenance, deps, tooling | `chore/upgrade-node-20` |
| `refactor/` | Refactor with no behavior change | `refactor/auth-service` |
| `docs/` | Documentation only | `docs/api-endpoints` |

**Optional:** include the ticket ID: `feature/PROJ-123-user-profile-page`

---

## Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional longer body]

[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples:**

```
feat(auth): add JWT refresh token endpoint
fix(profile): handle null avatar URL crash
docs(readme): update setup instructions
refactor(payments): extract Stripe client into service
chore(deps): bump express from 4.18 to 4.19
```

**Why this matters:** Conventional commits make it easy to auto-generate changelogs and understand history at a glance.

---

## Hotfixes (Production Emergencies)

When production has a critical bug that can't wait for the next release:

### 1. Branch from `main` (NOT staging)

```bash
git checkout main
git pull origin main
git checkout -b hotfix/short-description
```

### 2. Fix, commit, push

```bash
# Make your fix
git add .
git commit -m "fix: brief description of the fix"
git push origin hotfix/short-description
```

### 3. Open TWO Pull Requests

Both PRs are mandatory:

- **PR #1:** `hotfix/short-description → main` (gets the fix to production fast)
- **PR #2:** `hotfix/short-description → staging` (keeps staging in sync so the fix isn't lost on next release)

> ⚠️ **Always open both PRs.** Forgetting the staging PR means the bug will reappear next time we release.

### 4. After both are merged

Delete the hotfix branch. Tag the production release (release manager handles this).

---

## Releases (Staging → Production)

Only the **release manager** performs releases. Standard process:

1. Verify staging is stable (all tests passing, manual QA done)
2. Open a PR: `staging → main`
3. Title: `Release v1.X.0`
4. Get required approvals
5. Squash-merge to `main` — CI/CD auto-deploys to production
6. Tag the release:
   ```bash
   git checkout main
   git pull origin main
   git tag -a v1.X.0 -m "Release v1.X.0: short description"
   git push origin v1.X.0
   ```

---

## Common Scenarios

### Scenario 1: Two people are working on different features

**John** is on `feature/auth`. **Doe** is on `feature/profile`. Both branched from `staging` at the same time.

- John finishes first, opens PR, merges to `staging` ✅
- Doe is still working. Before opening his PR, Doe must rebase:
  ```bash
  git fetch origin
  git checkout feature/profile
  git rebase origin/staging   # picks up John's auth changes
  git push origin feature/profile --force-with-lease
  ```
- Doe opens PR. CI runs against `staging` + Doe's code combined. If everything passes, Doe merges. ✅

### Scenario 2: Your PR is approved but `staging` moved forward

GitHub will show a yellow warning: **"This branch is out-of-date with the base branch."**

Two options:
1. **Click the "Update branch" button** on the PR (simple, creates a merge commit — fine if your team uses squash-merge anyway, since the merge commit disappears on squash)
2. **Rebase locally** (cleaner):
   ```bash
   git fetch origin
   git rebase origin/staging
   git push origin feature/your-branch --force-with-lease
   ```

CI re-runs after either. Once green, merge.

### Scenario 3: You accidentally committed to `staging` or `main` locally

Don't push. Move your commits to a new branch:

```bash
# You're on staging with accidental commits
git branch feature/oops-recover    # save your commits to a new branch
git reset --hard origin/staging    # reset staging back to remote
git checkout feature/oops-recover  # continue working here
```

### Scenario 4: You need to abandon a PR

Close the PR on GitHub with a comment explaining why. Delete the branch:

```bash
git push origin --delete feature/abandoned-branch
git branch -D feature/abandoned-branch    # delete local copy
```

### Scenario 5: A hotfix to main hasn't been merged to staging yet

You're working on a feature, you rebase on staging, but the hotfix isn't there. **This shouldn't happen** — the hotfix workflow requires a second PR to staging. If you notice it's missing, ping the person who did the hotfix to open the staging PR.

---

## Cheat Sheet

Pin this somewhere visible:

```bash
# === START A NEW FEATURE ===
git checkout staging && git pull origin staging
git checkout -b feature/my-thing
git push -u origin feature/my-thing

# === DAILY SYNC (do this every morning) ===
git fetch origin
git rebase origin/staging
git push origin feature/my-thing --force-with-lease

# === BEFORE OPENING A PR ===
git fetch origin
git rebase origin/staging
# resolve any conflicts, then:
git push origin feature/my-thing --force-with-lease
# Open PR on GitHub: base = staging

# === RESOLVING CONFLICTS DURING REBASE ===
# 1. Edit conflicted files (remove <<<<<<< ======= >>>>>>> markers)
git add <fixed-files>
git rebase --continue
# OR to give up:
git rebase --abort

# === HOTFIX ===
git checkout main && git pull origin main
git checkout -b hotfix/fix-name
# fix, commit, push
git push -u origin hotfix/fix-name
# Open TWO PRs: one to main, one to staging

# === AFTER YOUR PR IS MERGED ===
git checkout staging
git pull origin staging
git branch -d feature/my-thing            # delete local
git push origin --delete feature/my-thing # delete remote
```

---

## Branch Protection Rules (Active)

The following rules are enforced automatically by GitHub:

**On `main` and `staging`:**
- ✅ Pull request required before merging
- ✅ At least 1 approving review required
- ✅ All CI status checks must pass
- ✅ Branch must be up-to-date with base before merging
- ✅ Conversation resolution required
- ✅ Linear history required (squash merges only)
- ✅ Force pushes blocked
- ✅ Branch deletion blocked

**Additional rules on `main`:**
- ✅ Only release manager can merge

---

## Questions?

If anything in this guide is unclear or you run into a Git situation not covered here, ask in **#dev-help** before you do something you might regret. Git is forgiving if you ask first, unforgiving if you force-push after.

Happy shipping! 🚀