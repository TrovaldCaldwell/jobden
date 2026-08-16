// shared/LanguageManager.js — Loads language JSON and serves translation strings
export default class LanguageManager {
    constructor() {
        this.currentLang = 'en';
        this.strings = {};
        this.availableLanguages = [
            { code: 'en', label: 'English' },
            { code: 'es', label: 'Español' }
        ];
        console.log('[LanguageManager] Created');
    }

    async loadLanguage(code) {
        if (!this.availableLanguages.find(l => l.code === code)) {
            console.warn(`[LanguageManager] Unknown language: ${code}`);
            code = 'en';
        }
        try {
            const res = await fetch(`./resources/languages/${code}.json`);
            this.strings = await res.json();
            this.currentLang = code;
            document.documentElement.setAttribute('lang', code);
            console.log(`[LanguageManager] Loaded language: ${code}`);
        } catch (err) {
            console.error('[LanguageManager] Failed to load language:', err);
        }
    }

    get(key, fallback = '') {
        return this.strings[key] ?? fallback;
    }

    getLang()      { return this.currentLang; }
    getAvailable() { return this.availableLanguages; }
}