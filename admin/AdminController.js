// admin/AdminController.js
import MessageBus       from './shared/MessageBus.js';
import ThemeManager     from './shared/ThemeManager.js';
import BackgroundLoader from './shared/BackgroundLoader.js';
import AdminSupervisor  from './supervisors/AdminSupervisor.js';

export default class AdminController {
    async init() {
        BackgroundLoader.init('space');
        this.bus = new MessageBus();
        this.tm  = new ThemeManager();
        await this.tm.init('dark');
        this.supervisor = new AdminSupervisor(this.bus);
        await this.supervisor.init();
        this._startClock();
        console.log('[AdminController] ✅ Ready');
    }

    _startClock() {
        const update = () => {
            const el = document.querySelector('.topbar-time');
            if (el) el.textContent = new Date().toLocaleString('en', {
                weekday: 'short', day: '2-digit', month: 'short',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
        };
        update();
        setInterval(update, 1000);
    }
}
