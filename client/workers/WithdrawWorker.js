// workers/WithdrawWorker.js — TOA PESA full flow light theme
import AppAPI from '../../app.api.js';

export default class WithdrawWorker {
    constructor(bus, lm, session) {
        this.bus = bus; this.lm = lm; this.session = session;
        this.el = document.getElementById('screen-withdraw');
        this._step = 'amount'; this._amount = ''; this._pin = ''; this._result = null;
    }

    async init() {
        this._injectCSS();
        this.bus.subscribe('service:selected', ({ service }) => { if (service === 'withdraw') this._reset(); });
        this.bus.subscribe('session:reset', () => this._reset());
        this.bus.subscribe('language:changed', () => { if (this.el.classList.contains('active')) this._render(); });
    }

    _injectCSS() {
        if (document.getElementById('flow-css')) return;
        const link = document.createElement('link');
        link.id = 'flow-css'; link.rel = 'stylesheet';
        link.href = './workers/FlowWorker.css';
        document.head.appendChild(link);
    }

    _reset() { this._step = 'amount'; this._amount = ''; this._pin = ''; this._result = null; this._render(); }
    _L(k,f) { return this.lm.get(k, f||k); }
    _fee(a) { if(a<=10000) return 500; if(a<=50000) return 1000; if(a<=100000) return 1500; return 2000; }

    _render() {
        switch(this._step) {
            case 'amount':     this._renderAmount();     break;
            case 'pin':        this._renderPin();        break;
            case 'confirm':    this._renderConfirm();    break;
            case 'processing': this._renderProcessing(); break;
            case 'success':    this._renderSuccess();    break;
            case 'receipt':    this._renderReceipt();    break;
            case 'sms':        this._renderSms();        break;
        }
    }

    _renderAmount() {
        this.el.innerHTML = `
        <div class="screen-title-bar">TOA PESA — Ingiza Kiasi (TZS)</div>
        <div class="screen-body">
            <p class="text-center" style="color:#8896a4;font-size:12px">Ingiza kiasi unachotaka kutoa.</p>
            <div class="amount-display ${this._amount ? 'has-value' : ''}">
                ${this._amount ? 'TZS ' + parseInt(this._amount).toLocaleString() : '—'}
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
            <button class="btn btn-ghost" id="wd-back">← ${this._L('back','NYUMA')}</button>
            <button class="btn btn-primary" id="wd-next" ${!this._amount || parseInt(this._amount)<1000?'disabled':''}>
                ${this._L('continue','ENDELEA')} →
            </button>
        </div>`;

        this.el.querySelectorAll('.quick-btn').forEach(b => b.addEventListener('click', () => { this._amount = b.dataset.amt; this._render(); }));
        this.el.querySelectorAll('.keypad-key').forEach(k => k.addEventListener('click', () => {
            const key = k.dataset.key;
            if(key==='del') this._amount = this._amount.slice(0,-1);
            else { if(this._amount.length>=7) return; this._amount += key; }
            this._render();
        }));
        document.getElementById('wd-back').addEventListener('click', () => this.bus.publish('nav:services',{}));
        document.getElementById('wd-next').addEventListener('click', () => { this._step='pin'; this._pin=''; this._render(); });
    }

    _renderPin() {
        this.el.innerHTML = `
        <div class="screen-title-bar">TOA PESA — Ingiza Namba ya Siri (PIN)</div>
        <div class="screen-body">
            <p class="text-center" style="color:#8896a4;font-size:12px">Ingiza Namba ya Siri (PIN)</p>
            <div class="pin-display">
                ${[0,1,2,3].map(i=>`<div class="pin-dot ${this._pin.length>i?'filled':''}"></div>`).join('')}
            </div>
            <div class="keypad">
                ${[1,2,3,4,5,6,7,8,9].map(n=>`<button class="keypad-key" data-key="${n}">${n}</button>`).join('')}
                <button class="keypad-key" disabled style="opacity:0" data-key=""></button>
                <button class="keypad-key key-zero" data-key="0">0</button>
                <button class="keypad-key key-del" data-key="del">⌫</button>
            </div>
        </div>
        <div class="screen-actions">
            <button class="btn btn-ghost" id="pin-back">← ${this._L('back','NYUMA')}</button>
            <button class="btn btn-primary" id="pin-next" ${this._pin.length<4?'disabled':''}>
                ${this._L('continue','ENDELEA')} →
            </button>
        </div>`;

        this.el.querySelectorAll('.keypad-key').forEach(k => k.addEventListener('click', () => {
            const key = k.dataset.key;
            if(key==='del') this._pin = this._pin.slice(0,-1);
            else { if(this._pin.length>=4||!key) return; this._pin += key; }
            this._render();
        }));
        document.getElementById('pin-back').addEventListener('click', () => { this._step='amount'; this._render(); });
        document.getElementById('pin-next').addEventListener('click', () => { this._step='confirm'; this._render(); });
    }

