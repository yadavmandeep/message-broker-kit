import { IMessageBroker } from '../interfaces/IMessageBroker';
import { IOutboxStorage } from './IOutboxStorage';
export interface OutboxOptions {
    /** How often to poll the database (in milliseconds) */
    pollIntervalMs?: number;
    /** Maximum number of messages to fetch in a single poll */
    batchSize?: number;
    /** Maximum retries per message before failing (if storage doesn't handle it) */
    maxRetries?: number;
    /** Enable or disable the processor. Default is true. */
    enabled?: boolean;
}
export declare class OutboxProcessor {
    private broker;
    private storage;
    private options;
    private isProcessing;
    private timerInfo;
    private stopRequested;
    constructor(broker: IMessageBroker, storage: IOutboxStorage, options?: OutboxOptions);
    /**
     * Start polling the Outbox Storage for pending messages
     */
    start(): void;
    /**
     * Stop polling gracefully
     */
    stop(): Promise<void>;
    private tick;
    private processMessage;
}
//# sourceMappingURL=OutboxProcessor.d.ts.map