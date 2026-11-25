# Common Anti-Patterns by Language Family

A catalog of anti-patterns frequently encountered during code review. Each entry includes a description, why it is problematic, and how to detect it in a review.

---

## General Anti-Patterns

These patterns appear across most programming languages and frameworks.

### God Class / God Module

A single class or module that accumulates too many responsibilities. It becomes the central dependency for the entire system and is modified for nearly every feature change.

**Why it matters:** Changes to a god class risk breaking unrelated features. Testing is difficult because the class has too many collaborators. Onboarding new developers takes longer because the class is too large to understand.

**Detection:** Look for classes or modules with more than 500 lines, more than 10 public methods, or imports from many unrelated modules. Check if multiple unrelated features reference the same class.

### Feature Envy

A method that accesses data from another class more than from its own. It suggests the method belongs in the other class.

**Detection:** Count field accesses in a method. If the majority reference another object's fields via getters or property access, the method is envious. Look for chains like `order.customer.address.city`.

### Primitive Obsession

Using primitive types (strings, integers, booleans) to represent domain concepts that deserve their own type. Examples: using a string for email addresses, an integer for currency amounts, a boolean parameter to toggle behavior.

**Detection:** Look for validation logic repeated in multiple places for the same kind of value. Check for functions with multiple parameters of the same primitive type (easy to swap accidentally). Look for boolean parameters that control branching inside a function.

### Shotgun Surgery

A single logical change requires modifications in many files across the codebase. This indicates that a concept is scattered rather than cohesive.

**Detection:** In a diff, count the number of files changed for a single feature. If a small behavioral change touches more than 5-6 files, investigate whether an abstraction is missing.

### Long Method / Function

A function that exceeds 40-50 lines or performs multiple sequential tasks that could be extracted into named sub-functions.

**Detection:** Check function length. Look for comments that act as section dividers within a function (e.g., "// Step 1: validate input" followed by "// Step 2: transform data"). Multiple levels of nesting within a single function are also a signal.

### Inappropriate Intimacy

Two classes or modules that depend heavily on each other's internal implementation details. Changes to one routinely break the other.

**Detection:** Look for classes that access private or protected members of another class (via reflection, friend declarations, or name-mangled access). Check for circular imports between modules.

### Speculative Generality

Abstractions, interfaces, or extension points added "in case we need them later" without a current use case. These add complexity without delivering value.

**Detection:** Look for interfaces with a single implementation, abstract classes with a single subclass, or type parameters that are never varied. Check for configuration options that are always set to the same value.

---

## JavaScript / TypeScript Anti-Patterns

### Callback Hell

Deeply nested callbacks that create a pyramid shape in the code, making control flow hard to follow and error handling inconsistent.

**Detection:** Look for callback nesting deeper than 2-3 levels. Check for functions passed as arguments that themselves accept callback arguments. Often found in legacy Node.js code that has not been migrated to Promises or async/await.

### Abuse of `any` Type (TypeScript)

Using `any` to bypass the type system, which defeats the purpose of TypeScript and hides bugs that the compiler would otherwise catch.

**Detection:** Search for `any` in type annotations. Check for `as any` casts. Look at `tsconfig.json` for `noImplicitAny: false`. Particularly problematic in function parameters and return types at module boundaries.

### Missing Error Boundaries (React)

React component trees that lack error boundaries, causing the entire application to crash when a single component throws during rendering.

**Detection:** Search for `componentDidCatch` or `ErrorBoundary` components. If none exist around major sections of the component tree, rendering errors in any child will unmount the whole tree.

### Mutating State Directly

Modifying state objects directly instead of creating new references, which prevents React from detecting changes and causes stale renders.

**Detection:** Look for direct property assignments on state objects (`state.items.push(...)`, `state.count = 5`). In Redux, check for mutations inside reducers instead of returning new objects.

### Uncontrolled Re-renders

Components that re-render excessively due to missing memoization, inline object/function creation in JSX, or missing dependency arrays in hooks.

**Detection:** Look for object literals or arrow functions defined inside JSX props (`onClick={() => ...}` in a list). Check for `useEffect` or `useMemo` with missing or incorrect dependency arrays. Look for context providers whose value is a new object on every render.

### Missing Cleanup in Effects

`useEffect` hooks that subscribe to events, set timers, or open connections without returning a cleanup function, causing memory leaks.

