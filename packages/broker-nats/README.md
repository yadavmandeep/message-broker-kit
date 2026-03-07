# Universal Broker NATS Broker

Efficient NATS broker for high-throughput messaging requirements.

## Features

- Seamless integration with Universal Broker SDK
- Standardized Promise-based API
- Automatic error handling and connection management
- Fully typed for TypeScript development

## Installation

```bash
npm install @universal-broker/nats
```

## Usage

```typescript
import { NatsBroker } from '@universal-broker/nats';
import { EnterpriseBrokerWrapper } from '@universal-broker/core';

const broker = new EnterpriseBrokerWrapper(new NatsBroker({ servers: 'nats://localhost:4222' }), {});
// Or use MessageBrokerFactory from @universal-broker/cli. See main documentation.
```

## Documentation

For full enterprise features (Outbox, Deduplication, Telemetry, etc.), please refer to the main repository:

[Universal Broker SDK Documentation](https://github.com/man21/message-broker-kit)
