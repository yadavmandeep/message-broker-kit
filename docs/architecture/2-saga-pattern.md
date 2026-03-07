# Saga Pattern Coordinator

A **saga** coordinates a multi-step workflow across several services. If one step fails, the saga runs **compensation** (rollback) for the steps that already succeeded, so the system can return to a consistent state. The kit provides `SagaCoordinator`, which publishes events for each step and, on failure, publishes compensation events in reverse order.

**Works with any broker:** Redis, RabbitMQ, Kafka, SQS, NATS, MQTT, ActiveMQ.

---

## When to use it

Use a saga when:

- A business flow spans multiple services (e.g. checkout: reserve inventory → charge payment → ship).
- Each step is triggered by publishing a message; the actual work is done by consumers.
- If a later step fails (e.g. payment fails), earlier steps (e.g. inventory reserved) must be undone via compensation events (e.g. "release inventory").

The coordinator only publishes events; your services must **subscribe** to those events and to the **compensation** events and perform the real work and rollback.

---

## How it works

1. You call `saga.startSaga(sagaId)` and then `saga.addAction(...)` for each step. Each action has a name, topic, payload, and a **compensation event** name.
2. You call `saga.execute()`. The coordinator publishes the first action’s event to its topic. (In a full implementation you might wait for a reply; here we assume fire-and-forget or you add your own reply handling.)
3. If all steps are "done" (e.g. you assume success or get acks), the saga completes.
4. If any step fails (you throw or detect failure), the coordinator **rolls back**: it publishes compensation events for all previously executed steps, in **reverse order**, then rethrows.

Your consumers must:

- Handle the normal events (e.g. `ReserveInventory`) and do the work.
- Handle the compensation events (e.g. `RestockInventory`) and undo that work.

---

## Full example: order checkout saga

Scenario: checkout has two steps — reserve inventory, then charge payment. If payment fails, we release inventory.

### 1. Coordinator (orchestrator)

```typescript
import { MessageBrokerFactory } from '@universal-broker/cli';
import { SagaCoordinator } from '@universal-broker/core';

const broker = await MessageBrokerFactory.create({
  type: 'redis',
  options: { url: 'redis://localhost' },
});

const saga = new SagaCoordinator(broker);

async function runCheckout(orderId: string, itemId: string, qty: number, amount: number) {
  const sagaId = `order-${orderId}-${Date.now()}`;
  saga.startSaga(sagaId);

  saga.addAction({
    name: 'ReserveInventory',
    topic: 'Inventory',
    payload: { orderId, itemId, qty },
    compensationEvent: 'ReleaseInventory',
  });

  saga.addAction({
    name: 'ChargePayment',
    topic: 'Payments',
    payload: { orderId, amount },
    compensationEvent: 'RefundPayment',
  });

  try {
    await saga.execute();
    console.log('Checkout completed:', sagaId);
  } catch (err) {
    console.error('Checkout failed; compensations were sent:', err.message);
    throw err;
  }
}

runCheckout('ord-1', 'item-42', 2, 99.99).catch(console.error);
```

### 2. What the coordinator publishes

- **Normal flow:**  
  - Publish to topic `Inventory`: event `ReserveInventory`, payload `{ orderId, itemId, qty }`.  
  - Publish to topic `Payments`: event `ChargePayment`, payload `{ orderId, amount }`.

- **If "ChargePayment" fails:**  
  - Publish to topic `Payments`: event `RefundPayment`, payload `{ originalPayload: {...}, rollbackReason: 'Saga Failed' }`.  
  - Publish to topic `Inventory`: event `ReleaseInventory`, payload `{ originalPayload: {...}, rollbackReason: 'Saga Failed' }`.

Messages include headers such as `sagaId` and `isCompensation: 'true'` for compensation events so your consumers can recognize them.

### 3. Consumers (your services)

Your inventory service subscribes to `Inventory` and handles both events:

```typescript
await broker.subscribe(async (msg) => {
  if (msg.event === 'ReserveInventory') {
    await reserveStock(msg.data.orderId, msg.data.itemId, msg.data.qty);
  } else if (msg.event === 'ReleaseInventory') {
    await releaseStock(msg.data.originalPayload.orderId, msg.data.originalPayload.itemId, msg.data.originalPayload.qty);
  }
}, 'Inventory');
```

Your payment service subscribes to `Payments` and handles both events:

```typescript
await broker.subscribe(async (msg) => {
  if (msg.event === 'ChargePayment') {
    await charge(msg.data.orderId, msg.data.amount);
  } else if (msg.event === 'RefundPayment') {
    await refund(msg.data.originalPayload.orderId);
  }
}, 'Payments');
```

---

## SagaAction shape

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Event name for the forward step (e.g. `ReserveInventory`). |
| `topic` | string | Topic/queue to publish to. |
| `payload` | any | Body to send with the forward event. |
| `compensationEvent` | string | Event name to publish when rolling back (e.g. `ReleaseInventory`). |

---

## Important notes

- **Acks and failure:** The default coordinator does not wait for consumer replies. To make a step "fail" and trigger rollback, you would need to extend the flow (e.g. listen for a "failure" event or use request/reply). The example above shows the structure; you can add your own ack/failure handling.
- **Compensation payload:** On rollback, the kit sends `{ originalPayload, rollbackReason: 'Saga Failed' }` so your consumers know what to undo.
- **Idempotency:** Compensations can be delivered more than once. Make compensations idempotent (e.g. "release inventory for order X" is safe to run twice).

**Related:** [Features Overview](../features-overview.md) · [Transactional Outbox](./1-transactional-outbox.md) · [Resilience & DLQ](../advanced-features/2-resilience-dlq-retries.md) · [Doc Hub](../INDEX.md)
