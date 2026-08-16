// admin/workers/AdminKiosksWorker.js
import AppAPI from '../../app.api.js';

export default class AdminKiosksWorker {
    constructor(bus) { this.bus = bus; this.el = document.getElementById('section-kiosks'); }

    async init() {
        this.bus.subscribe('admin:nav', ({ section }) => { if (section === 'kiosks') this._render(); });
    }

    async _render() {
        this.el.innerHTML = `<div style="color:var(--text-muted);padding:20px">Loading kiosks...</div>`;
        const res = await AppAPI.getKiosks();
        this._renderKiosks(res.kiosks);
    }

    _renderKiosks(kiosks) {
        const statusLabel = (s) => ({ online: '● Online', offline: '● Offline', low_cash: '● Low Cash' }[s] || s);
        const statusCls   = (s) => ({ online: 'pill-online', offline: 'pill-offline', low_cash: 'pill-low' }[s] || '');

        this.el.innerHTML = `
        <div class="section-header">
            <div class="section-title">Machines (${kiosks.length})</div>
            <button class="section-action">+ Register Kiosk</button>
        </div>
        <div class="kiosk-grid">
            ${kiosks.map(k => `
            <div class="kiosk-card" data-id="${k.id}">
                <div class="kiosk-card-header">
                    <div>
                        <div class="kiosk-id">${k.id}</div>
                        <div class="kiosk-name">${k.name}</div>
                        <div class="kiosk-loc">📍 ${k.location}</div>
                    </div>
                    <span class="status-pill ${statusCls(k.status)}">${statusLabel(k.status)}</span>
                </div>
                <div class="kiosk-meta">
                    💰 Cash: TZS ${k.cash.toLocaleString()}<br>
                    🕐 Last seen: ${k.lastSeen}
                </div>
                <div class="kiosk-actions">
                    <button class="kiosk-btn" data-action="view" data-id="${k.id}">📊 View</button>
                    <button class="kiosk-btn danger" data-action="toggle" data-id="${k.id}">
                        ${k.status === 'offline' ? '▶ Enable' : '⏸ Disable'}
                    </button>
                </div>
            </div>`).join('')}
        </div>`;

        this.el.querySelectorAll('[data-action="toggle"]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const res = await AppAPI.toggleKiosk(btn.dataset.id);
                if (res.success) this._render();
            });
        });
    }
}
