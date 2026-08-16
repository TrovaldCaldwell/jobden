// shared/ThemeManager.js — Reads theme from DOM attribute (set by onboarding.js)
// CSS variables are handled entirely by sidebar.css theme definitions.
export default class ThemeManager {
    constructor() {
        this.availableThemes = ['light', 'rose', 'dracula', 'dark', 'midnight'];
    }

    // Called by MainController — reads current theme from DOM
    async initFromDOM() {
        this.currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    }

    // Legacy compat — kept so workers that call applyTheme() still work
    async init(themeName = 'light') {
        await this.applyTheme(themeName);
    }

    async applyTheme(themeName) {
        if (!this.availableThemes.includes(themeName)) themeName = 'light';
        document.documentElement.setAttribute('data-theme', themeName);
        this.currentTheme = themeName;
        localStorage.setItem('pi-theme', themeName);
    }

    getTheme()     { return this.currentTheme || document.documentElement.getAttribute('data-theme') || 'light'; }
    getAvailable() { return this.availableThemes; }
}
