"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutboxProcessor = void 0;
class OutboxProcessor {
    broker;
    storage;
    options;
    isProcessing = false;
    timerInfo = null;
    stopRequested = false;
    constructor(broker, storage, options = {}) {
        this.broker = broker;
        this.storage = storage;
        this.options = {
            pollIntervalMs: options.pollIntervalMs || 5000,
            batchSize: options.batchSize || 100,
            maxRetries: options.maxRetries || 3,
            enabled: options.enabled !== false,
        };
    }
    /**
     * Start polling the Outbox Storage for pending messages
     */
    start() {
        if (!this.options.enabled) {
            console.log('[OutboxProcessor] Outbox is disabled in options.');
            return;
        }
        if (this.timerInfo) {
            console.warn('[OutboxProcessor] Processor is already running');
            return;
        }
        this.stopRequested = false;
        console.log(`[OutboxProcessor] Started tracking Outbox table. Polling every ${this.options.pollIntervalMs}ms`);
        // Initial immediate tick
        this.tick();
        // Schedule interval
        this.timerInfo = setInterval(() => {
            this.tick();
        }, this.options.pollIntervalMs);
    }
    /**
     * Stop polling gracefully
     */
    async stop() {
        this.stopRequested = true;
        if (this.timerInfo) {
            clearInterval(this.timerInfo);
            this.timerInfo = null;
        }
        console.log('[OutboxProcessor] Processor stopping...');
        // Wait for current batch to finish
        while (this.isProcessing) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        console.log('[OutboxProcessor] Processor stopped gracefully.');
    }
    async tick() {
        if (this.isProcessing || this.stopRequested)
            return;
        this.isProcessing = true;
        try {
            const messages = await this.storage.fetchPendingMessages(this.options.batchSize);
            if (messages && messages.length > 0) {
                for (const msg of messages) {
                    if (this.stopRequested)
                        break;
                    await this.processMessage(msg);
                }
            }
        }
        catch (error) {
            console.error('[OutboxProcessor] Error fetching outbox messages:', error.message);
        }
        finally {
            this.isProcessing = false;
        }
    }
    async processMessage(msg) {
        const retryCount = msg.retryCount || 0;
        const maxRetries = this.options.maxRetries;
        const dataToPublish = {
            topic: msg.topic,
            event: msg.event,
            headers: { ...msg.headers, 'x-outbox-id': msg.id },
            message: msg.message,
        };
        try {
            // 1. Send it
            await this.broker.publish(dataToPublish);
            // 2. Mark as successfully processed
            await this.storage.markAsProcessed(msg.id);
        }
        catch (error) {
            const nextRetryCount = retryCount + 1;
            console.error(`[OutboxProcessor] Failed to publish message ${msg.id}. Retry ${nextRetryCount}/${maxRetries}. Error:`, error.message);
            if (nextRetryCount > maxRetries) {
                // 3. Mark as totally failed if exhausted
                await this.storage.markAsFailed(msg.id, error.message);
            }
            else {
                // Normally, the storage adapter handles retry counts when the message is fetched again later.
                // Some adapters might natively implement backoff based on retryCount.
            }
        }
    }
}
exports.OutboxProcessor = OutboxProcessor;