**Detection:** Check every `useEffect` that calls `addEventListener`, `setInterval`, `setTimeout`, or `subscribe`. If there is no return function that reverses the operation, it is a leak.

---

## Python Anti-Patterns

### Mutable Default Arguments

Using mutable objects (lists, dicts, sets) as default parameter values. The default is shared across all calls, causing unexpected state accumulation.

**Detection:** Look for function signatures like `def f(items=[])` or `def f(config={})`. The correct pattern is `def f(items=None)` with `items = items or []` in the body.

### Bare `except`

Catching all exceptions without specifying a type. This catches `KeyboardInterrupt`, `SystemExit`, and `GeneratorExit` in addition to application errors, making the program hard to interrupt and hiding unexpected failures.

**Detection:** Search for `except:` without a type or `except Exception` (which is slightly better but still overly broad in most cases). Check whether the except block logs the exception or silently passes.

### Global Mutable State

Module-level mutable variables that are modified at runtime, creating hidden dependencies between functions and making the code unpredictable under concurrency.

**Detection:** Look for module-level variables that are not constants (not ALL_CAPS by convention) and are assigned to inside functions using the `global` keyword or by mutating the object directly.

### Monkeypatching in Production Code

Replacing methods or attributes of objects or modules at runtime outside of tests. This creates invisible dependencies and makes the code extremely hard to reason about.

**Detection:** Look for assignments to attributes of imported modules (`os.path.join = custom_join`) or class methods outside of test fixtures. Check for `setattr` calls on objects the caller does not own.

### Overuse of Inheritance

Deep class hierarchies (3+ levels) used to share code rather than to model genuine "is-a" relationships. Leads to fragile base class problems and tight coupling.

**Detection:** Count inheritance depth. Look for classes that override most methods of their parent. Check for calls to `super()` that skip levels or rely on method resolution order tricks.

---

## Go Anti-Patterns

### Error Swallowing

Ignoring error return values by assigning them to `_` or by not checking the second return value of functions that return `(result, error)`.

**Detection:** Search for `_ = someFunc()` where `someFunc` returns an error. Look for assignments like `result, _ := someFunc()`. Check that every `if err != nil` block either returns, logs, or wraps the error meaningfully.

### Interface Pollution

Defining interfaces preemptively rather than at the point of consumption. Go interfaces work best when defined by the consumer with only the methods it needs, not by the provider with all methods it offers.

**Detection:** Look for interfaces defined in the same package as their sole implementation. Check for interfaces with more than 5 methods (large interfaces are harder to implement and mock). Verify that interfaces are defined where they are used, not where they are implemented.

### `init()` Abuse

Putting significant logic, I/O, or registrations in `init()` functions. These run implicitly at import time, making dependencies invisible and testing difficult.

**Detection:** Check `init()` functions for anything beyond trivial variable initialization. Look for database connections, HTTP calls, or global registrations inside `init()`.

### Naked Goroutine Launch

Spawning goroutines with `go func()` without any mechanism to track completion, propagate errors, or handle panics.

**Detection:** Look for `go func()` or `go someFunc()` calls that do not write to a channel, call `wg.Done()`, or have a `recover()` in a deferred function. Check that the caller has a way to know when the goroutine finishes and whether it succeeded.

### Package-Level State for Configuration

Using package-level variables for configuration instead of passing configuration through function parameters or struct fields. This creates hidden coupling and makes testing harder.

**Detection:** Look for `var` declarations at the package level that are set during initialization and read during request handling. Check for test files that modify package-level variables and restore them after the test.

### Overuse of Empty Interface

Using `interface{}` (or `any` in Go 1.18+) as a parameter or return type when a more specific type or a constrained generic would be appropriate. This shifts type checking from compile time to runtime.

**Detection:** Look for `interface{}` in function signatures, especially in exported functions. Check whether the function body immediately type-asserts or type-switches on the parameter, which suggests a concrete type or interface should be used instead.

---

## C# / .NET Anti-Patterns

### Using `async void` Instead of `async Task`

Declaring async methods with a `void` return type instead of `Task`. Exceptions thrown in `async void` methods cannot be caught by the caller and will crash the process. The caller has no way to await completion.

