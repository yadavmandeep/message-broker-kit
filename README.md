# Universal Broker SDK — Unified Messaging Engine

> **Enterprise-grade messaging for Node.js** — One API, any broker. Kafka, RabbitMQ, Redis, AWS SQS, ActiveMQ, NATS, MQTT. Switch brokers with a single config change.

---

## Why Universal Broker SDK?

- **Zero Lock-In** — Started with RabbitMQ, need Kafka later? Change one line. Same code.
- **Unified API** — `publish()` and `subscribe()` work identically across all brokers.
- **Broker-Agnostic** — No matter which message queue you use, the API stays the same.
- **TypeScript First** — Full types, IDE autocomplete, clean codebase.
- **Enterprise Patterns** — Encryption, retries, circuit breaker, DLQ, transactional outbox, saga.

---

## Supported Brokers

| Broker | Type | Driver |
|--------|------|--------|
| Kafka | `kafka` | kafkajs |
| RabbitMQ | `rabbitmq` | amqplib |
| Redis | `redis` | redis |
| AWS SQS | `sqs` | @aws-sdk/client-sqs |
| ActiveMQ | `activemq` | stompit |
| NATS / JetStream | `nats` | nats |
| MQTT | `mqtt` | mqtt |
| Hybrid (fan-out) | `hybrid` | — |
| Serverless / Edge | `serverless` | axios |

---

## Quick Start

```bash
npm install universal-broker-sdk amqplib
```

```typescript
import { MessageBrokerFactory } from 'universal-broker-sdk';

const broker = MessageBrokerFactory.create({
  type: 'rabbitmq',
  options: { url: 'amqp://localhost' }
});

await broker.publish({ topic: 'Orders', event: 'OrderCreated', message: { id: 1 } });
await broker.subscribe((msg) => console.log(msg.data), 'Orders');
```

---

## Documentation

**[📚 Documentation Hub](./docs/INDEX.md)** — Full map, learning paths, and links.

### By Level

| Level | Docs |
|-------|------|
| **Beginner** | [Setup & Basic Usage](./docs/getting-started/1-setup-and-basic-usage.md) · [Broker Configs](./docs/configuration/broker-configs.md) · [Quick Reference](./docs/quick-reference.md) |
| **Intermediate** | [Payload Encryption](./docs/advanced-features/1-payload-encryption.md) · [Resilience & DLQ](./docs/advanced-features/2-resilience-dlq-retries.md) · [Smart DLQ Dashboard](./docs/tools/1-smart-dlq-dashboard.md) |
| **Advanced** | [Transactional Outbox](./docs/architecture/1-transactional-outbox.md) · [Saga Pattern](./docs/architecture/2-saga-pattern.md) · [Serverless / Edge](./docs/architecture/3-serverless-edge.md) |

### Quick Links

- [Troubleshooting](./docs/troubleshooting.md)
- [Broker Configuration Reference](./docs/configuration/broker-configs.md) — All queues, one place

---

## Roadmap

- 🤖 AI-driven intelligent routing
- 📜 Schema Registry (Avro / Protobuf)
- 📊 Prometheus / DataDog metrics

---

## Contributing

Found a bug or want a new adapter? Pull requests welcome. Fork and code.
