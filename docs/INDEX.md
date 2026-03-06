# Message Broker Kit — Documentation Hub

> **Enterprise-grade universal messaging for Node.js** — One API, any broker. Kafka, RabbitMQ, Redis, AWS SQS, ActiveMQ, NATS, MQTT — switch with a single config change.

---

## 📚 Documentation Map

### 🟢 Level 1: Getting Started (Beginners)

| Document | Description | When to Read |
|----------|-------------|--------------|
| [**Setup & Basic Usage**](./getting-started/1-setup-and-basic-usage.md) | Install, connect, publish, subscribe — first 5 minutes | Start here |
| [**Broker Configuration Reference**](./configuration/broker-configs.md) | Connection strings & options for every supported broker | When choosing or switching brokers |
| [**Quick Reference**](./quick-reference.md) | Cheat sheet — API, config snippets, common patterns | When you need a quick lookup |

---

### 🟡 Level 2: Production & Security (Intermediate)

| Document | Description | When to Read |
|----------|-------------|--------------|
| [**Payload Encryption**](./advanced-features/1-payload-encryption.md) | PII/PCI-DSS — encrypt sensitive fields end-to-end | Handling payments, healthcare, PII |
| [**Resilience: Retries, Circuit Breaker, DLQ**](./advanced-features/2-resilience-dlq-retries.md) | Rate limiting, auto-retries, circuit breaker, Dead Letter Queues | Building fault-tolerant consumers |
| [**Smart DLQ Dashboard**](./tools/1-smart-dlq-dashboard.md) | Visual UI to inspect, edit, and re-enqueue failed messages | Managing failed events in production |

---

### 🔴 Level 3: Enterprise Architecture (Advanced)

| Document | Description | When to Read |
|----------|-------------|--------------|
| [**Transactional Outbox Pattern**](./architecture/1-transactional-outbox.md) | Dual-write prevention — guaranteed delivery with DB transactions | Microservices with DB + messaging |
| [**Saga Pattern Coordinator**](./architecture/2-saga-pattern.md) | Distributed transactions with automatic rollback/compensation | Multi-step workflows (checkout, orders) |
| [**Serverless / Edge Support**](./architecture/3-serverless-edge.md) | Publish from Vercel, Cloudflare Workers, AWS Lambda | Edge/serverless deployments |

---

## 🎯 Learning Paths

### Path A: "I just want to send/receive messages"
1. [Setup & Basic Usage](./getting-started/1-setup-and-basic-usage.md)  
2. [Broker Configs](./configuration/broker-configs.md) — pick your broker  
3. [Quick Reference](./quick-reference.md) — keep handy

### Path B: "I'm building a production system"
1. Path A (above)  
2. [Resilience & DLQ](./advanced-features/2-resilience-dlq-retries.md)  
3. [Payload Encryption](./advanced-features/1-payload-encryption.md)  
4. [Smart DLQ Dashboard](./tools/1-smart-dlq-dashboard.md)

### Path C: "I need enterprise patterns"
1. Path B (above)  
2. [Transactional Outbox](./architecture/1-transactional-outbox.md)  
3. [Saga Pattern](./architecture/2-saga-pattern.md)  
4. [Serverless / Edge](./architecture/3-serverless-edge.md)

---

## 🔗 Supported Brokers (Broker-Agnostic API)

| Broker | Type Key | Driver | Use Case |
|--------|----------|--------|----------|
| **Kafka** | `kafka` | kafkajs | High throughput, event streaming |
| **RabbitMQ** | `rabbitmq` | amqplib | Flexible routing, AMQP |
| **Redis** | `redis` | redis | Pub/Sub, lightweight |
| **AWS SQS** | `sqs` | @aws-sdk/client-sqs | AWS-native, managed queues |
| **ActiveMQ** | `activemq` | stompit | STOMP, JMS-style |
| **NATS / JetStream** | `nats` | nats | Ultra-low latency |
| **MQTT** | `mqtt` | mqtt | IoT, constrained devices |
| **Hybrid** | `hybrid` | — | Fan-out to multiple brokers |
| **Serverless** | `serverless` | axios | Edge, Lambda, no TCP |

**Same `publish()` and `subscribe()` API for all.** See [Broker Configuration Reference](./configuration/broker-configs.md).

---

## 📖 Related Links

- [Troubleshooting](./troubleshooting.md) — common errors and fixes  
- [Changelog](../CHANGELOG.md) — version history (if present)

---

*Last updated for message-broker-kit v1.1.0*
