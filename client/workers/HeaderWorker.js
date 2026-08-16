// workers/HeaderWorker.js
export default class HeaderWorker {
    constructor(bus, lm, session) {
        this.bus = bus; this.lm = lm; this.session = session;
        this.el = document.getElementById('kiosk-header');
    }
    async init() { this._render(); this.bus.subscribe('language:changed', () => this._render()); }
    _render() {
        const now  = new Date();
        const time = now.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
        const date = now.toLocaleDateString('en', { day: '2-digit', month: 'short', year: 'numeric' });
        this.el.innerHTML = `
        <div class="header-logo">
            <div class="logo-mark">
                <svg viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                    <rect width="36" height="36" rx="7" fill="#1a3a5c"/>
                    <text x="18" y="25" text-anchor="middle" font-family="Arial Black,sans-serif"
                          font-weight="900" font-size="16" fill="#ffffff" letter-spacing="0">JD</text>
                </svg>
            </div>
            <div class="logo-text">
                <span class="logo-name">JOBDENI</span>
                <span class="logo-tagline">Universal Money Kiosk</span>
            </div>
        </div>
        <div class="header-time">
            <div class="time-value">${time}</div>
            <div class="header-date">${date}</div>
        </div>`;
    }
}
