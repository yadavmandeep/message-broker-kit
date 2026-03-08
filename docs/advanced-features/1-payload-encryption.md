# Payload Encryption

This feature encrypts specific fields in your message payload before they are sent over the broker. Only the fields you list are encrypted; the rest of the payload stays as plain JSON. Consumers using the same key and field list get the data decrypted automatically.

**Why use it?** In regulated or sensitive use cases (payments, healthcare, PII), you must not send plaintext data like credit card numbers or national IDs through message queues. If someone inspects the queue (e.g. via RabbitMQ UI or cloud console), they should not see that data in clear text.

**Works with all brokers:** RabbitMQ, Kafka, Redis, AWS SQS, NATS, MQTT, ActiveMQ. The same configuration and API apply everywhere.

---

## How It Works

1. **When you publish:** You pass a normal JavaScript object. The kit encrypts only the fields you listed (e.g. `creditCard`, `socialSecurityNumber`) using AES-256-CBC and sends the rest unchanged. A header `x-encrypted: true` is added so the consumer knows to decrypt.
2. **When you subscribe:** If the message has `x-encrypted: true`, the kit decrypts the listed fields before calling your handler. Your code always receives the original object with plain values.

You do not write any encryption or decryption logic yourself.

---

## Configuration

Add an `encryption` block under `enterprise` when creating the broker. You must provide:

- **`enabled: true`** — Turns on encryption/decryption.
- **`secretKey`** — A string of **exactly 32 characters** (required for AES-256). Use the same key on every service that publishes or consumes these messages.
- **`fieldsToEncrypt`** — An array of field names to encrypt. These can be top-level keys (e.g. `'creditCard'`) or dot-notation paths for nested fields (e.g. `'user.pin'`).

Example:

```typescript
import { MessageBrokerFactory } from '@universal-broker/cli';

const SECRET_KEY = 'super-secret-32-character-key-x1'; // Must be 32 chars

const broker = await MessageBrokerFactory.create({
  type: 'rabbitmq',
  options: { url: 'amqp://localhost' },
  enterprise: {
    encryption: {
      enabled: true,
      secretKey: SECRET_KEY,
      fieldsToEncrypt: ['creditCard', 'socialSecurityNumber'],
    },
  },
});
```

---

## Full Example: Publisher and Subscriber

Below is a complete example: one script publishes a message with sensitive fields, and another subscribes and reads them. In a real project you would run these in two separate processes (e.g. two services or two terminals).

### Step 1: Publisher (e.g. payment service)

The publisher sends a normal object. Only `creditCard` and `socialSecurityNumber` are encrypted on the wire.

```typescript
// publisher.ts
import { MessageBrokerFactory } from '@universal-broker/cli';

const SECRET_KEY = 'super-secret-32-character-key-x1';

const broker = await MessageBrokerFactory.create({
  type: 'rabbitmq',
  options: { url: 'amqp://localhost' },
  enterprise: {
    encryption: {
      enabled: true,
      secretKey: SECRET_KEY,
      fieldsToEncrypt: ['creditCard', 'socialSecurityNumber'],
    },
  },
});

async function publishPayment() {
  await broker.publish({
    topic: 'Payments',
    event: 'PaymentProcessed',
    message: {
      orderId: 105,
      customerName: 'Jane Doe',
      creditCard: '4111-1111-1111-1111',
      socialSecurityNumber: 'XXX-XX-1234',
    },
  });
  console.log('Payment event published. Sensitive fields are encrypted on the broker.');
}

publishPayment().catch(console.error);
```

### Step 2: What the broker actually stores

If you look at the message in the broker (e.g. in RabbitMQ management UI), the payload will look like this. Only the listed fields are encrypted; the rest stay readable:

```json
{
  "orderId": 105,
  "customerName": "Jane Doe",
  "creditCard": "a1b2c3d4e5...:U2FsdGVkX19...",
  "socialSecurityNumber": "f6g7h8i9j0...:U2FsdGVkX19..."
}
```

So even if someone has access to the queue, they cannot read the card number or SSN without the secret key.

### Step 3: Subscriber (e.g. analytics or notification service)

The subscriber uses the **same** `secretKey` and `fieldsToEncrypt`. The kit decrypts the payload before your handler runs, so you always see the original values.

```typescript
// subscriber.ts
import { MessageBrokerFactory } from '@universal-broker/cli';

const SECRET_KEY = 'super-secret-32-character-key-x1';

const broker = await MessageBrokerFactory.create({
  type: 'rabbitmq',
  options: { url: 'amqp://localhost' },
  enterprise: {
    encryption: {
      enabled: true,
      secretKey: SECRET_KEY,
      fieldsToEncrypt: ['creditCard', 'socialSecurityNumber'],
    },
  },
});

async function startSubscriber() {
  await broker.subscribe(async (msg) => {
    if (msg.event === 'PaymentProcessed') {
      // By the time your code runs, fields are decrypted.
      console.log('Order ID:', msg.data.orderId);
      console.log('Customer:', msg.data.customerName);
      console.log('Card (last 4):', msg.data.creditCard.slice(-4));  // e.g. "1111"
      // Use msg.data only for your business logic; do not log full card/SSN.
    }
  }, 'Payments');
  console.log('Subscriber listening on Payments...');
}

startSubscriber().catch(console.error);
```

---

## Important Notes

- **Key length:** `secretKey` must be exactly 32 characters. Shorter or longer keys can cause errors or insecure behavior.
- **Same config on both sides:** Publisher and all consumers that need to read the message must use the same `secretKey` and `fieldsToEncrypt`. Otherwise decryption will fail or return garbage.
- **Nested fields:** You can encrypt nested fields by using dot-notation in `fieldsToEncrypt`, e.g. `['user.pin', 'billing.cardNumber']`.
- **Other features:** You can combine encryption with rate limiting, retries, DLQ, idempotency, etc. See [Features Overview](../features-overview.md) and [Resilience & DLQ](./2-resilience-dlq-retries.md).

---

## Summary

| What you do | What the kit does |
|-------------|--------------------|
| Set `encryption.enabled`, `secretKey`, `fieldsToEncrypt` | Encrypts listed fields on publish, decrypts on subscribe |
| Publish a normal object | Sends encrypted values for listed fields, adds `x-encrypted: true` |
| Subscribe with same config | Decrypts before calling your handler so you see plain values |

**Related:** [Features Overview](../features-overview.md) · [Resilience & DLQ](./2-resilience-dlq-retries.md) · [Broker Configs](../configuration/broker-configs.md) · [Doc Hub](../INDEX.md)
