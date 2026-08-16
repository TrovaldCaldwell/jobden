// app.api.js — JOBDENI Unified Simulation API
// This is the ONLY file that knows transactions are simulated.
// Client and Admin both import from here.
// In production: replace this file's internals with real HTTP calls.
// Nothing else changes.

const AppAPI = (() => {

    // ── Internal helpers ────────────────────────────────────────

    const _delay = (ms) => new Promise(r => setTimeout(r, ms));

    const _ref = () => {
        const d = new Date();
        const pad = n => String(n).padStart(2, '0');
        return `JD${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}${Math.floor(Math.random() * 9000000 + 1000000)}`;
    };

    const _fee = (amount) => {
        if (amount <= 10000)  return 500;
        if (amount <= 50000)  return 1000;
        if (amount <= 100000) return 1500;
        if (amount <= 500000) return 2000;
        return 3000;
    };

    const _now = () => new Date().toLocaleString('sw-TZ', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    // Simulated provider name from phone prefix
    const _provider = (phone) => {
        const p = String(phone).replace(/\s/g, '');
        if (/^(0?6[15-9]|0?71|0?74|0?75|0?76)/.test(p)) return 'VODACOM M-PESA';
        if (/^(0?62|0?65|0?68|0?69|0?77)/.test(p))       return 'AIRTEL MONEY';
        if (/^(0?61|0?67|0?78)/.test(p))                  return 'TIGO PESA';
        if (/^(0?73)/.test(p))                            return 'HALOTEL';
        return 'VODACOM M-PESA';
    };

    // Simulated recipient name lookup
    const _names = ['JOHN PETER MWAKALE','MARY JOSEPH KILEO','HASSAN OMAR SAID',
        'GRACE AUGUSTINO MLAY','PETER CHARLES LYIMO','FATUMA ALI HASSAN',
        'DAVID MWANGI KAMAU','AMINA SAID OMAR','CHARLES BENEDICT MREMA'];
    const _recipientName = (phone) => {
        const idx = parseInt(String(phone).slice(-2)) % _names.length;
        return _names[idx];
    };

    // In-memory transaction store (shared between client and admin views)
    const _store = {
        transactions: [],
        kiosks: [
            { id: 'KSK-001', name: 'Kariakoo Branch',   location: 'Dar es Salaam', status: 'online',  cash: 850000,  lastSeen: _now() },
            { id: 'KSK-002', name: 'Mwenge Terminal',   location: 'Dar es Salaam', status: 'online',  cash: 320000,  lastSeen: _now() },
            { id: 'KSK-003', name: 'Arusha Clock Tower',location: 'Arusha',        status: 'offline', cash: 0,       lastSeen: '15/08/2026 09:12:00' },
            { id: 'KSK-004', name: 'Mbeya Bus Stand',   location: 'Mbeya',         status: 'low_cash',cash: 45000,   lastSeen: _now() },
            { id: 'KSK-005', name: 'Dodoma Centre',     location: 'Dodoma',        status: 'online',  cash: 1200000, lastSeen: _now() },
        ],
        alerts: [
            { id: 'ALT-001', type: 'low_cash',   kiosk: 'KSK-004', message: 'Low Cash — Machine #KSK-004', time: '10 min ago', read: false },
            { id: 'ALT-002', type: 'error',      kiosk: 'KSK-003', message: 'Printer Error — Machine #KSK-003', time: '25 min ago', read: false },
            { id: 'ALT-003', type: 'offline',    kiosk: 'KSK-003', message: 'Network Issue — Machine #KSK-003', time: '1 hour ago', read: true },
        ]
    };

    // Seed some initial transactions
    const _seedTransactions = () => {
        const types = ['WITHDRAW','SEND','DEPOSIT','BILL','AIRTIME'];
        const providers = ['VODACOM M-PESA','AIRTEL MONEY','TIGO PESA','CRDB BANK','NMB BANK'];
        const kiosks = ['KSK-001','KSK-002','KSK-004','KSK-005'];
        const statuses = ['success','success','success','success','failed','pending'];
        for (let i = 0; i < 48; i++) {
            const amount = [5000,10000,20000,50000,100000,200000][Math.floor(Math.random()*6)];
            const fee = _fee(amount);
            const type = types[Math.floor(Math.random()*types.length)];
            const status = statuses[Math.floor(Math.random()*statuses.length)];
            const d = new Date(Date.now() - Math.random() * 7 * 24 * 3600 * 1000);
            _store.transactions.push({
                ref: _ref(),
                type,
                provider: providers[Math.floor(Math.random()*providers.length)],
                amount,
                fee,
                total: amount + fee,
                status,
                kiosk: kiosks[Math.floor(Math.random()*kiosks.length)],
                phone: `075${Math.floor(Math.random()*9000000+1000000)}`,
                timestamp: d.toLocaleString('sw-TZ'),
                recipient: type === 'SEND' ? _names[Math.floor(Math.random()*_names.length)] : null,
            });
        }
    };
    _seedTransactions();

    // ── PUBLIC API ──────────────────────────────────────────────
    // All methods return Promises to mirror real HTTP calls.
    // Delay simulates network latency.

    return {

        // ── CUSTOMER / KIOSK APIs ───────────────────────────────

        /**
         * Identify a customer by phone number.
         * Returns provider name and masked account info.
         */
        async identifyPhone(phone) {
            await _delay(900);
            if (!phone || String(phone).replace(/\s/g,'').length < 9) {
                return { success: false, error: 'Namba si sahihi / Invalid number' };
            }
            return {
                success: true,
                phone,
                provider: _provider(phone),
                display: String(phone).replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3'),
            };
        },

        /**
         * Look up a recipient by phone (for Send Money).
         */
        async lookupRecipient(phone) {
            await _delay(1200);
            if (!phone || String(phone).replace(/\s/g,'').length < 9) {
                return { success: false, error: 'Namba si sahihi' };
            }
            return {
                success: true,
                phone,
                name: _recipientName(phone),
                provider: _provider(phone),
            };
        },

        /**
         * Withdraw cash (TOA PESA).
         */
        async withdraw({ phone, amount, pin }) {
            await _delay(2200);
            if (!pin || pin.length < 4) return { success: false, error: 'PIN si sahihi' };
            if (amount < 1000)          return { success: false, error: 'Kiasi kidogo sana' };
            const fee = _fee(amount);
            const ref = _ref();
            const tx = {
                ref, type: 'WITHDRAW',
                provider: _provider(phone),
                phone, amount, fee,
                total: amount + fee,
                status: 'success',
                kiosk: 'KSK-001',
                timestamp: _now(),
                recipient: null,
            };
            _store.transactions.unshift(tx);
            return { success: true, ...tx };
        },

        /**
         * Send money (TUMA PESA).
         */
        async sendMoney({ fromPhone, toPhone, amount, pin }) {
            await _delay(2400);
            if (!pin || pin.length < 4) return { success: false, error: 'PIN si sahihi' };
            if (amount < 500)           return { success: false, error: 'Kiasi kidogo sana' };
            const fee = _fee(amount);
            const ref = _ref();
            const tx = {
                ref, type: 'SEND',
                provider: _provider(fromPhone),
                phone: fromPhone,
                toPhone, amount, fee,
                total: amount + fee,
                status: 'success',
                kiosk: 'KSK-001',
                timestamp: _now(),
                recipient: _recipientName(toPhone),
            };
            _store.transactions.unshift(tx);
            return { success: true, ...tx };
        },

        /**
         * Deposit money (WEKA PESA).
         */
        async deposit({ phone, amount }) {
            await _delay(2000);
            if (amount < 500) return { success: false, error: 'Kiasi kidogo sana' };
            const fee = _fee(amount);
            const ref = _ref();
            const tx = {
                ref, type: 'DEPOSIT',
                provider: _provider(phone),
                phone, amount, fee,
                total: amount + fee,
                status: 'success',
                kiosk: 'KSK-001',
                timestamp: _now(),
                recipient: null,
            };
            _store.transactions.unshift(tx);
            return { success: true, ...tx };
        },

        /**
         * Banking service (BENKI) — withdraw from bank account.
         */
        async bankWithdraw({ phone, bank, amount, pin }) {
            await _delay(2600);
            if (!pin || pin.length < 4) return { success: false, error: 'PIN/OTP si sahihi' };
            if (amount < 5000)          return { success: false, error: 'Kiasi kidogo sana' };
            const fee = _fee(amount);
            const ref = _ref();
            const tx = {
                ref, type: 'WITHDRAW',
                provider: bank,
                phone, amount, fee,
                total: amount + fee,
                status: 'success',
                kiosk: 'KSK-001',
                timestamp: _now(),
                recipient: null,
            };
            _store.transactions.unshift(tx);
            return { success: true, ...tx };
        },

        /**
         * Buy airtime (AIRTIME).
         */
        async buyAirtime({ phone, amount }) {
            await _delay(1500);
            if (amount < 500) return { success: false, error: 'Kiasi kidogo sana' };
            const fee = 0;
            const ref = _ref();
            const tx = {
                ref, type: 'AIRTIME',
                provider: _provider(phone),
                phone, amount, fee,
                total: amount,
                status: 'success',
                kiosk: 'KSK-001',
                timestamp: _now(),
                recipient: null,
            };
            _store.transactions.unshift(tx);
            return { success: true, ...tx };
        },

        /**
         * Pay bill (LIPA BILI).
         */
        async payBill({ phone, billNumber, provider, amount }) {
            await _delay(2000);
            if (!billNumber) return { success: false, error: 'Namba ya bili inahitajika' };
            const fee = 500;
            const ref = _ref();
            const tx = {
                ref, type: 'BILL',
                provider, phone,
                billNumber, amount, fee,
                total: amount + fee,
                status: 'success',
                kiosk: 'KSK-001',
                timestamp: _now(),
                recipient: null,
            };
            _store.transactions.unshift(tx);
            return { success: true, ...tx };
        },

        /**
         * Check balance (mock — always returns simulated balance).
         */
        async checkBalance({ phone, pin }) {
            await _delay(1800);
            if (!pin || pin.length < 4) return { success: false, error: 'PIN si sahihi' };
            const balance = Math.floor(Math.random() * 900000 + 50000);
            return { success: true, phone, provider: _provider(phone), balance };
        },

        // ── ADMIN APIs ──────────────────────────────────────────

        /**
         * Get dashboard overview stats.
         */
        async getStats() {
            await _delay(400);
            const txs = _store.transactions;
            const total     = txs.length;
            const success   = txs.filter(t => t.status === 'success').length;
            const failed    = txs.filter(t => t.status === 'failed').length;
            const pending   = txs.filter(t => t.status === 'pending').length;
            const revenue   = txs.filter(t => t.status === 'success').reduce((s,t) => s + t.fee, 0);
            const deposits  = txs.filter(t => t.type === 'DEPOSIT'  && t.status === 'success').reduce((s,t) => s + t.amount, 0);
            const withdraws = txs.filter(t => t.type === 'WITHDRAW' && t.status === 'success').reduce((s,t) => s + t.amount, 0);
            const online    = _store.kiosks.filter(k => k.status === 'online').length;
            const offline   = _store.kiosks.filter(k => k.status === 'offline').length;
            const lowCash   = _store.kiosks.filter(k => k.status === 'low_cash').length;

            // Daily volume for last 7 days
            const dailyVolume = Array.from({ length: 7 }, (_, i) => {
                const d = new Date(Date.now() - (6 - i) * 86400000);
                const label = d.toLocaleDateString('en', { weekday: 'short' });
                const dayTxs = txs.filter(t => {
                    const td = new Date(t.timestamp);
                    return td.toDateString() === d.toDateString();
                });
                return { label, count: dayTxs.length, volume: dayTxs.reduce((s,t) => s+t.amount, 0) };
            });

            return {
                success: true,
                total, success: success, failed, pending,
                revenue, deposits, withdraws,
                kiosks: { online, offline, lowCash, total: _store.kiosks.length },
                dailyVolume,
                unreadAlerts: _store.alerts.filter(a => !a.read).length,
            };
        },

        /**
         * Get all transactions (admin view).
         * Supports filter: { type, status, kiosk, search }
         */
        async getTransactions({ type, status, kiosk, search, limit = 50 } = {}) {
            await _delay(300);
            let txs = [..._store.transactions];
            if (type)   txs = txs.filter(t => t.type === type);
            if (status) txs = txs.filter(t => t.status === status);
            if (kiosk)  txs = txs.filter(t => t.kiosk === kiosk);
            if (search) {
                const q = search.toLowerCase();
                txs = txs.filter(t =>
                    t.ref.toLowerCase().includes(q) ||
                    t.phone.includes(q) ||
                    (t.recipient || '').toLowerCase().includes(q)
                );
            }
            return { success: true, transactions: txs.slice(0, limit), total: txs.length };
        },

        /**
         * Get all kiosks (admin view).
         */
        async getKiosks() {
            await _delay(300);
            return { success: true, kiosks: [..._store.kiosks] };
        },

        /**
         * Toggle kiosk active/inactive.
         */
        async toggleKiosk(id) {
            await _delay(600);
            const k = _store.kiosks.find(k => k.id === id);
            if (!k) return { success: false, error: 'Kiosk not found' };
            k.status = k.status === 'offline' ? 'online' : 'offline';
            return { success: true, kiosk: { ...k } };
        },

        /**
         * Get all alerts (admin view).
         */
        async getAlerts() {
            await _delay(200);
            return { success: true, alerts: [..._store.alerts] };
        },

        /**
         * Mark alert as read.
         */
        async markAlertRead(id) {
            await _delay(100);
            const a = _store.alerts.find(a => a.id === id);
            if (a) a.read = true;
            return { success: true };
        },

        /**
         * Get service breakdown for charts.
         */
        async getServiceBreakdown() {
            await _delay(300);
            const txs = _store.transactions.filter(t => t.status === 'success');
            const counts = {};
            txs.forEach(t => { counts[t.type] = (counts[t.type] || 0) + 1; });
            return {
                success: true,
                breakdown: Object.entries(counts).map(([type, count]) => ({
                    type,
                    count,
                    percent: Math.round((count / txs.length) * 100)
                }))
            };
        },

    };

})();

export default AppAPI;
