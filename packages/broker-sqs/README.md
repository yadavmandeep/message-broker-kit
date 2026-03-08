# Universal Broker AWS SQS Broker

AWS Simple Queue Service broker using AWS SDK v3. Ideal for serverless and cloud-native workloads.

## Features

- Seamless integration with Universal Broker SDK
- Standardized Promise-based API
- Automatic error handling and connection management
- Fully typed for TypeScript development

## Installation

```bash
npm install @universal-broker/sqs
```

## Usage

```typescript
import { AWSSQSBroker } from '@universal-broker/sqs';
import { EnterpriseBrokerWrapper } from '@universal-broker/core';

const broker = new EnterpriseBrokerWrapper(new AWSSQSBroker({ queueUrl: 'https://sqs...' }), {});
// Or use MessageBrokerFactory from @universal-broker/cli. See main documentation.
```

## Documentation

For full enterprise features (Outbox, Deduplication, Telemetry, etc.), please refer to the main repository:

[Universal Broker SDK Documentation](https://github.com/yadavmandeep/message-broker-kit)
