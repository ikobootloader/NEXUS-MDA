/* --- taskmda-global-notes-filters-ui.js --- */
(function initTaskMdaGlobalNotesFiltersUiModule(global) {
  // Module role: UI/domain boundary for TaskMdaGlobalNotesFiltersUiModule.
  'use strict';

  function createModule(options) {
    // Injected dependencies: callbacks/state accessors provided by taskmda-team orchestrator.
    const opts = options || {};
    let bound = false;
    const normalizeCatalogKey = typeof opts.normalizeCatalogKey === 'function'
      ? opts.normalizeCatalogKey
      : (value) => String(value || '').trim().toLowerCase();
    const escapeHtml = typeof opts.escapeHtml === 'function'
      ? opts.escapeHtml
      : (value) => String(value || '');

    function getGlobalNoteThemeLabels(note) {
      const tags = Array.isArray(note?.tags)
        ? Array.from(new Set(note.tags.map((tag) => String(tag || '').trim()).filter(Boolean)))
        : [];
      if (tags.length > 0) return tags;
      const theme = String(note?.theme || '').trim();
      if (theme) return [theme];
      return ['Sans thematique'];
    }

    function buildGlobalNotesThemeCatalog(notes = []) {
      const map = new Map();
      (Array.isArray(notes) ? notes : []).forEach((note) => {
        getGlobalNoteThemeLabels(note).forEach((label) => {
          const key = normalizeCatalogKey(label);
          if (!key) return;
          const existing = map.get(key);
          if (existing) existing.count += 1;
          else map.set(key, { key, label, count: 1 });
        });
      });
      return Array.from(map.values()).sort((a, b) => String(a.label || '').localeCompare(String(b.label || ''), 'fr'));
    }

    function renderGlobalNotesThemeTabs(notes = []) {
      const host = document.getElementById('global-notes-theme-tabs');
      if (!host) return;
      // Defensive guard: keep vertical presentation even after dynamic re-renders.
      host.classList.add('global-notes-theme-tabs-vertical');
      let selectedThemeFilter = String(opts.getGlobalNotesThemeFilter?.() || 'all').trim() || 'all';
      const catalog = buildGlobalNotesThemeCatalog(notes);
      if (selectedThemeFilter !== 'all' && !catalog.some((item) => item.key === selectedThemeFilter)) {
        opts.setGlobalNotesThemeFilter?.('all');
        selectedThemeFilter = 'all';
      }
      const total = Array.isArray(notes) ? notes.length : 0;
      host.innerHTML = [
        `<button type="button" class="project-notes-theme-tab ${selectedThemeFilter === 'all' ? 'is-active' : ''}" data-global-note-theme-tab="all">Toutes <span>${total}</span></button>`,
        ...catalog.map((item) =>
          `<button type="button" class="project-notes-theme-tab ${selectedThemeFilter === item.key ? 'is-active' : ''}" data-global-note-theme-tab="${escapeHtml(item.key)}">${escapeHtml(item.label)} <span>${item.count}</span></button>`
        )
      ].join('');

      const toggle = document.getElementById('global-notes-themes-toggle');
      if (!toggle) return;
      const activeCount = selectedThemeFilter === 'all'
        ? catalog.length
        : (catalog.some((item) => item?.key === selectedThemeFilter) ? 1 : 0);
      let badge = toggle.querySelector('.notes-themes-toggle-count');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'notes-themes-toggle-count';
        toggle.appendChild(badge);
      }
      badge.textContent = String(activeCount);
      badge.title = activeCount > 1 ? `${activeCount} thématiques actives` : `${activeCount} thématique active`;
    }

    function bindDom() {
      if (bound) return;
      bound = true;

      document.getElementById('global-notes-theme-tabs')?.addEventListener('click', (event) => {
        const btn = event?.target?.closest?.('[data-global-note-theme-tab]');
        if (!btn) return;
        const key = String(btn.getAttribute('data-global-note-theme-tab') || 'all').trim() || 'all';
        opts.setGlobalNotesThemeFilter?.(key);
        opts.setGlobalNotesPage?.(1);
        opts.renderGlobalNotes?.().catch(() => null);
      });
    }

    return {
      bindDom,
      renderGlobalNotesThemeTabs
    };
  }

  global.TaskMDAGlobalNotesFiltersUI = {
    createModule
  };
}(window));
