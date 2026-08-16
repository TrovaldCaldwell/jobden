// workers/DepositWorker.js — WEKA PESA flow
import AppAPI from '../../app.api.js';

export default class DepositWorker {
    constructor(bus, lm, session) {
        this.bus = bus; this.lm = lm; this.session = session;
        this.el = document.getElementById('screen-deposit');
        this._step = 'amount'; this._amount = ''; this._result = null;
    }

    async init() {
        this.bus.subscribe('service:selected', ({ service }) => { if (service === 'deposit') this._reset(); });
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
            case 'sms':        this._renderSms();        break;
        }
    }

    _renderAmount() {
        const L = (k) => this.lm.get(k, k);
        this.el.innerHTML = `
        <div class="screen-title-bar">WEKA PESA — ${L('deposit')}</div>
        <div class="screen-body">
            <p class="text-center text-muted">Ingiza kiasi cha kuweka. Pesa itahesabiwa moja kwa moja.</p>
            <div class="amount-display ${this._amount ? 'has-value' : ''}">
                ${this._amount ? 'TZS ' + parseInt(this._amount).toLocaleString() : 'TZS 0'}
            </div>
            <div style="background:var(--surface-card);border:1px solid var(--border-color);border-radius:10px;padding:14px;text-align:center">
                <div style="font-size:11px;color:var(--text-muted)">Kiasi kitahesabiwa moja kwa moja</div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Amount will be counted automatically</div>
            </div>
            <div class="quick-amounts">
                ${[5000,10000,20000,50000,100000,200000].map(a =>
                    `<button class="quick-btn" data-amt="${a}">TZS ${a.toLocaleString()}</button>`
                ).join('')}
            </div>
            <div class="keypad">
                ${[1,2,3,4,5,6,7,8,9].map(n => `<button class="keypad-key" data-key="${n}">${n}</button>`).join('')}
                <button class="keypad-key key-00" data-key="000">000</button>
                <button class="keypad-key key-zero" data-key="0">0</button>
                <button class="keypad-key key-del" data-key="del">⌫</button>
            </div>
        </div>
        <div class="screen-actions">
            <button class="btn btn-ghost" id="dep-back">← ${L('back')}</button>
            <button class="btn btn-primary" id="dep-next" ${!this._amount || parseInt(this._amount) < 500 ? 'disabled' : ''}>${L('continue')} →</button>
        </div>`;

        this.el.querySelectorAll('.quick-btn').forEach(b => {
            b.addEventListener('click', () => { this._amount = b.dataset.amt; this._render(); });
        });
        this.el.querySelectorAll('.keypad-key').forEach(k => {
            k.addEventListener('click', () => {
                const key = k.dataset.key;
                if (key === 'del') this._amount = this._amount.slice(0,-1);
                else { if (this._amount.length >= 7) return; this._amount += key; }
                this._render();
            });
        });
        document.getElementById('dep-back').addEventListener('click', () => this.bus.publish('nav:services', {}));
        document.getElementById('dep-next').addEventListener('click', () => { this._step = 'confirm'; this._render(); });
    }

    _renderConfirm() {
        const L = (k) => this.lm.get(k, k);
        const amt = parseInt(this._amount);
        this.el.innerHTML = `
        <div class="screen-title-bar">THIBITISHA MUAMALA</div>
        <div class="screen-body">
            <div class="confirm-card">
                <div class="confirm-row"><span class="label">${L('service')}</span><span class="value">WEKA PESA</span></div>
                <div class="confirm-row"><span class="label">${L('provider')}</span><span class="value">${this.session.provider || 'M-PESA'}</span></div>
                <div class="confirm-row"><span class="label">${L('number')}</span><span class="value">${this.session.phone}</span></div>
                <div class="confirm-row"><span class="label">${L('amount')}</span><span class="value">TZS ${amt.toLocaleString()}</span></div>
                <div class="confirm-row"><span class="label">${L('fee')}</span><span class="value">TZS 0</span></div>
                <div class="confirm-row total-row"><span class="label fw-bold">${L('total')}</span><span class="value">TZS ${amt.toLocaleString()}</span></div>
            </div>
        </div>
        <div class="screen-actions">
            <button class="btn btn-ghost" id="dc-back">← ${L('back')}</button>
            <button class="btn btn-success" id="dc-confirm">✓ ${L('confirm')}</button>
        </div>`;
        document.getElementById('dc-back').addEventListener('click', () => { this._step = 'amount'; this._render(); });
        document.getElementById('dc-confirm').addEventListener('click', () => { this._step = 'processing'; this._render(); this._process(); });
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
        const res = await AppAPI.deposit({ phone: this.session.phone, amount: parseInt(this._amount) });
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
                <div style="font-size:15px;font-weight:800;color:var(--accent-green)">${L('success_deposit')}</div>
                <div style="font-size:22px;font-weight:900;margin-top:8px">TZS ${r.amount.toLocaleString()}</div>
                <div class="text-muted">${r.provider} — ${this.session.phone}</div>
            </div>
            <div class="text-muted" style="font-size:11px">${L('thank_you')}</div>
        </div>
        <div class="screen-actions">
            <button class="btn btn-primary full-width" id="dsuc-next">Endelea →</button>
        </div>`;
        document.getElementById('dsuc-next').addEventListener('click', () => { this._step = 'sms'; this._render(); });
    }

    _renderSms() {
        const L = (k) => this.lm.get(k, k);
        const r = this._result;
        this.el.innerHTML = `
        <div class="screen-body" style="justify-content:center;align-items:center;gap:16px;text-align:center">
            <div class="success-icon">✓</div>
            <div class="text-muted">SMS imetumwa kwenye<br><strong>${this.session.phone}</strong></div>
            <div class="sms-preview">
                <div class="sms-header">📱 ${r.provider}</div>
                <div class="sms-body">Umefanikiwa kuweka<br>TZS ${r.amount.toLocaleString()}<br>kwenye ${r.provider}<br>kupitia Jobdeni Kiosk.<br>Ref: ${r.ref}<br>Asante.</div>
            </div>
        </div>
        <div class="screen-actions">
            <button class="btn btn-primary full-width" id="dsms-finish">🏠 ${L('finish')}</button>
        </div>`;
        document.getElementById('dsms-finish').addEventListener('click', () => {
            this.bus.publish('flow:complete', {});
            this.bus.publish('nav:attract', {});
        });
    }
}
