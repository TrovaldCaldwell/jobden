// admin/supervisors/AdminSupervisor.js
import AdminSidebarWorker      from '../workers/AdminSidebarWorker.js';
import AdminTopbarWorker       from '../workers/AdminTopbarWorker.js';
import AdminOverviewWorker     from '../workers/AdminOverviewWorker.js';
import AdminTransactionsWorker from '../workers/AdminTransactionsWorker.js';
import AdminKiosksWorker       from '../workers/AdminKiosksWorker.js';
import AdminAlertsWorker       from '../workers/AdminAlertsWorker.js';
import AdminReportsWorker      from '../workers/AdminReportsWorker.js';

export default class AdminSupervisor {
    constructor(bus) {
        this.bus = bus;
        this._current = 'overview';
    }

    async init() {
        this.sidebar      = new AdminSidebarWorker(this.bus);
        this.topbar       = new AdminTopbarWorker(this.bus);
        this.overview     = new AdminOverviewWorker(this.bus);
        this.transactions = new AdminTransactionsWorker(this.bus);
        this.kiosks       = new AdminKiosksWorker(this.bus);
        this.alerts       = new AdminAlertsWorker(this.bus);
        this.reports      = new AdminReportsWorker(this.bus);

        await this.sidebar.init();
        await this.topbar.init();
        await this.overview.init();
        await this.transactions.init();
        await this.kiosks.init();
        await this.alerts.init();
        await this.reports.init();

        this.bus.subscribe('admin:nav', ({ section }) => this.goTo(section));
        this.goTo('overview');
    }

    goTo(section) {
        document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
        const el = document.getElementById(`section-${section}`);
        if (el) el.classList.add('active');
        this._current = section;
        this.bus.publish('admin:section-changed', { section });
        console.log(`[AdminSupervisor] → ${section}`);
    }
}
