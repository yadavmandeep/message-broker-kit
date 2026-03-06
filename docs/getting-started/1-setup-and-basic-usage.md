# 1. Setup and Basic Publishing/Subscribing

Welcome! If you just want to send a message from Application A and receive it in Application B without worrying about the complex stuff, this guide is for you.

**New here?** Start with this page, then explore the [Documentation Hub](../INDEX.md) for advanced topics.

---

## 📦 Step 1: Install the Package

```bash
npm install message-broker-kit
```

You also need to install the driver for your specific broker. For example, if you are using RabbitMQ, install `amqplib`:
```bash
npm install amqplib
```

| Broker | Driver to Install |
|--------|-------------------|
| RabbitMQ | `amqplib` |
| Kafka | `kafkajs` |
| Redis | `redis` |
| AWS SQS | `@aws-sdk/client-sqs` |
| NATS | `nats` |
| MQTT | `mqtt` |
| ActiveMQ | `stompit` |

**Need connection strings?** See [Broker Configuration Reference](../configuration/broker-configs.md).

## 🚀 Step 2: Initialize the Broker

You do not need to write specific RabbitMQ or Kafka code. You just use the `MessageBrokerFactory`:

```typescript
import { MessageBrokerFactory } from 'message-broker-kit';

// 1. Create the instance
const broker = MessageBrokerFactory.create({
  type: 'rabbitmq', // Change this to 'kafka' or 'redis' when extending!
  options: {
    url: 'amqp://localhost' // Your connection string
  }
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
