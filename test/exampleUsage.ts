import { MessageBrokerFactory, BrokerConfig } from '../src/index';

const kafkaConfig: BrokerConfig = {
  type: 'kafka',
  options: {
    clientId: 'custom-app',
    groupId: 'custom-group',
    brokers: ['localhost:9092']
  }
};

const rabbitConfig: BrokerConfig = {
  type: 'rabbitmq',
  options: {
    url: 'amqp://localhost',
    exchangeName: 'test_exchange'
  }
};

// Trying to instantiate both (if the services were running locally)
const useKafka: boolean = false; // Toggle to false to try RabbitMQ

const config = useKafka ? kafkaConfig : rabbitConfig;
const broker = MessageBrokerFactory.create(config);

const messageHandler = async (message: any) => {
  console.log('[MessageHandler] Received headers:', message.headers);
  console.log('[MessageHandler] Received event:', message.event);
  console.log('[MessageHandler] Received data:', message.data);
};

// Example usage
(async () => {
  try {
    console.log(`Connecting to ${config.type}...`);
    
    // Simulate publishing
    await broker.publish({
      topic: 'UserEvent',
      headers: { 'content-type': 'application/json' },
      event: 'user_create',
      message: { userId: 1, name: 'John Doe' }
    });

    console.log('Message published successfully.');

    // Simulate subscribing
    await broker.subscribe(messageHandler, 'UserEvent');
    console.log('Subscribed to UserEvent successfully.');
    
  } catch (error: any) {
    console.error('Test could not connect to broker. Ensure broker is running locally:', error.message);
  }
})();
