# Features Overview

This page lists every feature in Universal Broker SDK. Each feature works with **any supported broker** (Kafka, RabbitMQ, Redis, AWS SQS, NATS, MQTT, ActiveMQ). Use this as a map to find the right doc and a short example.

---

## Core API (All Brokers)

| Feature | What it does | Doc / Section |
|--------|----------------|----------------|
| **Publish** | Send a message to a topic/queue. Same method for every broker. | [Setup & Basic Usage](./getting-started/1-setup-and-basic-usage.md#-step-3-publish-a-message) |
| **Subscribe** | Receive messages from a topic/queue. Your handler gets `event`, `data`, `headers`. | [Setup & Basic Usage](./getting-started/1-setup-and-basic-usage.md#-step-4-subscribe-to-messages) |
| **Broker switch** | Change broker by changing only `type` and `options`. No code change. | [Broker Configuration Reference](./configuration/broker-configs.md) |

---

## Enterprise Features (Optional `enterprise` Config)

These are turned on by adding an `enterprise` block to `MessageBrokerFactory.create({ ... })`.

### Security & Data Protection

| Feature | What it does | Example | Doc |
|--------|----------------|---------|-----|
| **Payload encryption** | Encrypts specific fields (e.g. `creditCard`, `ssn`) with AES-256 before sending. Consumer decrypts automatically. | `encryption: { enabled: true, secretKey: '32-char-key...', fieldsToEncrypt: ['creditCard'] }` | [Payload Encryption](./advanced-features/1-payload-encryption.md) |

### Resilience & Failure Handling

| Feature | What it does | Example | Doc |
|--------|----------------|---------|-----|
| **Rate limiting** | Limits how many messages per second the consumer processes (e.g. to protect your DB). | `rateLimit: { enabled: true, maxMessagesPerSecond: 50 }` | [Resilience & DLQ](./advanced-features/2-resilience-dlq-retries.md#1--rate-limiting--throttling) |
| **Auto-retry** | On handler failure, retries with exponential backoff (e.g. 2s, 4s, 8s). | `autoRetry: { enabled: true, maxRetries: 3, initialDelayMs: 2000 }` | [Resilience & DLQ](./advanced-features/2-resilience-dlq-retries.md#2--exponential-auto-retries) |
| **Circuit breaker** | After N consecutive failures, stops processing and sends messages to DLQ for a period, then tries again. | `circuitBreaker: { enabled: true, failureThreshold: 5, resetTimeoutMs: 10000 }` | [Resilience & DLQ](./advanced-features/2-resilience-dlq-retries.md#3--distributed-circuit-breaker-stop-the-bleeding) |
| **Dead Letter Queue (DLQ)** | After retries are exhausted, failed messages are published to a separate topic for inspection or replay. | `dlq: { enabled: true, topicName: 'My_Dead_Letters' }` | [Resilience & DLQ](./advanced-features/2-resilience-dlq-retries.md#4--dead-letter-queue-dlq) |

### Reliability & Observability

| Feature | What it does | Example | Doc |
|--------|----------------|---------|-----|
| **Idempotency** | Adds a unique `messageId` to each message; consumer skips duplicates (same `messageId` seen twice). | `idempotency: { enabled: true, ttlMs: 60000 }` | [Resilience & DLQ](./advanced-features/2-resilience-dlq-retries.md#idempotency) |
| **Graceful shutdown** | On SIGINT/SIGTERM, closes producer and consumer connections before exit. | `gracefulShutdown: { enabled: true }` | [Resilience & DLQ](./advanced-features/2-resilience-dlq-retries.md#graceful-shutdown) |
| **OpenTelemetry (trace ID)** | Injects a `traceId` in message headers for distributed tracing. | `openTelemetry: { enabled: true }` | [Resilience & DLQ](./advanced-features/2-resilience-dlq-retries.md#trace-id-injection-opentelemetry) |
| **Schema validation (Zod)** | Validates the message payload with a Zod schema before publish; invalid payloads are rejected. | Pass `schema: myZodSchema` in `publish({ ... })` | [Resilience & DLQ](./advanced-features/2-resilience-dlq-retries.md#schema-validation-zod) |

---

## Architecture Patterns

| Feature | What it does | Doc |
|--------|----------------|-----|
| **Transactional outbox** | Write events to a DB table in the same transaction as your business data; a background worker publishes them to the broker. Avoids dual-write inconsistency. | [Transactional Outbox](./architecture/1-transactional-outbox.md) |
| **Saga pattern** | Coordinate multi-step workflows across services. If a step fails, compensation events are published to roll back previous steps. | [Saga Pattern](./architecture/2-saga-pattern.md) |
| **Serverless / Edge** | Publish via HTTP to a proxy (no persistent TCP). For Vercel, Cloudflare Workers, Lambda. | [Serverless / Edge](./architecture/3-serverless-edge.md) |

---

## Tools

| Feature | What it does | Doc |
|--------|----------------|-----|
| **Smart DLQ Dashboard** | Web UI to list failed messages (from your outbox/DB), inspect payloads, and re-enqueue them. | [Smart DLQ Dashboard](./tools/1-smart-dlq-dashboard.md) |

---

## Quick Example: Multiple Features Together

```typescript
import { MessageBrokerFactory } from '@universal-broker/cli';

const broker = await MessageBrokerFactory.create({
  type: 'rabbitmq',
  options: { url: 'amqp://localhost' },
  enterprise: {
    encryption:     { enabled: true, secretKey: 'my-32-char-secret-key-here!!', fieldsToEncrypt: ['ssn'] },
    rateLimit:      { enabled: true, maxMessagesPerSecond: 50 },
    autoRetry:      { enabled: true, maxRetries: 3, initialDelayMs: 2000 },
    circuitBreaker: { enabled: true, failureThreshold: 5, resetTimeoutMs: 10000 },
    dlq:            { enabled: true, topicName: 'DeadLetters' },
    idempotency:    { enabled: true, ttlMs: 60000 },
    gracefulShutdown: { enabled: true },
    openTelemetry:  { enabled: true },
  },
});

await broker.publish({ topic: 'Orders', event: 'OrderCreated', message: { orderId: 1, ssn: '123-45-6789' } });
await broker.subscribe(async (msg) => { console.log(msg.data); }, 'Orders');
```

---

**Next:** [GitHub Repository](https://github.com/yadavmandeep/message-broker-kit/blob/master/README.md) · [Doc Hub](./INDEX.md) · [Quick Reference](./quick-reference.md) · [Troubleshooting](./troubleshooting.md)
