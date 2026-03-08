# Universal Broker Redis Broker

Lightweight and fast Redis Pub/Sub implementation using the modern `redis` (node-redis) client.

## Features

- Seamless integration with Universal Broker SDK
- Standardized Promise-based API
- Automatic error handling and connection management
- Fully typed for TypeScript development

## Installation

```bash
npm install @universal-broker/redis
```

## Usage

```typescript
import { RedisBroker } from '@universal-broker/redis';
import { EnterpriseBrokerWrapper } from '@universal-broker/core';

const broker = new EnterpriseBrokerWrapper(new RedisBroker({ url: 'redis://localhost' }), {});
// Or use MessageBrokerFactory from @universal-broker/cli. See main documentation.
```

## Documentation

For full enterprise features (Outbox, Deduplication, Telemetry, etc.), please refer to the main repository:

[Universal Broker SDK Documentation](https://github.com/yadavmandeep/message-broker-kit)
