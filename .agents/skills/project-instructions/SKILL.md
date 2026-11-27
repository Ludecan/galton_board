---
name: project-instructions
description: How to create or fix a project's agent instructions file, `AGENTS.md`. Use when a repo has no `AGENTS.md` file, when it lacks a repo map, commands or search scope, when the user asks to set up or audit it, or when you write a project skill such as `code-conventions` or `experiment-profile`.
---

# Project instructions

The skills in this plugin read the repo's instructions file for the repo map, the commands and the search scope. Without that structure they cannot work. The file is the only place for the repo map: not a `docs/` file, not the README.

## Which file

- The instructions live in `AGENTS.md` at the repo root. All the content goes there.
- `CLAUDE.md` at the repo root holds only the line `@AGENTS.md`, so Claude Code reads the same text. It has no other content.
- If a repo has its instructions in `CLAUDE.md` or `.claude/CLAUDE.md`, move the content to the root `AGENTS.md`. Then make the root `CLAUDE.md` hold only the import line, and delete `.claude/CLAUDE.md`. An import resolves relative to the file that contains it, so a nested file must use `@../AGENTS.md`.
- Keep one source. Never copy the content into two files.

## Who owns what

The agent instructions of a project come in three layers. Each part owns one responsibility, and each responsibility is owned by one part only. Put a rule in the part that owns it, and nowhere else. When layers disagree, the narrower layer wins: project, then language, then core.

| Part | Layer | Lives in | Owns |
|---|---|---|---|
| `AGENTS.md` | project | the project repo | Project overview and stack, repo map, commands, search scope, gotchas. Loads on every turn. |
| `code-conventions` | project | the project's `.claude/skills/` | Project coding rules and exceptions to the core and language rules. |
| `experiment-profile` | project | the project's `.claude/skills/` | Experiment layout, metrics, comparison columns, promotion and domain pitfalls. |
| `engineering-core:project-instructions` | core | marketplace | The structure of `AGENTS.md` and the rules for project skills (this skill). |
| `engineering-core:planning` | core | marketplace | Multi-phase plans, the commit per phase and the proposal of PR slices. |
| `engineering-core:write-good-code` | core | marketplace | How to write any code: smallest change, scope while coding, style, tests, comments. |
| `engineering-core:review-changes` | core | marketplace | Code review of a change. |
| `engineering-core:make-prs` | core | marketplace | The PR flow: check the work with the user, split it into small PRs, open them. |
| `engineering-core:write-pr-description` | core | marketplace | The text of a PR description. |
| `engineering-core:write-simple-english` | core | marketplace | The English of all text the agent writes. |
| `engineering-core:human-review-helper` | core | marketplace | Walking a human through a large change. |
| `ml-experiments:experiment-tracking` | core | marketplace | The experiment procedure: records, naming, reproducibility, comparison, grid runs. |
| `python-dev:python-conventions` | language | marketplace | Python rules for every project that uses Python, including lint and tests after a change, dependencies and versioning. |
| `godot-dev:godot-conventions` | language | marketplace | Godot and GDScript rules for every project that uses Godot, including format, lint and tests after a change. |
| `html-dev:html-conventions` | language | marketplace | HTML, CSS and JavaScript rules for every project without a build step. |

The marketplace is the `Ludecan/skills-marketplace` repo. Its skills reach a project as a Claude Code plugin, or as copies in `.agents/skills/` made by its `install.sh`.

Change a shared skill only in the marketplace repo. Never edit a copy in `.agents/skills/` or the plugin cache: the next install overwrites it, and other projects never get the change. If a project needs a shared rule to be different, write the exception in its project skill. If the rule is wrong for every project, propose the change in the marketplace repo.

## Structure

Follow [the template](assets/AGENTS.template.md). Sections, in this order:

1. **Project overview**: what the repo does and its stack, in 3-6 lines.
2. **Repo map**: every directory and key file with one line on its role. Update it when the structure changes.
3. **Repo map updates**: the rule to update the map in its own final commit.
4. **Commands**: how to install, run, test and lint. Real commands only.
5. **Search scope**: directories and tools that are large or noisy, and how to exclude them.
6. **Gotchas**: project-specific pitfalls, quirks, or non-obvious behaviors that agents should be aware of, so they don't need to be rediscovered each time.

Additional sections are allowed, but these must exist.

## Rules

These rules hold for `AGENTS.md` and for every project skill (for example `code-conventions` or `experiment-profile`).

- Avoid redundant, duplicate or contradicting instructions. Write a fact only in the part that owns it (see "Who owns what"), and link to the owner from anywhere else.
- Never write a path that exists on one machine only, such as a home folder or a mounted disk. Name a shared location, or ask the user for one.
- Gotchas and pitfalls list only what still bites and what an agent would not assume. No history: not which change fixed a bug that is gone. When a fact stops being true, delete it.
- Write only what the agent cannot see from the code. No style rules that a linter enforces.
- Do not add sections that tell the agent to use `write-good-code`, `planning` or another skill: their descriptions already do that.
- Keep the file short. It loads on every turn, so a long map costs context each time. Trim detail that a directory listing shows.

## Setting up a repo

1. Read the repo: top-level tree, README, `pyproject.toml` or build files, the Makefile, CI config.
2. Fill the template from what you found. Ask the user only for what you cannot find, for example gotchas.
3. Check every path and command in it exists or runs.
4. Show the file to the user before committing it.
