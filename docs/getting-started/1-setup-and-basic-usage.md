# 1. Setup and Basic Publishing/Subscribing

Welcome! If you just want to send a message from Application A and receive it in Application B without worrying about the complex stuff, this guide is for you.

## 📦 Step 1: Install the Package

```bash
npm install message-broker-kit
```

You also need to install the driver for your specific broker. For example, if you are using RabbitMQ, install `amqplib`:
```bash
npm install amqplib
```
*(Other options: `kafkajs`, `redis`, `@aws-sdk/client-sqs`, `nats`, `mqtt`, `stompit`)*

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

## 🎉 Conclusion
That's it! You have successfully decoupled your applications using an enterprise-grade message broker kit.

Next up, do you want to secure sensitive user data? Check out **[Payload Encryption](../advanced-features/1-payload-encryption.md)**!
