(() => {
    'use strict';

    const STORAGE_KEY = 'ravan-ui-preferences';
    const DEFAULT_PREFS = { theme: 'dark', accent: 'blue' };
    const FORCED_THEME = 'dark';
    const ICON_SPRITE_PATH = '/assets/ravan_ui/icons.svg';
    const FRAPPE_THEME_KEY = 'desk_theme';

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
        state.theme = FORCED_THEME;
        if (saved.accent) {
            state.accent = saved.accent;
        }
    }

    function adoptFrappeTheme() {
        const bodyTheme = document.body ? document.body.getAttribute('data-theme') : null;

        if (bodyTheme !== FORCED_THEME) {
            if (document.body) {
                document.body.setAttribute('data-theme', FORCED_THEME);
            }
        }

        state.theme = FORCED_THEME;
    }

    function writePreferences() {
        if (!window.localStorage) {
            return;
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function persistPreferences() {
        writePreferences();
        if (!window.localStorage) {
            return;
        }
        localStorage.setItem(FRAPPE_THEME_KEY, FORCED_THEME);
    }

    let applyingTheme = false;

    function applyTheme() {
        const targetTheme = FORCED_THEME;
        applyingTheme = true;
        root.setAttribute('data-theme', targetTheme);
        if (document.body) {
            document.body.setAttribute('data-theme', targetTheme);
        }
        requestAnimationFrame(() => {
            applyingTheme = false;
        });
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
        iconWrapper.innerHTML = `\n            <svg viewBox="0 0 24 24" role="presentation">\n                <use href="${ICON_SPRITE_PATH}#${iconId}" xlink:href="${ICON_SPRITE_PATH}#${iconId}" />\n            </svg>\n        `;
        return iconWrapper;
    }

    function buildInitialGlyph(label) {
        const glyph = document.createElement('span');
        glyph.className = 'ravan-launchpad__glyph';
        glyph.textContent = label ? label.charAt(0).toUpperCase() : '•';
        return glyph;
    }

    function decorateShortcut(item) {
        if (!item || item.classList.contains('ravan-launchpad__item')) {
            return;
        }

        item.classList.add('ravan-launchpad__item');

        const iconNode = item.querySelector('.shortcut-icon, .icon, .widget-icon, .menu-item-icon, .link-icon, svg, img');
        let labelNode = item.querySelector('.shortcut-title, .shortcut-name, .shortcut-label, .link-title, .title-text, .widget-title, .ellipsis, span, strong');
        let descriptionNode = item.querySelector('.shortcut-description, .link-description, .description, .detail');

        if (labelNode && !labelNode.textContent.trim()) {
            labelNode = null;
        }

        if (descriptionNode && !descriptionNode.textContent.trim()) {
            descriptionNode = null;
        }

        if (iconNode) {
            iconNode.classList.add('ravan-launchpad__glyph');
        } else {
            const glyph = buildInitialGlyph(labelNode ? labelNode.textContent.trim() : '');
            item.insertBefore(glyph, item.firstChild);
        }

        if (labelNode) {
            labelNode.classList.add('ravan-launchpad__label');
        }

        if (descriptionNode && descriptionNode.textContent.trim()) {
            descriptionNode.classList.add('ravan-launchpad__caption');
        }
    }

    function decorateLaunchpad(widget) {
        if (!widget) {
            return;
        }

        const list = widget.querySelector('.shortcut-list, .links-grid, .workspace-shortcuts, .widget-body, .grid-body, .section-body');
        if (!list) {
            return;
        }

        list.classList.add('ravan-launchpad');
        list.querySelectorAll('.shortcut-item, .shortcut, .workspace-shortcut, .link-item').forEach(node => {
            decorateShortcut(node);
        });
    }

    function decorateSidebar() {
        const links = document.querySelectorAll(
            '.sidebar .sidebar-item .sidebar-link, .workspace-sidebar .sidebar-item .sidebar-link'
        );
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

            if (card.classList.contains('shortcuts-widget') || card.classList.contains('shortcut-widget-box')) {
                decorateLaunchpad(card);
            }
        });

        document.querySelectorAll('.workspace-page .shortcut-widget-box, .workspace-page .shortcuts-widget, .workspace-page .widget.shortcuts-widget-box').forEach(widget => {
            decorateLaunchpad(widget);
        });

        document.querySelectorAll('.workspace-page .shortcut-widget-box .shortcut-list, .workspace-page .workspace-shortcuts').forEach(list => {
            list.classList.add('ravan-launchpad');
            list.querySelectorAll('.shortcut-item, .shortcut, .workspace-shortcut').forEach(item => decorateShortcut(item));
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

    function observeThemeAttribute() {
        if (!window.MutationObserver || !document.body) {
            return;
        }

        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type !== 'attributes' || applyingTheme) {
                    return;
                }

                const rawTheme = document.body.getAttribute('data-theme');
                if (rawTheme !== FORCED_THEME) {
                    document.body.setAttribute('data-theme', FORCED_THEME);
                }
                if (state.theme !== FORCED_THEME) {
                    state.theme = FORCED_THEME;
                    writePreferences();
                    applyTheme();
                }
            });
        });

        observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
    }

    function bindStorageBridge() {
        if (typeof window.addEventListener !== 'function' || !window.localStorage) {
            return;
        }

        window.addEventListener('storage', event => {
            if (event.storageArea !== localStorage || event.key !== FRAPPE_THEME_KEY) {
                return;
            }

            if (event.newValue !== FORCED_THEME) {
                localStorage.setItem(FRAPPE_THEME_KEY, FORCED_THEME);
            }

            if (state.theme !== FORCED_THEME) {
                state.theme = FORCED_THEME;
                writePreferences();
                applyTheme();
            }
        });
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
        state.theme = FORCED_THEME;
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
        adoptFrappeTheme();
        applyTheme();
        applyAccent();
        persistPreferences();
        applyBranding();
        scheduleDecorate();
        bindFrappeHooks();
        initObserver();
        applySystemSync();
        observeThemeAttribute();
        bindStorageBridge();
        exposeAPI();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
        boot();
    }
})();
