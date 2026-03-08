"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnterpriseBrokerWrapper = void 0;
const uuid_1 = require("uuid");
const lru_cache_1 = require("lru-cache");
const CryptoUtils_1 = require("./CryptoUtils");
class EnterpriseBrokerWrapper {
    baseBroker;
    options;
    idempotencyCache = null;
    // Circuit Breaker State
    cbState = 'CLOSED';
    cbFailureCount = 0;
    cbLastFailureTime = 0;
    // Track cleanup hooks for graceful shutdown
    static instanceRefs = [];
    static shutdownInitialized = false;
    constructor(baseBroker, options = {}) {
        this.baseBroker = baseBroker;
        this.options = options;
        if (this.options.idempotency?.enabled) {
            this.idempotencyCache = new lru_cache_1.LRUCache({
                max: 10000,
                ttl: this.options.idempotency.ttlMs || 1000 * 60 * 60 // 1 hour default
            });
        }
        if (this.options.gracefulShutdown?.enabled) {
            EnterpriseBrokerWrapper.instanceRefs.push(this);
            EnterpriseBrokerWrapper.initGracefulShutdown();
        }
    }
    static initGracefulShutdown() {
        if (this.shutdownInitialized)
            return;
        this.shutdownInitialized = true;
        const performShutdown = async (signal) => {
            console.log(`\n[EnterpriseBroker] Received ${signal}. Commencing Graceful Shutdown...`);
            for (const broker of this.instanceRefs) {
                try {
                    await broker.disconnectConsumer();
                    await broker.disconnectProducer();
                }
                catch (e) {
                    console.error(`[EnterpriseBroker] Error during shutdown:`, e.message);
                }
            }
            console.log(`[EnterpriseBroker] All broker connections drained and closed. Exiting.`);
            process.exit(0);
        };
        process.on('SIGINT', () => performShutdown('SIGINT'));
        process.on('SIGTERM', () => performShutdown('SIGTERM'));
    }
    async connectProducer() {
        return this.baseBroker.connectProducer();
    }
    async disconnectProducer() {
        return this.baseBroker.disconnectProducer();
    }
    async publish(data) {
        // 1. Schema Validation (Zod / Joi check)
        if (data.schema) {
            try {
                // Assuming it's a zod schema `data.schema.parse()`
                if (typeof data.schema.parse === 'function') {
                    data.message = data.schema.parse(data.message);
                }
            }
            catch (err) {
                console.error('[EnterpriseBroker] Schema Validation Failed:', err.errors || err.message);
                throw new Error(`Schema Validation Failed for event: ${data.event}`);
            }
        }
        const headers = data.headers || {};
        // 2. OpenTelemetry (Inject Trace ID)
        if (this.options.openTelemetry?.enabled && !headers['traceId']) {
            headers['traceId'] = (0, uuid_1.v4)();
        }
        // 3. Idempotency (Inject Unique Message ID to track drops on consumer end)
        if (this.options.idempotency?.enabled && !headers['messageId']) {
            headers['messageId'] = (0, uuid_1.v4)();
        }
        // 4. Payload Encryption
        if (this.options.encryption?.enabled && this.options.encryption.secretKey) {
            data.message = CryptoUtils_1.CryptoUtils.processPayload(data.message, this.options.encryption.fieldsToEncrypt || [], 'encrypt', this.options.encryption.secretKey);
            headers['x-encrypted'] = 'true';
        }
        return this.baseBroker.publish({ ...data, headers });
    }
    async connectConsumer() {
        return this.baseBroker.connectConsumer();
    }
    async disconnectConsumer() {
        return this.baseBroker.disconnectConsumer();
    }
    async subscribe(messageHandler, topic) {
        let requestTimestamps = [];
        const wrappedHandler = async (incoming) => {
            // -1. Payload Decryption
            if (this.options.encryption?.enabled && this.options.encryption.secretKey && incoming.headers['x-encrypted'] === 'true') {
                incoming.data = CryptoUtils_1.CryptoUtils.processPayload(incoming.data, this.options.encryption.fieldsToEncrypt || [], 'decrypt', this.options.encryption.secretKey);
            }
            // 0. Circuit Breaker Quick Fail (Before Throttling)
            if (this.options.circuitBreaker?.enabled) {
                const cbOptions = this.options.circuitBreaker;
                const threshold = cbOptions.failureThreshold || 5;
                const resetTimeout = cbOptions.resetTimeoutMs || 10000;
                if (this.cbState === 'OPEN') {
                    const now = Date.now();
                    if (now - this.cbLastFailureTime > resetTimeout) {
                        console.log(`[EnterpriseBroker] Circuit Breaker HALF-OPEN for topic ${topic}. Testing health...`);
                        this.cbState = 'HALF_OPEN';
                    }
                    else {
                        // Fail fast and direct to DLQ (if configured) or just drop
                        console.error(`[EnterpriseBroker] Circuit is OPEN! Rejecting message for ${topic} immediately.`);
                        // Direct to DLQ handling if possible, or we throw so outer loop re-schedules?
                        // We'll throw an error to simulate instant fail without calling business logic
                        throw new Error('Circuit Breaker is OPEN');
                    }
                }
            }
            // 0.5 Rate Limiting (Throttling)
            if (this.options.rateLimit?.enabled && this.options.rateLimit.maxMessagesPerSecond) {
                const maxMsgs = this.options.rateLimit.maxMessagesPerSecond;
                let now = Date.now();
                requestTimestamps = requestTimestamps.filter(t => now - t < 1000);
                if (requestTimestamps.length >= maxMsgs) {
                    const oldest = requestTimestamps[0];
                    const waitTime = 1000 - (now - oldest);
                    if (waitTime > 0) {
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                    }
                }
                requestTimestamps.push(Date.now());
            }
            // 1. Idempotency Check (Filter duplicate events)
            if (this.options.idempotency?.enabled && this.idempotencyCache) {
                const messageId = incoming.headers['messageId'];
                if (messageId) {
                    if (this.idempotencyCache.has(messageId)) {
                        console.log(`[EnterpriseBroker] Duplicate event detected. Dropping messageId: ${messageId}`);
                        return; // drop duplicate silently
                    }
                    this.idempotencyCache.set(messageId, true);
                }
            }
            // 2. Auto-Retry with Exponential Backoff
            const maxRetries = this.options.autoRetry?.enabled ? (this.options.autoRetry.maxRetries || 3) : 0;
            let attempt = 0;
            while (attempt <= maxRetries) {
                try {
                    // Execute actual business logic handler
                    await messageHandler(incoming);
                    // Circuit Breaker Success Update
                    if (this.options.circuitBreaker?.enabled) {
                        if (this.cbState === 'HALF_OPEN') {
                            console.log(`[EnterpriseBroker] Circuit Breaker completely CLOSED for topic ${topic} after successful health test.`);
                        }
                        this.cbState = 'CLOSED';
                        this.cbFailureCount = 0;
                    }
                    return; // Success! Break out of the loop.
                }
                catch (err) {
                    attempt++;
                    console.error(`[EnterpriseBroker] Handler execution failed (Attempt: ${attempt}):`, err.message);
                    if (attempt > maxRetries) {
                        console.error(`[EnterpriseBroker] Exhausted all ${maxRetries} retries for event: ${incoming.event}`);
                        // Circuit Breaker Failure Update
                        if (this.options.circuitBreaker?.enabled) {
                            const threshold = this.options.circuitBreaker.failureThreshold || 5;
                            this.cbFailureCount++;
                            if (this.cbFailureCount >= threshold) {
                                console.error(`[EnterpriseBroker] Circuit Breaker TRIPPED to OPEN for topic ${topic}!`);
                                this.cbState = 'OPEN';
                                this.cbLastFailureTime = Date.now();
                            }
                        }
                        // 3. Dead Letter Queue (DLQ) Integration
                        if (this.options.dlq?.enabled) {
                            const dlqTopic = this.options.dlq.topicName || `${topic}_DLQ`;
                            console.log(`[EnterpriseBroker] Moving message to DLQ: ${dlqTopic}`);
                            try {
                                await this.baseBroker.publish({
                                    topic: dlqTopic,
                                    event: incoming.event,
                                    message: {
                                        originalData: incoming.data,
                                        errorReason: err.message,
                                        failedAt: new Date().toISOString()
                                    },
                                    headers: incoming.headers
                                });
                            }
                            catch (dlqErr) {
                                console.error(`[EnterpriseBroker] FATAL: Failed to send to DLQ!`, dlqErr.message);
                            }
                        }
                        // Exit handler manually so under-the-curve broker acks it (to prevent infinitely hanging)
                        return;
                    }
                    // Exponential Backoff Wait (2s -> 4s -> 8s)
                    if (this.options.autoRetry?.enabled) {
                        const delayMs = (this.options.autoRetry.initialDelayMs || 2000) * Math.pow(2, attempt - 1);
                        console.log(`[EnterpriseBroker] Retrying in ${delayMs}ms...`);
                        await new Promise(resolve => setTimeout(resolve, delayMs));
                    }
                }
            }
        };
        return this.baseBroker.subscribe(wrappedHandler, topic);
    }
}
exports.EnterpriseBrokerWrapper = EnterpriseBrokerWrapper;
