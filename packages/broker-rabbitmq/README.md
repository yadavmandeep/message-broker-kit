# Universal Broker RabbitMQ Broker

Robust RabbitMQ implementation using `amqplib`. Supports exchange bindings, persistent queues, and manual acknowledgments.

## Features

- Seamless integration with Universal Broker SDK
- Standardized Promise-based API
- Automatic error handling and connection management
- Fully typed for TypeScript development

## Installation

```bash
npm install @universal-broker/rabbitmq
```

## Usage

```typescript
import { RabbitMQBroker } from '@universal-broker/rabbitmq';
import { EnterpriseBrokerWrapper } from '@universal-broker/core';

const broker = new EnterpriseBrokerWrapper(new RabbitMQBroker({ url: 'amqp://localhost' }), {});
// Or use MessageBrokerFactory from @universal-broker/cli. See main documentation.
```

## Documentation

For full enterprise features (Outbox, Deduplication, Telemetry, etc.), please refer to the main repository:

[Universal Broker SDK Documentation](https://github.com/yadavmandeep/message-broker-kit)
