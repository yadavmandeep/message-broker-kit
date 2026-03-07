import { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { IMessageBroker, MessageHandler, PublishData, IncomingMessage } from '@universal-broker/core';

export interface AWSSQSConfig {
  region?: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  queueUrl: string;
}

export class AWSSQSAdapter implements IMessageBroker {
  private sqsClient: SQSClient;
  private queueUrl: string;
  private isConsuming: boolean = false;

  constructor(config: AWSSQSConfig) {
    if (!config.queueUrl) throw new Error('[AWSSQSAdapter] Queue URL is required.');
    this.queueUrl = config.queueUrl;
    const clientConfig: any = { region: config.region || 'us-east-1' };
    if (config.credentials) clientConfig.credentials = config.credentials;
    this.sqsClient = new SQSClient(clientConfig);
  }

  public async connectProducer(): Promise<any> { return this.sqsClient; }
  public async disconnectProducer(): Promise<void> {}

  public async publish(data: PublishData): Promise<any> {
    const payload = JSON.stringify({ event: data.event, data: data.message });
    const messageAttributes: any = {};
    if (data.headers) {
      for (const [key, value] of Object.entries(data.headers)) {
        messageAttributes[key] = { DataType: 'String', StringValue: String(value) };
      }
    }
    const command = new SendMessageCommand({
      QueueUrl: this.queueUrl,
      MessageBody: payload,
      MessageAttributes: Object.keys(messageAttributes).length > 0 ? messageAttributes : undefined
    });
    return this.sqsClient.send(command);
  }

  public async connectConsumer(): Promise<any> { return this.sqsClient; }
  public async disconnectConsumer(): Promise<void> { this.isConsuming = false; }

  public async subscribe(messageHandler: MessageHandler, topic: string): Promise<any> {
    this.isConsuming = true;
    const poll = async () => {
      if (!this.isConsuming) return;
      try {
        const command = new ReceiveMessageCommand({
          QueueUrl: this.queueUrl,
          MaxNumberOfMessages: 10,
          WaitTimeSeconds: 20,
          MessageAttributeNames: ['All']
        });
        const response = await this.sqsClient.send(command);
        if (response.Messages && response.Messages.length > 0) {
          for (const message of response.Messages) {
            let parsedBody: any = {};
            try { parsedBody = JSON.parse(message.Body || '{}'); } catch (e) {}
            const headers: any = {};
            if (message.MessageAttributes) {
              for (const [key, attr] of Object.entries(message.MessageAttributes))
                headers[key] = attr.StringValue;
            }
            await messageHandler({ headers, event: parsedBody.event || 'unknown', data: parsedBody.data || parsedBody });
            if (message.ReceiptHandle) {
              await this.sqsClient.send(new DeleteMessageCommand({ QueueUrl: this.queueUrl, ReceiptHandle: message.ReceiptHandle }));
            }
          }
        }
      } catch (err) { console.error('[AWSSQSAdapter] Polling error:', err); }
      if (this.isConsuming) setImmediate(poll);
    };
    poll();
    return this.sqsClient;
  }
}
