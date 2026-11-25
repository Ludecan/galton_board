# Code Review Checklist

A systematic checklist organized by review dimension. Work through each applicable section during a review. Not every item applies to every change; skip items that are clearly irrelevant to the language, framework, or scope.

---

## Correctness

1. All conditional branches produce the correct result for their intended cases.
2. Loop boundaries are correct (no off-by-one errors on start, end, or step).
3. Null, undefined, nil, or None values are handled before dereference.
4. Type conversions and coercions produce expected results (implicit and explicit).
5. Boolean expressions evaluate correctly under all combinations (verify De Morgan's law, short-circuit evaluation).
6. Switch/match statements include all expected cases and a default or exhaustiveness check.
7. Arithmetic operations handle overflow, underflow, and division by zero.
8. String operations account for encoding (UTF-8 multi-byte characters, locale-sensitive comparisons).
9. Concurrent access to shared state is properly synchronized (locks, atomics, channels).
10. Data structures are used correctly (map ordering assumptions, set uniqueness, queue FIFO guarantees).
11. Return values and output parameters are set on all code paths.
12. Resource acquisition is paired with release (files, connections, locks, memory).
13. API contracts are honored (preconditions, postconditions, invariants).

## Security

14. All user input is validated at trust boundaries before use.
15. SQL queries use parameterized statements, never string interpolation.
16. Shell commands use argument arrays, never interpolated strings.
17. File paths are validated against path traversal (no unsanitized `../` sequences).
18. HTML output is escaped or sanitized to prevent XSS.
19. Authentication is required on all endpoints that access user data.
20. Authorization checks verify the requesting user has permission for the specific resource.
21. Secrets (API keys, passwords, tokens) are not hardcoded in source files.
22. Cryptographic operations use current, recommended algorithms and parameters.
23. Sensitive data is not written to logs, error messages, or stack traces.
24. CORS policies restrict access to expected origins only.
25. Rate limiting is applied to public-facing endpoints.
26. Session tokens are generated with sufficient entropy and have appropriate expiration.
27. Deserialization of untrusted input uses safe methods with type restrictions.

## Performance

28. Database queries avoid N+1 patterns (use joins, eager loading, or batch fetching).
29. Database queries that filter or sort include appropriate indexes.
30. Large result sets are paginated rather than loaded entirely into memory.
31. Hot loops avoid unnecessary object allocation, string concatenation, or I/O.
32. Caching is used for expensive computations or frequently repeated queries.
33. Synchronous blocking calls are not made in async or event-loop contexts.
34. Algorithms have appropriate time complexity for the expected input size.
35. Network calls include timeouts and do not block indefinitely.
36. Large files or streams are processed incrementally, not loaded fully into memory.

## Readability

37. Variable, function, and class names clearly describe their purpose.
38. Functions are short enough to understand in a single reading (under ~40 lines).
39. Nesting depth does not exceed 3-4 levels; deep nesting is refactored with early returns or extraction.
40. Magic numbers and strings are replaced with named constants.
41. Dead code, commented-out code, and unreachable branches are removed.
42. Comments explain "why," not "what"; code that needs a "what" comment is refactored instead.
43. Complex expressions are broken into intermediate variables with descriptive names.
44. Consistent formatting and naming conventions are followed throughout the file.

## Maintainability

45. Each module, class, or function has a single, well-defined responsibility.
46. Modules depend on abstractions rather than concrete implementations where appropriate.
47. Duplicated logic is extracted into shared functions or modules (DRY).
48. Changes are localized; modifying one feature does not require changes in many unrelated files (low coupling).
49. Public APIs are minimal and well-documented; internal details are not exposed unnecessarily.
50. Configuration values (URLs, thresholds, feature flags) are externalized, not hardcoded.
51. The code can be extended for likely future requirements without modification of existing logic (open/closed principle).
52. Dependencies are up to date and do not include known vulnerabilities.

## Error Handling

53. All error-producing operations (I/O, network, parsing) have explicit error handling.
54. Catch blocks are specific to the expected exception types, not generic catch-all.
55. Error messages include sufficient context to diagnose the problem (input values, operation, expected state).
56. Errors are logged at the appropriate level (error, warn, info) with structured context.
57. Error paths clean up resources (close files, roll back transactions, release locks).
58. Errors are propagated to callers with enough context; they are not silently swallowed.
59. Retry logic includes backoff and a maximum retry count.
60. The system reaches a consistent state after an error (no partial updates, no dangling references).

## Testing

61. New logic has corresponding unit tests that cover the primary success path.
62. Edge cases and boundary conditions have dedicated test cases.
63. Error paths and failure modes are tested (invalid input, network failure, timeout).
64. Tests are independent and do not rely on execution order or shared mutable state.
65. Test assertions are specific; they check exact expected values, not just truthiness.
66. Mocks and stubs are used sparingly and only at module boundaries; internal implementation details are not mocked.
67. Integration or end-to-end tests cover critical user-facing workflows affected by the change.
68. Test names describe the scenario and expected outcome clearly.

## C# / .NET

69. Async methods return `Task` or `Task<T>`, not `void` (except event handlers).
70. Async calls use `await` instead of `.Result`, `.Wait()`, or `GetAwaiter().GetResult()`.
71. `CancellationToken` is accepted and forwarded in async method chains.
72. `IDisposable` objects are wrapped in `using` statements or `using` declarations.
73. Classes that own `IDisposable` fields implement `IDisposable` themselves.
74. EF Core queries use `.Include()` and `.ThenInclude()` for accessed navigation properties.
75. EF Core queries use `.AsNoTracking()` for read-only operations.
76. EF Core queries project to DTOs with `.Select()` instead of loading full entities when only a subset of columns is needed.
77. LINQ queries do not call `.ToList()` or `.ToArray()` prematurely, forcing client-side evaluation.
78. Dependency injection is used instead of `new`-ing services with their own dependencies.

## React

79. Hooks are called at the top level of the component, not inside conditions, loops, or nested functions.
80. Every `useEffect` has a dependency array that accurately lists all reactive values used inside it.
81. `useEffect` is not used to derive state that can be computed directly during rendering.
82. `useMemo` and `useCallback` are applied where re-computation or re-creation causes measurable performance issues, not applied everywhere indiscriminately.
83. List items rendered with `.map()` have stable, unique `key` props derived from data identifiers, not array indexes.
84. Components that receive objects or functions as props and are expensive to render are wrapped in `React.memo` with appropriate memoization of their props.
85. Forms and interactive elements include appropriate `aria-*` attributes, labels, and keyboard navigation support (a11y).
86. Images have `alt` attributes, and interactive elements are reachable via Tab and operable via Enter/Space (a11y).
87. Error boundaries wrap major sections of the component tree to prevent full-page crashes from rendering errors.

## Database (MariaDB / PostgreSQL / InfluxDB)

88. Queries select only needed columns instead of using `SELECT *`.
89. Columns used in `WHERE`, `JOIN`, and `ORDER BY` clauses have corresponding indexes.
90. `EXPLAIN` or `EXPLAIN ANALYZE` has been run on new or modified queries to verify index usage and identify sequential scans.
91. Collection queries include `LIMIT` or pagination to prevent unbounded result sets.
92. Multiple related write operations are wrapped in a transaction.
93. SQL queries use parameterized statements, never string interpolation or concatenation.
94. Database migration scripts are backward-compatible (no column renames or drops that break the running application).
95. Migration scripts that add indexes use `CREATE INDEX CONCURRENTLY` (PostgreSQL) or equivalent non-blocking syntax to avoid locking tables in production.
96. Time-series data (metrics, sensor readings, high-frequency logs) is stored in InfluxDB with appropriate retention policies, not in relational tables.
97. InfluxDB Flux queries use bounded `range()` and `limit()` to prevent unbounded data scans.

## PHP

98. All SQL queries use PDO prepared statements or mysqli parameterized queries, never string interpolation.
99. PDO connections set `ATTR_EMULATE_PREPARES` to `false` for real server-side prepared statements.
100. User input from `$_GET`, `$_POST`, `$_REQUEST`, `$_COOKIE` is validated and sanitized before use.
101. Output to HTML uses `htmlspecialchars()` with `ENT_QUOTES` and `'UTF-8'`, or template engine auto-escaping (Blade `{{ }}`, Twig `{{ }}`).
102. `unserialize()` is never called on user-controlled input. `json_decode()` or `allowed_classes` restriction is used instead.
103. File uploads validate MIME type via `finfo`, generate random filenames, and store outside the web root.
104. Session configuration sets `httponly`, `secure`, `samesite`, and `use_strict_mode`.
105. Composer dependencies are locked (`composer.lock` is committed) and audited with `composer audit`.
106. Error display is disabled in production (`display_errors = Off`, `log_errors = On`).

## Angular

107. Observables in components are cleaned up via `takeUntilDestroyed()`, `takeUntil(destroy$)`, or the `async` pipe.
108. `*ngFor` directives on non-trivial lists include a `trackBy` function.
109. Components follow smart/dumb separation: containers handle logic, presentational components only render via `@Input`/`@Output`.
110. Direct DOM manipulation (`document.getElementById`, jQuery) is not used; `Renderer2`, `@ViewChild`, or template refs are used instead.
111. TypeScript strict mode is enabled and `any` type is avoided.
112. HTTP interceptors handle authentication tokens, error responses, and retry logic centrally.
113. Lazy loading is used for feature modules to reduce initial bundle size.
114. `environment.ts` files do not contain secrets or API keys.

## SQL Server

115. Stored procedures start with `SET NOCOUNT ON`.
116. `WITH (NOLOCK)` is not used indiscriminately; each usage is justified for that specific query.
117. Queries avoid implicit type conversions in WHERE clauses (parameter types match column types).
118. Cursors are avoided in favor of set-based operations (CTEs, window functions, `MERGE`).
119. Indexes include frequently filtered/sorted columns; execution plans are checked for `CONVERT_IMPLICIT` and missing index hints.
120. Connection strings use `Encrypt=True` and `TrustServerCertificate=False` in production.

## MongoDB

121. Every query pattern has a supporting index; `explain()` shows `IXSCAN` not `COLLSCAN`.
122. Arrays in documents have bounded growth (use `$slice` or cap size).
123. Queries use proper `ObjectId()` type, not string representations of IDs.
124. Schema design balances embedding vs referencing based on access patterns and update frequency.
125. Write operations that must be atomic across documents use transactions (MongoDB 4.0+).
126. Connection strings use authentication and TLS in production.

## Redis

127. Redis connections use authentication (`requirepass` or ACL).
128. Cache keys have TTL set to prevent unbounded memory growth.
129. Cache invalidation strategy is explicit (TTL, event-driven, or write-through).
130. Sensitive data stored in Redis is encrypted at the application layer.
131. `KEYS *` command is never used in production (use `SCAN` instead).
