(() => {
    'use strict';

    const STORAGE_KEY = 'ravan-ui-preferences';
    const DEFAULT_PREFS = { theme: 'system', accent: 'blue' };
    const ICON_SPRITE_PATH = '/assets/ravan_ui/icons.svg';

    const ICON_MAP = {
        Home: 'icon-house',
        Workspace: 'icon-grid',
        Accounts: 'icon-ledger',
        Accounting: 'icon-ledger',
        CRM: 'icon-bubble',
        Sales: 'icon-tag',
        Selling: 'icon-tag',
        Buying: 'icon-bag',
        Stock: 'icon-cubes',
        Projects: 'icon-clipboard',
        Services: 'icon-clipboard',
        HR: 'icon-people',
        Payroll: 'icon-banknote',
        Support: 'icon-lifebuoy',
        Quality: 'icon-shield',
        Assets: 'icon-cube',
        Manufacturing: 'icon-gear',
        Website: 'icon-globe',
        Marketplace: 'icon-cart',
        Analytics: 'icon-chart',
        Settings: 'icon-sliders',
        Customizations: 'icon-magic',
        Integrations: 'icon-puzzle'
    };

    const iconLookup = Object.fromEntries(
        Object.entries(ICON_MAP).map(([label, id]) => [label.trim().toLowerCase(), id])
    );

    const state = { ...DEFAULT_PREFS };
    let pendingDecorate = false;

    const root = document.documentElement;

    function safeParse(json) {
        try {
            return JSON.parse(json);
        } catch (error) {
            console.warn('[ravan-ui] Failed to parse preferences, resetting.', error);
            return {};
        }
    }

    function loadPreferences() {
        if (!window.localStorage) {
            return;
        }
        const saved = safeParse(localStorage.getItem(STORAGE_KEY) || '{}');
        if (saved.theme) {
            state.theme = saved.theme;
        }
        if (saved.accent) {
            state.accent = saved.accent;
        }
    }

    function persistPreferences() {
        if (!window.localStorage) {
            return;
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function resolveSystemTheme() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
    }

    function applyTheme() {
        const targetTheme = state.theme === 'system' ? resolveSystemTheme() : state.theme;
        root.setAttribute('data-theme', targetTheme);
        if (document.body) {
            document.body.setAttribute('data-theme', targetTheme);
        }
    }

    function applyAccent() {
        root.setAttribute('data-accent', state.accent);
        if (document.body) {
            document.body.setAttribute('data-accent', state.accent);
        }
    }

    function applyBranding() {
        if (typeof document === 'undefined') {
            return;
        }

        if (document.title) {
            document.title = document.title
                .replace(/ERPNEXT/gi, 'RavanOS')
                .replace(/Frappe/gi, 'Ravan');
        }

        const brand = document.querySelector('.navbar-brand .app-logo-text');
        if (brand && brand.textContent) {
            brand.textContent = brand.textContent
                .replace(/ERPNEXT/gi, 'RavanOS')
                .replace(/Frappe/gi, 'Ravan');
        }
    }

    function createIconElement(iconId) {
        const iconWrapper = document.createElement('span');
        iconWrapper.className = 'ravan-ui-icon';
        iconWrapper.setAttribute('aria-hidden', 'true');
        iconWrapper.innerHTML = `\n            <svg viewBox="0 0 24 24" role="presentation">\n                <use href="${ICON_SPRITE_PATH}#${iconId}" />\n            </svg>\n        `;
        return iconWrapper;
    }

    function decorateSidebar() {
        const links = document.querySelectorAll('.sidebar .sidebar-item .sidebar-link');
        if (!links.length) {
            return;
        }

        links.forEach(link => {
            const existingIcon = link.querySelector('.ravan-ui-icon');
            if (existingIcon) {
                return;
            }

            const labelNode = link.querySelector('.sidebar-label, .module-link-title');
            const labelText = (labelNode ? labelNode.textContent : link.textContent || '').trim();
            if (!labelText) {
                return;
            }

            const iconId = iconLookup[labelText.toLowerCase()];
            if (!iconId) {
                return;
            }

            // Remove default icon placeholders if present
            const legacyIcon = link.querySelector('i, svg');
            if (legacyIcon) {
                legacyIcon.remove();
            }

            const iconWrapper = createIconElement(iconId);
            link.insertBefore(iconWrapper, link.firstChild);
        });
    }

    function decorateWorkspace() {
        document.querySelectorAll('.workspace-card, .workspace-page .widget').forEach(card => {
            if (!card.classList.contains('ravan-ui-elevated')) {
                card.classList.add('ravan-ui-elevated');
            }
        });
    }

    function scheduleDecorate() {
        if (pendingDecorate) {
            return;
        }
        pendingDecorate = true;
        requestAnimationFrame(() => {
            pendingDecorate = false;
            decorateSidebar();
            decorateWorkspace();
            applyBranding();
        });
    }

    function bindFrappeHooks() {
        if (!window.frappe) {
            return;
        }

        if (typeof frappe.after_ajax === 'function') {
            frappe.after_ajax(scheduleDecorate);
        }

        if (frappe.router && typeof frappe.router.on === 'function') {
            frappe.router.on('change', scheduleDecorate);
        }

        if (frappe.desk && typeof frappe.desk.on === 'function') {
            frappe.desk.on('page-change', scheduleDecorate);
        }
    }

    function initObserver() {
        if (!window.MutationObserver) {
            return;
        }

        const observer = new MutationObserver(mutations => {
            let shouldDecorate = false;
            mutations.forEach(mutation => {
                if (mutation.addedNodes && mutation.addedNodes.length) {
                    shouldDecorate = true;
                }
            });
            if (shouldDecorate) {
                scheduleDecorate();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    function applySystemSync() {
        if (!window.matchMedia) {
            return;
        }
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        if (typeof media.addEventListener === 'function') {
            media.addEventListener('change', () => {
                if (state.theme === 'system') {
                    applyTheme();
                }
            });
        } else if (typeof media.addListener === 'function') {
            media.addListener(() => {
                if (state.theme === 'system') {
                    applyTheme();
                }
            });
        }
    }

    function setThemePreference(preference) {
        if (!['light', 'dark', 'system'].includes(preference)) {
            return;
        }
        state.theme = preference;
        persistPreferences();
        applyTheme();
    }

    function setAccentPreference(accent) {
        const accentKey = accent && accent.toLowerCase();
        const allowed = ['blue', 'green', 'orange', 'pink'];
        if (!allowed.includes(accentKey)) {
            return;
        }
        state.accent = accentKey;
        persistPreferences();
        applyAccent();
    }

    function exposeAPI() {
        window.ravanUI = {
            setTheme: setThemePreference,
            setAccent: setAccentPreference,
            getPreferences: () => ({ ...state })
        };
    }

    function boot() {
        loadPreferences();
        applyTheme();
        applyAccent();
        applyBranding();
        scheduleDecorate();
        bindFrappeHooks();
        initObserver();
        applySystemSync();
        exposeAPI();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
        boot();
    }
})();
