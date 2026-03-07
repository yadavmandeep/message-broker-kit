import * as amqp from 'amqplib';
import { IMessageBroker, MessageHandler, PublishData, IncomingMessage } from "@universal-broker/core";

export interface RabbitMQConfig {
  url?: string;
  exchangeName?: string;
  exchangeType?: string;
}

export class RabbitMQAdapter implements IMessageBroker {
  private url: string;
  private exchangeName: string;
  private exchangeType: string;
  private producerConnection: any = null;
  private producerChannel: any = null;
  private consumerConnection: any = null;
  private consumerChannel: any = null;

  constructor(config: RabbitMQConfig = {}) {
    this.url = config.url || 'amqp://localhost';
    this.exchangeName = config.exchangeName || 'message_broker_kit_exchange';
    this.exchangeType = config.exchangeType || 'topic';
  }

  public async connectProducer(): Promise<any> {
    if (this.producerChannel) return this.producerChannel;
    
    this.producerConnection = await amqp.connect(this.url);
    this.producerChannel = await this.producerConnection.createChannel();
    await this.producerChannel.assertExchange(this.exchangeName, this.exchangeType, { durable: true });
    
    return this.producerChannel;
  }

  public async disconnectProducer(): Promise<void> {
    if (this.producerChannel) {
      await this.producerChannel.close();
      this.producerChannel = null;
    }
    if (this.producerConnection) {
      await this.producerConnection.close();
      this.producerConnection = null;
    }
  }

  public async publish(data: PublishData): Promise<boolean> {
    const channel = await this.connectProducer();
    const routingKey = data.topic; 
    
    const messagePayload = {
      event: data.event,
      data: data.message
    };
    
    const options: amqp.Options.Publish = {
      headers: data.headers || {},
      persistent: true
    };
    
    return channel.publish(
      this.exchangeName, 
      routingKey, 
      Buffer.from(JSON.stringify(messagePayload)),
      options
    );
  }

  public async connectConsumer(): Promise<any> {
    if (this.consumerChannel) return this.consumerChannel;

    this.consumerConnection = await amqp.connect(this.url);
    this.consumerChannel = await this.consumerConnection.createChannel();
    await this.consumerChannel.assertExchange(this.exchangeName, this.exchangeType, { durable: true });
    
    return this.consumerChannel;
  }

  public async disconnectConsumer(): Promise<void> {
    if (this.consumerChannel) {
      await this.consumerChannel.close();
      this.consumerChannel = null;
    }
    if (this.consumerConnection) {
      await this.consumerConnection.close();
      this.consumerConnection = null;
    }
  }

  public async subscribe(messageHandler: MessageHandler, topic: string): Promise<any> {
    const channel = await this.connectConsumer();
    
    const q = await channel.assertQueue('', { exclusive: true });
    await channel.bindQueue(q.queue, this.exchangeName, topic);

    await channel.consume(q.queue, async (msg: amqp.ConsumeMessage | null) => {
      if (msg !== null) {
        try {
          const content = JSON.parse(msg.content.toString());
          const inputMessage: IncomingMessage = {
            headers: (msg.properties.headers as Record<string, string>) || {},
            event: content.event,
            data: content.data
          };
          
          await messageHandler(inputMessage);
          channel.ack(msg);
        } catch (err) {
          console.error('[RabbitMQAdapter] Error processing message:', err);
          channel.nack(msg);
        }
      }
    });
    
    return channel;
  }
}
