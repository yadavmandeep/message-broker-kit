import { connect, NatsConnection, JSONCodec } from 'nats';
import { IMessageBroker, MessageHandler, PublishData, IncomingMessage } from '@universal-broker/core';

export interface NatsConfig {
  servers?: string | string[];
}

export class NatsBroker implements IMessageBroker {
  private servers: string | string[];
  private connection: NatsConnection | null = null;
  private jc = JSONCodec();

  constructor(config: NatsConfig = {}) {
    this.servers = config.servers || 'nats://localhost:4222';
  }

  private async getConnection(): Promise<NatsConnection> {
    if (!this.connection) this.connection = await connect({ servers: this.servers });
    return this.connection;
  }

  public async connectProducer(): Promise<any> { return this.getConnection(); }
  public async disconnectProducer(): Promise<void> {}

  public async publish(data: PublishData): Promise<any> {
    const nc = await this.connectProducer();
    const payload = this.jc.encode({ headers: data.headers || {}, event: data.event, data: data.message });
    nc.publish(data.topic, payload);
  }

  public async connectConsumer(): Promise<any> { return this.getConnection(); }

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
          await messageHandler({ headers: parsed.headers || {}, event: parsed.event, data: parsed.data });
        } catch (err) { console.error('[NatsBroker] Message decode error', err); }
      }
    })();
    return sub;
  }
}
