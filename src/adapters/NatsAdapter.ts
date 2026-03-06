import { connect, NatsConnection, StringCodec, JSONCodec } from 'nats';
import { IMessageBroker, MessageHandler, PublishData, IncomingMessage } from '../interfaces/IMessageBroker';

export interface NatsConfig {
  servers?: string | string[];
}

export class NatsAdapter implements IMessageBroker {
  private servers: string | string[];
  private connection: NatsConnection | null = null;
  private jc = JSONCodec();

  constructor(config: NatsConfig = {}) {
    this.servers = config.servers || 'nats://localhost:4222';
  }

  private async getConnection(): Promise<NatsConnection> {
    if (!this.connection) {
      this.connection = await connect({ servers: this.servers });
    }
    return this.connection;
  }

  public async connectProducer(): Promise<any> {
    return this.getConnection();
  }

  public async disconnectProducer(): Promise<void> {
    // Shared connection close is handled in disconnectConsumer or via singleton approach.
    // We will just do nothing distinct for producer.
  }

  public async publish(data: PublishData): Promise<any> {
    const nc = await this.connectProducer();
    
    const payload = this.jc.encode({
      headers: data.headers || {},
      event: data.event,
      data: data.message
    });
    
    nc.publish(data.topic, payload);
  }

  public async connectConsumer(): Promise<any> {
     return this.getConnection();
  }

  public async disconnectConsumer(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
  }

  public async subscribe(messageHandler: MessageHandler, topic: string): Promise<any> {
    const nc = await this.connectConsumer();
    const sub = nc.subscribe(topic);
    
    (async () => {
      for await (const m of sub) {
        try {
          const parsed: any = this.jc.decode(m.data);
          const incomingMessage: IncomingMessage = {
            headers: parsed.headers || {},
            event: parsed.event,
            data: parsed.data
          };
          await messageHandler(incomingMessage);
        } catch (err) {
          console.error('[NatsAdapter] Message decode error', err);
        }
      }
    })();
    
    return sub;
  }
}
