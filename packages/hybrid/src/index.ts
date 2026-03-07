import { IMessageBroker, PublishData, MessageHandler } from '@universal-broker/core';

export class HybridAdapter implements IMessageBroker {
  private brokers: IMessageBroker[] = [];

  constructor(brokers: IMessageBroker[]) {
    if (!brokers || brokers.length === 0)
      throw new Error('HybridAdapter requires at least one underlying broker.');
    this.brokers = brokers;
  }

  public async connectProducer(): Promise<any> {
    return Promise.all(this.brokers.map(b => b.connectProducer()));
  }

  public async disconnectProducer(): Promise<void> {
    await Promise.all(this.brokers.map(b => b.disconnectProducer()));
  }

  public async publish(data: PublishData): Promise<any> {
    const results = await Promise.allSettled(this.brokers.map(b => b.publish(data)));
    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length > 0) console.error(`[HybridAdapter] Failed to publish to ${failed.length} brokers.`);
    return results;
  }

  public async connectConsumer(): Promise<any> {
    return Promise.all(this.brokers.map(b => b.connectConsumer()));
  }

  public async disconnectConsumer(): Promise<void> {
    await Promise.all(this.brokers.map(b => b.disconnectConsumer()));
  }

  public async subscribe(messageHandler: MessageHandler, topic: string): Promise<any> {
    return Promise.all(this.brokers.map(b => b.subscribe(messageHandler, topic)));
  }
}
