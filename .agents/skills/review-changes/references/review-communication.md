# Review Communication Guide

How to phrase code review feedback so that it is clear, actionable, and constructive. Good review communication accelerates resolution, reduces friction, and maintains a collaborative working relationship.

---

## Severity Prefixes

Begin every finding with a severity prefix in brackets. This immediately tells the reader how urgent the issue is and prevents minor suggestions from being mistaken for blocking concerns.

| Prefix | Meaning | Expected Action |
|---|---|---|
| `[CRITICAL]` | Must fix before merge; correctness or security risk | Resolve immediately |
| `[MAJOR]` | Should fix before merge; significant quality concern | Resolve or justify deferral |
| `[MINOR]` | Best-practice deviation; fix if practical | Resolve or track as tech debt |
| `[NIT]` | Style preference; optional | Author's discretion |

Example:
> **[MAJOR] Missing null check on user lookup result** (line 42)
>
> `getUserById` returns `null` when the user is not found, but this code dereferences the result without checking. This will throw a `TypeError` in production when a deleted user's session is still active.

---

## Writing Actionable Suggestions

Every finding should answer three questions: what is wrong, why it matters, and what to do about it.

**Bad:** "This is wrong."
**Better:** "This query is vulnerable to SQL injection."
**Best:** "This query interpolates `userId` directly into the SQL string (line 34), which allows SQL injection. Use a parameterized query instead: `db.query('SELECT * FROM users WHERE id = $1', [userId])`."

Include a code snippet for the suggested fix whenever the change is not obvious. If there are multiple valid approaches, briefly mention the alternatives and state which one is recommended and why.

---

## Questions vs Demands

When the code might be intentionally written a certain way, frame the finding as a question rather than a directive. This acknowledges that the reviewer may lack context the author has.

**Demand (may cause friction):** "Remove this sleep call."
**Question (invites explanation):** "Is this `sleep(5)` call intentional? If it's a workaround for a race condition, consider using a synchronization primitive instead, as a fixed sleep is fragile under varying load."

Use questions when:
- The intent behind the code is ambiguous.
- The reviewer is not an expert in the specific domain.
- The pattern might be required by a framework or external constraint.
- The code works correctly but uses an unconventional approach.

Use direct statements when:
- The issue is a clear bug or security vulnerability.
- The code violates an established project convention.
- The issue is factual and not a matter of interpretation.

---

## Balancing Positive and Negative Feedback

A review that only lists problems can feel demoralizing even when the feedback is valid. Acknowledge good patterns when they are genuinely noteworthy.

**Effective positive feedback:**
- "Good use of early returns here; it keeps the nesting shallow and the logic easy to follow."
- "The error messages in this module are excellent -- they include the operation, the input, and the expected format, which will make debugging much easier."

**Ineffective positive feedback (avoid):**
- "Looks good!" (too vague to be useful)
- "Nice!" (does not identify what is good or why)

Do not force positive feedback. If there is nothing genuinely good to highlight, omit it. Inauthentic praise undermines credibility.

Place positive observations at the beginning or interspersed naturally. Do not sandwich criticism between compliments in a way that feels formulaic.

---

## Explaining Rationale

Always explain why an issue matters. A reviewer who says "do not use `eval`" without explanation may seem arbitrary. A reviewer who says "do not use `eval` because it executes arbitrary code from user input, enabling remote code execution" is teaching and persuading.

Connect findings to concrete consequences:
- **Correctness:** "This will cause [specific failure] when [specific condition]."
- **Security:** "An attacker could [specific exploit] by [specific action]."
- **Performance:** "Under [specific load], this will [specific degradation]."
- **Maintainability:** "When [future change] is needed, this will require modifying [N files] because [reason]."

---

## Handling Disagreements

When the author pushes back on a finding, respond with evidence rather than authority.

1. **Acknowledge the author's point.** Restate it to confirm understanding.
2. **Provide evidence.** Link to documentation, benchmarks, incident reports, or relevant examples.
3. **Propose a compromise** if the original suggestion is not the only valid approach.
4. **Escalate explicitly** if the issue is critical and agreement cannot be reached. State: "I believe this is a blocking issue because [reason]. Let's get a third opinion from [person/team]."

Do not repeat the same argument with more emphasis. If the first explanation did not convince, repeating it louder will not help. Add new information or accept the disagreement.

---

## Review Etiquette

### Address the code, not the person

**Bad:** "You made a mistake here."
**Good:** "This line has an off-by-one error."

**Bad:** "You always forget to handle errors."
**Good:** "This function is missing error handling on the network call."

### Be precise about location

Always include file paths and line numbers. "Somewhere in the auth module" forces the author to search. "`src/auth/login.ts`, line 87" lets them jump directly to the issue.

### Batch related findings

If the same issue appears in multiple places, describe it once in detail and then list the other locations briefly. This avoids repetitive prose and makes the review easier to action.

Example:
> **[MINOR] Unused imports** (lines 3, 7, 12)
>
> Three imports (`fs`, `lodash`, `moment`) are imported but never used in this file. Remove them to keep the dependency surface clean.

### Distinguish blocking from non-blocking

Make it unambiguous which findings must be addressed before merge and which are optional. The severity prefix handles this, but reinforce it in ambiguous cases:
- "This is a blocking concern because..."
- "Non-blocking suggestion: consider..."

### Keep nits brief

Nit-level findings should be one or two sentences. A paragraph-long explanation of a formatting preference wastes everyone's time.

---

## Examples of Good vs Bad Review Comments

### Example 1: Security Issue

**Bad:**
> Don't do this.

**Good:**
> **[CRITICAL] SQL injection via string interpolation** (line 34)
>
> The `userId` variable is interpolated directly into the SQL query string. If `userId` originates from user input, an attacker can inject arbitrary SQL. Use a parameterized query:
> ```sql
> SELECT * FROM users WHERE id = $1
> ```
> with `[userId]` as the parameter array.

### Example 2: Readability

**Bad:**
> This function is too long.

**Good:**
> **[MINOR] Consider extracting validation logic** (lines 45-92)
>
> This function handles both input validation and data transformation. Extracting the validation (lines 45-70) into a `validateOrderInput` function would make each part independently testable and reduce the cognitive load when reading the transformation logic.

### Example 3: Performance

**Bad:**
> This is slow.

**Good:**
> **[MAJOR] N+1 query in order listing endpoint** (line 78)
>
> Each order in the loop triggers a separate `getCustomerById` query. For a page of 50 orders, this executes 51 database queries. Use `getCustomersByIds` with the collected IDs to batch this into a single query. This endpoint is called on every page load of the dashboard.

### Example 4: Ambiguous Intent

**Bad:**
> Remove this sleep.

**Good:**
> **[MINOR] Hardcoded sleep in retry logic** (line 112)
>
> Is the 5-second sleep intentional as a fixed delay, or should this use exponential backoff? If the downstream service recovers quickly, a fixed 5-second wait adds unnecessary latency. If it recovers slowly, a single retry after 5 seconds may not be enough. Consider using a backoff strategy with jitter.
