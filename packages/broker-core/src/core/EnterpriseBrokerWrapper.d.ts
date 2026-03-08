import { IMessageBroker, MessageHandler, PublishData, EnterpriseOptions } from '../interfaces/IMessageBroker';
export declare class EnterpriseBrokerWrapper implements IMessageBroker {
    private baseBroker;
    private options;
    private idempotencyCache;
    private cbState;
    private cbFailureCount;
    private cbLastFailureTime;
    private static instanceRefs;
    private static shutdownInitialized;
    constructor(baseBroker: IMessageBroker, options?: EnterpriseOptions);
    private static initGracefulShutdown;
    connectProducer(): Promise<any>;
    disconnectProducer(): Promise<void>;
    publish(data: PublishData): Promise<any>;
    connectConsumer(): Promise<any>;
    disconnectConsumer(): Promise<void>;
    subscribe(messageHandler: MessageHandler, topic: string): Promise<any>;
}
//# sourceMappingURL=EnterpriseBrokerWrapper.d.ts.map