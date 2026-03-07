import { createClient, RedisClientType } from 'redis';
import { IMessageBroker, MessageHandler, PublishData, IncomingMessage } from "@universal-broker/core";

export interface RedisConfig {
  url?: string;
  password?: string;
}

export class RedisAdapter implements IMessageBroker {
  private url: string;
  private password?: string;
  private publisher: any | null = null;
  private subscriber: any | null = null;

  constructor(config: RedisConfig = {}) {
    this.url = config.url || 'redis://localhost:6379';
    this.password = config.password;
  }

  public async connectProducer(): Promise<any> {
    if (this.publisher) return this.publisher;
    this.publisher = createClient({ url: this.url, password: this.password });
    await this.publisher.connect();
    return this.publisher;
  }

  public async disconnectProducer(): Promise<void> {
    if (this.publisher) {
      await this.publisher.quit();
      this.publisher = null;
    }
  }

  public async publish(data: PublishData): Promise<any> {
    const publisher = await this.connectProducer();
    const payload = JSON.stringify({
      headers: data.headers || {},
      event: data.event,
      data: data.message
    });
    return publisher.publish(data.topic, payload);
  }

  public async connectConsumer(): Promise<any> {
    if (this.subscriber) return this.subscriber;
    this.subscriber = createClient({ url: this.url, password: this.password });
    await this.subscriber.connect();
    return this.subscriber;
  }

  public async disconnectConsumer(): Promise<void> {
    if (this.subscriber) {
      await this.subscriber.quit();
      this.subscriber = null;
    }
  }

  public async subscribe(messageHandler: MessageHandler, topic: string): Promise<any> {
    const subscriber = await this.connectConsumer();
    
    await subscriber.subscribe(topic, async (messageStr: string) => {
      try {
        const parsed = JSON.parse(messageStr);
        const incomingMessage: IncomingMessage = {
          headers: parsed.headers || {},
          event: parsed.event,
          data: parsed.data
        };
        await messageHandler(incomingMessage);
      } catch (err) {
        console.error('[RedisAdapter] Error parsing or handling message:', err);
      }
    });
    
    return subscriber;
  }
}
