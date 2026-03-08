# Broker Configuration Reference

> **Broker-agnostic API** — Same `publish()` and `subscribe()` calls work across all brokers. Only the `options` object changes.

---

## Quick Switch Example

```typescript
import { MessageBrokerFactory } from '@universal-broker/cli';

// RabbitMQ today (install @universal-broker/cli and @universal-broker/rabbitmq)
const broker = await MessageBrokerFactory.create({
  type: 'rabbitmq',
  options: { url: 'amqp://localhost' },
});

// Tomorrow: switch to Kafka — same code, just change config (install @universal-broker/kafka)
const broker = await MessageBrokerFactory.create({
  type: 'kafka',
  options: { brokers: ['localhost:9092'] },
});

// Your publish/subscribe code stays identical
await broker.publish({ topic: 'Orders', event: 'OrderCreated', message: { id: 1 } });
```

---

## Supported Brokers & Options

### Kafka

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `brokers` | `string[]` | `['localhost:9092']` | Kafka broker addresses |
| `clientId` | `string` | `'my-app'` | Client identifier |
| `groupId` | `string` | `'my-group'` | Consumer group ID |
| `sessionTimeout` | `number` | `10000` | Session timeout (ms) |
| `heartbeatInterval` | `number` | `3000` | Heartbeat interval (ms) |
| `topics` | `string[]` | `['UserEvent']` | Topics to create/use |

**Driver:** `kafkajs` — `npm install kafkajs`

```typescript
await MessageBrokerFactory.create({
  type: 'kafka',
  options: {
    brokers: ['kafka-1:9092', 'kafka-2:9092'],
    clientId: 'order-service',
    groupId: 'order-consumers',
    topics: ['Orders', 'Payments']
  }
});
```

---

### RabbitMQ

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `url` | `string` | `'amqp://localhost'` | AMQP connection URL |
| `exchangeName` | `string` | `'message_broker_kit_exchange'` | Exchange name |
| `exchangeType` | `string` | `'topic'` | Exchange type (topic, direct, fanout) |

**Driver:** `amqplib` — `npm install amqplib`

```typescript
await MessageBrokerFactory.create({
  type: 'rabbitmq',
  options: {
    url: 'amqp://user:pass@rabbit.example.com:5672/vhost',
    exchangeName: 'my_exchange',
    exchangeType: 'topic'
  }
});
```

---

### Redis

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `url` | `string` | `'redis://localhost:6379'` | Redis connection URL |
| `password` | `string` | — | Redis password (optional) |

**Driver:** `redis` — `npm install redis`

```typescript
await MessageBrokerFactory.create({
  type: 'redis',
  options: {
    url: 'redis://localhost:6379',
    password: 'secret'
  }
});
```

---

### AWS SQS

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `queueUrl` | `string` | ✅ | Full SQS queue URL |
| `region` | `string` | — | AWS region (default: `us-east-1`) |
| `credentials` | `{ accessKeyId, secretAccessKey }` | — | Override default AWS credentials |

**Driver:** `@aws-sdk/client-sqs` — `npm install @aws-sdk/client-sqs`

```typescript
await MessageBrokerFactory.create({
  type: 'sqs',
  options: {
    queueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789/my-queue',
    region: 'us-east-1'
  }
});
```

---

### ActiveMQ (STOMP)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `host` | `string` | `'localhost'` | ActiveMQ host |
| `port` | `number` | `61613` | STOMP port |
| `user` | `string` | — | Username |
| `password` | `string` | — | Password |

**Driver:** `stompit` — `npm install stompit`

```typescript
await MessageBrokerFactory.create({
  type: 'activemq',
  options: {
    host: 'activemq.example.com',
    port: 61613,
    user: 'admin',
    password: 'secret'
  }
});
```

---

### NATS / JetStream

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `servers` | `string \| string[]` | `'nats://localhost:4222'` | NATS server URL(s) |

**Driver:** `nats` — `npm install nats`

```typescript
await MessageBrokerFactory.create({
  type: 'nats',
  options: {
    servers: ['nats://nats1:4222', 'nats://nats2:4222']
  }
});
```

---

### MQTT (Mosquitto, etc.)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `url` | `string` | `'mqtt://localhost:1883'` | MQTT broker URL |
| `username` | `string` | — | Username |
| `password` | `string` | — | Password |
| `clientId` | `string` | Auto-generated | Client ID |

**Driver:** `mqtt` — `npm install mqtt`

```typescript
await MessageBrokerFactory.create({
  type: 'mqtt',
  options: {
    url: 'mqtt://broker.example.com:1883',
    username: 'device',
    password: 'secret'
  }
});
```

---

### Hybrid (Fan-Out to Multiple Brokers)

Publishes to **all** underlying brokers. Use for multi-region, redundancy, or migration.

| Option | Type | Description |
|--------|------|-------------|
| `options` | `BrokerConfig[]` | Array of broker configs |

```typescript
await MessageBrokerFactory.create({
  type: 'hybrid',
  options: [
    { type: 'rabbitmq', options: { url: 'amqp://primary' } },
    { type: 'kafka', options: { brokers: ['kafka:9092'] } }
  ]
});
```

---

### Serverless (Edge / Lambda)

For environments where TCP sockets are not allowed (Vercel, Cloudflare Workers, Lambda). Uses HTTP REST proxy.

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `restProxyUrl` | `string` | ✅ | Your HTTP proxy endpoint |
| `apiKey` | `string` | — | Bearer token for auth |
| `timeoutMs` | `number` | `5000` | Request timeout |

**Note:** `subscribe()` is not supported — use webhooks for consumption.

```typescript
await MessageBrokerFactory.create({
  type: 'serverless',
  options: {
    restProxyUrl: 'https://my-worker.workers.dev/publish',
    apiKey: 'eyJhbGciOiJIUz...',
    timeoutMs: 8000
  }
});
```

---

## Adding Enterprise Options

All brokers support the same `enterprise` block. See [Resilience & DLQ](../advanced-features/2-resilience-dlq-retries.md) and [Payload Encryption](../advanced-features/1-payload-encryption.md).

```typescript
await MessageBrokerFactory.create({
  type: 'rabbitmq',
  options: { url: 'amqp://localhost' },
  enterprise: {
    rateLimit: { enabled: true, maxMessagesPerSecond: 50 },
    autoRetry: { enabled: true, maxRetries: 3, initialDelayMs: 2000 },
    circuitBreaker: { enabled: true, failureThreshold: 5, resetTimeoutMs: 10000 },
    dlq: { enabled: true, topicName: 'DeadLetters' },
    encryption: { enabled: true, secretKey: '32-char-key...', fieldsToEncrypt: ['ssn'] }
  }
});
```

---

## Related Docs

- [GitHub Repository](https://github.com/yadavmandeep/message-broker-kit/blob/master/README.md) — source and README
- [Setup & Basic Usage](../getting-started/1-setup-and-basic-usage.md)
- [Quick Reference](../quick-reference.md)
- [Documentation Hub](../INDEX.md)
