---
name: write-pr-description
description: Write or update the description of a pull request (PR). Use when the user asks for a PR description or message, and from `make-prs` for each PR it opens.
---

# Write Pull Request (PR) description

## Objective

A new contribution has just been completed. A PR will be opened for this contribution. You are going to create a markdown-formatted text to be used as the description for this PR.
A human reviewer is going to read this text, so it must be concise.
The most important thing that this text must contain is all the decisions (explicit and implicit) that were made while creating this PR. They must be identified and put on the PR description for reviewers to read, understand, and discuss.

Every piece of text this skill produces (the intermediate report and the PR description) must follow ASD-STE100 Simplified Technical English. Before writing any such text, invoke the `write-simple-english` skill and apply its rules.

## Step 1: Inputs

You need the branch, the target branch, the plan file (or the user's confirmation that there is none) and the known limits. `make-prs` gives them. For a PR that is already open, read the branches from it (`gh pr view`), and find the plan as `make-prs` Step 1 says.

Ask the user for what you cannot find. Do not guess.
DO NOT PROCEED with the following step until all the inputs are provided.

## Step 2: Research

Load into your context:

- The `git diff` between the new version of the codebase, and the version that this branch is going to be merged into.
- The executed plan (if available).
- Anything else that could be useful for the analysis. For example:
  - Other files that weren't touched by the PR but give important context for the changes.
  - Relevant documentation (local to the repo or from the web).

It's important to understand not only what was changed, but also why the change was made.

DO NOT PROCEED with the following step until the research is complete and all the relevant info is loaded into context.

## Step 3: Intermediate report

Analyze and write an intermediate report with all the changes that were made to the code.
If the plan and the code have a discrepancy, note it, but use the code as the current source of truth: the plan may be outdated. If the discrepancy is big, ask the user about it.
Always describe what the code actually does, use the plan only as context.

The intermediate report must be detailed and in-depth. Do not omit anything relevant to reviewers, but also apply the exclusion rules below: they keep noise out of the report from the start, instead of only filtering it out at the final step.
The intermediate report must be written in ASD-STE100 Simplified Technical English (invoke the `write-simple-english` skill first, per the note above).

The intermediate report must include:
- Any new (if any) architecture decisions
  - Explain each decision and why it had to be made.
- New files
- Deleted files
- Renamed files
- Changed files
  - For each changed file, a summary of what was changed, and an explanation as to why the change was necessary.
- Other changes to files such as configuration, dependencies, etc
  - If it makes sense to do so, include a justification for these types of changes.

For each of these changes, explain WHY the change was necessary to achieve the plan objective.

The report must exclude:
- A bug that this same PR introduced and fixed during its own development (for example, a mistake made in an earlier commit on this branch and corrected in a later commit on the same branch, before the PR was opened for review). Such a bug never existed in the base branch and leaves no trace in the final diff other than the correct code, so it gives reviewers no useful signal. Only include a bug fix when the bug already existed in the base branch before this PR started.
- A change that is purely cosmetic or a formatting fix (for example, whitespace, line wrapping, or blank-line removal) and carries no behavior change.

If a change in this PR can affect a value the project measures (for example, an accuracy, a performance number, or a count), note this in the report and flag it for the final output step below.

Ask the user for more info if something is not completely clear from the context data.

DO NOT PROCEED with the following step until the intermediate report is written.

## Step 4: Produce output

Based on the intermediate report, generate the output: the PR description.
The PR description must be a concise, human-readable summary of the detail-heavy intermediate report. Carry over the exclusion rules from Step 3: leave out self-introduced-and-fixed bugs and purely cosmetic changes here too.
Write the description in ASD-STE100 Simplified Technical English (invoke the `write-simple-english` skill first, per the note above, if you have not already done so in this task).

The PR description must be a markdown-formatted text with the following structure:

- Title: The name of the PR, based on the branch name and the plan name.
- Objective: In one or two plain sentences, say what the PR achieves and why. A reader who does not know the code must understand it: no jargon and no file names.
- Known limits: each gap the user accepted, one line each, after the Objective. Leave it out if there are none.
- Review order: The changes, grouped by file, in the order in which a reviewer should read the files. Do not include tests here.
  - Each top-level item is a clickable repo (Github) link to the diff of one changed file.
  - Under each link, a nested list of the changes made in that file, so the reviewer knows what to look for. Each bullet says WHAT was done and WHY, in one short sentence.
  - Include every changed file that is not a test or format change, with no limit on the number of files. Group trivial files (for example, config or lock files) in one last item.
  - Sort the files so that the reviewer first reads the architecture decisions and the core logic, then the code that depends on them.
  - If one decision spans several files, explain it fully under the first file in the order, and refer to it under the other files.
- Tests: An itemized list of how the new features are tested:
  - In each item, explain where each new piece is tested.
  - Very concise: 1 sentence each.
  - If this PR doesn't touch any tests, say it explicitly on this section.
  - If the intermediate report flagged a change that can affect a measured value, ask the user whether updated values from a fresh run are available. If they are, include a concise before/after comparison here.
- How to verify: How a reviewer can check that the change works without reading every line. Give the exact command or steps, and the result to expect (for example, an output, a metric or a screenshot). If the PR changes a tool or a UI, say what to run and what to look at.

Be sure to note, in the Review order section, any changes that don't fit under the theme of the PR, appearing to be "out of place". On these cases, list the item among the other ones, but remark the difference on the description, this is useful to reviewers.

Keep the description under about 40 lines, not counting the Review order section.

Use [the template](assets/pr-description-template.md) as a base.

Present the final PR description in chat inside a fenced ```markdown code block containing the raw markdown source (not rendered) - this is what makes it copy-paste friendly directly into GitHub's PR description field. Do this for every PR description produced by this skill, without needing to be asked.

After producing the output, ask the user in chat to review it, give feedback, and iterate.

At the end, ALWAYS add this reminder in chat in a BOLD font: "REMEMBER! The idea is that your teammates actually read this! Consider this text a draft version of the PR submission: If something's missing, add it. If it's too long, cut it shorter!"
