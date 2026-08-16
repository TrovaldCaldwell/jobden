// workers/PhoneWorker.js — Screen 3: Phone / Account Entry
import AppAPI from '../../app.api.js';

export default class PhoneWorker {
    constructor(bus, lm, session) {
        this.bus = bus; this.lm = lm; this.session = session;
        this.el = document.getElementById('screen-phone');
        this._phone = '';
        this._identified = null;
        this._loading = false;
    }

    async init() {
        this._injectCSS();
        this.bus.subscribe('session:reset', () => { this._phone = ''; this._identified = null; });
        this.bus.subscribe('language:changed', () => this._render());
    }

    _injectCSS() {
        if (document.getElementById('phone-css')) return;
        const link = document.createElement('link');
        link.id = 'phone-css'; link.rel = 'stylesheet';
        link.href = './workers/PhoneWorker.css';
        document.head.appendChild(link);
    }

    // Called by supervisor when screen becomes active
    _render() {
        const L = (k) => this.lm.get(k, k);
        this.el.innerHTML = `
        <div class="screen-title-bar">${L('enter_phone')}</div>
        <div class="screen-body">
            <p class="text-center text-muted" style="margin-bottom:4px">${L('enter_phone')} <br><small>${L('or_account')}</small></p>

            <div class="phone-input-display ${this._phone ? 'has-value' : ''}" id="phone-display">
                ${this._phone || '—'}
            </div>

            <div id="phone-status"></div>

            <div class="keypad">
                ${[1,2,3,4,5,6,7,8,9].map(n =>
                    `<button class="keypad-key" data-key="${n}">${n}</button>`
                ).join('')}
                <button class="keypad-key key-00" data-key="00">00</button>
                <button class="keypad-key key-zero" data-key="0">0</button>
                <button class="keypad-key key-del" data-key="del">⌫</button>
            </div>

            <button class="btn btn-ghost full-width" id="phone-manual">📋 ${L('manual_entry')}</button>
        </div>
        <div class="screen-actions">
            <button class="btn btn-ghost" id="phone-back">← ${L('back')}</button>
            <button class="btn btn-primary" id="phone-continue" ${!this._identified ? 'disabled' : ''}>
                ${L('continue')} →
            </button>
        </div>`;

        // Render status if identified
        if (this._identified) this._showIdentified();

        // Keypad
        this.el.querySelectorAll('.keypad-key').forEach(k => {
            k.addEventListener('click', () => this._keyPress(k.dataset.key));
        });

        document.getElementById('phone-back').addEventListener('click', () => {
            this.bus.publish('nav:attract', {});
        });

        document.getElementById('phone-continue').addEventListener('click', () => {
            if (this._identified) {
                this.bus.publish('phone:confirmed', {
                    phone: this._phone,
                    provider: this._identified.provider
                });
            }
        });
    }

    _keyPress(key) {
        if (this._loading) return;
        if (key === 'del') {
            this._phone = this._phone.slice(0, -1);
            this._identified = null;
        } else {
            if (this._phone.length >= 12) return;
            this._phone += key;
        }

        const display = this.el.querySelector('#phone-display');
        if (display) {
            display.textContent = this._phone || '—';
            display.classList.toggle('has-value', !!this._phone);
        }
        this._identified = null;
        this._updateStatus('');
        this._updateContinueBtn(false);

        // Auto-identify when 10 digits entered
        if (this._phone.replace(/\s/g,'').length >= 10) {
            this._identify();
        }
    }

    async _identify() {
        this._loading = true;
        this._updateStatus('<div class="phone-loading">🔍 Inatafuta...</div>');
        try {
            const res = await AppAPI.identifyPhone(this._phone);
            this._loading = false;
            if (res.success) {
                this._identified = res;
                this._showIdentified();
                this._updateContinueBtn(true);
            } else {
                this._identified = null;
                this._updateStatus(`<div class="phone-error">❌ ${res.error}</div>`);
            }
        } catch(e) {
            this._loading = false;
            this._updateStatus('<div class="phone-error">❌ Hitilafu ya mtandao</div>');
        }
    }

    _showIdentified() {
        const L = (k) => this.lm.get(k, k);
        const res = this._identified;
        this._updateStatus(`
            <div class="info-box verified">
                <div class="provider-name">✓ ${res.provider}</div>
                <div class="provider-sub">${res.display || res.phone}</div>
                <div class="provider-sub" style="margin-top:6px">${L('verified')}</div>
            </div>`);
    }

    _updateStatus(html) {
        const el = this.el.querySelector('#phone-status');
        if (el) el.innerHTML = html;
    }

    _updateContinueBtn(enabled) {
        const btn = this.el.querySelector('#phone-continue');
        if (btn) btn.disabled = !enabled;
    }

    // KioskSupervisor calls this when routing to this screen
    onActivate() { this._render(); }
}
