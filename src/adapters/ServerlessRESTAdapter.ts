import { IMessageBroker, MessageHandler, PublishData } from '../interfaces/IMessageBroker';
import axios from 'axios';

export interface ServerlessOptions {
  restProxyUrl: string; // e.g., 'https://my-cloudflare-worker.workers.dev/publish'
  apiKey?: string;
  timeoutMs?: number;
}

/**
 * ServerlessRESTAdapter
 * Used in Edge environments (Vercel Edge, Cloudflare Workers)
 * where TCP sockets (like amqplib or kafkajs) are strictly blocked.
 * This adapter routes messages to your HTTP proxy which then speaks TCP to your broker.
 */
export class ServerlessRESTAdapter implements IMessageBroker {
  private options: ServerlessOptions;

  constructor(options: ServerlessOptions) {
    if (!options.restProxyUrl) throw new Error("restProxyUrl is required for ServerlessRESTAdapter");
    this.options = { ...options, timeoutMs: options.timeoutMs || 5000 };
  }

  public async connectProducer(): Promise<any> {
     // No real connection needed for HTTP stateless!
     console.log(`[ServerlessRESTAdapter] stateless connection established to ${this.options.restProxyUrl}`);
     return true;
  }

  public async disconnectProducer(): Promise<void> {
      // Nothing to disconnect
  }

  public async publish(data: PublishData): Promise<any> {
    try {
        const headers: any = { 'Content-Type': 'application/json' };
        if (this.options.apiKey) headers['Authorization'] = `Bearer ${this.options.apiKey}`;

        const response = await axios.post(
            this.options.restProxyUrl,
            { payload: data }, // Send the universal schema
            { headers, timeout: this.options.timeoutMs }
        );
        return response.data;
    } catch (error: any) {
        console.error(`[ServerlessRESTAdapter] Failed to push message via REST proxy:`, error.message);
        throw error;
    }
  }

  public async connectConsumer(): Promise<any> {
     throw new Error("Consumers are typically Webhook-triggered in Serverless Edge, not long-polling.");
  }

  public async disconnectConsumer(): Promise<void> {
        // Nothing to disconnect
  }

  public async subscribe(messageHandler: MessageHandler, topic: string): Promise<any> {
     throw new Error("ServerlessRESTAdapter does not support subscribe(). Use webhooks in edge environments.");
  }
}
