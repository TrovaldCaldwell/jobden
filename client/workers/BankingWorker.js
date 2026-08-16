// workers/BankingWorker.js — BENKI full flow (Screens 23-32)
import AppAPI from '../../app.api.js';

export default class BankingWorker {
    constructor(bus, lm, session) {
        this.bus = bus; this.lm = lm; this.session = session;
        this.el = document.getElementById('screen-banking');
        this._step    = 'choose_bank';
        this._bank    = null;
        this._service = null;
        this._amount  = '';
        this._pin     = '';
        this._result  = null;
    }

    async init() {
        this.bus.subscribe('service:selected', ({ service }) => { if (service === 'banking') this._reset(); });
        this.bus.subscribe('session:reset', () => this._reset());
        this.bus.subscribe('language:changed', () => { if (this.el.classList.contains('active')) this._render(); });
    }

    _reset() {
        this._step = 'choose_bank'; this._bank = null; this._service = null;
        this._amount = ''; this._pin = ''; this._result = null;
        this._render();
    }

    _render() {
        switch (this._step) {
            case 'choose_bank':    this._renderChooseBank();    break;
            case 'choose_service': this._renderChooseService(); break;
            case 'amount':         this._renderAmount();        break;
            case 'pin':            this._renderPin();           break;
            case 'confirm':        this._renderConfirm();       break;
            case 'processing':     this._renderProcessing();    break;
            case 'success':        this._renderSuccess();       break;
            case 'receipt':        this._renderReceipt();       break;
            case 'thankyou':       this._renderThankYou();      break;
        }
    }

    // ── Screen 23/24: Choose Bank ─────────────────────────────────
    _renderChooseBank() {
        const L = (k) => this.lm.get(k, k);
        const banks = [
            { id: 'CRDB Bank',    logo: 'CRDB',    color: '#e74c3c' },
            { id: 'NMB Bank',     logo: 'NMB',     color: '#2980b9' },
            { id: 'Stanbic Bank', logo: 'STAN',    color: '#27ae60' },
            { id: 'DTB Bank',     logo: 'DTB',     color: '#8e44ad' },
            { id: 'Equity Bank',  logo: 'EQT',     color: '#e67e22' },
            { id: 'Akiba Bank',   logo: 'AKIBA',   color: '#16a085' },
            { id: 'Exim Bank',    logo: 'EXIM',    color: '#2c3e50' },
            { id: 'I&M Bank',     logo: 'I&M',     color: '#c0392b' },
            { id: 'NBC Bank',     logo: 'NBC',     color: '#1abc9c' },
        ];
        this.el.innerHTML = `
        <div class="screen-title-bar">BENKI — ${L('choose_bank')}</div>
        <div class="screen-body">
            <div class="bank-grid">
                ${banks.map(b => `
                    <div class="bank-tile" data-bank="${b.id}">
                        <div class="b-logo" style="color:${b.color}">${b.logo}</div>
                        <div class="b-name">${b.id}</div>
                    </div>`).join('')}
                <div class="bank-tile" data-bank="more">
                    <div class="b-logo">⋯</div>
                    <div class="b-name">${L('more_banks')}</div>
                </div>
            </div>
        </div>
        <div class="screen-actions">
            <button class="btn btn-ghost" id="bk-back">← ${L('back')}</button>
        </div>`;

        this.el.querySelectorAll('.bank-tile').forEach(tile => {
            tile.addEventListener('click', () => {
                const b = tile.dataset.bank;
                if (b === 'more') return;
                this._bank = b;
                this._step = 'choose_service';
                this._render();
            });
        });
        document.getElementById('bk-back').addEventListener('click', () => this.bus.publish('nav:services', {}));
    }

    // ── Screen 25: Choose Service ─────────────────────────────────
    _renderChooseService() {
        const L = (k) => this.lm.get(k, k);
        const services = [
            { id: 'withdraw', icon: '💵', label: 'TOA PESA',    sub: 'Withdraw',        cls: 'svc-blue'   },
            { id: 'deposit',  icon: '⬇️', label: 'WEKA PESA',   sub: 'Deposit Money',   cls: 'svc-green'  },
            { id: 'transfer', icon: '↔️', label: 'HAMISHA PESA', sub: 'Transfer',        cls: 'svc-orange' },
            { id: 'statement',icon: '📄', label: 'TAZAMA SALIO', sub: 'Mini Statement',  cls: 'svc-purple' },
        ];
        this.el.innerHTML = `
        <div class="screen-title-bar">${this._bank} — CHAGUA HUDUMA</div>
        <div class="screen-body">
            <div class="bank-svc-grid">
                ${services.map(s => `
                    <div class="bank-svc-tile ${s.cls}" data-svc="${s.id}">
                        <div class="bs-icon">${s.icon}</div>
                        <div class="bs-label">${s.label}</div>
                        <div class="bs-sub">${s.sub}</div>
                    </div>`).join('')}
            </div>
        </div>
        <div class="screen-actions">
            <button class="btn btn-ghost" id="bsvc-back">← ${L('back')}</button>
        </div>`;

        this.el.querySelectorAll('.bank-svc-tile').forEach(tile => {
            tile.addEventListener('click', () => {
                this._service = tile.dataset.svc;
                if (this._service === 'withdraw' || this._service === 'deposit' || this._service === 'transfer') {
                    this._step = 'amount';
                } else {
                    // Mini statement — simulate directly
                    this._step = 'processing';
                    this._render();
                    setTimeout(() => { this._result = { success: true, ref: 'JD' + Date.now(), amount: 0, fee: 0, total: 0, provider: this._bank, timestamp: new Date().toLocaleString() }; this._step = 'receipt'; this._render(); }, 2000);
                    return;
                }
                this._amount = '';
                this._render();
            });
        });
        document.getElementById('bsvc-back').addEventListener('click', () => { this._step = 'choose_bank'; this._render(); });
    }

