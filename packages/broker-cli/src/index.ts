import { IMessageBroker, EnterpriseOptions, EnterpriseBrokerWrapper } from '@universal-broker/core';

export type BrokerType = 'kafka' | 'rabbitmq' | 'redis' | 'sqs' | 'activemq' | 'nats' | 'mqtt' | 'hybrid' | 'serverless';

export interface BrokerConfig {
  type: BrokerType;
  options: any;
  enterprise?: EnterpriseOptions;
}

export class MessageBrokerFactory {
  public static async create(config: BrokerConfig): Promise<IMessageBroker> {
    const { type, options, enterprise } = config;
    let baseBroker: IMessageBroker;

    try {
      switch (type) {
        case 'kafka': {
          const { KafkaAdapter } = await import('@universal-broker/kafka');
          baseBroker = new KafkaAdapter(options);
          break;
        }
        case 'redis': {
          const { RedisAdapter } = await import('@universal-broker/redis');
          baseBroker = new RedisAdapter(options);
          break;
        }
        case 'rabbitmq': {
          const { RabbitMQAdapter } = await import('@universal-broker/rabbitmq');
          baseBroker = new RabbitMQAdapter(options);
          break;
        }
        case 'sqs': {
          const { AWSSQSAdapter } = await import('@universal-broker/sqs');
          baseBroker = new AWSSQSAdapter(options);
          break;
        }
        case 'nats': {
          const { NatsAdapter } = await import('@universal-broker/nats');
          baseBroker = new NatsAdapter(options);
          break;
        }
        case 'mqtt': {
          const { MQTTAdapter } = await import('@universal-broker/mqtt');
          baseBroker = new MQTTAdapter(options);
          break;
        }
        case 'activemq': {
          const { ActiveMQAdapter } = await import('@universal-broker/activemq');
          baseBroker = new ActiveMQAdapter(options);
          break;
        }
        case 'serverless': {
          const { ServerlessRESTAdapter } = await import('@universal-broker/serverless');
          baseBroker = new ServerlessRESTAdapter(options);
          break;
        }
        case 'hybrid': {
          const { HybridAdapter } = await import('@universal-broker/hybrid');
          baseBroker = new HybridAdapter(options);
          break;
        }
        default:
          throw new Error(`Unsupported type: ${type}. Please make sure the corresponding @universal-broker package is installed.`);
      }
    } catch (err: any) {
      if (err.code === 'MODULE_NOT_FOUND' || err.message?.includes('cannot find module')) {
        throw new Error(`Package '@universal-broker/${type}' not found. Please run 'npx universal-broker setup' to install it.`);
      }
      throw err;
    }

    return new EnterpriseBrokerWrapper(baseBroker!, enterprise || {});
  }
}

// Re-export everything from core so users only need to import from one place
export * from '@universal-broker/core';
