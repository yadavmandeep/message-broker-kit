import { MessageBrokerFactory, SmartDLQDashboard, IOutboxStorage, OutboxMessage } from '../src/index';

// 1. A Fake Outbox Storage that holds some imaginary failed messages for us to test
class MockFailedStorage implements IOutboxStorage {
  private failedMessages: OutboxMessage[] = [
    {
      id: 'msg-abc-123',
      topic: 'OrdersQueue',
      event: 'OrderCreated',
      message: { orderId: 991, amount: 250.50, status: 'pending' },
      status: 'FAILED',
      retryCount: 3,
      createdAt: new Date().toISOString()
    },
    {
      id: 'msg-xyz-789',
      topic: 'EmailQueue',
      event: 'SendWelcomeEmail',
      message: { email: 'user@example.com', name: 'John Doe' },
      status: 'FAILED',
      retryCount: 5,
      createdAt: new Date().toISOString()
    }
  ];

  async fetchPendingMessages(limit: number): Promise<OutboxMessage[]> {
    // For Dashboard UI, we return our mock failed items
    return this.failedMessages;
  }

  async markAsProcessed(id: string): Promise<void> {
    console.log(`[MockDB] Message ${id} marked as PROCESSED in Database!`);
    this.failedMessages = this.failedMessages.filter(m => m.id !== id);
  }

  async markAsFailed(id: string, error: string): Promise<void> {
    console.log(`[MockDB] Message ${id} marked as FAILED in Database!`);
  }
}

async function run() {
  console.log("Setting up Test Environment...");
  
  // 2. Initialize a dummy broker (we'll use Redis for this quick offline test so we don't need heavy Kafka)
  // Ensure you have Redis running locally, or change to amqp/kafka if you have those running.
  // Actually, let's just use the Hybrid Adapter with nothing in it, or a mock adapter for pure UI testing.
  // For safety and zero-dependency testing, let's use the 'serverless' adapter as a dummy that just points nowhere blocking.
  
  const broker = MessageBrokerFactory.create({
      type: 'serverless',
      options: { restProxyUrl: 'http://localhost:9999/dummy-proxy' }
  });

  const dummyDb = new MockFailedStorage();

  // 3. Start the UI Dashboard
  const dashboard = new SmartDLQDashboard(broker, dummyDb, {
      port: 4000
  });

  dashboard.start();
  console.log("-------------------------------------------------");
  console.log("Go to your browser and open: http://localhost:4000/broker-ui");
  console.log("-------------------------------------------------");
}

run();
