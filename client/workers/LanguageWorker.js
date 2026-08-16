// workers/LanguageWorker.js — Screen 2: Language Selection
export default class LanguageWorker {
    constructor(bus, lm, session) {
        this.bus = bus; this.lm = lm; this.session = session;
        this.el = document.getElementById('screen-language');
    }

    async init() {
        this._injectCSS();
        this._render();
    }

    _injectCSS() {
        if (document.getElementById('language-css')) return;
        const link = document.createElement('link');
        link.id = 'language-css'; link.rel = 'stylesheet';
        link.href = './workers/LanguageWorker.css';
        document.head.appendChild(link);
    }

    _render() {
        this.el.innerHTML = `
        <div class="lang-wrap">
            <div class="lang-header">
                <div class="lang-title">KARIBU / WELCOME</div>
                <div class="lang-sub">Chagua Lugha / Choose Language</div>
            </div>
            <div class="lang-options">
                <button class="lang-btn" data-lang="sw">
                    <span class="lang-flag">🇹🇿</span>
                    <span class="lang-name">KISWAHILI</span>
                    <span class="lang-tap">Gusa hapa</span>
                </button>
                <button class="lang-btn" data-lang="en">
                    <span class="lang-flag">🇬🇧</span>
                    <span class="lang-name">ENGLISH</span>
                    <span class="lang-tap">Touch Here</span>
                </button>
            </div>
            <div class="lang-footer-bar">
                <span>🔒 Usalama</span>
                <span>•</span>
                <span>⚡ Uharaka</span>
                <span>•</span>
                <span>✨ Urahisi</span>
            </div>
        </div>`;

        this.el.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.bus.publish('language:selected', { lang: btn.dataset.lang });
            });
        });
    }
}
