// workers/AirtimeWorker.js — AIRTIME flow
import AppAPI from '../../app.api.js';

export default class AirtimeWorker {
    constructor(bus, lm, session) {
        this.bus = bus; this.lm = lm; this.session = session;
        this.el = document.getElementById('screen-airtime');
        this._step = 'amount'; this._amount = ''; this._result = null;
    }

    async init() {
        this.bus.subscribe('service:selected', ({ service }) => { if (service === 'airtime') this._reset(); });
        this.bus.subscribe('session:reset', () => this._reset());
        this.bus.subscribe('language:changed', () => { if (this.el.classList.contains('active')) this._render(); });
    }

    _reset() { this._step = 'amount'; this._amount = ''; this._result = null; this._render(); }

    _render() {
        switch (this._step) {
            case 'amount':     this._renderAmount();     break;
            case 'confirm':    this._renderConfirm();    break;
            case 'processing': this._renderProcessing(); break;
            case 'success':    this._renderSuccess();    break;
        }
    }

    _renderAmount() {
        const L = (k) => this.lm.get(k, k);
        this.el.innerHTML = `
        <div class="screen-title-bar">AIRTIME — ${L('airtime')}</div>
        <div class="screen-body">
            <div class="info-box verified" style="text-align:center">
                <div class="provider-name">📶 ${this.session.provider || 'M-PESA'}</div>
                <div class="provider-sub">${this.session.phone}</div>
            </div>
            <div class="amount-display ${this._amount ? 'has-value' : ''}">
                ${this._amount ? 'TZS ' + parseInt(this._amount).toLocaleString() : '—'}
            </div>
            <div class="quick-amounts">
                ${[500,1000,2000,3000,5000,10000].map(a =>
                    `<button class="quick-btn" data-amt="${a}">TZS ${a.toLocaleString()}</button>`
                ).join('')}
            </div>
            <div class="keypad">
                ${[1,2,3,4,5,6,7,8,9].map(n => `<button class="keypad-key" data-key="${n}">${n}</button>`).join('')}
                <button class="keypad-key key-00" data-key="00">00</button>
                <button class="keypad-key key-zero" data-key="0">0</button>
                <button class="keypad-key key-del" data-key="del">⌫</button>
            </div>
        </div>
        <div class="screen-actions">
            <button class="btn btn-ghost" id="air-back">← ${L('back')}</button>
            <button class="btn btn-primary" id="air-next" ${!this._amount || parseInt(this._amount) < 500 ? 'disabled' : ''}>${L('continue')} →</button>
        </div>`;

        this.el.querySelectorAll('.quick-btn').forEach(b => {
            b.addEventListener('click', () => { this._amount = b.dataset.amt; this._render(); });
        });
        this.el.querySelectorAll('.keypad-key').forEach(k => {
            k.addEventListener('click', () => {
                const key = k.dataset.key;
                if (key === 'del') this._amount = this._amount.slice(0,-1);
                else { if (this._amount.length >= 6) return; this._amount += key; }
                this._render();
            });
        });
        document.getElementById('air-back').addEventListener('click', () => this.bus.publish('nav:services', {}));
        document.getElementById('air-next').addEventListener('click', () => { this._step = 'confirm'; this._render(); });
    }

    _renderConfirm() {
        const L = (k) => this.lm.get(k, k);
        const amt = parseInt(this._amount);
        this.el.innerHTML = `
        <div class="screen-title-bar">THIBITISHA — AIRTIME</div>
        <div class="screen-body">
            <div class="confirm-card">
                <div class="confirm-row"><span class="label">${L('service')}</span><span class="value">AIRTIME</span></div>
                <div class="confirm-row"><span class="label">${L('provider')}</span><span class="value">${this.session.provider}</span></div>
                <div class="confirm-row"><span class="label">${L('number')}</span><span class="value">${this.session.phone}</span></div>
                <div class="confirm-row"><span class="label">${L('amount')}</span><span class="value">TZS ${amt.toLocaleString()}</span></div>
                <div class="confirm-row"><span class="label">${L('fee')}</span><span class="value">TZS 0</span></div>
                <div class="confirm-row total-row"><span class="label fw-bold">${L('total')}</span><span class="value">TZS ${amt.toLocaleString()}</span></div>
            </div>
        </div>
        <div class="screen-actions">
            <button class="btn btn-ghost" id="airc-back">← ${L('back')}</button>
            <button class="btn btn-success" id="airc-confirm">✓ ${L('confirm')}</button>
        </div>`;
        document.getElementById('airc-back').addEventListener('click', () => { this._step = 'amount'; this._render(); });
        document.getElementById('airc-confirm').addEventListener('click', () => { this._step = 'processing'; this._render(); this._process(); });
    }

    _renderProcessing() {
        const L = (k) => this.lm.get(k, k);
        this.el.innerHTML = `
        <div class="screen-body" style="justify-content:center;align-items:center;gap:20px">
            <div class="spinner"></div>
            <div class="text-center">
                <div style="font-size:16px;font-weight:700">${L('processing')}</div>
                <div class="text-muted">${L('processing_sub')}</div>
            </div>
        </div>`;
    }

    async _process() {
        const res = await AppAPI.buyAirtime({ phone: this.session.phone, amount: parseInt(this._amount) });
        this._result = res;
        this._step = res.success ? 'success' : 'amount';
        this._render();
    }

    _renderSuccess() {
        const L = (k) => this.lm.get(k, k);
        const r = this._result;
        this.el.innerHTML = `
        <div class="screen-body" style="justify-content:center;align-items:center;gap:16px;text-align:center">
            <div class="success-icon">✓</div>
            <div>
                <div style="font-size:15px;font-weight:800;color:var(--accent-green)">AIRTIME IMENUNULIWA!</div>
                <div style="font-size:24px;font-weight:900;margin-top:8px">TZS ${r.amount.toLocaleString()}</div>
                <div class="text-muted">${r.provider} — ${this.session.phone}</div>
                <div class="text-muted" style="font-size:11px;margin-top:6px">Ref: ${r.ref}</div>
            </div>
            <div class="text-muted" style="font-size:11px">${L('thank_you')}</div>
        </div>
        <div class="screen-actions">
            <button class="btn btn-primary full-width" id="airsuc-finish">🏠 ${L('finish')}</button>
        </div>`;
        document.getElementById('airsuc-finish').addEventListener('click', () => {
            this.bus.publish('flow:complete', {});
            this.bus.publish('nav:attract', {});
        });
    }
}
