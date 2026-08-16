// shared/BackgroundLoader.js — Light theme background
export default class BackgroundLoader {
    static async init(key = 'light') { BackgroundLoader.apply(key); }

    static apply(key = 'light') {
        const container = document.getElementById('bg-container');
        if (!container) return;
        container.innerHTML = BackgroundLoader._lightBackground();
    }

    static _lightBackground() {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
            <defs>
                <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#dde6f0"/>
                    <stop offset="100%" stop-color="#c8d8e8"/>
                </linearGradient>
                <radialGradient id="glowA" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#0099cc" stop-opacity="0.06"/>
                    <stop offset="100%" stop-color="#0099cc" stop-opacity="0"/>
                </radialGradient>
                <radialGradient id="glowB" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#1a3a5c" stop-opacity="0.04"/>
                    <stop offset="100%" stop-color="#1a3a5c" stop-opacity="0"/>
                </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#bgGrad)"/>
            <ellipse cx="20%" cy="30%" rx="500" ry="400" fill="url(#glowA)"/>
            <ellipse cx="80%" cy="70%" rx="400" ry="300" fill="url(#glowB)"/>
            <g opacity="0.04" stroke="#1a3a5c" stroke-width="0.5">
                ${Array.from({length:20},(_,i)=>`<line x1="${i*80}" y1="0" x2="${i*80}" y2="900"/>`).join('')}
                ${Array.from({length:12},(_,i)=>`<line x1="0" y1="${i*80}" x2="1440" y2="${i*80}"/>`).join('')}
            </g>
        </svg>`;
    }
}
