export interface PublishData {
  topic: string;
  headers?: Record<string, string>;
  event: string;
  message: any;
  schema?: any; // To allow passing a Zod schema for validation
}

export interface IncomingMessage {
  headers: Record<string, string>;
  event: string;
  data: any;
}

export type MessageHandler = (message: IncomingMessage) => Promise<void> | void;

export interface IMessageBroker {
  connectProducer(): Promise<any>;
  disconnectProducer(): Promise<void>;
  publish(data: PublishData): Promise<any>;
  
  connectConsumer(): Promise<any>;
  disconnectConsumer(): Promise<void>;
  subscribe(messageHandler: MessageHandler, topic: string): Promise<any>;
}

export interface EnterpriseOptions {
  autoRetry?: {
    enabled: boolean;
    maxRetries?: number;
    initialDelayMs?: number;
  };
  dlq?: {
    enabled: boolean;
    topicName?: string;
  };
  idempotency?: {
    enabled: boolean;
    ttlMs?: number; // Time-to-live for a processed event in memory
  };
  openTelemetry?: {
    enabled: boolean;
  };
  gracefulShutdown?: {
    enabled: boolean;
  };
  rateLimit?: {
    enabled: boolean;
    maxMessagesPerSecond: number;
  };
  encryption?: {
    enabled: boolean;
    secretKey: string; // 32-character string for AES-256
    fieldsToEncrypt?: string[]; // Array of dot-notation paths or top-level keys
  };
  circuitBreaker?: {
    enabled: boolean;
    failureThreshold: number; // e.g. 5 failures
    resetTimeoutMs: number; // e.g. 10000ms (10s) before trying again
  };
}
