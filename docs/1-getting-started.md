# Getting Started

Welcome to **Message Broker Kit** - the universal, enterprise-grade message broker wrapper for Node.js.

## Installation

```bash
npm install message-broker-kit
```

### Optional Peer Dependencies
Depending on which message broker string you want to connect to, install the underlying package:
- **Kafka**: `npm install kafkajs`
- **RabbitMQ**: `npm install amqplib`
- **Redis**: `npm install redis`
- **Amazon SQS**: `npm install @aws-sdk/client-sqs`
- **ActiveMQ**: `npm install stompit`
- **NATS**: `npm install nats`
- **MQTT**: `npm install mqtt`

## Basic Example

Here is a quick example of how to connect, publish, and subscribe using RabbitMQ.

```typescript
import { MessageBrokerFactory } from 'message-broker-kit';

const broker = MessageBrokerFactory.create({
  type: 'rabbitmq',
  options: { url: 'amqp://localhost' }
});

async function main() {
  // 1. Listen for messages
  await broker.subscribe(async (msg) => {
    console.log("Received Event:", msg.event);
    console.log("Payload:", msg.data);
  }, 'MyTopic');

  // 2. Publish a message
  await broker.publish({
    topic: 'MyTopic',
    event: 'UserCreated',
    message: { id: 1, name: 'John Doe' }
  });
}

main();
```

## Supported Brokers

The `type` field in your configuration object supports the following values:
- `kafka`
- `rabbitmq`
- `redis`
- `sqs`
- `activemq`
- `nats`
- `mqtt`
- `serverless` (For Edge/Cloudflare functions)
- `hybrid` (For multi-broker Fan-Out)

See [Core Concepts](./2-core-concepts.md) to understand how Adapters work.
