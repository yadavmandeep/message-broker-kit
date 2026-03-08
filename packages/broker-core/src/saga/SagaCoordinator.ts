import { IMessageBroker, MessageHandler, PublishData } from '../interfaces/IMessageBroker';

export interface SagaAction {
  name: string;
  topic: string;
  payload: any;
  compensationEvent: string; // The event to trigger if this saga part fails
}

export class SagaCoordinator {
  private broker: IMessageBroker;
  private currentSagaId: string | null = null;
  private actions: SagaAction[] = [];

  constructor(broker: IMessageBroker) {
    this.broker = broker;
  }

  public startSaga(sagaId: string) {
    this.currentSagaId = sagaId;
    this.actions = [];
    return this;
  }

  public addAction(action: SagaAction) {
    this.actions.push(action);
    return this;
  }

  public async execute() {
    if (!this.currentSagaId) throw new Error("Saga not started. Call startSaga() first.");
    
    const executedActions: SagaAction[] = [];

    for (const action of this.actions) {
      try {
        console.log(`[SagaCoordinator] Executing: ${action.name} for Saga: ${this.currentSagaId}`);
        await this.broker.publish({
          topic: action.topic,
          event: action.name,
          message: action.payload,
          headers: { sagaId: this.currentSagaId, isCompensation: 'false' }
        });
        executedActions.push(action); // Track success for potential rollback
        
        // Wait for an acknowledgment or assume success for this example
        // In a true distributed saga, we'd wait for a Reply/Response queue event.
        // We'll simulate synchronous success continuation.
      } catch (error: any) {
        console.error(`[SagaCoordinator] Saga Action FAILED: ${action.name}. Initiating Rollback...`);
        await this.rollback(executedActions);
        throw new Error(`Saga ${this.currentSagaId} Failed during ${action.name}: ${error.message}`);
      }
    }

    console.log(`[SagaCoordinator] Saga ${this.currentSagaId} Completed Successfully.`);
  }

  private async rollback(executedActions: SagaAction[]) {
    // Traverse backwards and trigger compensations
    const rollbackActions = [...executedActions].reverse();
    const sagaId = this.currentSagaId || 'UNKNOWN_SAGA_ID';

    for (const action of rollbackActions) {
       console.log(`[SagaCoordinator] Rolling back: ${action.name} -> Firing: ${action.compensationEvent}`);
       try {
           await this.broker.publish({
               topic: action.topic,
               event: action.compensationEvent,
               message: { originalPayload: action.payload, rollbackReason: 'Saga Failed' },
               headers: { sagaId: sagaId, isCompensation: 'true' }
           });
       } catch (e: any) {
           console.error(`[SagaCoordinator] CRITICAL: Failed to publish compensation event ${action.compensationEvent}`, e.message);
       }
    }
  }
}
