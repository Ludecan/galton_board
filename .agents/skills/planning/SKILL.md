---
name: planning
description: Multi-phase implementation planning workflow. Use before you write code for any complex feature that needs a structured plan - multi-file work, cross-module behavior changes, data schema/interface changes, or anything likely to need 3+ commits.
---

# Applicability: Choose Planning Mode First

Use this file in one of two modes:

- **Full Planning Mode (mandatory):** Use for complex or multi-phase work.
  Use this mode when at least one is true:
  - Multi-file feature work
  - Cross-module behavior changes
  - Data schema/interface changes
  - Work likely to require 3+ commits
- **Fast Path (allowed):** Use for small, low-risk tasks.
  Typical examples:
  - Single-file bugfix
  - Docs-only edit
  - Small test-only update

Fast Path flow:
1. Clarify request and success criteria
2. Implement directly with minimal change
3. Run targeted verification
4. Summarize what changed and why

If task scope expands during Fast Path execution, immediately switch to Full Planning Mode before continuing.

# 1. Analyze the Request and Clarify Before Researching
Understand the user's request and determine success criteria. 
If the task is ambiguous, under-specified, or has more than one reasonable interpretation,
ask the user clarifying questions BEFORE researching. Surface things like:
- Scope boundaries (what is in / out of this task)
- Target data formats or interfaces if unclear
- Success criteria (what does "done" look like)
- Any constraints not stated explicitly (performance, compatibility, deadlines)

Only proceed to research once the task is concrete enough to write a focused brief.
Do not invent assumptions to avoid asking - a clarifying question is cheaper than a wrong plan.

# 2. Research
Research the existing codebase with a clear research brief:
- What patterns and utilities already exist in the codebase, check the repo map in `AGENTS.md`.
- What data formats, file structures, or schemas are relevant
- What conventions (naming, testing, logging) are already established
- Any related prior code for the specific problem

# 3. Draft a Plan
Based on research findings, write a multi-phase plan (3-10 phases) following the `<plan_style_guide>` below.

Each phase must:
- Have a single, focused objective
- Follow TDD: write failing tests → write minimal code → confirm tests pass
- Be independently committable

# 4. Present Plan and Pause for Approval
Share the plan synopsis in chat. Highlight open questions or design choices.

**MANDATORY STOP** - wait for the user to approve or revise the plan before proceeding.

# 5. Write Plan File
Once approved, write the plan to `plans/<YYYYMMDD_HHMM>_<task-name>-plan.md`. Get the timestamp from `date +%Y%m%d_%H%M` so plans sort by creation time.

`plans/` is part of the repo. Commit the plan file in the first commit of the branch, so the plan is reviewed with the work and a reviewer or agent can read it later.

# 6. Execute Phases (repeat per phase)

For each phase:

## 6.1 Execution
Execute the task considering:
- The specific phase objective
- Relevant files and functions identified by the research step
- The tests to write (from the plan)
- Any constraints (e.g., "match the existing API/dataclasses", "use pytest fixtures already in conftest.py")
- Follow strict TDD and report back with a phase summary

## 6.2 Verification
After execution completion, verify success considering:
- The phase objective
- Expected test outcomes
- Review uncommitted changes and return one of: `APPROVED` / `NEEDS_REVISION` / `FAILED`

## 6.3 Handle verification results
- `APPROVED` → proceed to commit step
- `NEEDS_REVISION` → use verification feedback and go back to execution step for a revision pass; re-verify after
- `FAILED` → **MANDATORY STOP**, present the failure to the user and ask for guidance

## 6.4 Commit
Generate a git commit message following `<git_commit_style_guide>` and **present it in chat**.
**MANDATORY STOP** - user makes the commit and confirms readiness to continue.

**Do not skip this step.** A phase is not finished - and you must not describe
it as "complete", summarize it, or ask about the next phase - until the
commit message for it has been generated and shown in the same response as
the phase summary. Passing tests and a clean lint are necessary but not
sufficient; the commit message is a required deliverable of every phase,
not an optional extra you provide only if asked.

# 7. Final Report
First, if the plan no longer matches what you built, update its phases and commit the plan file. Keep the goal text as it was approved, so the goal can be checked against the result. Then, when all phases are complete, summarize the overall result in chat, including:
- Overall summary of what was built and why
- All phases completed (checklist)
- Full list of files modified/created
- Key functions/classes added
- Test coverage summary
- Unrelated bugs and cleanups recorded during execution
- Recommended next steps

# 8. Update Repo Map
The repo map lives in `AGENTS.md`. After all code and docs changes are complete, review whether repository structure or ownership has changed. Update the map only if it materially changed, in its own final commit so it does not hide the real change. If the repo has no map in its instructions file, tell the user and point them to the `project-instructions` skill.

Include updates such as:
- New top-level directories or important modules introduced by the task
- Moved, renamed, or removed key paths
- Any shift in the canonical location of major workflows or entry points

If no Repo-map changes are needed, explicitly state that in the final chat summary.

---

<plan_style_guide>

File name: `plans/<YYYYMMDD_HHMM>_<task-name>-plan.md` (timestamp, then the task name in kebab-case)

```
## Plan: {Task Title (2-10 words)}

{TL;DR - what is being built, why, and how it fits the codebase. 2-4 sentences.}
**Phases ({3-10})**

1. **Phase {N}: {Phase Title}**
   - **Objective:** {Single clear goal for this phase}
   - **Files/Functions to Modify/Create:** {List}
   - **Tests to Write:** {Specific test names or descriptions}
   - **Steps:**
     1. Write failing tests for {behaviour}
     2. Run tests - confirm they fail
     3. Implement {minimal code}
     4. Run tests - confirm they pass
     5. Lint / format

**Open Questions ({1-5})**
1. {Clarifying question? Option A / Option B}
```

Rules:
- No code blocks in the plan file - describe changes in prose and reference file paths
- No manual testing or validation steps unless explicitly requested by the user
- Each phase should touch 1-3 files maximum
- TDD red/green cycle must be contained within a single phase (no spanning phases)

</plan_style_guide>

<git_commit_style_guide>

Format: `<type>(<scope>): <short description>`

Types: `feat`, `fix`, `test`, `refactor`, `chore`, `docs`
Scope: module or subsystem (e.g., `annotation-parser`, `frame-matcher`, `eval`, `training`)

Body: 2-4 bullet points describing what changed and why.

Example:
```
feat(annotation-parser): add CVAT XML frame extraction

- Parse <image> tags to extract frame_id and label metadata
- Match frame_id against detection outputs by timestamp offset
- Add unit tests covering missing frames and duplicate annotations
```

</git_commit_style_guide>

---

## Constraints
- In Full Planning Mode, you NEVER skip the plan approval pause
- In Full Planning Mode, you keep commit pauses at real phase boundaries; do not create extra stop points for trivial follow-up edits that are still part of the same phase
- In Full Planning Mode, you do not start execution without a research pass first
- In Full Planning Mode, you do not fix unrelated bugs during execution. Record them in the final report and tell the user
- In Full Planning Mode, you NEVER end a phase turn without presenting that phase's commit message - a phase summary without one is incomplete, not just terse
- In Fast Path, you must still clarify scope and run targeted verification
