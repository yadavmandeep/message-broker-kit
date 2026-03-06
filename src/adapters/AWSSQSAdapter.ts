import { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { IMessageBroker, MessageHandler, PublishData, IncomingMessage } from '../interfaces/IMessageBroker';

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
    if (!config.queueUrl) {
      throw new Error('[AWSSQSAdapter] Queue URL is required.');
    }
    
    this.queueUrl = config.queueUrl;
    
    const clientConfig: any = { region: config.region || 'us-east-1' };
    if (config.credentials) {
      clientConfig.credentials = config.credentials;
    }
    this.sqsClient = new SQSClient(clientConfig);
  }

  public async connectProducer(): Promise<any> {
    // SQS is stateless over HTTP, client is instantiated in constructor.
    return this.sqsClient;
  }

  public async disconnectProducer(): Promise<void> {
    // No strict tear-down required.
  }

  public async publish(data: PublishData): Promise<any> {
    const payload = JSON.stringify({
        event: data.event,
        data: data.message
    });
    
    // Convert headers to SQS Message Attributes
    const messageAttributes: any = {};
    if (data.headers) {
        for (const [key, value] of Object.entries(data.headers)) {
            messageAttributes[key] = {
                DataType: 'String',
                StringValue: String(value)
            };
        }
    }

    const command = new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: payload,
        MessageAttributes: Object.keys(messageAttributes).length > 0 ? messageAttributes : undefined
    });

    return this.sqsClient.send(command);
  }

  public async connectConsumer(): Promise<any> {
    return this.sqsClient;
  }

  public async disconnectConsumer(): Promise<void> {
    this.isConsuming = false;
  }

  public async subscribe(messageHandler: MessageHandler, topic: string): Promise<any> {
    this.isConsuming = true;
    
    // Simple SQS Polling loop
    const poll = async () => {
      if (!this.isConsuming) return;

      try {
        const command = new ReceiveMessageCommand({
          QueueUrl: this.queueUrl,
          MaxNumberOfMessages: 10,
          WaitTimeSeconds: 20, // Long polling
          MessageAttributeNames: ['All']
        });

        const response = await this.sqsClient.send(command);

        if (response.Messages && response.Messages.length > 0) {
          for (const message of response.Messages) {
            let parsedBody: any = {};
            try {
              parsedBody = JSON.parse(message.Body || '{}');
            } catch (e) {}

            const headers: any = {};
            if (message.MessageAttributes) {
              for (const [key, attr] of Object.entries(message.MessageAttributes)) {
                headers[key] = attr.StringValue;
              }
            }

            const incomingMessage: IncomingMessage = {
              headers,
              event: parsedBody.event || 'unknown',
              data: parsedBody.data || parsedBody
            };

            await messageHandler(incomingMessage);

            // Delete message from queue after processing
            if (message.ReceiptHandle) {
              const delCmd = new DeleteMessageCommand({
                QueueUrl: this.queueUrl,
                ReceiptHandle: message.ReceiptHandle
              });
              await this.sqsClient.send(delCmd);
            }
          }
        }
      } catch (err) {
         console.error('[AWSSQSAdapter] Polling error:', err);
      }

      if (this.isConsuming) {
        // Continue polling
        setImmediate(poll); 
      }
    };

    // Start polling in background
    poll();
    return this.sqsClient;
  }
}
