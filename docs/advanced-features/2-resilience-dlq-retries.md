# Resilience: Rate Limiting, Retries, Circuit Breaker & DLQ

In distributed systems, things fail: databases go down, external APIs return errors, and services get overloaded. If a consumer fails while processing a message, you need a clear strategy so messages are not lost and your system does not spiral into repeated failures.

This page describes the built-in resilience features: **rate limiting**, **auto-retry**, **circuit breaker**, and **Dead Letter Queue (DLQ)**. It also covers **idempotency**, **graceful shutdown**, **trace ID injection**, and **schema validation**. All of these work with **any supported broker** (Kafka, RabbitMQ, Redis, SQS, NATS, MQTT, ActiveMQ).

---

## 1. Rate limiting (throttling)

**What it does:** Limits how many messages per second the consumer processes. This protects downstream resources (e.g. a database or API) from being overwhelmed.

**When to use it:** For example, if your database can handle only 50 writes per second, you should not let the consumer process thousands of messages per second; it would cause timeouts and crashes.

**How to enable:** Add `rateLimit` under `enterprise`:

```typescript
const broker = await MessageBrokerFactory.create({
  type: 'rabbitmq',
  options: { url: 'amqp://localhost' },
  enterprise: {
    rateLimit: { enabled: true, maxMessagesPerSecond: 50 },
  },
});
```

---

## 2. Exponential auto-retry

**What it does:** If your message handler throws an error, the kit retries it a fixed number of times with increasing delays (exponential backoff), e.g. 2s, then 4s, then 8s.

**When to use it:** For transient failures (e.g. a temporary 502 from an external API). After max retries, the message can be sent to the DLQ instead of being lost.

**How to enable:** Add `autoRetry` under `enterprise`:

```typescript
const broker = await MessageBrokerFactory.create({
  type: 'sqs',
  options: { region: 'us-east-1', queueUrl: 'https://sqs...' },
  enterprise: {
    autoRetry: {
      enabled: true,
      maxRetries: 3,
      initialDelayMs: 2000,
    },
  },
});
```

---

## 3. Circuit breaker

**What it does:** After a number of **consecutive** failures (`failureThreshold`), the circuit "opens": the kit stops calling your handler for new messages for a period (`resetTimeoutMs`) and can send them straight to the DLQ. After the timeout, it tries again (half-open), and if a call succeeds, the circuit closes and processing continues.

**When to use it:** When a dependency (e.g. payment API) is completely down. Retrying every message for hours wastes resources and delays recovery; the circuit breaker fails fast and gives the dependency time to recover.

**How to enable:** Add `circuitBreaker` under `enterprise`:

```typescript
const broker = await MessageBrokerFactory.create({
  type: 'redis',
  options: { url: 'redis://localhost' },
  enterprise: {
    circuitBreaker: {
      enabled: true,
      failureThreshold: 5,
      resetTimeoutMs: 10000,
    },
  },
});
```

---

## 4. Dead Letter Queue (DLQ)

**What it does:** When a message has exhausted all retries (or is skipped by the circuit breaker), the kit can publish it to a separate topic/queue (the DLQ). The payload includes the original data plus error reason and timestamp. You can later inspect or replay these messages (e.g. with the [Smart DLQ Dashboard](../tools/1-smart-dlq-dashboard.md)).

**When to use it:** Whenever you use retries or circuit breaker, so that failed messages are not lost and can be fixed or replayed.

**How to enable:** Add `dlq` under `enterprise`:

```typescript
const broker = await MessageBrokerFactory.create({
  type: 'kafka',
  options: { clientId: 'app', brokers: ['localhost:9092'] },
  enterprise: {
    dlq: { enabled: true, topicName: 'Global_Failed_Events' },
  },
});
```

---

## 5. Idempotency

**What it does:** The kit adds a unique `messageId` to each published message. On the consumer side, it remembers recent message IDs (for `ttlMs`). If the same `messageId` is seen again (e.g. duplicate delivery or replay), the message is skipped so your handler is not run twice for the same logical event.

**When to use it:** When your handler must not run twice for the same message (e.g. charging a card or creating a record). Works best with at-least-once delivery.

**How to enable:** Add `idempotency` under `enterprise`:

