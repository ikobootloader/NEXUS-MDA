/* --- taskmda-global-notes-export-menu.js --- */
(function initTaskMdaGlobalNotesExportMenu(global) {
  'use strict';

  function toggleGlobalNoteExportMenu(noteId, event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    const nid = String(noteId || '').trim();
    if (!nid) return;
    const menu = document.getElementById(`export-menu-${nid}`);
    const btn = document.getElementById(`export-menu-btn-${nid}`);
    if (!menu || !btn) return;
    document.querySelectorAll('[id^="export-menu-"]:not([id^="export-menu-btn-"])').forEach((otherMenu) => {
      if (otherMenu.id !== menu.id && !otherMenu.classList.contains('hidden')) {
        otherMenu.classList.add('hidden');
        const otherId = otherMenu.id.replace('export-menu-', '');
        const otherBtn = document.getElementById(`export-menu-btn-${otherId}`);
        if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
      }
    });
    const isHidden = menu.classList.contains('hidden');
    if (isHidden) {
      menu.classList.remove('hidden');
      btn.setAttribute('aria-expanded', 'true');
    } else {
      menu.classList.add('hidden');
      btn.setAttribute('aria-expanded', 'false');
    }
  }

  function closeGlobalNoteExportMenu(noteId) {
    const nid = String(noteId || '').trim();
    if (!nid) return;
    const menu = document.getElementById(`export-menu-${nid}`);
    const btn = document.getElementById(`export-menu-btn-${nid}`);
    if (menu) menu.classList.add('hidden');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  function handleGlobalNotesExportMenuDocumentClick(event) {
    const target = event?.target;
    if (!(target instanceof Element)) return;
    const isMenuButton = target.closest('[id^="export-menu-btn-"]');
    const isMenu = target.closest('[id^="export-menu-"]');
    if (isMenuButton || isMenu) return;
    document.querySelectorAll('[id^="export-menu-"]:not([id^="export-menu-btn-"])').forEach((menu) => {
      if (!menu.classList.contains('hidden')) {
        menu.classList.add('hidden');
        const noteId = menu.id.replace('export-menu-', '');
        const btn = document.getElementById(`export-menu-btn-${noteId}`);
        if (btn) btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  global.TaskMDAGlobalNotesExportMenu = {
    toggleGlobalNoteExportMenu,
    closeGlobalNoteExportMenu,
    handleGlobalNotesExportMenuDocumentClick
  };
}(window));
