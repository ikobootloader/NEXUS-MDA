/* --- taskmda-global-notes-read-inline-edit.js --- */
(function initTaskMdaGlobalNotesReadInlineEdit(global) {
  'use strict';

  function createModule(options) {
    const opts = options || {};
    const state = opts.state || {};
    const actions = opts.actions || {};
    const helpers = opts.helpers || {};

    function ensureGlobalReadInlineQuillUi() {
      const modal = document.getElementById('modal-global-read');
      const contentEl = document.getElementById('global-read-content');
      if (!modal || !contentEl) return null;
      const displayWrap = contentEl.closest('.rounded-xl');
      if (!displayWrap) return null;
      let editWrap = document.getElementById('global-read-inline-editor-wrap');
      let toolbarEl = document.getElementById('global-read-inline-toolbar');
      let editorEl = document.getElementById('global-read-inline-editor');
      if (!editWrap) {
        editWrap = document.createElement('div');
        editWrap.id = 'global-read-inline-editor-wrap';
        editWrap.className = 'hidden rounded-xl border border-slate-200 bg-slate-50 p-3 mb-3';
        editWrap.innerHTML = `
          <div id="global-read-inline-toolbar" class="project-editor-toolbar">
            <button type="button" class="ql-bold" title="Gras"></button>
            <button type="button" class="ql-italic" title="Italique"></button>
            <button type="button" class="ql-underline" title="Souligne"></button>
            <button type="button" class="ql-strike" title="Barre"></button>
            <button type="button" class="ql-list" value="ordered" title="Liste numerotee"></button>
            <button type="button" class="ql-list" value="bullet" title="Liste a puces"></button>
            <button type="button" class="ql-code" title="Code en ligne"></button>
            <button type="button" class="ql-code-block" title="Bloc de code"></button>
            <button type="button" class="ql-link" title="Lien"></button>
            <button type="button" class="ql-clean" title="Nettoyer"></button>
          </div>
          <div id="global-read-inline-editor" class="project-description-editor task-description-editor bg-white rounded-b-lg" style="min-height: 180px;" aria-label="Edition inline de la note globale"></div>
        `;
        displayWrap.insertAdjacentElement('afterend', editWrap);
        toolbarEl = document.getElementById('global-read-inline-toolbar');
        editorEl = document.getElementById('global-read-inline-editor');
      }
      const quill = state.getInlineQuill?.();
      if (window.Quill && editorEl && !quill) {
        const created = new window.Quill(editorEl, {
          theme: 'snow',
          modules: { toolbar: '#global-read-inline-toolbar' }
        });
        state.setInlineQuill?.(created);
      }
      return { modal, contentEl, displayWrap, editWrap, toolbarEl, editorEl };
    }

    function resetGlobalReadInlineEditState() {
      const refs = ensureGlobalReadInlineQuillUi();
      const titleEl = document.getElementById('global-read-title');
      const modal = document.getElementById('modal-global-read');
      state.setInlineEditActive?.(false);
      state.setInlineEditSaving?.(false);
      state.setInlineOriginalTitle?.('');
      state.setInlineOriginalContentHtml?.('');
      if (titleEl) {
        titleEl.removeAttribute('contenteditable');
        titleEl.removeAttribute('spellcheck');
      }
      if (refs?.editWrap) refs.editWrap.classList.add('hidden');
      if (refs?.displayWrap) refs.displayWrap.classList.remove('hidden');
      modal?.removeAttribute('data-inline-edit');
    }

    function isElementInsideGlobalReadInlineEdit(el) {
      if (!(el instanceof HTMLElement)) return false;
      if (el.id === 'global-read-title') return true;
      return !!el.closest('#global-read-inline-editor-wrap');
    }

    function placeCaretAtEndOfElement(element) {
      if (!element || typeof element.focus !== 'function') return;
      element.focus();
      try {
        const selection = window.getSelection?.();
        if (!selection) return;
        const range = document.createRange();
        range.selectNodeContents(element);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      } catch (_) {}
    }

    function canInlineEditGlobalReadModal() {
      const modal = document.getElementById('modal-global-read');
      if (!modal || modal.classList.contains('hidden')) return false;
      if (String(modal.dataset.canManage || '0') !== '1') return false;
      if (!String(state.getGlobalReadModalNoteId?.() || '').trim()) return false;
      return true;
    }

    function beginGlobalReadInlineEdit(target = 'content') {
      if (!canInlineEditGlobalReadModal()) return;
      const refs = ensureGlobalReadInlineQuillUi();
      const titleEl = document.getElementById('global-read-title');
      if (!refs || !titleEl) return;
      if (!state.getInlineEditActive?.()) {
        state.setInlineOriginalTitle?.(String(titleEl.textContent || '').trim());
        state.setInlineOriginalContentHtml?.(String(refs.contentEl.innerHTML || ''));
      }
      state.setInlineEditActive?.(true);
      refs.modal.dataset.inlineEdit = '1';
      titleEl.setAttribute('contenteditable', 'true');
      titleEl.setAttribute('spellcheck', 'true');
      refs.displayWrap.classList.add('hidden');
      refs.editWrap.classList.remove('hidden');
      const quill = state.getInlineQuill?.();
      if (quill) {
        quill.enable(true);
        quill.clipboard.dangerouslyPasteHTML(state.getInlineOriginalContentHtml?.() || '<p><br></p>');
      } else if (refs.editorEl) {
        refs.editorEl.innerHTML = state.getInlineOriginalContentHtml?.() || '<p><br></p>';
        refs.editorEl.setAttribute('contenteditable', 'true');
      }
      if (String(target || '') === 'title') {
        placeCaretAtEndOfElement(titleEl);
      } else if (quill) {
        quill.focus();
      } else {
        placeCaretAtEndOfElement(refs.editorEl);
      }
    }

    function cancelGlobalReadInlineEdit(options = {}) {
      if (!state.getInlineEditActive?.()) return;
      const titleEl = document.getElementById('global-read-title');
      const contentEl = document.getElementById('global-read-content');
      if (titleEl) titleEl.textContent = state.getInlineOriginalTitle?.() || 'Note sans titre';
      if (contentEl) contentEl.innerHTML = state.getInlineOriginalContentHtml?.() || '<p>Aucun contenu.</p>';
      resetGlobalReadInlineEditState();
      if (!options?.silent) helpers.showToast?.('Edition annulee');
    }

    async function saveGlobalReadInlineEdit(options = {}) {
      if (!state.getInlineEditActive?.() || state.getInlineEditSaving?.()) return false;
      const noteId = String(state.getGlobalReadModalNoteId?.() || '').trim();
      if (!noteId) return false;
      const titleEl = document.getElementById('global-read-title');
      if (!titleEl) return false;
      const note = await actions.getGlobalNoteById?.(noteId);
      if (!note) return false;
      if (!actions.canManageGlobalNote?.(note)) {
        helpers.showToast?.('Action non autorisee');
        return false;
      }

      const nextTitle = String(titleEl.textContent || '').trim();
      const quill = state.getInlineQuill?.();
      const rawHtml = quill
        ? String(quill.root?.innerHTML || '').trim()
        : String(document.getElementById('global-read-inline-editor')?.innerHTML || '').trim();
      const nextContentHtml = helpers.sanitizeProjectDescriptionHtml?.(rawHtml || '<p><br></p>') || '<p><br></p>';
      const nextContent = (helpers.getProjectDescriptionPlainText?.(nextContentHtml) || '').trim();
      const prevTitle = String(note.title || '').trim();
      const prevContentHtml = helpers.sanitizeProjectDescriptionHtml?.(
        String(note.contentHtml || '').trim() || helpers.plainTextToRichHtml?.(String(note.content || '').trim()) || ''
      ) || '';
      const prevContent = (helpers.getProjectDescriptionPlainText?.(prevContentHtml) || '').trim();
      const titleChanged = nextTitle !== prevTitle;
      const contentChanged = nextContentHtml !== prevContentHtml || nextContent !== prevContent;
      if (!titleChanged && !contentChanged) {
        resetGlobalReadInlineEditState();
        return false;
      }

      state.setInlineEditSaving?.(true);
      try {
        const updated = {
          ...note,
          title: nextTitle,
          content: nextContent,
          contentHtml: nextContentHtml,
          updatedAt: Date.now()
        };
        await actions.saveGlobalNote?.(updated);
        await actions.syncGlobalNoteFeed?.(updated);
        if (actions.isGlobalFeedView?.()) {
          await actions.renderGlobalFeed?.();
        }
        actions.setGlobalNotesFocusNoteId?.(noteId);
        await actions.renderGlobalNotes?.();
        await actions.openGlobalNoteReadModal?.(noteId);
        if (!options?.silent) helpers.showToast?.('Note mise a jour');
        return true;
      } catch (error) {
        console.error('Erreur sauvegarde note globale inline:', error);
        helpers.showToast?.(`Erreur de sauvegarde: ${error.message || 'inconnue'}`);
        return false;
      } finally {
        state.setInlineEditSaving?.(false);
      }
    }

    return {
      ensureGlobalReadInlineQuillUi,
      resetGlobalReadInlineEditState,
      isElementInsideGlobalReadInlineEdit,
      placeCaretAtEndOfElement,
      canInlineEditGlobalReadModal,
      beginGlobalReadInlineEdit,
      cancelGlobalReadInlineEdit,
      saveGlobalReadInlineEdit
    };
  }

  global.TaskMDAGlobalNotesReadInlineEdit = {
    createModule
  };
}(window));
