export interface OutboxMessage {
  id: string;
  topic: string;
  event: string;
  headers?: Record<string, string>;
  message: any; // The payload
  status?: 'PENDING' | 'PROCESSED' | 'FAILED';
  retryCount?: number;
  createdAt?: string | Date;
}

export interface IOutboxStorage {
  /**
   * Fetch a batch of pending messages to be published.
   * Implementation must ensure that these messages are locked or marked so 
   * other worker instances don't pick them up simultaneously (e.g. SELECT FOR UPDATE).
   * @param limit Maximum number of messages to fetch
   */
  fetchPendingMessages(limit: number): Promise<OutboxMessage[]>;

  /**
   * Mark a message as successfully processed (published to the broker).
   * Implementation could either update the status or delete the record.
   * @param id The ID of the message
   */
  markAsProcessed(id: string): Promise<void>;

  /**
   * Mark a message as failed after exhausting retries.
   * @param id The ID of the message
   * @param error The error reason
   */
  markAsFailed(id: string, error: string): Promise<void>;
}
