---
name: review-changes
description: >
  Perform structured, thorough code reviews to identify defects, security issues, and maintainability concerns.
  Trigger phrases:
    - "review this code"
    - "review my changes"
    - "code review the current diff"
    - "check this code for issues"
    - "analyze this code for bugs"
    - "review the staged changes"
    - "find problems in this code"
    - "review this file for quality"
    - "critique this implementation"
    - "audit this code"
user-invocable: true
allowed-tools:
  - Read
  - Bash(command *)
  - Glob
  - Grep
---

# Code Review Skill

Perform structured, thorough code reviews on local code and changes. Identify defects, security vulnerabilities, performance issues, and maintainability concerns. Produce actionable findings with clear severity classifications and suggested fixes.

This skill reviews local code, staged changes, and diffs. It is distinct from pull request review, which operates on remote branches and GitHub metadata.

## Review Workflow

Follow this three-phase workflow for every review: gather context, analyze changes, and report findings.

### Phase 1: Gather Context

Before examining any code, establish the scope and context of the review.

**For diff-based reviews (staged changes, branch diffs):**

Run `git diff --cached` or `git diff <base>..HEAD` to obtain the changeset. Identify which files are modified, added, or deleted. Read surrounding code in each modified file to understand the context beyond the diff hunks. Check for related test files and configuration changes.

**For full-file reviews:**

Read the target file or files in their entirety. Identify the module's role within the broader system by examining imports, exports, and call sites. Use `Grep` to find usages of key functions and types across the codebase. Check for existing tests that cover the code under review.

**For architectural reviews:**

Map the dependency graph by tracing imports across the affected modules. Identify the boundaries between components. Look for changes that cross architectural layers or introduce new dependencies between previously independent modules.

In all cases, determine the programming language, framework, and any project-specific conventions (check for linter configs, `.editorconfig`, `AGENTS.md`, or style guides in the repository).

### Phase 2: Analyze Changes

Examine the code systematically across all review dimensions. Do not jump to conclusions from surface-level patterns. Read each change carefully, trace data flow, and consider edge cases.

Work through the following dimensions in order:

1. **Correctness** -- Verify logic, control flow, data transformations, boundary conditions, and return values. Trace inputs through the code and confirm outputs match expectations.
2. **Security** -- Check for injection vectors, authentication and authorization gaps, secret exposure, unsafe deserialization, and missing input validation.
3. **Performance** -- Look for unnecessary allocations, N+1 query patterns, missing caching opportunities, quadratic algorithms on potentially large inputs, and blocking operations in async contexts.
4. **Readability** -- Assess naming clarity, function length, nesting depth, comment quality, and overall code organization.
5. **Maintainability** -- Evaluate coupling between components, adherence to SOLID principles, DRY violations, and whether the code will be easy to modify in the future.
6. **Error Handling** -- Confirm that errors are caught, propagated, logged, and recovered from appropriately. Check for swallowed exceptions and missing error cases.
7. **Testing** -- Assess whether the changes include adequate tests, whether existing tests still pass, and whether edge cases are covered.

For each dimension, record any findings with precise file locations and severity.

### Phase 3: Report Findings

Produce a structured review output following the format specified in the Output Format section below. Group findings by file, sort by severity within each file, and include a summary at the end.

## Review Dimensions in Detail

### Correctness

Correctness is the highest-priority dimension. A correct program does what it is intended to do for all valid inputs and handles invalid inputs gracefully.