    // ── Screen 26: Amount ─────────────────────────────────────────
    _renderAmount() {
        const L = (k) => this.lm.get(k, k);
        this.el.innerHTML = `
        <div class="screen-title-bar">${this._bank} — Ingiza Kiasi (Benki ${this._service === 'withdraw' ? 'Withdraw' : 'Deposit'})</div>
        <div class="screen-body">
            <div class="amount-display ${this._amount ? 'has-value' : ''}">
                ${this._amount ? 'TZS ' + parseInt(this._amount).toLocaleString() : '—'}
            </div>
            <div class="quick-amounts">
                ${[10000,20000,50000,100000,200000,500000].map(a =>
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
            <button class="btn btn-ghost" id="ba-back">← ${L('back')}</button>
            <button class="btn btn-primary" id="ba-next" ${!this._amount || parseInt(this._amount) < 5000 ? 'disabled' : ''}>${L('continue')} →</button>
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
        document.getElementById('ba-back').addEventListener('click', () => { this._step = 'choose_service'; this._render(); });
        document.getElementById('ba-next').addEventListener('click', () => { this._step = 'pin'; this._pin = ''; this._render(); });
    }

    // ── Screen 27: PIN / OTP ──────────────────────────────────────
    _renderPin() {
        const L = (k) => this.lm.get(k, k);
        this.el.innerHTML = `
        <div class="screen-title-bar">${this._bank} — Ingiza PIN / OTP</div>
        <div class="screen-body">
            <p class="text-center text-muted">PIN yako ya Benki</p>
            <div style="background:var(--surface-card);border-radius:10px;padding:10px 14px;font-size:12px;color:var(--text-muted);text-align:center">
                AU<br>Ingiza OTP (imetumwa kwa ${this.session.phone})
            </div>
            <div class="pin-display">
                ${[0,1,2,3,4,5].map(i => `<div class="pin-dot ${this._pin.length > i ? 'filled' : ''}"></div>`).join('')}
            </div>
            <div class="keypad">
                ${[1,2,3,4,5,6,7,8,9].map(n => `<button class="keypad-key" data-key="${n}">${n}</button>`).join('')}
                <button class="keypad-key" disabled style="opacity:0" data-key=""></button>
                <button class="keypad-key key-zero" data-key="0">0</button>
                <button class="keypad-key key-del" data-key="del">⌫</button>
            </div>
        </div>
        <div class="screen-actions">
            <button class="btn btn-ghost" id="bp-back">← ${L('back')}</button>
            <button class="btn btn-primary" id="bp-next" ${this._pin.length < 4 ? 'disabled' : ''}>${L('continue')} →</button>
        </div>`;

        this.el.querySelectorAll('.keypad-key').forEach(k => {
            k.addEventListener('click', () => {
                const key = k.dataset.key;
                if (key === 'del') this._pin = this._pin.slice(0,-1);
                else { if (this._pin.length >= 6 || !key) return; this._pin += key; }
                this._render();
            });
        });
        document.getElementById('bp-back').addEventListener('click', () => { this._step = 'amount'; this._render(); });
        document.getElementById('bp-next').addEventListener('click', () => { this._step = 'confirm'; this._render(); });
    }

    // ── Screen 28: Confirm ────────────────────────────────────────
    _renderConfirm() {
        const L = (k) => this.lm.get(k, k);
        const amt = parseInt(this._amount);
        const fee = 1000;
        this.el.innerHTML = `
        <div class="screen-title-bar">THIBITISHA MUAMALA (BENKI)</div>
        <div class="screen-body">
            <div class="confirm-card">
                <div class="confirm-row"><span class="label">${L('bank')}</span><span class="value">${this._bank}</span></div>
                <div class="confirm-row"><span class="label">${L('service')}</span><span class="value">${this._service?.toUpperCase()}</span></div>
                <div class="confirm-row"><span class="label">${L('amount')}</span><span class="value">TZS ${amt.toLocaleString()}</span></div>
                <div class="confirm-row"><span class="label">${L('fee')}</span><span class="value">TZS ${fee.toLocaleString()}</span></div>
                <div class="confirm-row total-row"><span class="label fw-bold">${L('total')}</span><span class="value">TZS ${(amt+fee).toLocaleString()}</span></div>
            </div>
        </div>
        <div class="screen-actions">
            <button class="btn btn-ghost" id="bc-back">← ${L('back')}</button>
            <button class="btn btn-success" id="bc-confirm">✓ ${L('confirm')}</button>
        </div>`;

        document.getElementById('bc-back').addEventListener('click', () => { this._step = 'pin'; this._render(); });
        document.getElementById('bc-confirm').addEventListener('click', () => { this._step = 'processing'; this._render(); this._process(); });
    }

    // ── Screen 29: Processing ─────────────────────────────────────
    _renderProcessing() {
        const L = (k) => this.lm.get(k, k);
        this.el.innerHTML = `
        <div class="screen-body" style="justify-content:center;align-items:center;gap:20px">
            <div class="spinner"></div>
            <div class="text-center">
                <div style="font-size:16px;font-weight:700">${L('processing')}</div>
                <div class="text-muted" style="margin-top:6px">${L('processing_sub')}</div>
            </div>
        </div>`;
    }

    async _process() {
        const res = await AppAPI.bankWithdraw({
            phone: this.session.phone,
            bank: this._bank,
            amount: parseInt(this._amount),
            pin: this._pin
        });
        this._result = res;
        this._step = res.success ? 'success' : 'amount';
        this._render();
    }

    // ── Screen 30: Success ────────────────────────────────────────
    _renderSuccess() {
        const L = (k) => this.lm.get(k, k);
        this.el.innerHTML = `
        <div class="screen-body" style="justify-content:center;align-items:center;gap:16px;text-align:center">
            <div class="success-icon">✓</div>
            <div>
                <div style="font-size:15px;font-weight:800;color:var(--accent-green)">MUAMALA UMEFANIKISHA!</div>
                <div class="text-muted" style="margin-top:6px">Chukua pesa zako kwenye sehemu ya kutoa pesa.</div>
            </div>
        </div>
        <div class="screen-actions">
            <button class="btn btn-primary full-width" id="bsuc-next">Endelea →</button>
        </div>`;
        document.getElementById('bsuc-next').addEventListener('click', () => { this._step = 'receipt'; this._render(); });
    }

    // ── Screen 31: Receipt ────────────────────────────────────────
    _renderReceipt() {
        const L = (k) => this.lm.get(k, k);
        const r = this._result;
        const amt = parseInt(this._amount) || 0;
        const fee = 1000;
        this.el.innerHTML = `
        <div class="screen-title-bar">RISITI / RECEIPT</div>
        <div class="screen-body">
            <div class="receipt-card">
                <div class="receipt-header">RISITI / RECEIPT</div>
                <div class="confirm-row"><span class="label">${L('bank')}</span><span class="value">${this._bank}</span></div>
                <div class="confirm-row"><span class="label">${L('service')}</span><span class="value">TOA PESA</span></div>
                <div class="confirm-row"><span class="label">${L('amount')}</span><span class="value">TZS ${amt.toLocaleString()}</span></div>
                <div class="confirm-row"><span class="label">${L('fee')}</span><span class="value">TZS ${fee.toLocaleString()}</span></div>
                <div class="confirm-row total-row"><span class="label">Jumla</span><span class="value">TZS ${(amt+fee).toLocaleString()}</span></div>
                <div class="confirm-row"><span class="label">${L('ref')}</span><span class="value" style="font-size:10px">${r?.ref || '—'}</span></div>
                <div class="confirm-row"><span class="label">${L('date')}</span><span class="value" style="font-size:10px">${r?.timestamp || new Date().toLocaleString()}</span></div>
                <div class="receipt-footer">Asante kwa kutumia Jobdeni</div>
            </div>
        </div>
        <div class="screen-actions">
            <button class="btn btn-success" id="br-print">🖨️ Print</button>
            <button class="btn btn-primary" id="br-done">Endelea →</button>
        </div>`;

        document.getElementById('br-print').addEventListener('click', () => { this._step = 'thankyou'; this._render(); });
        document.getElementById('br-done').addEventListener('click', () => { this._step = 'thankyou'; this._render(); });
    }

    // ── Screen 32: Thank You ──────────────────────────────────────
    _renderThankYou() {
        const L = (k) => this.lm.get(k, k);
        this.el.innerHTML = `
        <div class="screen-body">
            <div class="thankyou-wrap">
                <div style="font-size:60px">🙏</div>
                <div class="thankyou-title">ASANTE<br>KWA KUTUMIA<br>JOBDENI</div>
                <div class="thankyou-sub">Universal Money Kiosk</div>
                <div class="text-muted" style="font-size:11px">Karibu tena!</div>
            </div>
        </div>
        <div class="screen-actions">
            <button class="btn btn-primary full-width" id="bty-finish">🏠 ${L('finish')}</button>
        </div>`;

        document.getElementById('bty-finish').addEventListener('click', () => {
            this.bus.publish('flow:complete', {});
            this.bus.publish('nav:attract', {});
        });

        // Auto-return after 8 seconds
        setTimeout(() => {
            this.bus.publish('flow:complete', {});
            this.bus.publish('nav:attract', {});
        }, 8000);
    }
}