**Detection:** Search for `async void` in method signatures. The only acceptable use of `async void` is in event handlers (e.g., WPF/WinForms UI event handlers). All other async methods must return `Task` or `Task<T>`.

### Not Disposing IDisposable (Missing `using` Statements)

Failing to dispose objects that implement `IDisposable`, such as `HttpClient`, `DbConnection`, `StreamReader`, or `SqlCommand`. This causes resource leaks including unclosed connections, file handles, and memory.

**Detection:** Look for `new` expressions that create `IDisposable` types without a `using` statement or `using` declaration. Check for fields of disposable types in classes that do not themselves implement `IDisposable`. Look for `HttpClient` instantiated per request instead of being injected via `IHttpClientFactory`.

### Catching Generic `Exception` Instead of Specific Types

Using `catch (Exception ex)` as a catch-all instead of catching specific exception types. This hides bugs by swallowing unexpected exceptions such as `NullReferenceException`, `InvalidOperationException`, or `OutOfMemoryException`.

**Detection:** Search for `catch (Exception` blocks. Check whether the block logs and rethrows (`throw;`) or silently swallows the error. Acceptable patterns include top-level middleware exception handlers and retry logic that catches `Exception` but rethrows after exhausting retries.

### String Concatenation in Loops Instead of StringBuilder

Building strings by repeated concatenation (`+=`) inside loops. Each concatenation allocates a new string object, resulting in O(n^2) memory allocation and significant garbage collection pressure.

**Detection:** Look for `+=` on string variables inside `for`, `foreach`, `while`, or `do` loops. The correct pattern is to use `StringBuilder` and call `Append()` in the loop, then `ToString()` after.

### Blocking on Async Code (.Result, .Wait())

Calling `.Result` or `.Wait()` on a `Task` in synchronous code. This blocks the calling thread and can cause deadlocks in environments with a synchronization context, such as ASP.NET or WPF.

**Detection:** Search for `.Result` and `.Wait()` on `Task` or `Task<T>` variables. Also search for `Task.WaitAll` and `Task.WaitAny` in code that could use `Task.WhenAll` or `Task.WhenAny` with `await` instead. Look for `GetAwaiter().GetResult()` which avoids the `AggregateException` wrapping but still blocks.

### N+1 Queries in EF Core (Missing Include/ThenInclude)

Loading a collection of entities and then accessing a navigation property on each entity in a loop, causing a separate database query per item instead of a single query with a join.

**Detection:** Look for `foreach` loops over EF Core query results where a navigation property is accessed inside the loop body. Check whether the original query uses `.Include()` or `.ThenInclude()` for the accessed navigation properties. Look for LINQ queries that use `.Select()` to project navigation properties without a prior `.Include()`.

### Exposing Internal Types in Public APIs

Returning entity framework models, internal DTOs, or database row types directly from controller actions or public service methods. This couples consumers to the internal data model and leaks implementation details.

**Detection:** Check controller return types and public service interfaces for types annotated with EF Core attributes (`[Key]`, `[ForeignKey]`, `[Table]`) or types from a data layer namespace. Public APIs should return dedicated response DTOs or view models.

### Hardcoding Connection Strings Instead of IConfiguration

Embedding database connection strings, API URLs, or other environment-specific values directly in source code instead of reading them from `IConfiguration`, `appsettings.json`, or environment variables.

**Detection:** Search for literal connection strings containing `Server=`, `Data Source=`, `Host=`, or `mongodb://` in `.cs` files. Check for hardcoded URLs in `HttpClient` calls. Look for `new SqlConnection("...")` with a literal string argument instead of an injected configuration value.

---

## React Anti-Patterns

### Mutating State Directly Instead of Using Setter

Modifying state variables by direct assignment or mutation methods (`state.items.push(...)`, `state.count = 5`) instead of using the setter function returned by `useState` or dispatching an action.

**Detection:** Look for direct property assignments on state objects. Search for array mutation methods (`push`, `pop`, `splice`, `sort`, `reverse`) called on state arrays. In class components, look for `this.state.x = ...` instead of `this.setState()`.

### Missing Dependency Array in useEffect

Calling `useEffect` without a dependency array, causing the effect to run after every render. This leads to infinite loops when the effect updates state, and causes unnecessary API calls or subscriptions.

**Detection:** Look for `useEffect(() => { ... })` calls with no second argument. Every `useEffect` should have a dependency array, even if it is empty (`[]`) for effects that should run only on mount.

