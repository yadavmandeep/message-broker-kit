# Universal Broker MQTT Broker

MQTT broker suitable for IoT and lightweight mobile messaging applications.

## Features

- Seamless integration with Universal Broker SDK
- Standardized Promise-based API
- Automatic error handling and connection management
- Fully typed for TypeScript development

## Installation

```bash
npm install @universal-broker/mqtt
```

## Usage

```typescript
import { MQTTBroker } from '@universal-broker/mqtt';
import { EnterpriseBrokerWrapper } from '@universal-broker/core';

const broker = new EnterpriseBrokerWrapper(new MQTTBroker({ url: 'mqtt://localhost:1883' }), {});
// Or use MessageBrokerFactory from @universal-broker/cli. See main documentation.
```

## Documentation

For full enterprise features (Outbox, Deduplication, Telemetry, etc.), please refer to the main repository:

[Universal Broker SDK Documentation](https://github.com/yadavmandeep/message-broker-kit)
