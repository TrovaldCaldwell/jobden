// workers/AttractWorker.js — Screen 1: Attract Mode matching design image
export default class AttractWorker {
    constructor(bus, lm, session) {
        this.bus = bus; this.lm = lm; this.session = session;
        this.el = document.getElementById('screen-attract');
        this._slideInterval = null;
        this._currentSlide = 0;
    }

    async init() {
        this._injectCSS();
        this._render();
        this.bus.subscribe('session:reset', () => {
            if (this.el.classList.contains('active')) this._startSlideshow();
        });
    }

    _injectCSS() {
        if (document.getElementById('attract-css')) return;
        const link = document.createElement('link');
        link.id = 'attract-css'; link.rel = 'stylesheet';
        link.href = './workers/AttractWorker.css';
        document.head.appendChild(link);
    }

    _kioskSVG() {
        return `<svg class="kiosk-svg" viewBox="0 0 80 160" xmlns="http://www.w3.org/2000/svg">
            <!-- Kiosk body -->
            <rect x="10" y="0" width="60" height="160" rx="8" fill="#1e3a5c" stroke="#2d5a8e" stroke-width="1.5"/>
            <!-- Screen bezel -->
            <rect x="15" y="10" width="50" height="90" rx="4" fill="#0a1628"/>
            <!-- Screen display -->
            <rect x="17" y="12" width="46" height="86" rx="3" fill="#1a4a7c"/>
            <!-- JD logo on screen -->
            <rect x="28" y="25" width="24" height="20" rx="4" fill="#ffffff" opacity="0.9"/>
            <text x="40" y="39" text-anchor="middle" font-family="Arial Black" font-weight="900" font-size="11" fill="#1a3a5c">JD</text>
            <!-- Screen content lines -->
            <rect x="20" y="52" width="40" height="3" rx="1.5" fill="rgba(255,255,255,0.3)"/>
            <rect x="20" y="59" width="30" height="2" rx="1" fill="rgba(255,255,255,0.2)"/>
            <rect x="20" y="65" width="35" height="2" rx="1" fill="rgba(255,255,255,0.2)"/>
            <rect x="20" y="71" width="25" height="2" rx="1" fill="rgba(255,255,255,0.2)"/>
            <!-- Keypad area -->
            <rect x="17" y="102" width="46" height="36" rx="3" fill="#0d2137"/>
            <!-- Keypad buttons 3x3 -->
            ${[0,1,2].map(row => [0,1,2].map(col =>
                `<rect x="${20 + col*14}" y="${105 + row*10}" width="11" height="8" rx="2" fill="#1e4a7a"/>`
            ).join('')).join('')}
            <!-- Card slot -->
            <rect x="20" y="142" width="40" height="4" rx="2" fill="#0d2137"/>
            <!-- Cash slot -->
            <rect x="20" y="150" width="40" height="5" rx="2" fill="#0d2137"/>
            <!-- Base -->
            <rect x="5" y="155" width="70" height="5" rx="2" fill="#152840"/>
        </svg>`;
    }

