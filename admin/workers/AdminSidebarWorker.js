// admin/workers/AdminSidebarWorker.js
export default class AdminSidebarWorker {
    constructor(bus) {
        this.bus = bus;
        this.el = document.getElementById('admin-sidebar');
        this._active = 'overview';
    }

    async init() {
        this._render();
        this.bus.subscribe('admin:section-changed', ({ section }) => {
            this._active = section;
            this._updateActive();
        });
    }

    _render() {
        this.el.innerHTML = `
        <div class="sidebar-logo">
            <div class="sidebar-brand">
                <div class="sidebar-mark">JD</div>
                <div>
                    <div class="sidebar-name">JOBDENI</div>
                    <div class="sidebar-role">Admin Dashboard</div>
                </div>
            </div>
        </div>
        <nav class="sidebar-nav">
            <div class="nav-item active" data-section="overview">
                <span class="nav-icon">📊</span> Dashboard
            </div>
            <div class="nav-item" data-section="transactions">
                <span class="nav-icon">💳</span> Transactions
            </div>
            <div class="nav-item" data-section="kiosks">
                <span class="nav-icon">🖥️</span> Machines
            </div>
            <div class="nav-item" data-section="alerts">
                <span class="nav-icon">🔔</span> Alerts
                <span class="nav-badge" id="alert-badge">2</span>
            </div>
            <div class="nav-item" data-section="reports">
                <span class="nav-icon">📄</span> Reports
            </div>
        </nav>
        <div class="sidebar-footer">
            <div class="sidebar-logout">
                <span>🚪</span> Log Out
            </div>
        </div>`;

        this.el.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                this.bus.publish('admin:nav', { section: item.dataset.section });
            });
        });
    }

    _updateActive() {
        this.el.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.section === this._active);
        });
    }
}
