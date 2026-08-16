// workers/SendWorker.js — TUMA PESA full flow light theme
import AppAPI from '../../app.api.js';

export default class SendWorker {
    constructor(bus, lm, session) {
        this.bus = bus; this.lm = lm; this.session = session;
        this.el = document.getElementById('screen-send');
        this._step='phone'; this._toPhone=''; this._recipient=null;
        this._amount=''; this._pin=''; this._result=null;
    }

    async init() {
        this.bus.subscribe('service:selected', ({service}) => { if(service==='send') this._reset(); });
        this.bus.subscribe('session:reset', () => this._reset());
        this.bus.subscribe('language:changed', () => { if(this.el.classList.contains('active')) this._render(); });
    }

    _reset() { this._step='phone'; this._toPhone=''; this._recipient=null; this._amount=''; this._pin=''; this._result=null; this._render(); }
    _L(k,f) { return this.lm.get(k,f||k); }
    _fee(a) { if(a<=10000) return 500; if(a<=50000) return 1000; if(a<=100000) return 1500; return 2000; }

    _render() {
        switch(this._step) {
            case 'phone':      this._renderPhone();      break;
            case 'amount':     this._renderAmount();     break;
            case 'pin':        this._renderPin();        break;
            case 'confirm':    this._renderConfirm();    break;
            case 'processing': this._renderProcessing(); break;
            case 'success':    this._renderSuccess();    break;
            case 'sms':        this._renderSms();        break;
        }
    }

    _renderPhone() {
        this.el.innerHTML = `
        <div class="screen-title-bar">TUMA PESA — Ingiza Namba ya Mpokeaji</div>
        <div class="screen-body">
            <p class="text-center" style="color:#8896a4;font-size:12px">Ingiza Namba ya Mpokeaji</p>
            <div class="phone-input-display ${this._toPhone?'has-value':''}" id="recv-display">
                ${this._toPhone || '—'}
            </div>
            <div id="recv-status"></div>
            <div class="keypad">
                ${[1,2,3,4,5,6,7,8,9].map(n=>`<button class="keypad-key" data-key="${n}">${n}</button>`).join('')}
                <button class="keypad-key key-00" data-key="00">00</button>
                <button class="keypad-key key-zero" data-key="0">0</button>
                <button class="keypad-key key-del" data-key="del">⌫</button>
            </div>
        </div>
        <div class="screen-actions">
            <button class="btn btn-ghost" id="sp-back">← ${this._L('back','NYUMA')}</button>
            <button class="btn btn-primary" id="sp-next" ${!this._recipient?'disabled':''}>${this._L('continue','ENDELEA')} →</button>
        </div>`;

        this.el.querySelectorAll('.keypad-key').forEach(k => k.addEventListener('click', () => this._phoneKey(k.dataset.key)));
        document.getElementById('sp-back').addEventListener('click', () => this.bus.publish('nav:services',{}));
        document.getElementById('sp-next').addEventListener('click', () => { this._step='amount'; this._render(); });
    }

    _phoneKey(key) {
        if(key==='del') { this._toPhone=this._toPhone.slice(0,-1); this._recipient=null; }
        else { if(this._toPhone.length>=12) return; this._toPhone += key; }
        const d = this.el.querySelector('#recv-display');
        if(d) { d.textContent=this._toPhone||'—'; d.classList.toggle('has-value',!!this._toPhone); }
        this._recipient=null;
        const next = this.el.querySelector('#sp-next');
        if(next) next.disabled=true;
        if(this._toPhone.replace(/\s/g,'').length>=10) this._lookupRecipient();
    }

