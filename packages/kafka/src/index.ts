import { Kafka, Producer, Consumer, logLevel } from "kafkajs";
import { IMessageBroker, MessageHandler, PublishData, IncomingMessage } from "@universal-broker/core";

export interface KafkaConfig {
  clientId?: string;
  groupId?: string;
  brokers?: string[];
  sessionTimeout?: number;
  heartbeatInterval?: number;
  topics?: string[];
}

export class KafkaAdapter implements IMessageBroker {
  private kafka: Kafka;
  private producer: Producer | null = null;
  private consumer: Consumer | null = null;
  private clientId: string;
  private groupId: string;
  private brokers: string[];
  private sessionTimeout: number;
  private heartbeatInterval: number;
  private topics: string[];

  constructor(config: KafkaConfig = {}) {
    this.clientId = config.clientId || "my-app";
    this.groupId = config.groupId || "my-group";
    this.brokers = config.brokers || ["localhost:9092"];
    this.sessionTimeout = config.sessionTimeout || 10000;
    this.heartbeatInterval = config.heartbeatInterval || 3000;
    this.topics = config.topics || ["UserEvent"];

    this.kafka = new Kafka({
      clientId: this.clientId,
      brokers: this.brokers,
      logLevel: logLevel.ERROR,
    });
  }

  public async createTopics(topics: string[]): Promise<void> {
    const topicConfigs = topics.map(t => ({
      topic: t,
      numPartitions: 2,
      replicationFactor: 1, // Based on available brokers
    }));

    const admin = this.kafka.admin();
    await admin.connect();
    
    const topicExists = await admin.listTopics();

    for (const t of topicConfigs) {
      if (!topicExists.includes(t.topic)) {
        await admin.createTopics({
          topics: [t],
        });
      }
    }
    await admin.disconnect();
  }

  public async connectProducer(): Promise<Producer> {
    await this.createTopics(this.topics);

    if (this.producer) {
      return this.producer;
    }

    this.producer = this.kafka.producer();
    await this.producer.connect();
    return this.producer;
  }

  public async disconnectProducer(): Promise<void> {
    if (this.producer) {
      await this.producer.disconnect();
      this.producer = null;
    }
  }

  public async publish(data: PublishData): Promise<any> {
    const producer = await this.connectProducer();
    
    const kafkaHeaders: Record<string, string> = {};
    if (data.headers) {
      for (const [key, value] of Object.entries(data.headers)) {
        kafkaHeaders[key] = String(value);
      }
    }

    const result = await producer.send({
      topic: data.topic,
      messages: [
        {
          headers: kafkaHeaders,
          key: data.event,
          value: JSON.stringify(data.message),
        },
      ],
      acks: 1,
    });
    return result;
  }

  public async connectConsumer(): Promise<Consumer> {
    if (this.consumer) {
      return this.consumer;
    }
    this.consumer = this.kafka.consumer({
      groupId: this.groupId,
      sessionTimeout: this.sessionTimeout,
      heartbeatInterval: this.heartbeatInterval,
    });
    await this.consumer.connect();
    return this.consumer;
  }

  public async disconnectConsumer(): Promise<void> {
    if (this.consumer) {
      await this.consumer.disconnect();
      this.consumer = null;
    }
  }

  public async subscribe(messageHandler: MessageHandler, topic: string): Promise<any> {
    const consumer = await this.connectConsumer();
    await consumer.subscribe({ topic, fromBeginning: true });
    
    await consumer.run({
      eachMessage: async ({ topic: messageTopic, partition, message }) => {
        if (message.key && message.value) {
          
          let parsedHeaders: Record<string, string> = {};
          if (message.headers) {
            for (const key of Object.keys(message.headers)) {
              if (message.headers[key]) {
                parsedHeaders[key] = String(message.headers[key]);
              }
            }
          }

          const inputMessage: IncomingMessage = {
            headers: parsedHeaders,
            event: message.key.toString(),
            data: message.value ? JSON.parse(message.value.toString()) : null,
          };
          
          await messageHandler(inputMessage);
          
          await consumer.commitOffsets([
            { topic: messageTopic, partition, offset: (Number(message.offset) + 1).toString() },
          ]);
        }
      },
    });
    return consumer;
  }
}
