# Installation

Install the SDK from npm. Choose the packages you need for your project.

---

## What to install

### Option 1: Factory (recommended)

Use the factory so you can switch brokers by changing config. Install **`@universal-broker/cli`** plus the **adapter** for your broker:

```bash
npm install @universal-broker/cli @universal-broker/rabbitmq
```

| Broker   | Install this adapter            |
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

### Option 2: Core + adapter (manual)

Install **`@universal-broker/core`** and the adapter(s) you need. You create the adapter and wrap it with `EnterpriseBrokerWrapper`:

```bash
npm install @universal-broker/core @universal-broker/rabbitmq
```

```typescript
import { EnterpriseBrokerWrapper } from '@universal-broker/core';
import { RabbitMQAdapter } from '@universal-broker/rabbitmq';

const base = new RabbitMQAdapter({ url: 'amqp://localhost' });
const broker = new EnterpriseBrokerWrapper(base, { /* enterprise options */ });
await broker.publish({ topic: 'Orders', event: 'OrderCreated', message: { id: 1 } });
await broker.subscribe((msg) => console.log(msg.data), 'Orders');
```

---

### Option 3: All adapters

To get core and every broker adapter in one go (no factory):

```bash
npm install @universal-broker/all
```

Then use **Option 2** style: import the adapter from its package (e.g. `@universal-broker/rabbitmq`) and wrap with `EnterpriseBrokerWrapper` from `@universal-broker/core`.

---

**Related:** [Setup & Basic Usage](./getting-started/1-setup-and-basic-usage.md) · [Broker Configs](./configuration/broker-configs.md) · [Doc Hub](./INDEX.md)
