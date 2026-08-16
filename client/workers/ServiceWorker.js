// workers/ServiceWorker.js — Screen 4: Service grid matching design image
export default class ServiceWorker {
    constructor(bus, lm, session) {
        this.bus = bus; this.lm = lm; this.session = session;
        this.el = document.getElementById('screen-services');
    }

    async init() {
        this.bus.subscribe('language:changed', () => { if (this.el.classList.contains('active')) this._render(); });
        this.bus.subscribe('phone:confirmed', () => this._render());
    }

    _render() {
        const L = (k,f) => this.lm.get(k, f||k);
        // Colors match image exactly — each tile has its own gradient
        const services = [
            { id:'send',    icon:'✈️',  label:'TUMA PESA',        sub:'Send Money',          cls:'tile-green'  },
            { id:'withdraw',icon:'💵',  label:'TOA PESA',         sub:'Withdraw Cash',       cls:'tile-blue'   },
            { id:'deposit', icon:'⬇️',  label:'WEKA PESA',        sub:'Deposit Money',       cls:'tile-orange' },
            { id:'bills',   icon:'📋',  label:'LIPA BILI',        sub:'Pay Bills',           cls:'tile-red'    },
            { id:'govt',    icon:'🏛️',  label:'MALIPO YA SERIKALI',sub:'Government Payments', cls:'tile-purple' },
            { id:'tickets', icon:'🎫',  label:'TIKETI',           sub:'Tickets',             cls:'tile-teal'   },
            { id:'airtime', icon:'📶',  label:'AIRTIME',          sub:'Pongozo',             cls:'tile-yellow' },
            { id:'internet',icon:'🌐',  label:'INTERNET BUNDLES', sub:'Vifurushi',           cls:'tile-navy'   },
            { id:'banking', icon:'🏦',  label:'BENKI',            sub:'Banking',             cls:'tile-blue'   },
            { id:'savings', icon:'🐖',  label:'AKIBA NA MIKOPO',  sub:'Savings & Loans',     cls:'tile-green'  },
            { id:'transfer',icon:'↔️',  label:'HAMISHA KWA BENKI', sub:'Bank Transfer',      cls:'tile-teal'   },
            { id:'more',    icon:'⋯',   label:'ZAIDI',            sub:'More Services',       cls:'tile-navy'   },
        ];

        const active = ['send','withdraw','deposit','airtime','banking'];

        this.el.innerHTML = `
        <div class="screen-title-bar">Chagua Huduma Unayohitaji / Choose a Service</div>
        <div class="screen-body" style="padding:12px;background:#f0f4f8">
            <div class="service-grid">
                ${services.map(s => `
                    <div class="service-tile ${s.cls}" data-service="${s.id}" style="${!active.includes(s.id) ? 'opacity:0.75' : ''}">
                        <div class="tile-icon">${s.icon}</div>
                        <div class="tile-label">${s.label}</div>
                        <div class="tile-sub">${s.sub}</div>
                    </div>`).join('')}
            </div>
        </div>
        <div class="screen-actions">
            <button class="btn btn-ghost" style="flex:0 0 auto;padding:12px 20px" id="svc-back">← ${L('back','NYUMA')}</button>
            <div style="flex:1;display:flex;align-items:center;justify-content:center;font-size:11px;color:#8896a4">
                📞 ${L('help','MSAADA')}
            </div>
        </div>`;

        this.el.querySelectorAll('.service-tile').forEach(tile => {
            tile.addEventListener('click', () => {
                const svc = tile.dataset.service;
                if (active.includes(svc)) {
                    this.bus.publish('service:selected', { service: svc });
                } else {
                    tile.style.transform = 'scale(0.95)';
                    setTimeout(() => tile.style.transform = '', 200);
                }
            });
        });

        document.getElementById('svc-back').addEventListener('click', () => {
            this.bus.publish('nav:phone', {});
        });
    }
}
