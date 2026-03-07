import { EnterpriseBrokerWrapper } from '@universal-broker/core';
import { RedisBroker } from '@universal-broker/redis';

async function main() {
  // Initialize the specific underlying broker
  const redisBroker = new RedisBroker({
    url: 'redis://localhost:6379'
  });

  // Wrap it with Enterprise features (idempotency, retry, etc.)
  const broker = new EnterpriseBrokerWrapper(redisBroker, {
    autoRetry: {
      enabled: true,
      maxRetries: 3
    },
    idempotency: {
      enabled: true
    }
  });

  // Connect
  await broker.connectProducer();
  await broker.connectConsumer();
  console.log('Connected to Broker!');

  // Subscribe to a topic
  await broker.subscribe(async (message) => {
    console.log('Received message:', message.data);
    console.log('Event type:', message.event);
  }, 'user.signup');

  // Publish to a topic
  await broker.publish({
    topic: 'user.signup',
    event: 'USER_CREATED',
    message: { userId: 123, email: 'test@example.com' }
  });

  // Disconnect after some time
  setTimeout(async () => {
    await broker.disconnectProducer();
    await broker.disconnectConsumer();
    console.log('Disconnected');
  }, 2000);
}

main().catch(console.error);
