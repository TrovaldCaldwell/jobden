// KioskController.js — CEO of the JOBDENI Kiosk Client
import MessageBus       from './shared/MessageBus.js';
import ThemeManager     from './shared/ThemeManager.js';
import LanguageManager  from './shared/LanguageManager.js';
import BackgroundLoader from './shared/BackgroundLoader.js';
import CustomPopup      from './shared/CustomPopup.js';
import KioskSupervisor  from './supervisors/KioskSupervisor.js';

export default class KioskController {
    constructor() {
        this.messageBus      = null;
        this.themeManager    = null;
        this.languageManager = null;
        this.supervisor      = null;
        console.log('[KioskController] Created');
    }

    async init() {
        // Background first
        BackgroundLoader.init('space');

        // Shared services
        this.messageBus      = new MessageBus();
        this.themeManager    = new ThemeManager();
        this.languageManager = new LanguageManager();

        await this.themeManager.init('dark');
        await this.languageManager.loadLanguage('sw'); // default Kiswahili

        // Global popup engine
        CustomPopup.init();

        // Hand off to supervisor
        this.supervisor = new KioskSupervisor(
            this.messageBus,
            this.themeManager,
            this.languageManager
        );
        await this.supervisor.init();

        // Clock update
        this._startClock();

        console.log('[KioskController] ✅ Ready');
    }

    _startClock() {
        const update = () => {
            const el = document.querySelector('.time-value');
            if (el) {
                const now = new Date();
                el.textContent = now.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
            }
            const dateEl = document.querySelector('.header-date');
            if (dateEl) {
                dateEl.textContent = new Date().toLocaleDateString('en', {
                    day: '2-digit', month: 'short', year: 'numeric'
                });
            }
        };
        update();
        setInterval(update, 1000);
    }
}
