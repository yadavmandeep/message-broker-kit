# Smart DLQ Dashboard

The **Smart DLQ Dashboard** is a web UI that lets you view failed messages (e.g. from your outbox or DLQ storage), inspect their payloads, and **re-enqueue** them back to the broker with one click. It is useful when messages have been marked as FAILED in your outbox or sent to a Dead Letter Queue and you want to fix the cause and retry without writing custom scripts.

**Works with any broker:** RabbitMQ, Kafka, SQS, Redis, NATS, MQTT, ActiveMQ. The dashboard uses the same broker instance you use in your app to push re-enqueued messages.

---

## What you need

1. A **broker instance** (created with `MessageBrokerFactory`) so the dashboard can publish re-enqueued messages.
2. A **storage implementation** that returns failed/pending DLQ-style records. Often this is the same `IOutboxStorage` (or a similar interface) you use for the [Transactional Outbox](../architecture/1-transactional-outbox.md), but that returns rows where `status = 'FAILED'` (or your equivalent) so the dashboard can list them and, after a successful re-enqueue, mark them as PROCESSED.

The dashboard does not replace your broker’s native DLQ topic: it gives you a **UI over your own store** of failed events (e.g. outbox table with status FAILED). If your failed messages live only in a broker topic (e.g. Kafka topic `DeadLetters`), you would need a small adapter that reads from that topic and exposes something like `fetchPendingMessages` / `markAsProcessed` for the dashboard to use.

---

## Setup

1. Create a broker (any type).
2. Implement the storage the dashboard expects (e.g. your outbox storage that can list FAILED messages and mark them PROCESSED).
3. Instantiate `SmartDLQDashboard` with the broker, storage, and options (port, API path).
4. Call `dashboard.start()` so the Express server and UI are served.

Example:

```typescript
import { MessageBrokerFactory } from '@universal-broker/cli';
import { SmartDLQDashboard } from '@universal-broker/core';

const broker = await MessageBrokerFactory.create({
  type: 'rabbitmq',
  options: { url: 'amqp://localhost' },
});

// Use the same storage you use for OutboxProcessor, or an adapter that returns FAILED messages.
const failedMessageStorage = new MyOutboxStorage();

const dashboard = new SmartDLQDashboard(broker, failedMessageStorage, {
  port: 4000,
  apiPath: '/api/dlq',
});

dashboard.start();

console.log('DLQ Dashboard: http://localhost:4000/broker-ui');
```

Open **http://localhost:4000/broker-ui** in your browser.

---

## Dashboard options

| Option | Description |
|--------|-------------|
| `port` | HTTP port for the Express server (e.g. 4000). |
| `apiPath` | Base path for the API the UI calls (e.g. `/api/dlq`). |

---

## What the dashboard does

- **List failed messages** — Fetches records from your storage (e.g. outbox rows with status FAILED) and shows them in a table.
- **Inspect payload** — Shows the message payload (and metadata) in a readable, scrollable view so you can see why it might have failed.
- **Re-enqueue** — Sends the message back to the broker (same topic/event/payload as the original) and marks the record as PROCESSED in your storage so it disappears from the failed list. Use this after fixing the underlying issue (e.g. bug fix or dependency back online).

The UI typically includes light/dark mode and confirmation (e.g. SweetAlert) before re-enqueue so you don’t retry by accident.

---

## Storage contract (for the dashboard)

The dashboard expects your storage to support the same idea as `IOutboxStorage`:

- **Fetch failed (or DLQ) messages** — e.g. return rows where `status = 'FAILED'` with `id`, `topic`, `event`, `message`, `headers`, etc., in the shape of `OutboxMessage` or equivalent.
- **Mark as processed** — After a successful re-enqueue, the dashboard calls something like `markAsProcessed(id)` so the record is no longer shown as failed.

If your failed messages live in an outbox table, you can use the same `IOutboxStorage` implementation and have the dashboard’s "fetch" query filter by `status = 'FAILED'`. If they live only in a broker DLQ topic, you need an adapter that reads from that topic and exposes a similar fetch/markAsProcessed API.

---

## Full example (with PostgreSQL outbox)

Assume you already have a `PostgresOutbox` that implements `IOutboxStorage` and an `outbox_events` table with a `status` column. To show only FAILED rows in the dashboard, add a method or a separate class that fetches only FAILED:

```typescript
import { IOutboxStorage, OutboxMessage } from '@universal-broker/core';

class PostgresDLQStorage implements IOutboxStorage {
  async fetchPendingMessages(limit: number): Promise<OutboxMessage[]> {
    const result = await pool.query(
      `SELECT id, topic, event, message, headers, status, retry_count as "retryCount", created_at as "createdAt"
       FROM outbox_events
       WHERE status = 'FAILED'
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  async markAsProcessed(id: string): Promise<void> {
    await pool.query(
      `UPDATE outbox_events SET status = 'PROCESSED' WHERE id = $1`,
      [id]
    );
  }

  async markAsFailed(id: string, error: string): Promise<void> {
    // Already failed; could update error message or retry count
    await pool.query(
      `UPDATE outbox_events SET retry_count = retry_count + 1 WHERE id = $1`,
      [id]
    );
  }
}
```

Then pass `PostgresDLQStorage` to `SmartDLQDashboard` instead of the main outbox storage, so the dashboard only shows and retries failed events.

---

**Related:** [Resilience & DLQ](../advanced-features/2-resilience-dlq-retries.md) · [Transactional Outbox](../architecture/1-transactional-outbox.md) · [Features Overview](../features-overview.md) · [Doc Hub](../INDEX.md)
