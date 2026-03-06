import { KafkaAdapter, KafkaConfig } from './adapters/KafkaAdapter';
import { RabbitMQAdapter, RabbitMQConfig } from './adapters/RabbitMQAdapter';
import { RedisAdapter, RedisConfig } from './adapters/RedisAdapter';
import { AWSSQSAdapter, AWSSQSConfig } from './adapters/AWSSQSAdapter';
import { ActiveMQAdapter, ActiveMQConfig } from './adapters/ActiveMQAdapter';
import { NatsAdapter, NatsConfig } from './adapters/NatsAdapter';
import { MQTTAdapter, MQTTConfig } from './adapters/MQTTAdapter';
import { HybridAdapter } from './adapters/HybridAdapter';
import { ServerlessRESTAdapter, ServerlessOptions } from './adapters/ServerlessRESTAdapter';

import { IMessageBroker, MessageHandler, PublishData, IncomingMessage, EnterpriseOptions } from './interfaces/IMessageBroker';
import { EnterpriseBrokerWrapper } from './core/EnterpriseBrokerWrapper';

export type BrokerType = 'kafka' | 'rabbitmq' | 'redis' | 'sqs' | 'activemq' | 'nats' | 'mqtt' | 'hybrid' | 'serverless';

export interface BrokerConfig {
  type: BrokerType;
  options: KafkaConfig | RabbitMQConfig | RedisConfig | AWSSQSConfig | ActiveMQConfig | NatsConfig | MQTTConfig | BrokerConfig[] | ServerlessOptions;
  enterprise?: EnterpriseOptions;
}

export class MessageBrokerFactory {
  /**
   * Create a message broker instance based on configuration.
   * @param {BrokerConfig} config - Configuration object
   * @returns {IMessageBroker} Broker instance
   */
  public static create(config: BrokerConfig): IMessageBroker {
    const { type, options, enterprise } = config;

    let baseBroker: IMessageBroker;

    switch (type) {
      case 'kafka':
        baseBroker = new KafkaAdapter(options as KafkaConfig);
        break;
      case 'rabbitmq':
        baseBroker = new RabbitMQAdapter(options as RabbitMQConfig);
        break;
      case 'redis':
        baseBroker = new RedisAdapter(options as RedisConfig);
        break;
      case 'sqs':
        baseBroker = new AWSSQSAdapter(options as AWSSQSConfig);
        break;
      case 'activemq':
        baseBroker = new ActiveMQAdapter(options as ActiveMQConfig);
        break;
      case 'nats':
        baseBroker = new NatsAdapter(options as NatsConfig);
        break;
      case 'mqtt':
        baseBroker = new MQTTAdapter(options as MQTTConfig);
        break;
      case 'hybrid':
        const hybridOptions = options as BrokerConfig[];
        if (!Array.isArray(hybridOptions)) throw new Error('Hybrid options must be an array of BrokerConfig');
        const internalBrokers = hybridOptions.map(cfg => MessageBrokerFactory.create(cfg));
        baseBroker = new HybridAdapter(internalBrokers);
        break;
      case 'serverless':
        baseBroker = new ServerlessRESTAdapter(options as ServerlessOptions);
        break;
      default:
        throw new Error(`Unsupported type: ${type}.`);
    }

    // Since Hybrid creates wrappers for its internal brokers via recursion, 
    // wrapping the Hybrid itself is okay (it gives a top-level enterprise feature set like Encryption or Rate Limiting on the Fan Out node before fanning out)
    return new EnterpriseBrokerWrapper(baseBroker, enterprise || {});
  }
}

import { IOutboxStorage, OutboxMessage } from './outbox/IOutboxStorage';
import { OutboxProcessor, OutboxOptions } from './outbox/OutboxProcessor';
import { SagaCoordinator, SagaAction } from './saga/SagaCoordinator';
import { SmartDLQDashboard, DashboardOptions } from './ui/SmartDLQDashboard';

// Exporting interfaces and adapter instances so users can type their usages
export {
  IMessageBroker,
  MessageHandler,
  PublishData,
  IncomingMessage,
  EnterpriseOptions,
  KafkaAdapter,
  RabbitMQAdapter,
  RedisAdapter,
  AWSSQSAdapter,
  ActiveMQAdapter,
  NatsAdapter,
  MQTTAdapter,
  HybridAdapter,
  ServerlessRESTAdapter,
  IOutboxStorage,
  OutboxMessage,
  OutboxProcessor,
  OutboxOptions,
  SagaCoordinator,
  SagaAction,
  SmartDLQDashboard,
  DashboardOptions
};
