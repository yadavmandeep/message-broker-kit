# Universal Message Broker Toolkit

A production-ready Node.js/TypeScript abstraction library for wrapping multiple message brokers (Kafka, Redis, RabbitMQ, etc.) under a single, unified API. Includes enterprise features like Outbox Pattern, Deduplication, Retries, Circuit Breaker, and Telemetry/Observability natively!

## Features

- **Multi-Broker Support:** Switch between Kafka, Redis, RabbitMQ, AWS SQS seamlessly without changing your app code.
- **Enterprise Ready:** Message Deduplication, Transactional Outbox, Retry with Exponential Backoff.
- **TypeScript First:** First-class types that are strictly validated.
- **Plugin Architecture:** Write your own plugins to connect any other broker you might be running.
- **Unified API:** Publish and Subscribe methods work the same way regardless of the underlying broker logic.

## Monorepo Architecture

The project is structured logically as a monorepo consisting of the following core scopes published natively under the `@universal-broker` npm scope:
- `@universal-broker/core`: Common interfaces, Outbox Processor, Message Envelope parsing, basic telemetry wrapping.
- `@universal-broker/rabbitmq`: Adapter specifically leveraging `amqplib` to parse RabbitMQ.
- `@universal-broker/kafka`: Adapter specifically connecting leveraging `kafkajs`.
- `@universal-broker/redis`: Adapter specifically connecting leveraging `ioredis`.
- `@universal-broker/all` (meta-package): Provides `import { ... } from '@universal-broker/all'` installing all sub-brokers out-of-the-box for ease.

## Installation

Using npm, simply specify the specific broker implementation you wish to leverage, and the core implementation will automatically be fetched!

```bash
# If using RabbitMQ
npm i @universal-broker/rabbitmq @universal-broker/core

# Or Kafka
npm i @universal-broker/kafka @universal-broker/core

# Or if you just wish to play around with all brokers:
npm i @universal-broker/all
```

## Basic Example

```typescript
import { EnterpriseBrokerWrapper } from '@universal-broker/core';
import { RedisBroker } from '@universal-broker/redis';

// Or you can import specifically:
// import { KafkaBroker } from '@universal-broker/kafka';
// import { RabbitMQBroker } from '@universal-broker/rabbitmq';

async function main() {
  // Initialize the specific underlying broker
  const redisAdapter = new RedisBroker({
    host: 'localhost',
    port: 6379,
  });

  // Wrap it with Enterprise features (outbox, telemetry, retry, etc.)
  const broker = new EnterpriseBrokerWrapper(redisAdapter, {
    enableOutbox: false,
    retryCount: 3
  });

  // Connect
  await broker.connect();
  console.log('Connected to Broker!');

  // Subscribe to a topic
  await broker.subscribe('user.signup', async (message) => {
    console.log('Received message:', message);
  });

  // Publish to a topic
  await broker.publish('user.signup', { userId: 123, email: 'test@example.com' });

  // Disconnect after some time
  setTimeout(async () => {
    await broker.disconnect();
    console.log('Disconnected');
  }, 2000);
}

main().catch(console.error);
```

## Creating Your Own Adapter

If you want to implement your own sub-broker package, simply follow the abstract class provided by `@universal-broker/core`:

```ts
import { IMessageBroker } from '@universal-broker/core';

export class CustomBroker implements IMessageBroker {
    async connect(): Promise<void> { /* ... */ }
    async disconnect(): Promise<void> { /* ... */ }
    async publish(topic: string, data: any): Promise<void> { /* ... */ }
    async subscribe(topic: string, handler: (data: any) => Promise<void>): Promise<void> { /* ... */ }
}
```

## Contributions

Feel free to open PRs, this monorepo is architected heavily adhering to TS NPM workspaces logic ensuring isolation per-package!

## Publishing (Maintainers Only)

To publish all components publicly to NPM natively under the `@universal-broker` scope:
```bash
npm run publish:all
```
