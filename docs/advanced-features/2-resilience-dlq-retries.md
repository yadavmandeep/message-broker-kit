# 🛠️ Handling Failures: Rate Limiting, Retries, Circuit Breakers & DLQs

Distributed systems are chaotic. Databases go offline. External APIs rate limit you. Microservices crash under load.

**Broker-agnostic** — Same resilience config works with Kafka, RabbitMQ, Redis, SQS, NATS, MQTT, ActiveMQ.

If your consumer fails while processing a message, what happens to that message? Usually, it's either **lost forever** or it **loops endlessly, crashing your system**.

This package includes a 4-tier resilience strategy: **Rate Limiting -> Auto-Retries -> Circuit Breaker -> Dead Letter Queues (DLQ).**

---

## The 4-Tier Resilience Strategy Explained

### 1. 🚦 Rate Limiting & Throttling
Before a crash even happens, prevent it! If your downstream Postgres DB can only handle 50 queries per second, you shouldn't allow your RabbitMQ/Kafka consumer to process 5,000 incoming messages in 1 second. It will choke and die.

```typescript
const broker = MessageBrokerFactory.create({
  type: 'rabbitmq',
  options: { url: 'amqp://localhost' },
  enterprise: {
    // Limits the subscriber to only process up to 50 messages per second!
    rateLimit: { enabled: true, maxMessagesPerSecond: 50 },
  }
});
```

### 2. 🔄 Exponential Auto-Retries
Okay, a message arrived, but an external API `Stripe.charge()` randomly returned a `502 Bad Gateway` timeout, throwing an Error in your code.

Normally, the message is instantly re-queued or rejected. With `autoRetry`, the Kit will automatically back off and try again after waiting an exponential duration (e.g., *2s -> 4s -> 8s*).

```typescript
const broker = MessageBrokerFactory.create({
  type: 'sqs',
  options: { region: 'us-east-1', queueUrl: '...' },
  enterprise: {
    // If your code throws an Error, wait 2000ms, then retry.
    // If it fails again, wait 4000ms. Max tries is 3 times.
    autoRetry: { enabled: true, maxRetries: 3, initialDelayMs: 2000 },
  }
});
```

### 3. 📉 Distributed Circuit Breaker (Stop the Bleeding)
What if the Stripe API is COMPLETELY down for the next 2 hours?
Retrying 3 times for *every single message* will just keep failing and exhausting your worker's CPU.

The **Circuit Breaker** detects when a certain number of failures (`failureThreshold`) happen in a row. It then "Trips/Opens" the circuit. For the next `resetTimeoutMs` (e.g., 10 seconds), it will instantly skip trying to process any new messages and directly route them to the DLQ to prevent compounding failures!

```typescript
const broker = MessageBrokerFactory.create({
  type: 'redis',
  options: { url: 'redis://localhost' },
  enterprise: {
    // If 5 subsequent messages fail back-to-back, open the circuit for 10 seconds.
    circuitBreaker: { enabled: true, failureThreshold: 5, resetTimeoutMs: 10000 },
  }
});
```

### 4. 🔴 Dead Letter Queue (DLQ)
Ultimately, if the message exhausts its `maxRetries` AND the Circuit Breaker skips it, we cannot throw it away. We must send it to a **Dead Letter Queue (DLQ)**. A DLQ is a special "parking lot" topic where all broken events go so a developer can review them later (typically using our built-in Smart DLQ Dashboard UI).

```typescript
const broker = MessageBrokerFactory.create({
  type: 'kafka',
  options: { clientId: 'app', brokers: ['localhost:9092'] },
  enterprise: {
    // If all retries fail, publish the event payload to 'Global_Failed_Events'
    dlq: { enabled: true, topicName: 'Global_Failed_Events' },
  }
});
```

---

## The Complete Example Setup

Put them all together and see the magic!

```typescript
import { MessageBrokerFactory } from 'universal-broker-sdk';

console.log("Starting Resilient Worker...");

const broker = MessageBrokerFactory.create({
  type: 'rabbitmq',
  options: { url: 'amqp://localhost' },

  enterprise: {
    rateLimit: { enabled: true, maxMessagesPerSecond: 50 },
    autoRetry: { enabled: true, maxRetries: 3, initialDelayMs: 2000 },
    circuitBreaker: { enabled: true, failureThreshold: 5, resetTimeoutMs: 10000 },
    dlq: { enabled: true, topicName: 'My_Dead_Letters' }
  }
});

// A flaky handler simulating a downed database
async function myUnreliableHandler(msg) {
    console.log(`Processing Order ${msg.data.orderId}`);
    
    // Simulating an unexpected database failure!!
    const dbIsDown = true; 
    
    if (dbIsDown) {
        throw new Error("Cannot connect to Postgres, Connection Refused!");
    }
    
    console.log("Processed perfectly!");
}

// Start consuming
broker.subscribe(myUnreliableHandler, 'OrdersQueue');
```

**What happens?**
1. Message arrives: `Processing Order 1...`
2. Handlers throws `Error`!
3. Broker catches error, waits 2000ms.
4. Auto-Retry kicks in, tries again, waits 4000ms.
5. Auto-Retry kicks in, tries again, waits 8000ms.
6. Max retries hit! Routes the `Order 1` payload gracefully to `My_Dead_Letters` topic.
7. Does NOT crash your Node process!

**Pro Tip:** If you want to visually manage these failed events, refer to [Smart DLQ Triage UI](../tools/1-smart-dlq-dashboard.md).

**Related:** [Payload Encryption](./1-payload-encryption.md) | [Broker Configs](../configuration/broker-configs.md) | [Troubleshooting](../troubleshooting.md) | [Doc Hub](../INDEX.md)
