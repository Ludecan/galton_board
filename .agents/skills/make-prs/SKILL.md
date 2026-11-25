---
name: make-prs
description: Turn finished work into pull requests (PRs). Use when the work is done and the user wants a PR, or asks to split, push or open PRs, and before you run `gh pr create`.
---

# Make PRs

Follow the steps in order. Each step that asks the user waits for the answer. Do not answer for the user.

## Step 1: Inputs

- The current branch, and the target branch the work merges into (usually `main`).
- The plan file of this work, if there is one. Find it with `git log --diff-filter=A --name-only --format= <target>..HEAD -- plans/`, which lists the plan files that this branch adds. Do not use a plan file that the target branch already has. If there is no plan, ask the user to confirm that.

Ask the user for what you cannot find. Do not guess.

## Step 2: Check the work with the user

Talk with the user about two questions before you split or write anything.

1. **Is the goal met?** Read the goal in the plan, or infer it from the conversation if there is no plan. Give a short list: each goal item, and the evidence in the diff or the tests that meets it. Say plainly which items are not met or not proven.
2. **Is the design good, and can it be better?** Name the design decisions in the diff that the user should look at, and say how each one follows or breaks the rules in `write-good-code` and the repo's `code-conventions`: for example the module that owns the new code, a new abstraction, a new dependency, or an error path that fails quietly. Say what you would change.

If the user finds a gap, fix it now, or keep it as a known limit for the PR description.

## Step 3: Split the work into small, focused PRs

Reviewers must be able to read a PR in one sitting, and get its intent from a diagonal read of its description.

- One PR does one thing, and it stands alone: it can merge by itself, tests pass, and the codebase stays consistent. It either adds useful behavior or is a no-op preparation (for example, a refactor).
- Split only along those lines. Steps that only work together stay in one PR. For example, "add function `f`", "switch callers to `f`" and "remove old `g`" are one PR. Intermediate phases are commits inside a PR, not separate PRs.
- Put fixes, refactors, renames and formatting in their own PR, ahead of the behavior change, branched from the target branch so they can merge first. If a fix cannot be separated cleanly, say so in the PR description.
- Each bug or cleanup outside the task that was recorded during the work is its own slice.
- Run `git diff --stat <target>` and check that every changed file traces to the task. Revert or split out the rest.
- Count the size with [the line counter](assets/count_changed_lines.py): `python3 <skill folder>/assets/count_changed_lines.py <target> [HEAD]`. It counts added and deleted lines without tests and generated files. Over about 500 lines, look for a split that follows the rules above. If there is none, keep one PR and give it a specific "How to verify", because the reviewer cannot read it all.

Propose the slices. For each slice, give:

- A title and the commits or files it contains.
- What it depends on. Keep slices independent where possible. Stack a slice on another one only when it needs it.
- The changed line count.

One PR that needs no split is also a proposal. **Stop and wait** for the user to approve or change the slices. Do not create a branch or a PR before then.

## Step 4: Write the descriptions

Write the description of each PR with the `write-pr-description` skill. Give it the branch, the target branch, the plan and the known limits from Step 2. Iterate with the user until they accept it.

## Step 5: Open the PRs

1. Ask the user before you push. Then create one branch per slice. A slice that depends on another one branches from it, and its PR targets that branch. The others branch from the target branch.
2. Push each branch and open its PR: `gh pr create --base <target> --head <branch> --title "<title>" --body-file <file>`.
3. The Review order links of the description need the PR number. After you open the PR, set each link to `https://github.com/<owner>/<repo>/pull/<number>/files#diff-<sha256 of the file path>`, and update the body with `gh pr edit <number> --body-file <file>`.
4. Give the user the URL of each PR. For a stack, say the order in which they merge.
