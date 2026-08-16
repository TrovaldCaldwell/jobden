// admin/workers/AdminReportsWorker.js
import AppAPI from '../../app.api.js';

export default class AdminReportsWorker {
    constructor(bus) { this.bus = bus; this.el = document.getElementById('section-reports'); }

    async init() {
        this.bus.subscribe('admin:nav', ({ section }) => { if (section === 'reports') this._render(); });
    }

    async _render() {
        const stats = await AppAPI.getStats();
        const fmt = n => `TZS ${n.toLocaleString()}`;

        this.el.innerHTML = `
        <div class="section-header">
            <div class="section-title">Reports</div>
            <button class="section-action">⬇ Download PDF</button>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
            <div class="chart-card">
                <div class="chart-title">Summary Report</div>
                <div style="display:flex;flex-direction:column;gap:10px;font-size:13px">
                    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color)">
                        <span style="color:var(--text-muted)">Total Transactions</span>
                        <span style="font-weight:700">${stats.total}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color)">
                        <span style="color:var(--text-muted)">Successful</span>
                        <span style="font-weight:700;color:var(--accent-green)">${stats['success']}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color)">
                        <span style="color:var(--text-muted)">Failed</span>
                        <span style="font-weight:700;color:var(--accent-red)">${stats.failed}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color)">
                        <span style="color:var(--text-muted)">Pending</span>
                        <span style="font-weight:700;color:var(--accent-orange)">${stats.pending}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color)">
                        <span style="color:var(--text-muted)">Total Revenue (Fees)</span>
                        <span style="font-weight:700;color:var(--accent-color)">${fmt(stats.revenue)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color)">
                        <span style="color:var(--text-muted)">Total Deposits</span>
                        <span style="font-weight:700">${fmt(stats.deposits)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:8px 0">
                        <span style="color:var(--text-muted)">Total Withdrawals</span>
                        <span style="font-weight:700">${fmt(stats.withdraws)}</span>
                    </div>
                </div>
            </div>

            <div class="chart-card">
                <div class="chart-title">Kiosk Performance</div>
                <div style="display:flex;flex-direction:column;gap:10px;font-size:13px">
                    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color)">
                        <span style="color:var(--text-muted)">Total Kiosks</span>
                        <span style="font-weight:700">${stats.kiosks.total}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color)">
                        <span style="color:var(--text-muted)">Online</span>
                        <span style="font-weight:700;color:var(--accent-green)">${stats.kiosks.online}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color)">
                        <span style="color:var(--text-muted)">Offline</span>
                        <span style="font-weight:700;color:var(--accent-red)">${stats.kiosks.offline}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:8px 0">
                        <span style="color:var(--text-muted)">Low Cash</span>
                        <span style="font-weight:700;color:var(--accent-orange)">${stats.kiosks.lowCash}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="chart-card" style="margin-top:16px">
            <div class="chart-title">Export Options</div>
            <div style="display:flex;gap:10px;flex-wrap:wrap">
                ${['Daily Report','Weekly Report','Monthly Report','Transaction CSV','Kiosk Report','Revenue Report'].map(r =>
                    `<button class="section-action" style="flex:0 0 auto">📄 ${r}</button>`
                ).join('')}
            </div>
        </div>`;
    }
}
