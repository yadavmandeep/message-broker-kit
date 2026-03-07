# Transactional Outbox Pattern

The **transactional outbox pattern** solves the **dual-write problem**: when you update a database and also publish a message, one of them can succeed while the other fails, leaving your system inconsistent. With the outbox, you only write to the database (including an "outbox" table) in a single transaction. A separate process reads pending outbox rows and publishes them to the broker. That way, delivery is tied to your database transaction and can be retried until success.

**Works with any broker:** RabbitMQ, Kafka, SQS, Redis, NATS, MQTT, ActiveMQ.

---

## The problem (without outbox)

Example: your API creates a user in PostgreSQL and then publishes a `UserCreated` event to RabbitMQ.

1. Database insert succeeds.
2. RabbitMQ is temporarily down or times out.
3. The user exists in the DB, but no event is published. Downstream services (e.g. analytics, email) never see the user. Your system is inconsistent.

If you publish first and then write to the DB, the opposite can happen: the event is sent but the DB write fails.

---

## The solution: outbox table + background publisher

1. In the **same database transaction** as your business logic, you insert a row into an **outbox** table with the event data (topic, event name, payload, status = PENDING).
2. You commit the transaction. Either both your business row and the outbox row are saved, or neither is.
3. A **background worker** (the kit’s `OutboxProcessor`) periodically reads pending rows from the outbox, publishes each to the broker, and then marks the row as PROCESSED (or FAILED after max retries).

So publishing is **eventually consistent** and driven by the database; no separate "write to DB then write to broker" that can get out of sync.

---

## What you need to implement

The kit provides `OutboxProcessor` and the interface `IOutboxStorage`. You provide the storage implementation (e.g. PostgreSQL, MySQL, MongoDB) that:

- Fetches pending messages (e.g. `status = 'PENDING'`).
- Marks a message as processed or failed after publish attempt.

Your outbox table (or collection) should store at least: an ID, topic, event, payload (message), status, and optionally headers and retry count. The kit expects messages in the shape of `OutboxMessage` (see below).

---

## OutboxMessage shape

Each item returned by `fetchPendingMessages` should look like this:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique ID of the outbox row. |
| `topic` | string | Broker topic/queue to publish to. |
| `event` | string | Event name (e.g. `UserCreated`). |
| `message` | any | The JSON payload to send. |
| `headers` | Record<string, string> | Optional headers. |
| `status` | 'PENDING' \| 'PROCESSED' \| 'FAILED' | Optional; your storage can use this. |
| `retryCount` | number | Optional; number of publish attempts. |
| `createdAt` | string \| Date | Optional. |

---

## Full example: PostgreSQL outbox

### 1. Database table (example schema)

```sql
CREATE TABLE outbox_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic         VARCHAR(255) NOT NULL,
  event         VARCHAR(255) NOT NULL,
  message       JSONB NOT NULL,
  headers       JSONB DEFAULT '{}',
  status        VARCHAR(50) DEFAULT 'PENDING',
  retry_count   INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_outbox_status ON outbox_events (status) WHERE status = 'PENDING';
```

### 2. Implement IOutboxStorage

```typescript
import { Pool } from 'pg';
import { IOutboxStorage, OutboxMessage } from '@universal-broker/core';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

class PostgresOutbox implements IOutboxStorage {
  async fetchPendingMessages(limit: number): Promise<OutboxMessage[]> {
    const result = await pool.query(
      `SELECT id, topic, event, message, headers, status, retry_count as "retryCount", created_at as "createdAt"
       FROM outbox_events
       WHERE status = 'PENDING'
       ORDER BY created_at ASC
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
    await pool.query(
      `UPDATE outbox_events SET status = 'FAILED', retry_count = retry_count + 1 WHERE id = $1`,
      [id]
    );
  }
}
```

### 3. Write to outbox in your API (same transaction as business logic)

```typescript
import { pool } from './db';

async function createUser(email: string, name: string) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userResult = await client.query(
      'INSERT INTO users (email, name) VALUES ($1, $2) RETURNING id',
      [email, name]
    );
    const userId = userResult.rows[0].id;
    await client.query(
      `INSERT INTO outbox_events (topic, event, message, status)
       VALUES ($1, $2, $3, 'PENDING')`,
      ['Users', 'UserCreated', JSON.stringify({ userId, email, name })]
    );
    await client.query('COMMIT');
    return userId;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
```

### 4. Start the OutboxProcessor

```typescript
import { MessageBrokerFactory } from '@universal-broker/cli';
import { OutboxProcessor } from '@universal-broker/core';

const broker = await MessageBrokerFactory.create({
  type: 'rabbitmq',
  options: { url: 'amqp://localhost' },
});

const storage = new PostgresOutbox();
const outboxProcessor = new OutboxProcessor(broker, storage, {
  pollIntervalMs: 5000,
  batchSize: 100,
  maxRetries: 3,
});

outboxProcessor.start();
console.log('Outbox processor running. Pending events will be published to the broker.');
```

---

## OutboxProcessor options

| Option | Default | Description |
|--------|---------|-------------|
| `pollIntervalMs` | 5000 | How often to poll the outbox table (milliseconds). |
| `batchSize` | 100 | Max number of messages to fetch per poll. |
| `maxRetries` | 3 | After this many failed publish attempts, the message is marked as FAILED. |
| `enabled` | true | Set to false to disable polling. |

---

## Summary

| Step | Who does it |
|------|----------------|
| Insert business data + outbox row in one transaction | Your API |
| Poll outbox, publish to broker, mark PROCESSED/FAILED | `OutboxProcessor` + your `IOutboxStorage` |

**Related:** [Features Overview](../features-overview.md) · [Saga Pattern](./2-saga-pattern.md) · [Smart DLQ Dashboard](../tools/1-smart-dlq-dashboard.md) · [Doc Hub](../INDEX.md)