    _render() {
        this.el.innerHTML = `
        <div class="attract-wrap">
            <div class="attract-carousel">

                <!-- Slide 1: Main brand slide matching image -->
                <div class="attract-slide active" data-slide="0">
                    <div class="attract-hero">
                        <div class="attract-top">
                            <div class="attract-logo-mark">
                                <svg viewBox="0 0 40 40" width="36" height="36">
                                    <rect width="40" height="40" rx="7" fill="#1a3a5c"/>
                                    <text x="20" y="28" text-anchor="middle" font-family="Arial Black,sans-serif"
                                          font-weight="900" font-size="17" fill="#ffffff">JD</text>
                                </svg>
                            </div>
                            <div class="attract-brand-text">
                                <span class="attract-brand-name">JOBDENI</span>
                                <span class="attract-brand-tag">Universal Money Kiosk</span>
                            </div>
                        </div>

                        <div class="attract-headline">ONE MACHINE<br>ALL NETWORKS<br>ALL SERVICES</div>
                        <div class="attract-subline">Faster • Safer • Convenient</div>

                        <div class="attract-kiosk-img">${this._kioskSVG()}</div>

                        <div class="attract-services">
                            <div class="attract-svc-row"><div class="svc-dot" style="background:#27ae60"></div>Send Money — Tuma Pesa</div>
                            <div class="attract-svc-row"><div class="svc-dot" style="background:#2980b9"></div>Withdraw Cash — Toa Pesa</div>
                            <div class="attract-svc-row"><div class="svc-dot" style="background:#e74c3c"></div>Pay Bills — Lipa Bili</div>
                            <div class="attract-svc-row"><div class="svc-dot" style="background:#8e44ad"></div>Government Payments</div>
                            <div class="attract-svc-row"><div class="svc-dot" style="background:#e67e22"></div>Airtime & Bundles</div>
                            <div class="attract-svc-row"><div class="svc-dot" style="background:#16a085"></div>Banking Services — Benki</div>
                        </div>

                        <div class="attract-ad-badge">
                            📢 <span>Advertise Here!</span> &nbsp;✆ +255 123 456 789
                        </div>
                    </div>
                </div>

                <!-- Slide 2: Networks -->
                <div class="attract-slide" data-slide="1">
                    <div class="attract-hero attract-hero-alt">
                        <div class="attract-icon-big">💸</div>
                        <div class="attract-headline-sm">TUMA PESA HARAKA</div>
                        <div class="attract-alt-sub">Send money instantly to any network</div>
                        <div class="net-pills">
                            <span class="net-pill" style="background:rgba(0,153,204,0.3)">M-PESA</span>
                            <span class="net-pill" style="background:rgba(231,76,60,0.3)">AIRTEL</span>
                            <span class="net-pill" style="background:rgba(39,174,96,0.3)">TIGO</span>
                            <span class="net-pill" style="background:rgba(243,156,18,0.3)">HALOTEL</span>
                        </div>
                    </div>
                </div>

                <!-- Slide 3: Banking -->
                <div class="attract-slide" data-slide="2">
                    <div class="attract-hero attract-hero-alt">
                        <div class="attract-icon-big">🏦</div>
                        <div class="attract-headline-sm">HUDUMA ZA BENKI</div>
                        <div class="attract-alt-sub">CRDB • NMB • Stanbic • DTB • Equity • Akiba</div>
                        <div class="net-pills">
                            <span class="net-pill">CRDB</span>
                            <span class="net-pill">NMB</span>
                            <span class="net-pill">STANBIC</span>
                            <span class="net-pill">DTB</span>
                        </div>
                    </div>
                </div>

            </div>

            <div class="attract-dots">
                <div class="attract-dot active"></div>
                <div class="attract-dot"></div>
                <div class="attract-dot"></div>
            </div>

            <div class="attract-cta" id="attract-start-btn">
                <div class="attract-cta-pulse"></div>
                <div class="attract-cta-text">
                    <span class="cta-main">Gusa Kuanza / Touch to Start</span>
                    <span class="cta-sub">Peza Yako, Mahali Pamoja • 24/7 SERVICE</span>
                </div>
            </div>
        </div>`;

        document.getElementById('attract-start-btn').addEventListener('click', () => {
            this.bus.publish('attract:start', {});
        });
        this._startSlideshow();
    }

    _startSlideshow() {
        if (this._slideInterval) clearInterval(this._slideInterval);
        this._currentSlide = 0;
        this._showSlide(0);
        this._slideInterval = setInterval(() => {
            this._currentSlide = (this._currentSlide + 1) % 3;
            this._showSlide(this._currentSlide);
        }, 4000);
    }

    _showSlide(idx) {
        this.el.querySelectorAll('.attract-slide').forEach((s, i) => s.classList.toggle('active', i === idx));
        this.el.querySelectorAll('.attract-dot').forEach((d, i) => d.classList.toggle('active', i === idx));
    }
}
