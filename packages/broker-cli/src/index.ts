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
          const { KafkaBroker } = await import('@universal-broker/kafka');
          baseBroker = new KafkaBroker(options);
          break;
        }
        case 'redis': {
          const { RedisBroker } = await import('@universal-broker/redis');
          baseBroker = new RedisBroker(options);
          break;
        }
        case 'rabbitmq': {
          const { RabbitMQBroker } = await import('@universal-broker/rabbitmq');
          baseBroker = new RabbitMQBroker(options);
          break;
        }
        case 'sqs': {
          const { AWSSQSBroker } = await import('@universal-broker/sqs');
          baseBroker = new AWSSQSBroker(options);
          break;
        }
        case 'nats': {
          const { NatsBroker } = await import('@universal-broker/nats');
          baseBroker = new NatsBroker(options);
          break;
        }
        case 'mqtt': {
          const { MQTTBroker } = await import('@universal-broker/mqtt');
          baseBroker = new MQTTBroker(options);
          break;
        }
        case 'activemq': {
          const { ActiveMQBroker } = await import('@universal-broker/activemq');
          baseBroker = new ActiveMQBroker(options);
          break;
        }
        case 'serverless': {
          const { ServerlessRESTBroker } = await import('@universal-broker/serverless');
          baseBroker = new ServerlessRESTBroker(options);
          break;
        }
        case 'hybrid': {
          const { HybridBroker } = await import('@universal-broker/hybrid');
          baseBroker = new HybridBroker(options);
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
