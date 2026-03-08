import { IMessageBroker, MessageHandler, PublishData } from '@universal-broker/core';
import axios from 'axios';

export interface ServerlessOptions {
  restProxyUrl: string;
  apiKey?: string;
  timeoutMs?: number;
}

export class ServerlessRESTBroker implements IMessageBroker {
  private options: ServerlessOptions;

  constructor(options: ServerlessOptions) {
    if (!options.restProxyUrl) throw new Error('restProxyUrl is required for ServerlessRESTBroker');
    this.options = { ...options, timeoutMs: options.timeoutMs || 5000 };
  }

  public async connectProducer(): Promise<any> {
    console.log(`[ServerlessRESTBroker] stateless connection to ${this.options.restProxyUrl}`);
    return true;
  }
  public async disconnectProducer(): Promise<void> {}

  public async publish(data: PublishData): Promise<any> {
    const headers: any = { 'Content-Type': 'application/json' };
    if (this.options.apiKey) headers['Authorization'] = `Bearer ${this.options.apiKey}`;
    const response = await axios.post(this.options.restProxyUrl, { payload: data }, { headers, timeout: this.options.timeoutMs });
    return response.data;
  }

  public async connectConsumer(): Promise<any> {
    throw new Error('Consumers are typically Webhook-triggered in Serverless Edge, not long-polling.');
  }
  public async disconnectConsumer(): Promise<void> {}

  public async subscribe(messageHandler: MessageHandler, topic: string): Promise<any> {
    throw new Error('ServerlessRESTBroker does not support subscribe(). Use webhooks in edge environments.');
  }
}