### Prop Drilling Instead of Context or State Management

Passing data through many intermediate components that do not use the data themselves, just to reach a deeply nested child. This makes refactoring difficult and couples unrelated components.

**Detection:** Look for components that accept props they only forward to children without using them. Count how many levels a prop travels from its origin to its consumer. If a prop passes through three or more intermediary components, consider Context, Zustand, Jotai, or another state management approach.

### useEffect for Derived State (Compute in Render Instead)

Using `useEffect` to compute a value from props or state and store it in another state variable, when the value could be computed directly during rendering. This adds an unnecessary render cycle and extra complexity.

**Detection:** Look for `useEffect` that reads state or props in its dependency array and calls a state setter with a computed value. If the computation is a pure transformation of existing state or props, it should be a `const` or `useMemo` in the component body.

### Not Using Keys or Using Index as Key in Lists

Omitting the `key` prop on list items or using the array index as the key. Index keys cause incorrect behavior when items are reordered, inserted, or deleted because React cannot distinguish which items changed.

**Detection:** Look for `.map()` calls in JSX where the rendered element does not have a `key` prop. Check for `key={index}` or `key={i}` patterns. Keys should be stable, unique identifiers derived from the data (e.g., `key={item.id}`).

### Giant Components Instead of Composition

Single component files that exceed 200-300 lines, containing multiple responsibilities such as data fetching, form handling, layout, and business logic all in one component.

**Detection:** Check component file length. Look for components that manage more than 3-4 state variables, have multiple `useEffect` hooks with unrelated concerns, or render large JSX trees with many conditional branches. These should be split into smaller, focused components.

### Fetching in useEffect Without Cleanup/Cancellation

Performing data fetching in `useEffect` without handling component unmount or request cancellation. This causes "setState on unmounted component" warnings and potential race conditions when the component unmounts before the fetch completes.

**Detection:** Look for `fetch()` or `axios` calls inside `useEffect` that do not use an `AbortController` or a boolean `isMounted` flag. Check that the cleanup function (the return value of `useEffect`) cancels the pending request.

### Inline Object/Function Creation Causing Unnecessary Re-renders

Creating new object literals, array literals, or arrow functions directly in JSX props on every render. Since these create new references each time, child components receiving them will re-render even if the values have not logically changed.

**Detection:** Look for object literals (`style={{ ... }}`) or arrow functions (`onClick={() => ...}`) inside JSX, especially when passed to memoized child components or rendered in lists. These should be extracted to `useMemo`, `useCallback`, or defined outside the render path.

---

## Database Anti-Patterns (MariaDB / PostgreSQL / InfluxDB)

### SELECT * in Production Queries

Using `SELECT *` instead of selecting only the needed columns. This transfers unnecessary data over the network, prevents covering index optimizations, and breaks when columns are added or reordered.

**Detection:** Search for `SELECT *` or `SELECT \*` in SQL strings, repository classes, and ORM raw queries. Check for EF Core or Dapper queries that load entire entities when only a few columns are needed. Use `.Select()` projections in LINQ to retrieve only required fields.

### Missing Indexes on Frequently Queried Columns

Tables that are filtered, sorted, or joined on columns that lack indexes. This forces full table scans on every query, degrading performance as data grows.

**Detection:** Review `WHERE` clauses, `JOIN` conditions, and `ORDER BY` columns in application queries. Cross-reference with the database migration files or schema definitions to verify that indexes exist for those columns. Run `EXPLAIN` or `EXPLAIN ANALYZE` on slow queries to confirm sequential scans.

### N+1 Query Patterns from ORMs

Executing one query to load a list of entities, then executing a separate query for each entity to load related data. This is the most common ORM performance problem and appears in EF Core, Dapper result mapping, and any ORM that supports lazy loading.

**Detection:** Enable query logging and look for repeated queries that differ only in a parameter value. In EF Core, check for lazy-loading proxies enabled without `.Include()` usage. In application code, look for database calls inside `foreach` loops over previously loaded collections.

### Not Using Transactions for Multi-Step Operations

Performing multiple related database writes (insert, update, delete) without wrapping them in a transaction. If any step fails, the database is left in an inconsistent state.

