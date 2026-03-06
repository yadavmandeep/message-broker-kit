# Enterprise Features

By passing an optional `enterprise` block to your configuration, you can unlock powerful robustness features **without changing any adapter code**:

## How to Enable

Just drop the magic block inside `MessageBrokerFactory.create(config)`:

```typescript
const config = {
  type: 'rabbitmq',
  options: { url: 'amqp://localhost' },
  // Magic Enterprise Configuration Block 👇
  enterprise: {
    idempotency: { enabled: true, ttlMs: 3600000 },
    autoRetry: { enabled: true, maxRetries: 3, initialDelayMs: 2000 },
    dlq: { enabled: true, topicName: 'Global_Failed_Events' },
    openTelemetry: { enabled: true },
    rateLimit: { enabled: true, maxMessagesPerSecond: 50 },
    circuitBreaker: { enabled: true, failureThreshold: 5, resetTimeoutMs: 10000 },
    encryption: { enabled: true, secretKey: '32_character_long_secret_key_here', fieldsToEncrypt: ['creditCard', 'ssn'] },
    gracefulShutdown: { enabled: true }
  }
};
```

## Detailed Breakdown

### 1. End-to-End Payload Encryption 🔒
Automatically encrypts specific PII data fields (e.g. `creditCard`, `ssn`) using `AES-256` before publishing, and decrypts them automatically upon receiving. A zero-trust implementation that protects sensitive strings from being viewable in the RabbitMQ/Kafka management portal!

### 2. Distributed Circuit Breaker 📉
Prevents a failing consumer from hammering a downed database or downstream API. The circuit breaker automatically short-circuits to the DLQ when a predefined `failureThreshold` is met. It then probes with a single "Half-Open" test payload after the `resetTimeoutMs`.

### 3. Rate Limiting & Throttling 🚦
If your Node.js application or database can only handle 50 queries per second, configure `rateLimit` (e.g. `maxMessagesPerSecond: 50`). The kit will automatically slide the throttle on incoming consumer processing to prevent cascading load-balancing failures!

### 4. Idempotency (Deduplication) 🟢
Network blips cause duplicate messages to hit consumers. The broker automatically injects `messageId`s and drops duplicate events it has already seen within the specified `ttlMs` (using a fast LRU cache).

### 5. Zero-Config Dead Letter Queues (DLQ) & Auto-Retries 🔴
If your consumer crashes or throws an Error object during processing, the broker will **automatically backoff** and retry based on an exponential delay (e.g. *2s, 4s, 8s*).
If it exhausts max retries, it routes the message to a DLQ topic instead of blocking the main pipeline.

### 6. OpenTelemetry Distributed Tracing 🟣
Microservices need tracing. The framework auto-injects a `traceId` onto headers if one isn't present, ensuring distributed systems like DataDog and Jaeger can map the lifecycle of your payload.

### 7. Graceful Shutdown 🔌
Intercepts `SIGINT` and `SIGTERM`. Prevents your service from cutting off database connections abruptly while a payload is mid-processing, significantly curtailing data-loss chances.

**Next:** Look at advanced database workflows in [Transactional Outbox](./4-transactional-outbox.md).
