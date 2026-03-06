# Smart Dead-Letter Triage UI 🧠

When scaling messaging architectures, unhandled exceptions throw payloads into a Dead Letter Queue (`DLQ`). Finding those exact failed properties via CLI commands across 20 nodes is complex.

The package provides an optional built-in DataDog-styled Express dashboard (accessible via `/broker-ui`) allowing you to manually review, edit, and re-enqueue failed messages back into the master stream via one-click buttons.

## Setting Up The Triage Component

The Triage dashboard is meant to connect with your database implementation of broken events (usually managed by the `Transactional Outbox Pattern`).

```typescript
import { SmartDLQDashboard, MessageBrokerFactory } from 'message-broker-kit';

// 1. Establish the broker connection to push retries back into it
const broker = MessageBrokerFactory.create({
    type: 'rabbitmq',
    options: { url: 'amqp://localhost' }
});

// 2. Wrap your db implementation (Refer to Transactional Outbox docs for how this fetches status FAILED)
const myDeadLetterDb = new MyDatabaseOutbox();

// 3. Start the Web UI Server
const dashboard = new SmartDLQDashboard(broker, myDeadLetterDb, {
    port: 4000,
    apiPath: '/api/dlq'
});

dashboard.start();

console.log("-------------------------------------------------");
console.log("Go to your browser and open: http://localhost:4000/broker-ui");
```

## Dashboard Features
- **Sleek Light/Dark Mode Integration**: Clean, modern grid design powered by TailwindCSS.
- **Payload Inspect Node**: A scrolling IDE-formatted box shows exactly which properties caused an exception in JSON formatting without copying terminal pastes.
- **SweetAlert2 Intervention**: Intercepts one-click `Enqueue` directives directly triggering a Broker Push + DB mark `PROCESSED` resolution.