    async _lookupRecipient() {
        const s = this.el.querySelector('#recv-status');
        if(s) s.innerHTML = '<div style="text-align:center;color:#8896a4;font-size:12px;padding:6px">🔍 Inatafuta...</div>';
        const res = await AppAPI.lookupRecipient(this._toPhone);
        if(!this.el.querySelector('#recv-status')) return;
        const st = this.el.querySelector('#recv-status');
        if(res.success) {
            this._recipient = res;
            st.innerHTML = `
                <div class="recipient-box">
                    <div class="r-name">${res.name}</div>
                    <div class="r-meta">${res.provider} — ${this._toPhone}</div>
                    <div class="r-check">✓ Taarifa zimethibitishwa</div>
                </div>`;
            const next = this.el.querySelector('#sp-next');
            if(next) next.disabled=false;
        } else {
            st.innerHTML = `<div style="color:#e74c3c;font-size:12px;text-align:center;padding:6px">❌ ${res.error}</div>`;
        }
    }

    _renderAmount() {
        const r = this._recipient;
        this.el.innerHTML = `
        <div class="screen-title-bar">TUMA PESA — Ingiza Kiasi (TZS)</div>
        <div class="screen-body">
            ${r ? `<div class="recipient-box"><div class="r-name">${r.name}</div><div class="r-meta">${r.provider} — ${this._toPhone}</div></div>` : ''}
            <div class="amount-display ${this._amount?'has-value':''}">
                ${this._amount ? 'TZS '+parseInt(this._amount).toLocaleString() : '—'}
            </div>
            <div class="quick-amounts">
                ${[5000,10000,20000,50000,100000,200000].map(a=>
                    `<button class="quick-btn" data-amt="${a}">TZS ${a.toLocaleString()}</button>`
                ).join('')}
            </div>
            <div class="keypad">
                ${[1,2,3,4,5,6,7,8,9].map(n=>`<button class="keypad-key" data-key="${n}">${n}</button>`).join('')}
                <button class="keypad-key key-00" data-key="000">000</button>
                <button class="keypad-key key-zero" data-key="0">0</button>
                <button class="keypad-key key-del" data-key="del">⌫</button>
            </div>
        </div>
        <div class="screen-actions">
            <button class="btn btn-ghost" id="sa-back">← ${this._L('back','NYUMA')}</button>
            <button class="btn btn-primary" id="sa-next" ${!this._amount||parseInt(this._amount)<500?'disabled':''}>${this._L('continue','ENDELEA')} →</button>
        </div>`;

        this.el.querySelectorAll('.quick-btn').forEach(b=>b.addEventListener('click',()=>{ this._amount=b.dataset.amt; this._render(); }));
        this.el.querySelectorAll('.keypad-key').forEach(k=>k.addEventListener('click',()=>{
            const key=k.dataset.key;
            if(key==='del') this._amount=this._amount.slice(0,-1);
            else { if(this._amount.length>=7) return; this._amount+=key; }
            this._render();
        }));
        document.getElementById('sa-back').addEventListener('click',()=>{ this._step='phone'; this._render(); });
        document.getElementById('sa-next').addEventListener('click',()=>{ this._step='pin'; this._pin=''; this._render(); });
    }

    _renderPin() {
        this.el.innerHTML = `
        <div class="screen-title-bar">TUMA PESA — Ingiza Namba ya Siri (PIN)</div>
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
            <button class="btn btn-ghost" id="spi-back">← ${this._L('back','NYUMA')}</button>
            <button class="btn btn-primary" id="spi-next" ${this._pin.length<4?'disabled':''}>${this._L('continue','ENDELEA')} →</button>
        </div>`;

        this.el.querySelectorAll('.keypad-key').forEach(k=>k.addEventListener('click',()=>{
            const key=k.dataset.key;
            if(key==='del') this._pin=this._pin.slice(0,-1);
            else { if(this._pin.length>=4||!key) return; this._pin+=key; }
            this._render();
        }));
        document.getElementById('spi-back').addEventListener('click',()=>{ this._step='amount'; this._render(); });
        document.getElementById('spi-next').addEventListener('click',()=>{ this._step='confirm'; this._render(); });
    }

