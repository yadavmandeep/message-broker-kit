import * as stompit from 'stompit';
import { IMessageBroker, MessageHandler, PublishData, IncomingMessage } from '@universal-broker/core';

export interface ActiveMQConfig {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
}

export class ActiveMQAdapter implements IMessageBroker {
  private connectOptions: any;
  private producerClient: stompit.Client | null = null;
  private consumerClient: stompit.Client | null = null;

  constructor(config: ActiveMQConfig = {}) {
    this.connectOptions = {
      host: config.host || 'localhost',
      port: config.port || 61613,
      connectHeaders: {
        host: '/',
        login: config.user,
        passcode: config.password,
        'heart-beat': '5000,5000'
      }
    };
  }

  private createConnection(): Promise<stompit.Client> {
    return new Promise((resolve, reject) => {
      stompit.connect(this.connectOptions, (error, client) => {
        if (error) return reject(error);
        resolve(client);
      });
    });
  }

  public async connectProducer(): Promise<any> {
    if (this.producerClient) return this.producerClient;
    this.producerClient = await this.createConnection();
    return this.producerClient;
  }

  public async disconnectProducer(): Promise<void> {
    if (this.producerClient) { this.producerClient.disconnect(); this.producerClient = null; }
  }

  public async publish(data: PublishData): Promise<any> {
    const client = await this.connectProducer();
    const sendHeaders = { destination: `/queue/${data.topic}`, 'content-type': 'application/json', ...data.headers };
    const frame = client.send(sendHeaders);
    frame.write(JSON.stringify({ event: data.event, data: data.message }));
    frame.end();
  }

  public async connectConsumer(): Promise<any> {
    if (this.consumerClient) return this.consumerClient;
    this.consumerClient = await this.createConnection();
    return this.consumerClient;
  }

  public async disconnectConsumer(): Promise<void> {
    if (this.consumerClient) { this.consumerClient.disconnect(); this.consumerClient = null; }
  }

  public async subscribe(messageHandler: MessageHandler, topic: string): Promise<any> {
    const client = await this.connectConsumer();
    client.subscribe({ destination: `/queue/${topic}`, ack: 'client-individual' }, (error: any, message: any) => {
      if (error) { console.error('[ActiveMQAdapter] subscribe error', error); return; }
      message.readString('utf-8', async (error: any, body: string) => {
        if (error) return;
        let parsed: any = {};
        try { if (body) parsed = JSON.parse(body); } catch (e) {}
        try {
          await messageHandler({ headers: message.headers as any, event: parsed.event || 'unknown', data: parsed.data || parsed });
          client.ack(message);
        } catch (handlerError) { console.error('[ActiveMQAdapter] handler error', handlerError); }
      });
    });
    return client;
  }
}
