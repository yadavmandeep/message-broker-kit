export interface PublishData {
    topic: string;
    headers?: Record<string, string>;
    event: string;
    message: any;
    schema?: any;
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
        ttlMs?: number;
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
        secretKey: string;
        fieldsToEncrypt?: string[];
    };
    circuitBreaker?: {
        enabled: boolean;
        failureThreshold: number;
        resetTimeoutMs: number;
    };
}
//# sourceMappingURL=IMessageBroker.d.ts.map