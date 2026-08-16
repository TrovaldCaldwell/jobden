// admin/workers/AdminTopbarWorker.js
export default class AdminTopbarWorker {
    constructor(bus) { this.bus = bus; this.el = document.getElementById('admin-topbar'); this._title = 'Dashboard'; }
    async init() {
        this._render();
        this.bus.subscribe('admin:section-changed', ({ section }) => {
            const titles = { overview: 'Dashboard', transactions: 'Transactions', kiosks: 'Machines', alerts: 'Alerts', reports: 'Reports' };
            this._title = titles[section] || section;
            document.querySelector('.topbar-title').textContent = this._title;
        });
    }
    _render() {
        this.el.innerHTML = `
        <div class="topbar-title">Dashboard</div>
        <div class="topbar-right">
            <span class="topbar-time"></span>
            <span class="topbar-badge">● LIVE</span>
        </div>`;
    }
}
