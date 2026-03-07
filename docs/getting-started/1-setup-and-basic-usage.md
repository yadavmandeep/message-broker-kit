# 1. Setup and Basic Publishing/Subscribing

This guide gets you from zero to sending and receiving messages in a few minutes. No prior message-queue experience is required: you install the package, pick a broker, create a broker instance, then call `publish` and `subscribe`. The same steps work for RabbitMQ, Kafka, Redis, AWS SQS, and the other supported brokers.

**New here?** Start with this page. When you are ready for more (encryption, retries, DLQ, etc.), use the [Documentation Hub](../INDEX.md) or [Features Overview](../features-overview.md).

---

## 📦 Step 1: Install the packages you need

Install from npm. [Installation](../installation-and-packages.md) has all options; below is the usual path.

**Option A — Factory (recommended):** install the CLI package and the adapter for your broker:

```bash
npm install @universal-broker/cli @universal-broker/rabbitmq
```

**Option B — All adapters:** `npm install @universal-broker/all` (then use core + adapter manually; see [Installation](../installation-and-packages.md)).

| Broker | Adapter to install (with Option A) |
|--------|------------------------------------|
| RabbitMQ | `@universal-broker/rabbitmq` |
| Kafka | `@universal-broker/kafka` |
| Redis | `@universal-broker/redis` |
| AWS SQS | `@universal-broker/sqs` |
| NATS | `@universal-broker/nats` |
| MQTT | `@universal-broker/mqtt` |
| ActiveMQ | `@universal-broker/activemq` |

You can also run `npx universal-broker setup` to pick brokers interactively. **Need connection strings?** See [Broker Configuration Reference](../configuration/broker-configs.md).

## 🚀 Step 2: Initialize the Broker

Use the factory so you don't write broker-specific code. Import from the package you installed:

```typescript
import { MessageBrokerFactory } from '@universal-broker/cli';

// 1. Create the instance (use the adapter you installed, e.g. @universal-broker/rabbitmq)
const broker = await MessageBrokerFactory.create({
  type: 'rabbitmq', // Change to 'kafka', 'redis', etc. when you install that adapter
  options: { url: 'amqp://localhost' },
});
```

## 📤 Step 3: Publish a Message

To send data somewhere, use the `.publish()` method. 

**Example Scenario:** A user just signed up on your website.

```typescript
async function publishUserEvent() {
  await broker.publish({
    topic: 'UserRegistrations',    // The Queue or Topic name
    event: 'UserCreated',          // The specific event name
    message: {                     // ANY JSON payload you want
      userId: 90210,
      email: 'john.doe@example.com',
      plan: 'free'
    },
    headers: { source: 'web-api' } // (Optional) Extra context
  });

  console.log("Welcome message sent to the queue!");
}

publishUserEvent();
```

## 📥 Step 4: Subscribe to Messages

In your background worker or microservice, you want to listen to these messages.

**Example Scenario:** An Email microservice that sends welcome emails when 'UserCreated' is received.

```typescript
async function startEmailWorker() {
  
  // This listener function runs EVERY time a new message comes in
  const processIncomingMessage = async (msg) => {
    
    // 1. Check which event it is
    if (msg.event === 'UserCreated') {
        const userEmail = msg.data.email;
        console.log(`Sending a welcome email to: ${userEmail}`);
        // ... your email sending logic here
    }
    
  };

  // 2. Start subscribing!
  // Tell the broker to listen to 'UserRegistrations' and pass messages to processIncomingMessage
  await broker.subscribe(processIncomingMessage, 'UserRegistrations');
  console.log("Email Worker is now listening for messages...");
}

startEmailWorker();
```

## 🎉 What's Next?

You've set up basic publish/subscribe. Choose your path:

| Goal | Next Step |
|------|-----------|
| **Use a different broker** (Kafka, Redis, SQS, etc.) | [Broker Configuration Reference](../configuration/broker-configs.md) |
| **Secure sensitive data** (PII, payments) | [Payload Encryption](../advanced-features/1-payload-encryption.md) |
| **Handle failures** (retries, DLQ, circuit breaker) | [Resilience & DLQ](../advanced-features/2-resilience-dlq-retries.md) |
| **Quick lookup** | [Quick Reference](../quick-reference.md) |
| **Full doc map** | [Documentation Hub](../INDEX.md) |
