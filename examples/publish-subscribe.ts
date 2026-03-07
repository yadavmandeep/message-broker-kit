import { EnterpriseBrokerWrapper } from '@universal-broker/core';
import { RedisBroker } from '@universal-broker/redis';
// Or you can import specifically:
// import { KafkaBroker } from '@universal-broker/kafka';
// import { RabbitMQBroker } from '@universal-broker/rabbitmq';

async function main() {
  // Initialize the specific underlying broker
  const redisAdapter = new RedisBroker({
    host: 'localhost',
    port: 6379,
  });

  // Wrap it with Enterprise features (outbox, telemetry, retry, etc.)
  const broker = new EnterpriseBrokerWrapper(redisAdapter, {
    enableOutbox: false,
    retryCount: 3
  });

  // Connect
  await broker.connect();
  console.log('Connected to Broker!');

  // Subscribe to a topic
  await broker.subscribe('user.signup', async (message) => {
    console.log('Received message:', message);
  });

  // Publish to a topic
  await broker.publish('user.signup', { userId: 123, email: 'test@example.com' });

  // Disconnect after some time
  setTimeout(async () => {
    await broker.disconnect();
    console.log('Disconnected');
  }, 2000);
}

main().catch(console.error);
