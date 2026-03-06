# Orchestration: Saga Pattern Coordinator 🚦

Provides an orchestration layer `new SagaCoordinator(broker)` to handle **Long-Running Transactions** across distant microservices. 

## The Scenario
If you have a workflow where:
1. `ShoppingCart` starts an Order Checkout.
2. `Inventory` successfully reserves an Item block (`OrderProcessed`).
3. But the `Payment Gateway` ultimately fails to bill the user (`PaymentFailed`).

Instead of the `Inventory` holding items indefinitely, the Saga automatically rolls backward publishing "Compensation Events" (`OrderCancelled`), telling downstream services to refund and restock items globally.

## The Setup

```typescript
import { SagaCoordinator, MessageBrokerFactory } from 'message-broker-kit';

const broker = MessageBrokerFactory.create({ type: 'redis', options: { url: 'redis://localhost' }});
const saga = new SagaCoordinator(broker);

async function processOrderCheckout() {
    saga.startSaga("order-tx-99214");

    saga.addAction({
        name: "ReserveInventory",
        topic: "InventoryQueue",
        payload: { itemId: 4, qty: 1 },
        compensationEvent: "RestockInventory" // Global Rollback instruction
    });

    try {
        await saga.execute(); // Begins the distributed pipeline
    } catch (failed) {
        console.log("Entire checkout reversed flawlessly:", failed.message);
    }
}
```
