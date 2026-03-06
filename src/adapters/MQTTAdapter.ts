import * as mqtt from 'mqtt';
import { IMessageBroker, MessageHandler, PublishData, IncomingMessage } from '../interfaces/IMessageBroker';

export interface MQTTConfig {
  url?: string;
  username?: string;
  password?: string;
  clientId?: string;
}

export class MQTTAdapter implements IMessageBroker {
  private url: string;
  private options: mqtt.IClientOptions;
  private producerClient: mqtt.MqttClient | null = null;
  private consumerClient: mqtt.MqttClient | null = null;

  constructor(config: MQTTConfig = {}) {
    this.url = config.url || 'mqtt://localhost:1883';
    this.options = {
      username: config.username,
      password: config.password,
      clientId: config.clientId || `mqtt_adapter_${Math.random().toString(16).slice(2, 8)}`
    };
  }

  private connectClient(clientIdPrefix: string): Promise<mqtt.MqttClient> {
    return new Promise((resolve, reject) => {
      const clientOptions = { ...this.options, clientId: `${clientIdPrefix}_${this.options.clientId}` };
      const client = mqtt.connect(this.url, clientOptions);
      client.on('connect', () => resolve(client));
      client.on('error', (err) => reject(err));
    });
  }

  public async connectProducer(): Promise<any> {
    if (!this.producerClient) {
      this.producerClient = await this.connectClient('pub');
    }
    return this.producerClient;
  }

  public async disconnectProducer(): Promise<void> {
    if (this.producerClient) {
      this.producerClient.end();
      this.producerClient = null;
    }
  }

  public async publish(data: PublishData): Promise<any> {
    const client = await this.connectProducer();
    const payload = JSON.stringify({
      headers: data.headers || {},
      event: data.event,
      data: data.message
    });
    return new Promise((resolve, reject) => {
        client.publish(data.topic, payload, { qos: 1 }, (error: any) => {
            if (error) return reject(error);
            resolve(true);
        });
    });
  }

  public async connectConsumer(): Promise<any> {
    if (!this.consumerClient) {
        this.consumerClient = await this.connectClient('sub');
    }
    return this.consumerClient;
  }

  public async disconnectConsumer(): Promise<void> {
    if (this.consumerClient) {
      this.consumerClient.end();
      this.consumerClient = null;
    }
  }

  public async subscribe(messageHandler: MessageHandler, topic: string): Promise<any> {
    const client = await this.connectConsumer();
    
    // To allow multiple subscribes on the same client, we handle an array of topics internally?
    // For simplicity of this adapter, standard callback
    
    client.subscribe(topic, { qos: 1 }, (err: any) => {
        if (err) console.error('[MQTTAdapter] Subscribe error', err);
    });

    client.on('message', async (t: string, message: Buffer) => {
       if (t !== topic) return; // simple router

       try {
           const parsed = JSON.parse(message.toString());
           const incomingMessage: IncomingMessage = {
             headers: parsed.headers || {},
             event: parsed.event || 'unknown',
             data: parsed.data
           };
           await messageHandler(incomingMessage);
       } catch (err) {
           console.error('[MQTTAdapter] Decode error', err);
       }
    });

    return client;
  }
}
