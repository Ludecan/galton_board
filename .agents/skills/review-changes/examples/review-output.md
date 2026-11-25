# Example: Structured Code Review Output

The following is a complete example of the expected output format for a code review.

---

## Code Review: Order processing service changes

### src/orders/order-service.ts

**[CRITICAL] Race condition in concurrent order updates** (lines 45-52)

The `updateOrderStatus` method reads the current order, checks its status, and then writes the new status in three separate database calls without a transaction or optimistic locking. Two concurrent requests can both read status "pending," both pass the validation check, and both write conflicting updates (e.g., one sets "shipped" while the other sets "cancelled"). The last write wins silently.

**Rationale:** This will cause order state corruption in production. Customers may receive shipments for cancelled orders, or cancelled orders may be billed.

**Suggested fix:**
Wrap the read-check-write sequence in a database transaction with a `SELECT ... FOR UPDATE` lock on the order row:
```typescript
async updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<Order> {
  return this.db.transaction(async (tx) => {
    const order = await tx.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [orderId]);
    if (!order) throw new OrderNotFoundError(orderId);
    validateStatusTransition(order.status, newStatus);
    return tx.query('UPDATE orders SET status = $1 WHERE id = $2 RETURNING *', [newStatus, orderId]);
  });
}
```

---

**[MAJOR] Missing authorization check on order cancellation** (line 67)

The `cancelOrder` method accepts an `orderId` parameter and cancels the order without verifying that the requesting user owns the order or has admin privileges. Any authenticated user can cancel any other user's order by guessing or iterating order IDs.

**Rationale:** This is a horizontal privilege escalation vulnerability. An attacker can disrupt other users' orders.

**Suggested fix:**
Add an ownership check before proceeding:
```typescript
const order = await this.getOrder(orderId);
if (order.userId !== requestingUserId && !user.hasRole('admin')) {
  throw new ForbiddenError('Not authorized to cancel this order');
}
```

---

**[MAJOR] Unhandled promise rejection in payment processing** (line 89)

The call to `paymentGateway.refund(order.paymentId)` is not wrapped in a try/catch and has no `.catch()` handler. If the refund fails (network timeout, invalid payment ID, gateway error), the promise rejects, the order status is left in an inconsistent state ("cancelling" rather than "cancelled" or "cancel_failed"), and the error propagates as an unhandled rejection.

**Rationale:** In production, this will leave orders in a limbo state that requires manual intervention to resolve. The user receives a generic 500 error with no indication of what went wrong.

**Suggested fix:**
```typescript
try {
  await paymentGateway.refund(order.paymentId);
  await this.updateOrderStatus(orderId, 'cancelled');
} catch (err) {
  await this.updateOrderStatus(orderId, 'cancel_failed');
  logger.error('Refund failed for order', { orderId, paymentId: order.paymentId, error: err });
  throw new RefundFailedError(orderId, err);
}
```

---

### src/orders/order-validator.ts

**[MINOR] Duplicated validation logic** (lines 12-28 and lines 34-50)

The `validateCreateOrder` and `validateUpdateOrder` functions both contain identical checks for item quantity ranges, price format, and shipping address structure. If the validation rules change, both functions must be updated in sync.

**Rationale:** Duplicated validation logic is a maintenance risk. A future change that updates one function but not the other will create inconsistent behavior between create and update paths.

**Suggested fix:**
Extract the shared validation into a `validateOrderFields` function and call it from both:
```typescript
function validateOrderFields(fields: OrderFields): ValidationResult {
  // shared checks for quantity, price, address
}

function validateCreateOrder(input: CreateOrderInput): ValidationResult {
  const base = validateOrderFields(input);
  // create-specific checks (e.g., required fields)
  return base.merge(createChecks);
}
```

---

**[MINOR] Magic number for maximum item quantity** (line 15)

The quantity check `if (item.quantity > 9999)` uses a hardcoded number without explanation. It is unclear whether 9999 is a business rule, a database column limit, or an arbitrary guard.

**Rationale:** Future developers will not know whether they can safely change this number or what constraint it represents.

**Suggested fix:**
Extract to a named constant:
```typescript
const MAX_ITEM_QUANTITY = 9999; // Business rule: warehouse cannot fulfill single-item orders above this
```

---

### src/orders/order-repository.ts

**[MAJOR] N+1 query pattern in order listing** (lines 30-38)

The `getOrdersWithItems` method fetches all orders, then loops through each order and makes a separate `getItemsByOrderId` query. For a page of 50 orders, this executes 51 database queries.

**Rationale:** The order listing page is the most visited page in the admin dashboard. Under normal load (200 orders per page request, 10 concurrent users), this generates 10,000+ queries per minute for a single endpoint. This will degrade database performance for the entire application.

**Suggested fix:**
Use a single query with a JOIN or a batched IN clause:
```typescript
async getOrdersWithItems(page: number, limit: number): Promise<OrderWithItems[]> {
  const orders = await this.db.query(
    'SELECT o.*, json_agg(i.*) as items FROM orders o LEFT JOIN order_items i ON o.id = i.order_id GROUP BY o.id ORDER BY o.created_at DESC LIMIT $1 OFFSET $2',
    [limit, page * limit]
  );
  return orders.map(mapToOrderWithItems);
}
```

---

**[NIT] Inconsistent naming convention** (line 5)

The method `fetchById` deviates from the naming convention used elsewhere in the repository layer, where all methods use the `get` prefix (`getOrder`, `getOrdersByUserId`, `getOrdersWithItems`).

**Rationale:** Consistent naming reduces cognitive load when navigating the codebase.

**Suggested fix:** Rename to `getById` or `getOrderById` for consistency.

---

### src/orders/order-controller.ts

**[MINOR] Missing input sanitization on sort parameter** (line 22)

The `sortBy` query parameter is passed directly to the repository method without validation against an allowlist. While the repository uses parameterized queries for values, column names cannot be parameterized in most SQL drivers. If `sortBy` reaches a raw SQL `ORDER BY` clause, it enables SQL injection via the column name.

**Rationale:** Even if the current repository implementation is safe, a future refactor that introduces dynamic ORDER BY would inherit this unsanitized input.

**Suggested fix:**
Validate against an explicit allowlist:
```typescript
const ALLOWED_SORT_FIELDS = ['created_at', 'updated_at', 'total', 'status'] as const;
const sortBy = ALLOWED_SORT_FIELDS.includes(req.query.sortBy) ? req.query.sortBy : 'created_at';
```

---

**[NIT] Unused import** (line 3)

The `Logger` import from `@app/logging` is not used in this file. The controller uses `req.log` (the request-scoped logger) instead.

**Rationale:** Unused imports add noise and may cause confusion about which logger is intended for use in this module.

**Suggested fix:** Remove the unused import.

---

## Architectural Observations

The order service directly calls the payment gateway synchronously during cancellation. If the payment gateway is slow or unavailable, the cancellation request blocks and may time out. Consider decoupling the refund step by emitting a cancellation event and processing the refund asynchronously via a worker. This would make the cancellation endpoint more resilient and allow retries with backoff on the refund step.

The repository layer mixes query building and data mapping. Consider separating the query logic from the response mapping to make each independently testable.

---

## Summary

- **Critical:** 1
- **Major:** 3
- **Minor:** 3
- **Nit:** 2
- **Files reviewed:** 4

**Overall assessment:** The order processing changes contain a critical race condition in status updates and a major authorization gap in order cancellation that must be resolved before merge. The N+1 query pattern in order listing will cause performance degradation under production load and should also be addressed. The remaining findings are improvements to code quality and maintainability that can be addressed in this change or tracked for follow-up.
