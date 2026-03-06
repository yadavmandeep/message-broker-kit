# Core Concepts & Adapters

The `MessageBrokerFactory` creates an underlying specific adapter (e.g., `RabbitMQAdapter`, `KafkaAdapter`) and automatically wraps it inside an `EnterpriseBrokerWrapper`.

This wrapper applies cross-cutting concerns like Encryption, Rate Limiting, circuit breaking, etc., without altering the core adapter logic.

## The IMessageBroker Interface

All brokers adhere to these four simple methods:
```typescript
interface IMessageBroker {
  connectProducer(): Promise<any>;
  disconnectProducer(): Promise<void>;
  publish(data: PublishData): Promise<any>;

  connectConsumer(): Promise<any>;
  disconnectConsumer(): Promise<void>;
  subscribe(messageHandler: MessageHandler, topic: string): Promise<any>;
}
```

## Supported Configurations

### 1. RabbitMQ (AMQP)
```typescript
const config = { type: 'rabbitmq', options: { url: 'amqp://localhost' } };
```

### 2. Apache Kafka
```typescript
const config = {
  type: 'kafka',
  options: { clientId: 'my-app', brokers: ['localhost:9092'] }
};
```

### 3. Redis (Pub/Sub)
```typescript
const config = {
  type: 'redis',
  options: { url: 'redis://localhost:6379' }
};
```

### 4. Amazon SQS
```typescript
const config = {
  type: 'sqs',
  options: { region: 'us-east-1', queueUrl: 'https://sqs.us-east-1.amazonaws.com/123/Queue' }
};
```

### 5. Apache ActiveMQ
```typescript
const config = {
  type: 'activemq',
  options: { host: 'localhost', port: 61613, connectHeaders: {} }
};
```

### 6. NATS
```typescript
const config = {
  type: 'nats',
  options: { servers: ['nats://localhost:4222'] }
};
```

### 7. MQTT
```typescript
const config = {
  type: 'mqtt',
  options: { url: 'mqtt://localhost:1883' }
};
```

### 8. Hybrid (Multi-Broker Fan Out)
Publishes messages to multiple brokers simultaneously! Subscribes to multiple streams at the same time.
```typescript
const config = {
  type: 'hybrid',
  options: [
    { type: 'redis', options: { url: 'redis://localhost' } },
    { type: 'rabbitmq', options: { url: 'amqp://localhost' } }
  ]
};
```

---
Next: Learn how to scale your application with [Enterprise Features](./3-enterprise-features.md).
