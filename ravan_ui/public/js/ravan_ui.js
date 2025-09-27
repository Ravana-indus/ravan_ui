(() => {
    'use strict';

    const STORAGE_KEY = 'ravan-ui-preferences';
    const DEFAULT_PREFS = { theme: 'light', accent: 'blue' };
    const FRAPPE_THEME_KEY = 'desk_theme';
    const VALID_THEMES = ['light', 'dark'];

    const state = { ...DEFAULT_PREFS };
    let pendingDecorate = false;
    let applyingTheme = false;

    const root = document.documentElement;

    function normalizeTheme(theme) {
        if (!theme) {
            return null;
        }
        const value = String(theme).toLowerCase();
        return VALID_THEMES.includes(value) ? value : null;
    }

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
        const savedTheme = normalizeTheme(saved.theme);
        if (savedTheme) {
            state.theme = savedTheme;
        }
        if (saved.accent) {
            const accent = String(saved.accent).toLowerCase();
            if (['blue', 'green', 'orange', 'pink'].includes(accent)) {
                state.accent = accent;
            }
        }
    }

    function adoptFrappeTheme() {
        const storedTheme = window.localStorage ? normalizeTheme(localStorage.getItem(FRAPPE_THEME_KEY)) : null;
        const bodyTheme = document.body ? normalizeTheme(document.body.getAttribute('data-theme')) : null;
        const candidate = storedTheme || bodyTheme;
        if (candidate) {
            state.theme = candidate;
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            state.theme = 'dark';
        }
    }

    function writePreferences() {
        if (!window.localStorage) {
            return;
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function persistPreferences() {
        const themeToPersist = normalizeTheme(state.theme) || DEFAULT_PREFS.theme;
        state.theme = themeToPersist;
        writePreferences();
        if (!window.localStorage) {
            return;
        }
        localStorage.setItem(FRAPPE_THEME_KEY, themeToPersist);
    }

    function applyTheme() {
        const targetTheme = normalizeTheme(state.theme) || DEFAULT_PREFS.theme;
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
            link.classList.add('ravan-sidebar__link');
            const labelNode = link.querySelector('.sidebar-label, .module-link-title');
            if (labelNode) {
                labelNode.classList.add('ravan-sidebar__label');
            }
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

                const rawTheme = normalizeTheme(document.body.getAttribute('data-theme'));
                if (rawTheme && rawTheme !== state.theme) {
                    state.theme = rawTheme;
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

            const incoming = normalizeTheme(event.newValue);
            if (incoming && incoming !== state.theme) {
                state.theme = incoming;
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

    function setThemePreference(preference) {
        const normalized = normalizeTheme(preference);
        if (!normalized || normalized === state.theme) {
            return;
        }
        state.theme = normalized;
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
