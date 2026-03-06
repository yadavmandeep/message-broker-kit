# Message Broker Kit (Universal Messaging Client) 🚀

🎉 **Welcome to `message-broker-kit`!** 
Are you tired of rewriting the same connection and configuration code every time you switch between Kafka, RabbitMQ, or other streaming technologies? 

`message-broker-kit` is a **Universal Messaging Engine** built in TypeScript. It acts as an abstraction layer (or a universal remote control) over popular message brokers. **You don't have to write specific code for any broker!** Just tell the kit which broker you want to use in the configuration, and it handles everything automatically.

---

## 🌟 Why Use This Kit?

For beginners and experts alike, this kit solves a major headache:
- **Zero Lock-In:** Started with RabbitMQ but need scalable Kafka later? Or shifting to AWS SQS? Don't change your code. Just change 1 line in your configuration.
- **Unified API:** The way you Publish or Subscribe to a message remains **exactly the same**, no matter what technology runs under the hood.
- **TypeScript First:** Fully typed out of the box. Meaning your IDE (like VSCode) will auto-complete arguments and configurations for you.
- **Enterprise-ready Pattern:** Uses Factory Design Pattern so your codebase stays clean.

---

## 🏎️ Available Connectors (Adapters)
- **Kafka** (Uses `kafkajs`)
- **RabbitMQ** (Uses `amqplib`)
- **Redis Pub/Sub** (Uses `redis`)
- **AWS SQS** (Uses `@aws-sdk/client-sqs`)
- **ActiveMQ** (Uses `stompit` for STOMP)
- **NATS / JetStream** (Uses `nats`)
- **MQTT / Mosquitto** (Uses `mqtt`)

---

## 📖 Comprehensive Documentation

The kit has grown to encompass industry-grade enterprise functionality. To keep this README clean, please refer to our detailed topic-wise guides explicitly listed below:

### 🟢 Getting Started
- [1. Setup and Basic Publishing/Subscribing](./docs/getting-started/1-setup-and-basic-usage.md) 

### 🏢 Advanced Enterprise Features
- [1. End-To-End Payload Encryption (PII Protection)](./docs/advanced-features/1-payload-encryption.md)
- [2. Handling Failures: Rate Limiting, Retries, Circuit Breakers & DLQs](./docs/advanced-features/2-resilience-dlq-retries.md)

### 🏗️ Advanced Architecture Patterns
- [1. Transactional Outbox Pattern (Dual-write Prevention)](./docs/architecture/1-transactional-outbox.md)
- [2. Orchestration: Saga Pattern Coordinator (Rollbacks)](./docs/architecture/2-saga-pattern.md)
- [3. Serverless / Edge Computing Support (Stateless Fallback)](./docs/architecture/3-serverless-edge.md)

### 🛠️ Developer Tools
- [1. Smart Dead-Letter Triage UI (Visual Recovery Dashboard)](./docs/tools/1-smart-dlq-dashboard.md)

---

## 🛣️ Roadmap (Future Scope & Ultimate Vision)

As we continue to push the boundaries of this wrapper into a globally scalable messaging layer, here is what we plan to tackle next:

- 🤖 **AI-Driven Intelligent Routing**: Automatically analyzing payload intent/size and shifting messages to cheaper latency tier queues (e.g., dynamically moving from Kafka to SQS) during non-priority hours to save heavy cloud costs.
- 📜 **Schema Registry Integration**: Full support for `Apache Avro / Protobuf` and integration with Confluent / AWS Glue Schema Registries for byte-level transmission efficiency.
- 📊 **Metrics & APM Integrations**: Built-in `Prometheus /metrics` hook and DataDog plugins to report live processing bandwidth.

---

## 🤝 Contributing
Found a bug, or want an adapter for a specific messaging system? Pull requests are absolutely welcome! Fork the project and start coding.
