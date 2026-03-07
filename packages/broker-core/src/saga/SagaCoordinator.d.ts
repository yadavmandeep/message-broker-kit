import { IMessageBroker } from '../interfaces/IMessageBroker';
export interface SagaAction {
    name: string;
    topic: string;
    payload: any;
    compensationEvent: string;
}
export declare class SagaCoordinator {
    private broker;
    private currentSagaId;
    private actions;
    constructor(broker: IMessageBroker);
    startSaga(sagaId: string): this;
    addAction(action: SagaAction): this;
    execute(): Promise<void>;
    private rollback;
}
//# sourceMappingURL=SagaCoordinator.d.ts.map