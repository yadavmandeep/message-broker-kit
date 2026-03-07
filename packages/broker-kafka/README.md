# Universal Broker Kafka Broker

High-performance Kafka implementation using `kafkajs`. Handles topic creation, producer/consumer management, and automatic serialization.

## Features

- Seamless integration with Universal Broker SDK
- Standardized Promise-based API
- Automatic error handling and connection management
- Fully typed for TypeScript development

## Installation

```bash
npm install @universal-broker/kafka
```

## Usage

```typescript
import { KafkaBroker } from '@universal-broker/kafka';
import { EnterpriseBrokerWrapper } from '@universal-broker/core';

const broker = new EnterpriseBrokerWrapper(new KafkaBroker({ brokers: ['localhost:9092'] }), {});
// Or use MessageBrokerFactory from @universal-broker/cli. See main documentation.
```

## Documentation

For full enterprise features (Outbox, Deduplication, Telemetry, etc.), please refer to the main repository:

[Universal Broker SDK Documentation](https://github.com/man21/message-broker-kit)
