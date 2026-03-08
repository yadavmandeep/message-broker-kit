# Universal Broker Hybrid Broker

Allows routing messages across multiple brokers simultaneously (e.g., Local Redis for speed, Cloud Kafka for persistence).

## Features

- Seamless integration with Universal Broker SDK
- Standardized Promise-based API
- Automatic error handling and connection management
- Fully typed for TypeScript development

## Installation

```bash
npm install @universal-broker/hybrid
```

## Usage

```typescript
import { HybridBroker } from '@universal-broker/hybrid';
import { EnterpriseBrokerWrapper } from '@universal-broker/core';

// HybridBroker takes an array of broker instances. See main documentation.
const broker = new EnterpriseBrokerWrapper(new HybridBroker([redisBroker, kafkaBroker]), {});
```

## Documentation

For full enterprise features (Outbox, Deduplication, Telemetry, etc.), please refer to the main repository:

[Universal Broker SDK Documentation](https://github.com/yadavmandeep/message-broker-kit)