    _renderConfirm() {
        const amt=parseInt(this._amount), fee=this._fee(amt), r=this._recipient;
        this.el.innerHTML = `
        <div class="screen-title-bar">THIBITISHA MUAMALA</div>
        <div class="screen-body">
            <div class="confirm-card">
                <div class="confirm-row"><span class="label">Kumtumia:</span><span class="value">${r?.name||'—'}</span></div>
                <div class="confirm-row"><span class="label">Namba:</span><span class="value">${this._toPhone}</span></div>
                <div class="confirm-row"><span class="label">Mtandao:</span><span class="value">${r?.provider||'M-PESA'}</span></div>
                <div class="confirm-row"><span class="label">Kiasi:</span><span class="value">TZS ${amt.toLocaleString()}</span></div>
                <div class="confirm-row"><span class="label">Ada:</span><span class="value">TZS ${fee.toLocaleString()}</span></div>
                <div class="confirm-row total-row"><span class="label fw-bold">Jumla:</span><span class="value">TZS ${(amt+fee).toLocaleString()}</span></div>
            </div>
        </div>
        <div class="screen-actions">
            <button class="btn btn-ghost" id="sc-back">← ${this._L('back','NYUMA')}</button>
            <button class="btn btn-success" id="sc-confirm">✓ THIBITISHA</button>
        </div>`;
        document.getElementById('sc-back').addEventListener('click',()=>{ this._step='pin'; this._render(); });
        document.getElementById('sc-confirm').addEventListener('click',()=>{ this._step='processing'; this._render(); this._process(); });
    }

    _renderProcessing() {
        this.el.innerHTML = `<div class="screen-body"><div class="processing-wrap"><div class="spinner"></div><div><div class="processing-title">Tafadhali subiri...</div><div class="processing-sub">Muamala wako unaendelea</div></div></div></div>`;
    }

    async _process() {
        const res = await AppAPI.sendMoney({ fromPhone:this.session.phone, toPhone:this._toPhone, amount:parseInt(this._amount), pin:this._pin });
        this._result=res; this._step=res.success?'success':'amount'; this._render();
    }

    _renderSuccess() {
        const r=this._result;
        this.el.innerHTML = `
        <div class="screen-body" style="background:#f0faf5">
            <div class="success-wrap">
                <div class="success-icon">✓</div>
                <div>
                    <div class="success-title">PESA ZIMETUMWA KWA MAFANIKIO!</div>
                    <div class="success-amount">TZS ${r.amount.toLocaleString()}</div>
                    <div class="success-meta">kwa ${r.recipient}</div>
                    <div class="success-meta">${r.toPhone||this._toPhone}</div>
                </div>
            </div>
        </div>
        <div class="screen-actions">
            <button class="btn btn-primary full-width" id="ss-done">Endelea →</button>
        </div>`;
        document.getElementById('ss-done').addEventListener('click',()=>{ this._step='sms'; this._render(); });
    }

    _renderSms() {
        const r=this._result;
        this.el.innerHTML = `
        <div class="screen-body" style="background:#f0faf5">
            <div class="success-wrap">
                <div class="success-icon">✓</div>
                <div style="color:#8896a4;font-size:13px">SMS imetumwa kwenye<br><strong style="color:#1a3a5c">${this.session.phone}</strong></div>
                <div class="sms-preview">
                    <div class="sms-header">📱 ${r.provider}</div>
                    <div class="sms-body">Umetuma<br>TZS ${r.amount.toLocaleString()}<br>kwa ${r.recipient}<br>${r.toPhone||this._toPhone}<br>Ada: TZS ${r.fee.toLocaleString()}<br>Ref: ${r.ref}<br>Asante.</div>
                </div>
            </div>
        </div>
        <div class="screen-actions">
            <button class="btn btn-primary full-width" id="ssms-finish">🏠 NYUMBANI (MALIZA)</button>
        </div>`;
        document.getElementById('ssms-finish').addEventListener('click',()=>{ this.bus.publish('flow:complete',{}); this.bus.publish('nav:attract',{}); });
    }
}
