/* --- taskmda-global-read-inline-ui.js --- */
(function initTaskMdaGlobalReadInlineUiModule(global) {
  // Module role: UI/domain boundary for TaskMdaGlobalReadInlineUiModule.
  'use strict';

  function createModule(options) {
    // Injected dependencies: callbacks/state accessors provided by taskmda-team orchestrator.
    const opts = options || {};
    let bound = false;

    function bindDom() {
      // DOM bindings are attached once; module remains idempotent across repeated init calls.
      if (bound) return;
      bound = true;

      const globalReadModal = document.getElementById('modal-global-read');
      if (globalReadModal && globalReadModal.dataset.inlineShortcutsBound !== '1') {
        globalReadModal.dataset.inlineShortcutsBound = '1';
        globalReadModal.addEventListener('keydown', async (event) => {
          if (globalReadModal.classList.contains('hidden')) return;
          const key = String(event.key || '').toLowerCase();
          if ((event.ctrlKey || event.metaKey) && key === 's') {
            event.preventDefault();
            await opts.saveGlobalReadInlineEdit?.();
            return;
          }
          if (opts.isGlobalReadInlineEditActive?.() && key === 'enter' && event.target?.id === 'global-read-title') {
            event.preventDefault();
            await opts.saveGlobalReadInlineEdit?.();
            return;
          }
          if (key === 'escape') {
            event.preventDefault();
            event.stopPropagation();
            if (opts.isGlobalReadInlineEditActive?.()) {
              opts.cancelGlobalReadInlineEdit?.();
              return;
            }
            opts.closeGlobalReadModal?.();
          }
        });
      }

      document.getElementById('global-read-title')?.addEventListener('click', () => {
        opts.beginGlobalReadInlineEdit?.('title');
      });
      document.getElementById('global-read-content')?.addEventListener('click', () => {
        opts.beginGlobalReadInlineEdit?.('content');
      });
      document.getElementById('global-read-title')?.addEventListener('blur', async () => {
        if (!opts.isGlobalReadInlineEditActive?.()) return;
        setTimeout(async () => {
          const active = document.activeElement;
          if (opts.isElementInsideGlobalReadInlineEdit?.(active)) return;
          await opts.saveGlobalReadInlineEdit?.({ silent: true });
        }, 0);
      });
      document.addEventListener('focusout', (event) => {
        if (!opts.isGlobalReadInlineEditActive?.()) return;
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        if (!target.closest('#global-read-inline-editor-wrap')) return;
        setTimeout(async () => {
          const active = document.activeElement;
          if (opts.isElementInsideGlobalReadInlineEdit?.(active)) return;
          await opts.saveGlobalReadInlineEdit?.({ silent: true });
        }, 0);
      }, true);
    }

    return {
      bindDom
    };
  }

  global.TaskMDAGlobalReadInlineUI = {
    createModule
  };
}(window));