**Detection:** Look for multiple `ExecuteNonQuery`, `SaveChanges`, or `Execute` calls in sequence without a surrounding `BEGIN`/`COMMIT` block, `TransactionScope`, or EF Core transaction. Check that error handling includes a rollback path.

### Storing Time-Series Data in Relational DB Instead of InfluxDB

Using MariaDB or PostgreSQL tables to store high-frequency time-series data (sensor readings, metrics, logs with timestamps) that is primarily queried by time range and aggregated. Relational databases lack native time-series optimizations such as automatic downsampling, retention policies, and time-partitioned storage.

**Detection:** Look for tables with a timestamp primary key or indexed timestamp column that receive frequent inserts and are queried primarily with time-range filters and aggregate functions (`AVG`, `SUM`, `COUNT` grouped by time intervals). If the project already uses InfluxDB, verify that time-series workloads are routed there rather than to the relational database.

### Unbounded Queries Without LIMIT

Executing queries that can return an unlimited number of rows. Without a `LIMIT` clause (or `TOP` in SQL Server), a table that grows over time will eventually cause out-of-memory errors or extreme response times.

**Detection:** Search for `SELECT` statements in application code that lack a `LIMIT`, `TOP`, or `FETCH FIRST` clause. Check ORM queries for `.ToList()` or `.ToArray()` calls without a preceding `.Take()` or pagination. In InfluxDB Flux queries, verify that `limit()` or a bounded `range()` is applied.

### Using String Interpolation for SQL Queries

Building SQL queries with string interpolation (`$"SELECT * FROM users WHERE id = {userId}"`) or concatenation instead of parameterized queries. This creates SQL injection vulnerabilities and prevents query plan caching.

