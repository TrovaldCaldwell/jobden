// admin/workers/AdminOverviewWorker.js
import AppAPI from '../../app.api.js';

export default class AdminOverviewWorker {
    constructor(bus) { this.bus = bus; this.el = document.getElementById('section-overview'); }

    async init() {
        this._render();
        this.bus.subscribe('admin:nav', ({ section }) => { if (section === 'overview') this._render(); });
        // Auto-refresh every 30s
        setInterval(() => {
            if (this.el.classList.contains('active')) this._render();
        }, 30000);
    }

    async _render() {
        this.el.innerHTML = `<div style="color:var(--text-muted);padding:20px">Loading dashboard...</div>`;
        try {
            const [stats, breakdown] = await Promise.all([AppAPI.getStats(), AppAPI.getServiceBreakdown()]);
            this._renderStats(stats, breakdown);
        } catch(e) {
            this.el.innerHTML = `<div style="color:var(--accent-red)">Error loading stats</div>`;
        }
    }

    _renderStats(stats, breakdown) {
        const fmt = n => n >= 1000000 ? `TZS ${(n/1000000).toFixed(1)}M` : n >= 1000 ? `TZS ${(n/1000).toFixed(0)}K` : `TZS ${n}`;
        const colors = ['#00b4d8','#10b981','#f59e0b','#ef4444','#8b5cf6'];

        // Bar chart
        const maxCount = Math.max(...stats.dailyVolume.map(d => d.count), 1);
        const bars = stats.dailyVolume.map(d => `
            <div class="bar-col">
                <div class="bar-fill" style="height:${Math.max((d.count/maxCount)*100, 4)}px"></div>
                <div class="bar-label">${d.label}</div>
            </div>`).join('');

        // Breakdown
        const breakdownHtml = (breakdown.breakdown || []).map((b, i) => `
            <div class="breakdown-item">
                <div class="b-dot" style="background:${colors[i % colors.length]}"></div>
                <div class="b-label">${b.type}</div>
                <div class="b-bar-wrap"><div class="b-bar-fill" style="width:${b.percent}%;background:${colors[i % colors.length]}"></div></div>
                <div class="b-pct">${b.percent}%</div>
            </div>`).join('');

        this.el.innerHTML = `
        <!-- Stats cards -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">Total Transactions</div>
                <div class="stat-value">${stats.total?.toLocaleString()}</div>
                <div class="stat-delta up">▲ +12.5% this week</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Total Revenue</div>
                <div class="stat-value">${fmt(stats.revenue)}</div>
                <div class="stat-delta up">▲ +18.7% this week</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Total Deposits</div>
                <div class="stat-value">${fmt(stats.deposits)}</div>
                <div class="stat-delta up">▲ +10.3% this week</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Total Withdrawals</div>
                <div class="stat-value">${fmt(stats.withdraws)}</div>
                <div class="stat-delta up">▲ +16.2% this week</div>
            </div>
        </div>

        <!-- Charts -->
        <div class="charts-row">
            <div class="chart-card">
                <div class="chart-title">Daily Transactions (This Week)</div>
                <div class="bar-chart">${bars}</div>
            </div>
            <div class="chart-card">
                <div class="chart-title">Top Services</div>
                <div class="breakdown-list">${breakdownHtml}</div>
            </div>
        </div>

        <!-- Bottom row -->
        <div class="charts-row">
            <div class="chart-card">
                <div class="section-header" style="margin-bottom:12px">
                    <div class="chart-title">Machine Status</div>
                </div>
                <div style="display:flex;gap:20px;align-items:center">
                    <div style="text-align:center">
                        <div style="font-size:28px;font-weight:800;color:var(--accent-green)">${stats.kiosks.online}</div>
                        <div style="font-size:11px;color:var(--text-muted)">● Online</div>
                    </div>
                    <div style="text-align:center">
                        <div style="font-size:28px;font-weight:800;color:var(--accent-red)">${stats.kiosks.offline}</div>
                        <div style="font-size:11px;color:var(--text-muted)">● Offline</div>
                    </div>
                    <div style="text-align:center">
                        <div style="font-size:28px;font-weight:800;color:var(--accent-orange)">${stats.kiosks.lowCash}</div>
                        <div style="font-size:11px;color:var(--text-muted)">● Low Cash</div>
                    </div>
                </div>
            </div>
            <div class="chart-card">
                <div class="chart-title">Transaction Summary</div>
                <div style="display:flex;flex-direction:column;gap:8px">
                    <div style="display:flex;justify-content:space-between;font-size:13px">
                        <span style="color:var(--accent-green)">✓ Successful</span>
                        <span style="font-weight:700">${stats['success']?.toLocaleString()}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;font-size:13px">
                        <span style="color:var(--accent-red)">✕ Failed</span>
                        <span style="font-weight:700">${stats.failed?.toLocaleString()}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;font-size:13px">
                        <span style="color:var(--accent-orange)">⏳ Pending</span>
                        <span style="font-weight:700">${stats.pending?.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>`;
    }
}