```typescript
const broker = await MessageBrokerFactory.create({
  type: 'rabbitmq',
  options: { url: 'amqp://localhost' },
  enterprise: {
    idempotency: { enabled: true, ttlMs: 60000 }, // 1 hour
  },
});
```

---

## 6. Graceful shutdown

**What it does:** When the process receives SIGINT or SIGTERM (e.g. Ctrl+C or Kubernetes stop), the kit closes producer and consumer connections cleanly and then exits. This reduces the chance of leaving unacked messages or half-open connections.

**When to use it:** In production, especially in containers or orchestrated environments.

**How to enable:** Add `gracefulShutdown` under `enterprise`:

```typescript
const broker = await MessageBrokerFactory.create({
  type: 'rabbitmq',
  options: { url: 'amqp://localhost' },
  enterprise: {
    gracefulShutdown: { enabled: true },
  },
});
```

---

## 7. Trace ID injection (OpenTelemetry-style)

**What it does:** For each published message, if the payload does not already have a trace ID, the kit adds a `traceId` in the message headers. You can use this to correlate logs and spans across services.

**When to use it:** When you want distributed tracing or log correlation without integrating a full OpenTelemetry SDK first.

**How to enable:** Add `openTelemetry` under `enterprise`:

```typescript
const broker = await MessageBrokerFactory.create({
  type: 'rabbitmq',
  options: { url: 'amqp://localhost' },
  enterprise: {
    openTelemetry: { enabled: true },
  },
});
```

Your consumer can read `msg.headers.traceId` and attach it to logs or metrics.

---

## 8. Schema validation (Zod)

**What it does:** When you call `publish()`, you can pass a `schema` (e.g. a Zod schema). The kit validates the message payload with that schema before sending. If validation fails, the message is not published and an error is thrown.

**When to use it:** To enforce a contract for event payloads and catch bad data at the publisher.

**How to use it:** Pass `schema` in the publish call (not in `enterprise`):

```typescript
import { z } from 'zod';

const OrderSchema = z.object({
  orderId: z.number(),
  total: z.number().positive(),
  currency: z.string().length(3),
});

await broker.publish({
  topic: 'Orders',
  event: 'OrderCreated',
  message: { orderId: 1, total: 99.99, currency: 'USD' },
  schema: OrderSchema,
});
// If message does not match OrderSchema, publish throws.
```

---

## Full example: all resilience features together

```typescript
import { MessageBrokerFactory } from '@universal-broker/cli';

const broker = await MessageBrokerFactory.create({
  type: 'rabbitmq',
  options: { url: 'amqp://localhost' },
  enterprise: {
    rateLimit:      { enabled: true, maxMessagesPerSecond: 50 },
    autoRetry:      { enabled: true, maxRetries: 3, initialDelayMs: 2000 },
    circuitBreaker: { enabled: true, failureThreshold: 5, resetTimeoutMs: 10000 },
    dlq:            { enabled: true, topicName: 'My_Dead_Letters' },
    idempotency:    { enabled: true, ttlMs: 60000 },
    gracefulShutdown: { enabled: true },
    openTelemetry:  { enabled: true },
  },
});

async function myHandler(msg) {
  console.log('Processing order', msg.data.orderId, 'traceId:', msg.headers.traceId);
  // Simulate failure for demo:
  throw new Error('Database connection refused');
}

await broker.subscribe(myHandler, 'OrdersQueue');
```

**What happens when a message fails:**  
1. Handler throws → kit waits 2s, retries.  
2. Fails again → waits 4s, retries.  
3. Fails again → waits 8s, retries.  
4. After 3 retries, message is published to `My_Dead_Letters` (DLQ).  
5. If many messages fail in a row, the circuit opens and new messages go to DLQ until the reset timeout.  
6. Duplicate deliveries with the same `messageId` are skipped.  
7. On SIGINT/SIGTERM, connections close and the process exits.

To inspect and re-enqueue failed messages, use the [Smart DLQ Dashboard](../tools/1-smart-dlq-dashboard.md).

---

**Related:** [Features Overview](../features-overview.md) · [Payload Encryption](./1-payload-encryption.md) · [Smart DLQ Dashboard](../tools/1-smart-dlq-dashboard.md) · [Troubleshooting](../troubleshooting.md) · [Doc Hub](../INDEX.md)
