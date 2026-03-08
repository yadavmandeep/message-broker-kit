import express, { Request, Response } from 'express';
import cors from 'cors';
import { IMessageBroker } from '../interfaces/IMessageBroker';
import { IOutboxStorage, OutboxMessage } from '../outbox/IOutboxStorage';

export interface DashboardOptions {
    port?: number;
    apiPath?: string; // '/broker-ui/api'
    staticPath?: string; // Optional custom UI 
}

/**
 * Super lightweight UI Server bundled within the package to manage DLQ
 */
export class SmartDLQDashboard {
    private app: express.Application;
    private broker: IMessageBroker;
    private storage: IOutboxStorage;
    private port: number;

    constructor(broker: IMessageBroker, storage: IOutboxStorage, options: DashboardOptions = {}) {
        this.app = express();
        this.broker = broker;
        this.storage = storage;
        this.port = options.port || 4000;

        this.app.use(cors());
        this.app.use(express.json());

        this.setupRoutes(options.apiPath || '/api/dlq');
    }

    private setupRoutes(apiPath: string) {
        
        // --- 1. View Failed Messages API ---
        this.app.get(`${apiPath}/failed`, async (req: Request, res: Response) => {
            try {
                // Fetch failed messages from the Storage (mock limit to 100 for ui plugin)
                // Note: User's IOutboxStorage implementation needs to return Failed ones
                const messages = await this.storage.fetchPendingMessages(100); 
                
                // Assuming Outbox Implementation returns all statuses or we map Failed DB Logic
                const failed = messages.filter(m => m.status === 'FAILED'); 
                
                res.json({ success: true, count: failed.length, messages: failed });
            } catch (err: any) {
                res.status(500).json({ success: false, error: err.message });
            }
        });

        // --- 2. Retry Logic API (Click to Retry) ---
        this.app.post(`${apiPath}/retry`, async (req: Request, res: Response) => {
            const { messageId, topic, event, payload } = req.body;
            
            if (!messageId || !topic) return res.status(400).json({ error: "Missing parameters" });

            console.log(`[BrokerUI] Analyst initiating manual retry on Event: ${event} (${messageId})`);

            try {
                // Publish back to broker
                await this.broker.publish({
                    topic,
                    event,
                    message: payload,
                    headers: { isManualRetry: 'true', originalId: messageId }
                });

                // Mark processed in DB
                await this.storage.markAsProcessed(messageId);
                
                res.json({ success: true, message: "Pushed to queue successfully." });
            } catch (err: any) {
                console.error(`[BrokerUI] Manual Retry Failed: `, err.message);
                res.status(500).json({ success: false, error: err.message });
            }
        });

        // --- 3. Basic HTML Dashboard Fallback UI ---
        this.app.get('/broker-ui', (req: Request, res: Response) => {
            const html = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Message Broker - Edge Control</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                    <style>
                        body { font-family: 'Inter', sans-serif; background-color: #f8fafc; color: #0f172a; }
                        .glass-panel { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(12px); border: 1px solid rgba(0, 0, 0, 0.05); }
                        .scrollbar-hide::-webkit-scrollbar { display: none; }
                    </style>
                </head>
                <body class="min-h-screen p-8">
                    <div class="max-w-7xl mx-auto">
                        <!-- Header -->
                        <header class="flex justify-between items-center mb-10">
                            <div>
                                <h1 class="text-4xl font-bold text-slate-900 flex items-center gap-3">
                                    <svg class="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                                    Smart DLQ Triage Center
                                </h1>
                                <p class="text-slate-500 mt-2 text-lg">Live diagnostic metrics and manual intervention pane.</p>
                            </div>
                            <div class="glass-panel px-6 py-3 rounded-xl shadow border-l-4 border-rose-500">
                                <span class="text-sm text-slate-500 uppercase tracking-wider font-semibold">Dead Letters Found</span>
                                <p id="status" class="text-3xl font-bold text-rose-600 mt-1">0</p>
                            </div>
                        </header>

                        <!-- Main Content -->
                        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div class="bg-slate-50 px-6 py-4 border-b border-slate-200 font-semibold text-slate-700 flex justify-between items-center">
                                <span>Failed Messages Stream</span>
                                <button onclick="load()" class="text-sm flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors">
                                   <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                                   Refresh
                                </button>
                            </div>
                            
                            <div class="overflow-x-auto">
                                <table class="w-full text-left border-collapse">
                                    <thead>
                                        <tr class="bg-slate-100 text-slate-600 text-sm tracking-wider">
                                            <th class="p-4 font-medium">Msg ID</th>
                                            <th class="p-4 font-medium">Topic</th>
                                            <th class="p-4 font-medium">Event</th>
                                            <th class="p-4 font-medium">Payload Data</th>
                                            <th class="p-4 font-medium text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody id="grid" class="divide-y divide-slate-100 bg-white">
                                        <tr><td colspan="5" class="p-8 text-center text-slate-500">Loading data from backend...</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <script>
                        async function load() {
                            try {
                                const res = await fetch('${apiPath}/failed');
                                const data = await res.json();
                                
                                document.getElementById('status').innerText = data.count;
                                const grid = document.getElementById('grid');
                                grid.innerHTML = '';
                                
                                if (data.count === 0) {
                                    grid.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-emerald-600 py-12"><svg class="w-16 h-16 mx-auto mb-4 text-emerald-100 stroke-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>No dead letters found! Queue is healthy.</td></tr>';
                                    return;
                                }
                                
                                data.messages.forEach(m => {
                                    const payloadStr = JSON.stringify(m.message, null, 2);
                                    grid.innerHTML += \`
                                        <tr class="hover:bg-slate-50 transition-colors group">
                                            <td class="p-4 font-mono text-xs text-slate-500">\${m.id.substring(0,8)}...</td>
                                            <td class="p-4"><span class="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs rounded-full border border-indigo-100 font-medium">\${m.topic}</span></td>
                                            <td class="p-4 font-medium text-slate-900">\${m.event}</td>
                                            <td class="p-4 w-1/2">
                                                <div class="bg-slate-50 p-3 rounded-lg border border-slate-200 max-h-24 overflow-y-auto scrollbar-hide text-xs font-mono text-slate-700 leading-relaxed shadow-inner">
                                                    <pre>\${payloadStr}</pre>
                                                </div>
                                            </td>
                                            <td class="p-4 text-right">
                                                <button onclick="retry('\${m.id}', '\${m.topic}', '\${m.event}', \${JSON.stringify(m.message).replace(/"/g, '&quot;')})" 
                                                    class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-indigo-500/30 flex items-center justify-center gap-2 ml-auto">
                                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                                    Enqueue
                                                </button>
                                            </td>
                                        </tr>
                                    \`;
                                });
                            } catch (err) {
                                console.error(err);
                                Swal.fire({ icon: 'error', title: 'Connection Failed', text: 'Could not connect to broker UI server', confirmButtonColor: '#4f46e5' });
                            }
                        }

                        async function retry(id, topic, event, payload) {
                            Swal.fire({
                                title: 'Re-queue Event?',
                                text: "This will push the message back to " + topic,
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonColor: '#4f46e5',
                                cancelButtonColor: '#f43f5e',
                                confirmButtonText: 'Yes, enqueue it!'
                            }).then(async (result) => {
                                if (result.isConfirmed) {
                                    try {
                                        const res = await fetch('${apiPath}/retry', {
                                            method: 'POST',
                                            headers: {'Content-Type': 'application/json'},
                                            body: JSON.stringify({ messageId: id, topic, event, payload })
                                        });
                                        const data = await res.json();
                                        if (data.success) {
                                            Swal.fire({ title: 'Enqueued!', text: 'Message pushed back into stream.', icon: 'success', timer: 1500, showConfirmButton: false });
                                            load();
                                        } else throw new Error(data.error);
                                    } catch (e) {
                                         Swal.fire({ icon: 'error', title: 'Failed', text: e.message, confirmButtonColor: '#4f46e5' });
                                    }
                                }
                            });
                        }

                        // Init
                        document.addEventListener('DOMContentLoaded', load);
                    </script>
                </body>
                </html>
            `;
            res.send(html);
        });
    }

    public start() {
        this.app.listen(this.port, () => {
            console.log(`\n\x1b[36m[BrokerUI]\x1b[0m 🧠 Smart DLQ Triage Dashboard is Live at: http://localhost:${this.port}/broker-ui`);
        });
    }
}