Check for:
- Off-by-one errors in loops and array indexing.
- Null or undefined dereferences.
- Type coercion issues (especially in dynamically or loosely typed languages).
- Race conditions in concurrent code.
- Incorrect boolean logic (De Morgan's law violations, short-circuit evaluation misuse).
- Missing `break` statements in switch/case blocks.
- Incorrect comparison operators (equality vs identity, signed vs unsigned).
- Resource leaks (unclosed file handles, database connections, network sockets).
- Uninitialized variables or fields.
- Incorrect assumptions about data ordering or uniqueness.

### Security

Security findings are almost always critical or major severity. Even seemingly minor oversights can create exploitable vulnerabilities.

Check for:
- SQL injection, command injection, path traversal, and XSS.
- Hardcoded credentials, API keys, or secrets.
- Missing authentication or authorization checks.
- Insecure cryptographic practices (weak algorithms, hardcoded IVs, ECB mode).
- Unsafe deserialization of untrusted input.
- Missing rate limiting on public endpoints.
- Overly permissive CORS or CSP policies.
- Sensitive data in logs or error messages.
- Missing input validation and sanitization at trust boundaries.

### Performance

Performance issues range from minor (unnecessary allocations in cold paths) to critical (quadratic algorithms on user-controlled input sizes).

Check for:
- N+1 database query patterns.
- Unnecessary object copying or allocation in hot loops.
- Missing indexes on frequently queried columns.
- Synchronous I/O in async contexts.
- Unbounded growth of in-memory collections.
- Missing pagination on database queries.
- Redundant computation that could be cached or memoized.
- String concatenation in loops instead of builder patterns.

### Readability

Readable code reduces the cost of future maintenance and lowers the probability of introducing bugs during modifications.

Check for:
- Unclear or misleading variable, function, and class names.
- Functions longer than 40-50 lines or with more than 3-4 levels of nesting.
- Magic numbers and strings without named constants.
- Dead code, commented-out code, or unreachable branches.
- Missing or misleading comments.
- Inconsistent formatting or naming conventions relative to the project style.

### Maintainability

Maintainable code can be modified safely and efficiently. Violations here increase the long-term cost of change.

Check for:
- High coupling between unrelated modules.
- Low cohesion within a single module (doing too many unrelated things).
- DRY violations (duplicated logic that should be extracted).
- Violations of SOLID principles.
- Missing abstractions that would simplify future extension.
- Excessive abstraction that adds complexity without benefit.
- Hardcoded configuration values that should be externalized.

### Error Handling

Robust error handling prevents silent failures and aids debugging in production.

Check for:
- Swallowed exceptions (empty catch blocks).
- Generic catch-all handlers that mask specific errors.
- Missing error logging or insufficient context in error messages.
- Inconsistent error handling patterns within the same module.
- Unhandled promise rejections or missing `.catch()` handlers.
- Error conditions that leave the system in an inconsistent state.
- Missing cleanup in error paths (finally blocks, defer statements, context managers).

## Severity Classification

Classify every finding into exactly one of four severity levels:

### Critical

The issue will cause data loss, security breaches, crashes in production, or silent corruption. The code must not be merged until the issue is resolved.

Examples: SQL injection, unhandled null dereference on a critical path, race condition causing data corruption, exposed secrets.

### Major

The issue will cause incorrect behavior under realistic conditions, degrade performance significantly, or make the code substantially harder to maintain. The issue should be resolved before merging.

Examples: Missing error handling on a network call, N+1 query in a user-facing endpoint, incorrect business logic for a common case, missing authorization check.

### Minor

The issue is unlikely to cause immediate problems but represents a deviation from best practices or introduces technical debt. Resolve if practical, or track for later.

Examples: Unused import, slightly misleading variable name, missing edge-case test, suboptimal algorithm where input size is small.

### Nit

A stylistic preference or trivial improvement that does not affect correctness, security, or performance. Resolve at the author's discretion.

Examples: Formatting preference, minor naming suggestion, comment wording, import ordering.

## Output Format

Structure every review output as follows:

```
## Code Review: <scope description>

### <file path>

**[SEVERITY] Issue #i<issue number>: <short title>** (line <N> or lines <N>-<M>)

<description of the issue>

**Rationale:** <why this matters>

**Suggested fix:**
<code snippet or description of the fix>

---

(repeat for each finding in the file)

### <next file path>

(repeat for each file)

---

## Summary

- **Critical:** <count>
- **Major:** <count>
- **Minor:** <count>
- **Nit:** <count>
- **Files reviewed:** <count>

**Overall assessment:** <1-3 sentence summary of the code quality and the most important actions to take>
```

Provide the exact line numbers for every finding. Include enough surrounding context in the description for the reader to understand the issue without opening the file. Always suggest a concrete fix or an alternative approach.

## Diff-Based Review vs Full-File Review

**Diff-based review** focuses on changed lines and their immediate context. Use this mode when reviewing staged changes, branch diffs, or specific commits. Pay attention to:
- Whether the change introduces new issues.
- Whether the change makes existing issues worse.
- Whether the change misses an opportunity to fix nearby existing issues.
- Whether the change is consistent with the patterns in the surrounding code.

**Full-file review** examines an entire file regardless of what has changed recently. Use this mode when reviewing new files, when the user requests a complete review, or when understanding the broader context is essential. Apply all dimensions uniformly across the entire file.

Default to diff-based review when there are staged changes or when a comparison branch is apparent. Default to full-file review when a specific file or directory is named without a diff context.

## Architectural Review Patterns

When the changes span multiple files or introduce structural modifications, perform an architectural review in addition to the per-file analysis.

Assess the following:
- **Dependency direction.** Do dependencies flow from high-level modules toward low-level modules? Flag circular dependencies or dependency inversions that violate the intended architecture.
- **API surface changes.** Do modifications to public APIs maintain backward compatibility? Are new APIs consistent with existing conventions?
- **Separation of concerns.** Does each module have a single, well-defined responsibility? Flag changes that blur the boundaries between layers (e.g., business logic in a controller, database queries in a view).
- **Error propagation across boundaries.** Do errors cross module boundaries with sufficient context? Are error types appropriate for the layer they originate from?
- **Configuration and environment.** Are environment-specific values externalized? Do changes introduce new configuration requirements without documentation?

Include architectural findings in the review output under a dedicated "Architectural Observations" section after the per-file findings and before the summary.

## Handling Ambiguity

When a pattern is potentially problematic but might be intentional, phrase the finding as a question rather than a directive. For example, write "Is the omission of input validation on this endpoint intentional? If the endpoint is internal-only, this may be acceptable, but if it is exposed to external clients, add validation for the `userId` parameter." This approach invites discussion rather than creating unnecessary friction.

When uncertain whether something is a bug or a feature, still report it, but lower the severity by one level and clearly state the uncertainty.

## Review Scope Limits

Do not review auto-generated code, vendored dependencies, or lockfiles unless the user specifically requests it. Focus review effort on application code, configuration that affects behavior, and test code.

When the changeset is very large (more than 500 lines of diff), prioritize critical and major findings. Call out that a full minor/nit pass was not performed and suggest a follow-up review.

## Additional Resources

- `references/checklist.md` -- A 131-item checklist organized by review dimension, suitable for systematic use during reviews.
- `references/anti-patterns.md` -- Common anti-patterns organized by language family with detection strategies.
- `references/review-communication.md` -- Guidance on phrasing review feedback constructively and handling disagreements.
- `examples/review-output.md` -- A complete example of a structured code review output with multiple findings across severity levels.
