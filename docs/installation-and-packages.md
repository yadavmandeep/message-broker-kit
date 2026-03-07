# Installation

Install the SDK from npm. Choose the packages you need for your project.

---

## What to install

### Option 1: Factory (recommended)

Use the factory so you can switch brokers by changing config. Install **`@universal-broker/cli`** plus the **broker package** for your message queue:

```bash
npm install @universal-broker/cli @universal-broker/rabbitmq
```

| Broker   | Install this package            |
|----------|----------------------------------|
| RabbitMQ | `@universal-broker/rabbitmq`    |
| Kafka    | `@universal-broker/kafka`       |
| Redis    | `@universal-broker/redis`       |
| AWS SQS  | `@universal-broker/sqs`         |
| NATS     | `@universal-broker/nats`        |
| MQTT     | `@universal-broker/mqtt`        |
| ActiveMQ | `@universal-broker/activemq`    |
| Hybrid   | `@universal-broker/hybrid`      |
| Serverless | `@universal-broker/serverless` |

You can also run **`npx universal-broker setup`** to pick brokers interactively.

**Import and use:**

```typescript
import { MessageBrokerFactory } from '@universal-broker/cli';

const broker = await MessageBrokerFactory.create({
  type: 'rabbitmq',
  options: { url: 'amqp://localhost' },
});
await broker.publish({ topic: 'Orders', event: 'OrderCreated', message: { id: 1 } });
await broker.subscribe((msg) => console.log(msg.data), 'Orders');
```

---

### Option 2: Core + broker (manual)

Install **`@universal-broker/core`** and the broker package(s) you need. Create the broker instance and wrap it with `EnterpriseBrokerWrapper`:

```bash
npm install @universal-broker/core @universal-broker/rabbitmq
```

```typescript
import { EnterpriseBrokerWrapper } from '@universal-broker/core';
import { RabbitMQBroker } from '@universal-broker/rabbitmq';

const base = new RabbitMQBroker({ url: 'amqp://localhost' });
const broker = new EnterpriseBrokerWrapper(base, { /* enterprise options */ });
await broker.publish({ topic: 'Orders', event: 'OrderCreated', message: { id: 1 } });
await broker.subscribe((msg) => console.log(msg.data), 'Orders');
```

---

### Option 3: All broker packages

To get core and every broker package in one go (no factory):

```bash
npm install @universal-broker/all
```

Then use **Option 2** style: import the broker class from its package and wrap with `EnterpriseBrokerWrapper` from `@universal-broker/core`.

**Broker class names (for Option 2):** `RabbitMQBroker`, `KafkaBroker`, `RedisBroker`, `AWSSQSBroker`, `NatsBroker`, `MQTTBroker`, `ActiveMQBroker`, `HybridBroker`, `ServerlessRESTBroker`.

---

**Related:** [Setup & Basic Usage](./getting-started/1-setup-and-basic-usage.md) · [Broker Configs](./configuration/broker-configs.md) · [Doc Hub](./INDEX.md)
