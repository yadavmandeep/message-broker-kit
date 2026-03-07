# Universal Broker ActiveMQ Broker

STOMP-based broker implementation for Apache ActiveMQ integration.

## Features

- Seamless integration with Universal Broker SDK
- Standardized Promise-based API
- Automatic error handling and connection management
- Fully typed for TypeScript development

## Installation

```bash
npm install @universal-broker/activemq
```

## Usage

```typescript
import { ActiveMQBroker } from '@universal-broker/activemq';
import { EnterpriseBrokerWrapper } from '@universal-broker/core';

const broker = new EnterpriseBrokerWrapper(new ActiveMQBroker({ host: 'localhost', port: 61613 }), {});
// Or use MessageBrokerFactory from @universal-broker/cli. See main documentation.
```

## Documentation

For full enterprise features (Outbox, Deduplication, Telemetry, etc.), please refer to the main repository:

[Universal Broker SDK Documentation](https://github.com/man21/message-broker-kit)
