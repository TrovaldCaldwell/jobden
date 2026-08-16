// supervisors/KioskSupervisor.js
// Owns all kiosk workers. Routes screens. Holds session state.
// Never touches DOM directly — delegates to workers.

import AttractWorker    from '../workers/AttractWorker.js';
import LanguageWorker   from '../workers/LanguageWorker.js';
import PhoneWorker      from '../workers/PhoneWorker.js';
import ServiceWorker    from '../workers/ServiceWorker.js';
import HeaderWorker     from '../workers/HeaderWorker.js';
import FooterWorker     from '../workers/FooterWorker.js';
import WithdrawWorker   from '../workers/WithdrawWorker.js';
import SendWorker       from '../workers/SendWorker.js';
import BankingWorker    from '../workers/BankingWorker.js';
import DepositWorker    from '../workers/DepositWorker.js';
import AirtimeWorker    from '../workers/AirtimeWorker.js';

export default class KioskSupervisor {
    constructor(messageBus, themeManager, languageManager) {
        this.bus  = messageBus;
        this.tm   = themeManager;
        this.lm   = languageManager;

        // Session state — shared across all workers
        this.session = {
            language: 'sw',
            phone:    null,
            provider: null,
            service:  null,
        };

        // Workers
        this.headerWorker   = null;
        this.footerWorker   = null;
        this.attractWorker  = null;
        this.languageWorker = null;
        this.phoneWorker    = null;
        this.serviceWorker  = null;
        this.withdrawWorker = null;
        this.sendWorker     = null;
        this.bankingWorker  = null;
        this.depositWorker  = null;
        this.airtimeWorker  = null;

        // Session timeout
        this._timeoutHandle = null;
        this._TIMEOUT_MS    = 90000; // 90 seconds

        console.log('[KioskSupervisor] Created');
    }

    async init() {
        // Header + Footer always visible
        this.headerWorker = new HeaderWorker(this.bus, this.lm, this.session);
        await this.headerWorker.init();

        this.footerWorker = new FooterWorker(this.bus, this.lm);
        await this.footerWorker.init();

        // All screen workers
        this.attractWorker  = new AttractWorker(this.bus, this.lm, this.session);
        this.languageWorker = new LanguageWorker(this.bus, this.lm, this.session);
        this.phoneWorker    = new PhoneWorker(this.bus, this.lm, this.session);
        this.serviceWorker  = new ServiceWorker(this.bus, this.lm, this.session);
        this.withdrawWorker = new WithdrawWorker(this.bus, this.lm, this.session);
        this.sendWorker     = new SendWorker(this.bus, this.lm, this.session);
        this.bankingWorker  = new BankingWorker(this.bus, this.lm, this.session);
        this.depositWorker  = new DepositWorker(this.bus, this.lm, this.session);
        this.airtimeWorker  = new AirtimeWorker(this.bus, this.lm, this.session);

        await this.attractWorker.init();
        await this.languageWorker.init();
        await this.phoneWorker.init();
        await this.serviceWorker.init();
        await this.withdrawWorker.init();
        await this.sendWorker.init();
        await this.bankingWorker.init();
        await this.depositWorker.init();
        await this.airtimeWorker.init();

        this._setupListeners();

        // Start at attract screen
        this.goTo('attract');

        console.log('[KioskSupervisor] ✅ Ready');
    }

    // ── Navigation ──────────────────────────────────────────────

    goTo(screen) {
        // Hide all sections
        document.querySelectorAll('#kiosk-screen section').forEach(s => {
            s.classList.remove('active');
        });

        // Show target
        const el = document.getElementById(`screen-${screen}`);
        if (el) {
            el.classList.add('active');
        } else {
            console.warn(`[KioskSupervisor] Screen not found: screen-${screen}`);
        }

        // Reset session timeout (not on attract)
        if (screen !== 'attract') {
            this._resetTimeout();
        } else {
            this._clearTimeout();
        }

        console.log(`[KioskSupervisor] → ${screen}`);
    }

    // ── Session timeout ─────────────────────────────────────────

    _resetTimeout() {
        this._clearTimeout();
        this._timeoutHandle = setTimeout(() => {
            console.log('[KioskSupervisor] Session timeout — returning to attract');
            this._resetSession();
            this.goTo('attract');
        }, this._TIMEOUT_MS);
    }

    _clearTimeout() {
        if (this._timeoutHandle) {
            clearTimeout(this._timeoutHandle);
            this._timeoutHandle = null;
        }
    }

    _resetSession() {
        this.session.phone    = null;
        this.session.provider = null;
        this.session.service  = null;
        this.bus.publish('session:reset', {});
    }

    // ── Event Listeners ─────────────────────────────────────────

    _setupListeners() {

        // Attract → Language
        this.bus.subscribe('attract:start', () => {
            this.goTo('language');
        });

        // Language selected
        this.bus.subscribe('language:selected', ({ lang }) => {
            this.session.language = lang;
            this.lm.loadLanguage(lang).then(() => {
                this.bus.publish('language:changed', { lang });
                this.goTo('phone');
            });
        });

        // Phone identified
        this.bus.subscribe('phone:confirmed', ({ phone, provider }) => {
            this.session.phone    = phone;
            this.session.provider = provider;
            this.goTo('services');
        });

        // Service selected
        this.bus.subscribe('service:selected', ({ service }) => {
            this.session.service = service;
            switch (service) {
                case 'withdraw': this.goTo('withdraw');  break;
                case 'send':     this.goTo('send');      break;
                case 'banking':  this.goTo('banking');   break;
                case 'deposit':  this.goTo('deposit');   break;
                case 'airtime':  this.goTo('airtime');   break;
                default:
                    console.warn('[KioskSupervisor] Unknown service:', service);
            }
        });

        // Any "back to services" event
        this.bus.subscribe('nav:services', () => this.goTo('services'));
        this.bus.subscribe('nav:phone',    () => this.goTo('phone'));
        this.bus.subscribe('nav:attract',  () => {
            this._resetSession();
            this.goTo('attract');
        });

        // Flow completion → back to attract after short delay
        this.bus.subscribe('flow:complete', () => {
            setTimeout(() => {
                this._resetSession();
                this.goTo('attract');
            }, 8000);
        });
    }
}
