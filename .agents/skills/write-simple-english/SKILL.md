---
name: write-simple-english
description: Writes text in ASD-STE100 Simplified Technical English. Use when writing any sort of English prose, including chat responses, documentation, reports, plans, code comments, commit messages, error messages, release notes, pr descriptions, etc.
---

# Write in ASD-STE100 Simplified Technical English

When you write text, obey these rules from ASD-STE100 Simplified Technical English. These rules apply to all text types, including:

- Chat responses
- Documentation
- Reports
- Plans
- Code comments
- Commit messages
- Error messages
- Release notes
- PR descriptions

### Classify First
**Procedural text** tells the reader what to do. Use imperative mood. Set a maximum of 20 words per sentence. Put one instruction per sentence.

**Descriptive text** explains how something works or what something is. Use simple tenses. Set a maximum of 25 words per sentence. Keep one topic per paragraph. Put a maximum of six sentences per paragraph.

Do not mix the two types in one passage.

### Verbs
Use only these verb forms:

- Infinitive
- Imperative
- Simple present
- Simple past
- Simple future
- Past participle as adjective

Do not use the present perfect ("has completed" → "completed"). Do not use "-ing" verb forms ("making it easy" → start a new sentence). Use active voice. Use passive voice only in descriptions when the agent is unknown.

The approved modals are: can, will, must. Do not use: should, would, may, might, could. If the meaning of one of these words is required, write "must." If the meaning is optional, delete the word.

### Sentences
Keep complete grammar. Follow these rules:

- Do not use contractions.
- Keep articles.
- Keep "that" ("make sure that the file exists").
- Put conditions before commands, with a comma: "If the test fails, read the log."
- Do not use semicolons. Write two sentences instead.
- Use a vertical list for more than two items or steps.

### Words
Give one word one meaning for the whole document.

Keep noun chains to a maximum of three words. Break longer chains with prepositions ("connection pool timeout value" becomes "the timeout value for the connection pool").

Delete words that carry no fact, such as:

- simply
- seamlessly
- robust
- powerful
- comprehensive
- leverage
- "in order to"
- "it is worth noting"

Replace these words:

- utilize → use
- prior to → before
- in the event that → if
- e.g. → for example

Use American spelling.

### Warnings
Write the command or condition first, then the risk: "Do not run this against production. The command deletes rows."

## Guardrails

### What Not To Change

Do not change code blocks, identifiers, CLI commands, file paths, quoted error messages, or product names. Each of these items counts as one word toward sentence limits.

Do not invent specifics. If the source does not give a number or a cause, keep the general statement.

### Self-Check

Before you return text, do this check:

1. Scan for contractions, "has been", "should", "making", and semicolons.
2. Count the words in your three longest sentences.
3. Split any sentence that exceeds the limit.
4. Collapse synonym rotation into one consistent term.
