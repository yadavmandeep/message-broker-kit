import { IMessageBroker } from '../interfaces/IMessageBroker';
import { IOutboxStorage } from '../outbox/IOutboxStorage';
export interface DashboardOptions {
    port?: number;
    apiPath?: string;
    staticPath?: string;
}
/**
 * Super lightweight UI Server bundled within the package to manage DLQ
 */
export declare class SmartDLQDashboard {
    private app;
    private broker;
    private storage;
    private port;
    constructor(broker: IMessageBroker, storage: IOutboxStorage, options?: DashboardOptions);
    private setupRoutes;
    start(): void;
}
//# sourceMappingURL=SmartDLQDashboard.d.ts.map