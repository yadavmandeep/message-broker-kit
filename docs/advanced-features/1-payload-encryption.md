# 🔐 End-To-End Payload Encryption

In modern enterprise applications, particularly those handling **Payments** (PCI-DSS), **Healthcare** (HIPAA), or any **PII** (Personal Identifiable Information), you strictly cannot send plaintext credit-card numbers or Social Security Numbers via network streams.

**Works with all brokers** — RabbitMQ, Kafka, Redis, SQS, NATS, MQTT, ActiveMQ. Same config, same API. If your RabbitMQ UI or AWS SQS Queue is hacked or viewed by an admin, that data gets compromised!

This kit provides **Zero-Trust Encryption** natively.

## How It Works 🛠️

Instead of manually encrypting string payloads in your code, you specify which fields you want encrypted inside your `BrokerConfig`. The `Universal Broker SDK` will intercept your publishing request, apply an `AES-256-CBC` encryption on those JSON keys, and send the encrypted blob over the wire.

When a downstream consumer uses our kit, the `EnterpriseBrokerWrapper` intercepts the encrypted blob, decrypts it back to real JSON, and hands it directly to your business logic layer!

## The Implementation 💻

### 1. The Configuration Setup

Add the `encryption` block to the `enterprise` options.

```typescript
import { MessageBrokerFactory } from 'universal-broker-sdk';

// Secret key must be a 32-character long string for AES-256
const MY_SECRET_KEY = 'super-secret-32-character-key-x1';

const broker = MessageBrokerFactory.create({
  type: 'rabbitmq',
  options: { url: 'amqp://localhost' },

  // Magic Enterprise Configuration Block 👇
  enterprise: {
    encryption: { 
        enabled: true, 
        secretKey: MY_SECRET_KEY, 
        // We tell the Broker to ONLY encrypt these two JSON properties!
        fieldsToEncrypt: ['creditCard', 'socialSecurityNumber'] 
    }
  }
});
```

### 2. Publishing Sensitive Data

Now, you write your code as if encryption doesn't exist. Publish your raw object!

```typescript
async function checkout() {
  const sensitiveUserPayload = {
      userId: 105,
      name: 'Bruce Wayne',
      creditCard: '4111-1111-1111-1111',       // Will be encrypted
      socialSecurityNumber: 'XXX-XX-1234'      // Will be encrypted
  };

  await broker.publish({
    topic: 'CheckoutQueue',
    event: 'PaymentProcessed',
    message: sensitiveUserPayload
  });
  
  console.log("Published Securely!");
}

checkout();
```

### 3. What Happens on the Network? (The Magic ✨)

If a hacker (or an administrator) looks directly at the `amqp://localhost` RabbitMQ queue interface, this is what the JSON payload actually looks like over the wire:

```json
{
  "userId": 105,
  "name": "Bruce Wayne",
  "creditCard": "U2FsdGVkX19sMjBwNGs0eDIwX3d... (Encrypted Hash)",
  "socialSecurityNumber": "U2FsdGVkX19kY... (Encrypted Hash)"
}
```
**Notice:** `userId` and `name` are untouched because they weren't in `fieldsToEncrypt`. But the secure data is a base64 hash! 🔒

### 4. Receiving Decrypted Data Automatically

When another microservice (which has the same `MY_SECRET_KEY` configured) subscribes to this topic, the Kit decrypts it instantly before your handler runs.

```typescript
await broker.subscribe(async (msg) => {
    
    // By the time it reaches your code, the data is back to normal!
    console.log("Credit Card is:", msg.data.creditCard); 
    // Outputs: "4111-1111-1111-1111"

}, 'CheckoutQueue');
```

---

That's it! You've implemented bank-grade encryption across your event-driven systems without writing a single `crypto` parsing script! 🚀

**Related:** [Resilience & DLQ](./2-resilience-dlq-retries.md) | [Broker Configs](../configuration/broker-configs.md) | [Doc Hub](../INDEX.md)