    _renderConfirm() {
        const amt = parseInt(this._amount), fee = this._fee(amt);
        this.el.innerHTML = `
        <div class="screen-title-bar">THIBITISHA MUAMALA</div>
        <div class="screen-body">
            <div class="confirm-card">
                <div class="confirm-row"><span class="label">Huduma:</span><span class="value">TOA PESA</span></div>
                <div class="confirm-row"><span class="label">Mtandao:</span><span class="value">${this.session.provider||'VODACOM M-PESA'}</span></div>
                <div class="confirm-row"><span class="label">Kiasi:</span><span class="value">TZS ${amt.toLocaleString()}</span></div>
                <div class="confirm-row"><span class="label">Ada:</span><span class="value">TZS ${fee.toLocaleString()}</span></div>
                <div class="confirm-row total-row"><span class="label fw-bold">Jumla:</span><span class="value">TZS ${(amt+fee).toLocaleString()}</span></div>
            </div>
        </div>
        <div class="screen-actions">
            <button class="btn btn-ghost" id="cf-back">← ${this._L('back','NYUMA')}</button>
            <button class="btn btn-success" id="cf-confirm">✓ THIBITISHA</button>
        </div>`;

        document.getElementById('cf-back').addEventListener('click', () => { this._step='pin'; this._render(); });
        document.getElementById('cf-confirm').addEventListener('click', () => { this._step='processing'; this._render(); this._process(); });
    }

    _renderProcessing() {
        this.el.innerHTML = `
        <div class="screen-body">
            <div class="processing-wrap">
                <div class="spinner"></div>
                <div>
                    <div class="processing-title">Tafadhali subiri...</div>
                    <div class="processing-sub">Muamala wako unaendelea</div>
                </div>
            </div>
        </div>`;
    }

    async _process() {
        const res = await AppAPI.withdraw({ phone: this.session.phone, amount: parseInt(this._amount), pin: this._pin });
        this._result = res;
        this._step = res.success ? 'success' : 'amount';
        this._render();
    }

    _renderSuccess() {
        this.el.innerHTML = `
        <div class="screen-body" style="background:#f0faf5">
            <div class="success-wrap">
                <div class="success-icon">✓</div>
                <div>
                    <div class="success-title">MUAMALA UMEFANIKISHA!</div>
                    <div class="success-meta" style="margin-top:8px">Chukua pesa zako kwenye sehemu ya kutoa pesa.</div>
                    <div class="success-meta" style="margin-top:12px;font-size:11px">Asante kwa kutumia Jobdeni Universal Money Kiosk</div>
                </div>
            </div>
        </div>
        <div class="screen-actions">
            <button class="btn btn-primary full-width" id="suc-next">Endelea →</button>
        </div>`;
        document.getElementById('suc-next').addEventListener('click', () => { this._step='receipt'; this._render(); });
    }

    _renderReceipt() {
        const r = this._result;
        this.el.innerHTML = `
        <div class="screen-title-bar">Unahitaji Risiti?</div>
        <div class="screen-body">
            <div class="receipt-card">
                <div class="receipt-header">RISITI / RECEIPT</div>
                <div class="confirm-row"><span class="label">Mtandao:</span><span class="value">${r.provider}</span></div>
                <div class="confirm-row"><span class="label">Huduma:</span><span class="value">TOA PESA</span></div>
                <div class="confirm-row"><span class="label">Kiasi:</span><span class="value">TZS ${r.amount.toLocaleString()}</span></div>
                <div class="confirm-row"><span class="label">Ada:</span><span class="value">TZS ${r.fee.toLocaleString()}</span></div>
                <div class="confirm-row total-row"><span class="label fw-bold">Jumla:</span><span class="value">TZS ${r.total.toLocaleString()}</span></div>
                <div class="confirm-row"><span class="label">Ref:</span><span class="value" style="font-size:10px">${r.ref}</span></div>
                <div class="confirm-row"><span class="label">Tarehe:</span><span class="value" style="font-size:10px">${r.timestamp}</span></div>
                <div class="receipt-footer">Asante kwa kutumia Jobdeni</div>
            </div>
            <div style="display:flex;gap:10px;width:100%">
                <button class="btn btn-success" id="rec-print">🖨️ NDIYO<br><small>Print Receipt</small></button>
                <button class="btn btn-danger"  id="rec-skip">✕ HAPANA<br><small>No Receipt</small></button>
            </div>
        </div>`;
        document.getElementById('rec-print').addEventListener('click', () => { this._step='sms'; this._render(); });
        document.getElementById('rec-skip').addEventListener('click',  () => { this._step='sms'; this._render(); });
    }

    _renderSms() {
        const r = this._result;
        this.el.innerHTML = `
        <div class="screen-body" style="background:#f0faf5">
            <div class="success-wrap">
                <div class="success-icon">✓</div>
                <div>
                    <div style="color:#8896a4;font-size:13px">SMS imetumwa kwenye</div>
                    <div style="font-size:20px;font-weight:800;color:#1a3a5c;margin-top:4px">${this.session.phone}</div>
                </div>
                <div class="sms-preview">
                    <div class="sms-header">📱 ${r.provider}</div>
                    <div class="sms-body">Umefanikiwa kutoa<br>TZS ${r.amount.toLocaleString()}<br>kutoka ${r.provider}<br>kupitia Jobdeni Kiosk.<br>Ada: TZS ${r.fee.toLocaleString()}<br>Ref: ${r.ref}<br>Asante.</div>
                </div>
                <div style="font-size:11px;color:#8896a4">Asante kwa kutumia Jobdeni Universal Money Kiosk</div>
            </div>
        </div>
        <div class="screen-actions">
            <button class="btn btn-primary full-width" id="sms-finish">🏠 NYUMBANI (MALIZA)</button>
        </div>`;
        document.getElementById('sms-finish').addEventListener('click', () => {
            this.bus.publish('flow:complete', {}); this.bus.publish('nav:attract', {});
        });
    }
}
