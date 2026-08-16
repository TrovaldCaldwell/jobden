// workers/FooterWorker.js
export default class FooterWorker {
    constructor(bus, lm) { this.bus = bus; this.lm = lm; this.el = document.getElementById('kiosk-footer'); }
    async init() { this._render(); this.bus.subscribe('language:changed', () => this._render()); }
    _render() {
        const L = (k,f) => this.lm.get(k,f||k);
        this.el.innerHTML = `
            <span>🔒 ${L('security','Usalama')}</span>
            <span class="footer-dot">•</span>
            <span>⚡ ${L('speed','Uharaka')}</span>
            <span class="footer-dot">•</span>
            <span>✨ ${L('convenience','Urahisi')}</span>
            <span class="footer-dot">•</span>
            <span class="footer-badge">24/7</span>`;
    }
}
