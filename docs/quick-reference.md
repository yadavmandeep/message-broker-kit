# Quick Reference

> Cheat sheet for Message Broker Kit — API, config snippets, and common patterns.

---

## Installation

```bash
npm install message-broker-kit
# Plus driver for your broker, e.g.:
npm install amqplib      # RabbitMQ
npm install kafkajs      # Kafka
npm install redis        # Redis
npm install @aws-sdk/client-sqs  # AWS SQS
npm install nats         # NATS
npm install mqtt         # MQTT
npm install stompit      # ActiveMQ
```

---

## Create Broker (Minimal)

```typescript
import { MessageBrokerFactory } from 'message-broker-kit';

const broker = MessageBrokerFactory.create({
  type: 'rabbitmq',  // kafka | redis | sqs | nats | mqtt | activemq | hybrid | serverless
  options: { url: 'amqp://localhost' }
});
```

Full configs: [Broker Configuration Reference](./configuration/broker-configs.md)

---

## Publish

```typescript
await broker.publish({
  topic: 'Orders',           // Queue/topic name
  event: 'OrderCreated',     // Event type
  message: { id: 1, total: 99.99 },  // Payload (any JSON)
  headers: { source: 'api' } // Optional
});
```

---

## Subscribe

```typescript
await broker.subscribe(async (msg) => {
  console.log(msg.event, msg.data, msg.headers);
  // msg.event  → 'OrderCreated'
  // msg.data   → { id: 1, total: 99.99 }
  // msg.headers → { source: 'api' }
}, 'Orders');
```

---

## Enterprise Options (One-Liner Reference)

```typescript
enterprise: {
  rateLimit:      { enabled: true, maxMessagesPerSecond: 50 },
  autoRetry:      { enabled: true, maxRetries: 3, initialDelayMs: 2000 },
  circuitBreaker: { enabled: true, failureThreshold: 5, resetTimeoutMs: 10000 },
  dlq:            { enabled: true, topicName: 'DeadLetters' },
  encryption:     { enabled: true, secretKey: '32-char-key...', fieldsToEncrypt: ['ssn'] },
  idempotency:    { enabled: true, ttlMs: 60000 },
  gracefulShutdown: { enabled: true },
  openTelemetry:  { enabled: true }
}
```

Details: [Resilience & DLQ](./advanced-features/2-resilience-dlq-retries.md) | [Encryption](./advanced-features/1-payload-encryption.md)

---

## Transactional Outbox (Snippet)

```typescript
import { MessageBrokerFactory, OutboxProcessor, IOutboxStorage } from 'message-broker-kit';

class MyOutbox implements IOutboxStorage {
  async fetchPendingMessages(limit: number) { /* SELECT * FROM outbox WHERE status='PENDING' LIMIT ? */ }
  async markAsProcessed(id: string) { /* UPDATE outbox SET status='PROCESSED' */ }
  async markAsFailed(id: string, error: string) { /* UPDATE outbox SET status='FAILED' */ }
}

const broker = MessageBrokerFactory.create({ type: 'rabbitmq', options: { url: 'amqp://localhost' } });
const outbox = new OutboxProcessor(broker, new MyOutbox(), { pollIntervalMs: 5000, batchSize: 100 });
outbox.start();
```

Full guide: [Transactional Outbox](./architecture/1-transactional-outbox.md)

---

## Saga Pattern (Snippet)

```typescript
import { SagaCoordinator, MessageBrokerFactory } from 'message-broker-kit';

const broker = MessageBrokerFactory.create({ type: 'redis', options: { url: 'redis://localhost' } });
const saga = new SagaCoordinator(broker);

saga.startSaga('order-tx-123');
saga.addAction({
  name: 'ReserveInventory',
  topic: 'InventoryQueue',
  payload: { itemId: 4, qty: 1 },
  compensationEvent: 'RestockInventory'
});
await saga.execute(); // Rolls back on failure
```

Full guide: [Saga Pattern](./architecture/2-saga-pattern.md)

---

## Smart DLQ Dashboard

```typescript
import { SmartDLQDashboard, MessageBrokerFactory } from 'message-broker-kit';

const broker = MessageBrokerFactory.create({ type: 'rabbitmq', options: { url: 'amqp://localhost' } });
const dashboard = new SmartDLQDashboard(broker, myDeadLetterDb, { port: 4000, apiPath: '/api/dlq' });
dashboard.start();
// Open http://localhost:4000/broker-ui
```

Full guide: [Smart DLQ Dashboard](./tools/1-smart-dlq-dashboard.md)

---

## Broker Type Quick Switch

| From | To | Change |
|------|----|--------|
| RabbitMQ | Kafka | `type: 'kafka'`, `options: { brokers: ['localhost:9092'] }` |
| Kafka | Redis | `type: 'redis'`, `options: { url: 'redis://localhost' }` |
| Any | AWS SQS | `type: 'sqs'`, `options: { queueUrl: '...', region: 'us-east-1' }` |
| Any | Serverless | `type: 'serverless'`, `options: { restProxyUrl: '...' }` |

---

## Related Docs

- [Documentation Hub](./INDEX.md)
- [Setup & Basic Usage](./getting-started/1-setup-and-basic-usage.md)
- [Broker Configs](./configuration/broker-configs.md)
- [Troubleshooting](./troubleshooting.md)
