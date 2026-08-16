// admin/workers/AdminTransactionsWorker.js
import AppAPI from '../../app.api.js';

export default class AdminTransactionsWorker {
    constructor(bus) {
        this.bus = bus;
        this.el = document.getElementById('section-transactions');
        this._filters = { type: '', status: '', search: '' };
    }

    async init() {
        this.bus.subscribe('admin:nav', ({ section }) => { if (section === 'transactions') this._render(); });
    }

    async _render() {
        this.el.innerHTML = `<div style="color:var(--text-muted);padding:20px">Loading transactions...</div>`;
        const res = await AppAPI.getTransactions(this._filters);
        this._renderTable(res.transactions, res.total);
    }

    _renderTable(txs, total) {
        this.el.innerHTML = `
        <div class="section-header">
            <div class="section-title">Transactions <span style="color:var(--text-muted);font-size:13px">(${total})</span></div>
            <button class="section-action" onclick="window.print()">⬇ Export</button>
        </div>

        <div class="filter-bar">
            <select class="filter-select" id="filter-type">
                <option value="">All Types</option>
                <option value="WITHDRAW">Withdraw</option>
                <option value="SEND">Send Money</option>
                <option value="DEPOSIT">Deposit</option>
                <option value="AIRTIME">Airtime</option>
                <option value="BILL">Bill</option>
            </select>
            <select class="filter-select" id="filter-status">
                <option value="">All Status</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
            </select>
            <input class="filter-search" id="filter-search" placeholder="Search ref, phone..." value="${this._filters.search}">
            <button class="section-action" id="filter-apply">🔍 Filter</button>
        </div>

        <div style="background:var(--surface-card);border:1px solid var(--border-color);border-radius:14px;overflow:hidden">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>REF</th>
                        <th>TYPE</th>
                        <th>PROVIDER</th>
                        <th>PHONE</th>
                        <th>AMOUNT</th>
                        <th>FEE</th>
                        <th>STATUS</th>
                        <th>KIOSK</th>
                        <th>TIME</th>
                    </tr>
                </thead>
                <tbody>
                    ${txs.map(t => `
                    <tr>
                        <td class="mono">${t.ref}</td>
                        <td><span style="font-weight:700;font-size:11px">${t.type}</span></td>
                        <td style="font-size:11px">${t.provider}</td>
                        <td class="mono">${t.phone}</td>
                        <td style="font-weight:700">TZS ${t.amount.toLocaleString()}</td>
                        <td style="color:var(--text-muted)">TZS ${t.fee.toLocaleString()}</td>
                        <td><span class="status-pill ${t.status === 'success' ? 'pill-success' : t.status === 'failed' ? 'pill-failed' : 'pill-pending'}">${t.status}</span></td>
                        <td class="mono" style="font-size:11px">${t.kiosk}</td>
                        <td style="font-size:10px;color:var(--text-muted)">${t.timestamp}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>`;

        // Filters
        document.getElementById('filter-type').value   = this._filters.type;
        document.getElementById('filter-status').value = this._filters.status;
        document.getElementById('filter-apply').addEventListener('click', () => {
            this._filters.type   = document.getElementById('filter-type').value;
            this._filters.status = document.getElementById('filter-status').value;
            this._filters.search = document.getElementById('filter-search').value;
            this._render();
        });
        document.getElementById('filter-search').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this._filters.search = e.target.value;
                this._render();
            }
        });
    }
}
