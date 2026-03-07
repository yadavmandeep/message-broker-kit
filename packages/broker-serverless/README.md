# Universal Broker Serverless Wrapper

Optimized wrapper for cold-start sensitive environments like AWS Lambda and Vercel.

## Features

- Seamless integration with Universal Broker SDK
- Standardized Promise-based API
- Automatic error handling and connection management
- Fully typed for TypeScript development

## Installation

```bash
npm install @universal-broker/serverless
```

## Usage

```typescript
import { ServerlessRESTBroker } from '@universal-broker/serverless';
import { EnterpriseBrokerWrapper } from '@universal-broker/core';

const broker = new EnterpriseBrokerWrapper(new ServerlessRESTBroker({ restProxyUrl: 'https://...' }), {});
// Or use MessageBrokerFactory from @universal-broker/cli. See main documentation.
```

## Documentation

For full enterprise features (Outbox, Deduplication, Telemetry, etc.), please refer to the main repository:

[Universal Broker SDK Documentation](https://github.com/man21/message-broker-kit)
