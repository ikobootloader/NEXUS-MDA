/* --- taskmda-global-read-actions-ui.js --- */
(function initTaskMdaGlobalReadActionsUiModule(global) {
  // Module role: UI/domain boundary for TaskMdaGlobalReadActionsUiModule.
  'use strict';

  function createModule(options) {
    // Injected dependencies: callbacks/state accessors provided by taskmda-team orchestrator.
    const opts = options || {};
    let bound = false;

    function bindDom() {
      // DOM bindings are attached once; module remains idempotent across repeated init calls.
      if (bound) return;
      bound = true;

      document.getElementById('btn-close-global-read-modal')?.addEventListener('click', () => {
        opts.closeGlobalReadModal?.();
      });

      document.getElementById('btn-global-read-edit')?.addEventListener('click', () => {
        const noteId = String(document.getElementById('btn-global-read-edit')?.getAttribute('data-note-id') || '').trim();
        if (!noteId) return;
        opts.closeGlobalReadModal?.();
        opts.openGlobalNoteEditor?.(noteId)?.catch?.(() => null);
      });

      document.getElementById('btn-global-read-delete')?.addEventListener('click', async () => {
        const noteId = String(document.getElementById('btn-global-read-delete')?.getAttribute('data-note-id') || '').trim();
        if (!noteId) return;
        await opts.deleteGlobalNote?.(noteId);
        opts.closeGlobalReadModal?.();
      });

      document.getElementById('btn-global-read-export-menu')?.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const menu = document.getElementById('global-read-export-dropdown');
        const btn = document.getElementById('btn-global-read-export-menu');
        if (!menu || !btn) return;
        const willOpen = menu.classList.contains('hidden');
        menu.classList.toggle('hidden', !willOpen);
        btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      });

      document.getElementById('btn-global-read-export-html')?.addEventListener('click', async () => {
        const noteId = String(document.getElementById('btn-global-read-export-html')?.getAttribute('data-note-id') || '').trim();
        if (!noteId) return;
        await opts.exportGlobalNote?.(noteId, 'html');
      });

      document.getElementById('btn-global-read-export-pdf')?.addEventListener('click', async () => {
        const noteId = String(document.getElementById('btn-global-read-export-pdf')?.getAttribute('data-note-id') || '').trim();
        if (!noteId) return;
        await opts.exportGlobalNoteAsPdf?.(noteId);
      });

      document.getElementById('btn-global-read-export-docx')?.addEventListener('click', async () => {
        const noteId = String(document.getElementById('btn-global-read-export-docx')?.getAttribute('data-note-id') || '').trim();
        if (!noteId) return;
        await opts.exportGlobalNoteAsDocx?.(noteId);
      });

      document.getElementById('btn-global-read-export-txt')?.addEventListener('click', async () => {
        const noteId = String(document.getElementById('btn-global-read-export-txt')?.getAttribute('data-note-id') || '').trim();
        if (!noteId) return;
        await opts.exportGlobalNote?.(noteId, 'txt');
      });
    }

    return {
      bindDom
    };
  }

  global.TaskMDAGlobalReadActionsUI = {
    createModule
  };
}(window));
