# Transactional Outbox Pattern 📦

Solves the **dual-write problem** natively! Works with any broker — RabbitMQ, Kafka, SQS, Redis, etc.

## The Problem
If your API attempts to create a user in PostgreSQL and then publish a "UserCreated" event to RabbitMQ, an error in RabbitMQ could leave the database out of sync with downstream analytics teams. 

## The Solution
By using the built-in `IOutboxStorage` and `OutboxProcessor`, you can save your event data to an `Outbox` table along with your Database Transaction. The Kit runs a background worker that fetches these pending events and pushes them to your active broker with **100% Guaranteed Delivery**.

## Implementation Example

You must write a generic database connector that matches our `IOutboxStorage` interface:

```typescript
import { MessageBrokerFactory, OutboxProcessor, IOutboxStorage } from 'universal-broker-sdk';

// You write this class that connects to your Postgres/Mongo/MySQL
class MyDatabaseOutbox implements IOutboxStorage {
  async fetchPendingMessages(limit: number) {
      // Execute: SELECT * FROM outbox_events WHERE status = 'PENDING' LIMIT 100
      return []; 
  }
  
  async markAsProcessed(id: string) { 
      // Execute: UPDATE outbox_events SET status = 'PROCESSED' WHERE event_id = id
  }
  
  async markAsFailed(id: string, error: string) {
      // Execute: UPDATE outbox_events SET status = 'FAILED' WHERE event_id = id 
  }
}

// 1. Initialize your broker
const broker = MessageBrokerFactory.create({
  type: 'rabbitmq',
  options: { url: 'amqp://localhost' }
});

// 2. Wrap your db implementation
const myDbStorage = new MyDatabaseOutbox();

// 3. Let the framework handle the polling and publishing!
const outboxProcessor = new OutboxProcessor(broker, myDbStorage, {
  pollIntervalMs: 5000,
  batchSize: 100,
  maxRetries: 3
});

outboxProcessor.start(); // Runs your background worker job!
```

**Related:** [Saga Pattern](./2-saga-pattern.md) | [Smart DLQ Dashboard](../tools/1-smart-dlq-dashboard.md) | [Doc Hub](../INDEX.md)
