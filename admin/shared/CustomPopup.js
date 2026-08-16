// shared/CustomPopup.js
// Universal popup / dialog engine for ProgInsight.
//
// TWO MODES
// ─────────
// 1. Anchored popover  — opens beside a trigger element (e.g. sidebar Customize)
//    CustomPopup.open({ anchor, content, id? })
//
// 2. Confirmation dialog — centered modal with confirm / cancel buttons
//    const ok = await CustomPopup.confirm({ title, message, confirmLabel?, cancelLabel? })
//
// Both modes share the same backdrop, animation, Escape handling, and outside-click
// dismissal logic. Only one popup is open at a time.

export default class CustomPopup {

    // ── Static API ──────────────────────────────────────────────

    /** Call once from MainController so the container exists before any popup is needed. */
    static init() {
        if (document.getElementById('cp-root')) return;

        // Backdrop (covers page for dialogs; transparent for popovers)
        const backdrop = document.createElement('div');
        backdrop.id        = 'cp-backdrop';
        backdrop.className = 'cp-backdrop';
        backdrop.setAttribute('aria-hidden', 'true');
        document.body.appendChild(backdrop);

        // Panel (the visible card)
        const panel = document.createElement('div');
        panel.id        = 'cp-root';
        panel.className = 'cp-panel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-modal', 'true');
        document.body.appendChild(panel);

        // Wire global close events once
        backdrop.addEventListener('click', () => CustomPopup._dismiss());
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && CustomPopup._isOpen()) CustomPopup._dismiss();
        });
    }

    /**
     * Open an anchored popover beside a trigger element.
     *
     * @param {object} opts
     * @param {HTMLElement}      opts.anchor   — The button that triggered the popup
     * @param {string|Node}      opts.content  — HTML string or DOM Node to place inside
     * @param {string}           [opts.id]     — Optional id for the inner content wrapper
     * @param {'left'|'right'}   [opts.side='right'] — Which side of anchor to open on
     */
    static open({ anchor, content, id = '', side = 'right' }) {
        CustomPopup._mode = 'popover';
        CustomPopup._show(content, id);

        const panel    = document.getElementById('cp-root');
        const backdrop = document.getElementById('cp-backdrop');

        // No dark backdrop for popovers
        backdrop.classList.remove('cp-backdrop--visible');

        CustomPopup._position(panel, anchor, side);
    }

    /**
     * Open a centered confirmation dialog. Returns a Promise<boolean>.
     *
     * @param {object} opts
     * @param {string} opts.title
     * @param {string} opts.message
     * @param {string} [opts.confirmLabel='Confirm']
     * @param {string} [opts.cancelLabel='Cancel']
     * @param {'danger'|'default'} [opts.variant='default']
     * @returns {Promise<boolean>}
     */
    static confirm({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'default' }) {
        return new Promise((resolve) => {
            CustomPopup._mode    = 'dialog';
            CustomPopup._resolve = resolve;

            const html = `
                <div class="cp-dialog-header">
                    <span class="cp-dialog-title">${title}</span>
                </div>
                <p class="cp-dialog-message">${message}</p>
                <div class="cp-dialog-actions">
                    <button class="cp-btn cp-btn--cancel"  id="cp-cancel">${cancelLabel}</button>
                    <button class="cp-btn cp-btn--confirm cp-btn--${variant}" id="cp-confirm">${confirmLabel}</button>
                </div>`;

            CustomPopup._show(html, 'cp-dialog-inner');

            const panel    = document.getElementById('cp-root');
            const backdrop = document.getElementById('cp-backdrop');

            // Centre the panel
            panel.classList.add('cp-panel--centered');
            backdrop.classList.add('cp-backdrop--visible');

            panel.querySelector('#cp-confirm').addEventListener('click', () => {
                CustomPopup._settle(true);
            });
            panel.querySelector('#cp-cancel').addEventListener('click', () => {
                CustomPopup._settle(false);
            });
        });
    }

    /** Programmatically close whatever is currently open. */
    static close() {
        CustomPopup._dismiss();
    }

    // ── Internal ────────────────────────────────────────────────

    static _mode    = null;   // 'popover' | 'dialog'
    static _resolve = null;   // Promise resolver for confirm()

    static _isOpen() {
        const panel = document.getElementById('cp-root');
        return panel && panel.classList.contains('cp-panel--open');
    }

    static _show(content, wrapperId) {
        const panel = document.getElementById('cp-root');
        if (!panel) { console.warn('[CustomPopup] Not initialised — call CustomPopup.init() first.'); return; }

        // Reset state
        panel.className = 'cp-panel';
        panel.removeAttribute('style');

        // Inject content
        if (typeof content === 'string') {
            panel.innerHTML = wrapperId
                ? `<div id="${wrapperId}">${content}</div>`
                : content;
        } else {
            panel.innerHTML = '';
            if (wrapperId) {
                const wrap = document.createElement('div');
                wrap.id = wrapperId;
                wrap.appendChild(content);
                panel.appendChild(wrap);
            } else {
                panel.appendChild(content);
            }
        }

        // Trigger open animation (rAF lets the browser apply initial styles first)
        requestAnimationFrame(() => panel.classList.add('cp-panel--open'));
    }

    static _position(panel, anchor, side) {
        const rect      = anchor.getBoundingClientRect();
        const gap       = 12; // px between anchor and panel
        const panelW    = 272;

        // Vertical: align panel bottom with anchor bottom, nudge if it clips viewport top
        let top = rect.bottom - panel.offsetHeight;
        if (top < 8) top = 8;

        // Horizontal
        let left;
        if (side === 'right') {
            left = rect.right + gap;
            // If it clips the right edge, flip to left
            if (left + panelW > window.innerWidth - 8) {
                left = rect.left - panelW - gap;
            }
        } else {
            left = rect.left - panelW - gap;
            if (left < 8) left = rect.right + gap;
        }

        panel.style.position = 'fixed';
        panel.style.top      = `${top}px`;
        panel.style.left     = `${left}px`;
        panel.style.width    = `${panelW}px`;
    }

    static _dismiss() {
        const panel    = document.getElementById('cp-root');
        const backdrop = document.getElementById('cp-backdrop');
        if (!panel) return;

        panel.classList.remove('cp-panel--open');
        panel.classList.remove('cp-panel--centered');
        backdrop.classList.remove('cp-backdrop--visible');

        // Settle any pending confirm() as false
        if (CustomPopup._resolve) {
            CustomPopup._settle(false);
        }
    }

    static _settle(result) {
        const resolve = CustomPopup._resolve;
        CustomPopup._resolve = null;
        CustomPopup._dismiss();
        if (resolve) resolve(result);
    }
}
