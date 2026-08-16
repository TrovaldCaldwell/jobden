// admin/workers/AdminAlertsWorker.js
import AppAPI from '../../app.api.js';

export default class AdminAlertsWorker {
    constructor(bus) { this.bus = bus; this.el = document.getElementById('section-alerts'); }

    async init() {
        this.bus.subscribe('admin:nav', ({ section }) => { if (section === 'alerts') this._render(); });
    }

    async _render() {
        const res = await AppAPI.getAlerts();
        this._renderAlerts(res.alerts);
    }

    _renderAlerts(alerts) {
        const icons = { low_cash: '💰', error: '⚠️', offline: '📡', info: 'ℹ️' };

        this.el.innerHTML = `
        <div class="section-header">
            <div class="section-title">System Alerts (${alerts.filter(a => !a.read).length} unread)</div>
            <button class="section-action" id="mark-all">✓ Mark All Read</button>
        </div>
        <div class="alert-list">
            ${alerts.map(a => `
            <div class="alert-item ${!a.read ? 'unread' : ''}" data-id="${a.id}">
                <div class="alert-icon">${icons[a.type] || '🔔'}</div>
                <div class="alert-body">
                    <div class="alert-msg">${a.message}</div>
                    <div class="alert-time">${a.time} — ${a.kiosk}</div>
                </div>
                <div class="alert-read">${a.read ? '✓ Read' : '● New'}</div>
            </div>`).join('')}
        </div>`;

        this.el.querySelectorAll('.alert-item').forEach(item => {
            item.addEventListener('click', async () => {
                await AppAPI.markAlertRead(item.dataset.id);
                this._render();
            });
        });

        document.getElementById('mark-all').addEventListener('click', async () => {
            await Promise.all(alerts.map(a => AppAPI.markAlertRead(a.id)));
            this._render();
            // Update sidebar badge
            const badge = document.getElementById('alert-badge');
            if (badge) badge.textContent = '0';
        });
    }
}