**Detection:** Search for string interpolation (`$"..."` in C#, f-strings or `.format()` in Python, template literals in JavaScript) containing SQL keywords. Look for string concatenation with `+` that includes `SELECT`, `INSERT`, `UPDATE`, `DELETE`, or `WHERE`. Verify that all SQL execution uses parameterized queries (`@param` in ADO.NET, `$1` in PostgreSQL, `?` in MariaDB/MySQL).

---

## PHP Anti-Patterns

### Using `mysql_*` Functions

The `mysql_*` extension was removed in PHP 7.0. Any code still referencing `mysql_connect`, `mysql_query`, or `mysql_fetch_assoc` is broken on modern PHP and is inherently vulnerable to SQL injection.

**Detection:** Search for `mysql_connect`, `mysql_query`, `mysql_real_escape_string`. Replace with PDO or mysqli with prepared statements.

### Trusting `$_GET` / `$_POST` / `$_REQUEST` Without Validation

Directly using superglobal input in queries, file operations, or output without validation or sanitization.

**Detection:** Search for `$_GET[`, `$_POST[`, `$_REQUEST[`, `$_COOKIE[` used directly in `query()`, `exec()`, `echo`, `file_get_contents()`, `include()`, or `require()` without prior validation.

### Using `eval()` or `preg_replace` with `e` Modifier

`eval()` executes arbitrary PHP code. The `e` modifier in `preg_replace` (removed in PHP 7.0) also evaluates replacement as PHP. Both are code injection vectors.

**Detection:** Search for `eval(`, `assert(` with string arguments, `preg_replace` with `/e` flag.

### Not Setting `PDO::ATTR_EMULATE_PREPARES` to `false`

PDO emulates prepared statements by default, which means parameters are still interpolated client-side. This provides weaker protection than server-side prepared statements.

**Detection:** Look for `new PDO(` without `ATTR_EMULATE_PREPARES => false` in the options array.

### Exposing `.env` or Configuration Files via Web Server

Laravel's `.env` file or other config files accessible through the web root.

**Detection:** Check that `.htaccess` or nginx config blocks access to dotfiles. Verify that `public/` is the document root, not the project root. Check for `storage/` and `vendor/` accessible via URL.

### Mixing Business Logic in Blade/Twig Templates

Heavy PHP logic inside template files defeats the purpose of MVC separation and makes testing impossible.

**Detection:** Look for database queries, API calls, or complex business logic inside `.blade.php` or `.twig` files. Templates should only contain presentation logic (loops, conditionals for display).

---

## Angular Anti-Patterns

### Subscribing Without Unsubscribing

Subscribing to Observables in components without cleaning up on destruction causes memory leaks.

**Detection:** Search for `.subscribe(` in component files without corresponding `unsubscribe()` in `ngOnDestroy`, or without using `takeUntil`, `takeUntilDestroyed()`, or the `async` pipe.

### Fat Components

Components that contain HTTP calls, business logic, state management, and presentation in one file. Should be split into smart (container) and dumb (presentational) components.

**Detection:** Look for components that inject `HttpClient` directly and contain both template logic and data manipulation. Check for components exceeding 200 lines.

### Using `any` Type Extensively

Defeats TypeScript's type safety. Common in Angular projects migrated from JavaScript.

**Detection:** Search for `: any` declarations. Check HTTP responses typed as `any` instead of proper interfaces. Look for `@ts-ignore` comments.

### Not Using `trackBy` in `*ngFor`

Without `trackBy`, Angular destroys and recreates all DOM elements when the array reference changes, even if the data is identical.

**Detection:** Search for `*ngFor=` without a `; trackBy:` clause, especially on lists with more than a few items or items containing child components.

### Direct DOM Manipulation

Using `document.getElementById`, `document.querySelector`, or jQuery instead of Angular's `Renderer2`, `@ViewChild`, or template references. Breaks server-side rendering and bypasses Angular's change detection.

**Detection:** Search for `document.get`, `document.query`, `jQuery`, `$('` in Angular component or service files.

### Circular Dependency Between Services

Two or more services that inject each other, causing runtime errors or infinite loops.

**Detection:** Angular CLI reports circular dependencies during build. Search for service pairs where Service A injects Service B and vice versa.

---

## SQL Server Anti-Patterns

### Using `NOLOCK` Hint Everywhere

Adding `WITH (NOLOCK)` to every query to "improve performance." This reads uncommitted data (dirty reads) and can return phantom rows or miss rows entirely.

**Detection:** Search for `NOLOCK` or `READ UNCOMMITTED`. Verify each usage is intentional and acceptable for that specific query. Most OLTP queries should NOT use NOLOCK.

### Cursors Instead of Set-Based Operations

Using `DECLARE CURSOR` / `FETCH NEXT` to process rows one-by-one instead of set-based SQL operations. Cursors are orders of magnitude slower.

**Detection:** Search for `DECLARE CURSOR`, `FETCH NEXT`, `@@FETCH_STATUS`. Replace with `UPDATE ... FROM`, `MERGE`, CTEs, or window functions.

### Missing `SET NOCOUNT ON` in Stored Procedures

Without `SET NOCOUNT ON`, SQL Server sends row-count messages for every statement in a procedure, adding network overhead and sometimes confusing ORMs.

**Detection:** Check stored procedures for `SET NOCOUNT ON` as the first statement after `AS BEGIN`.

### Implicit Conversions in WHERE Clauses

Comparing columns of different types (e.g., `WHERE varchar_column = @intParam`) causes SQL Server to implicitly convert every row, preventing index usage.

**Detection:** Review execution plans for `CONVERT_IMPLICIT` warnings. Check WHERE clauses where parameter types don't match column types.

---

## MongoDB Anti-Patterns

### Not Creating Indexes for Query Patterns

MongoDB performs collection scans without indexes, just like relational databases. Every query pattern needs a supporting index.

**Detection:** Run `db.collection.explain("executionStats").find(...)` and look for `COLLSCAN` instead of `IXSCAN`. Review application queries and cross-reference with `db.collection.getIndexes()`.

### Unbounded Array Growth in Documents

Using `$push` to append to arrays without bounds. MongoDB documents have a 16MB size limit, and large arrays degrade read/write performance.

**Detection:** Search for `$push` without `$slice` or `$each` with a size limit. Check schema design for arrays that grow proportionally to user activity (e.g., storing all user events in the user document).

### Using ObjectId Strings Instead of ObjectId Type

Querying with string representations of ObjectIds instead of proper `ObjectId()` instances returns no results without errors.

**Detection:** Search for `.find({ _id: someStringVariable })` without `new ObjectId(someStringVariable)` wrapping.

### Embedding Large Related Data Instead of Referencing

Embedding frequently-updated subdocuments inside parent documents causes the entire parent to be rewritten on every update.

**Detection:** Look for documents with deeply nested structures that change independently. If a subdocument is updated more frequently than its parent, it should be a separate collection with a reference.
