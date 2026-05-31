(function initTaskMDAEditorInteropModule(global) {
  'use strict';

  function createModule(options) {
    const opts = options || {};

    function appendDigestBlocksToEditorById(editorId, fallbackInputId, digestBlocks) {
      const safeEditorId = String(editorId || '').trim();
      if (!safeEditorId) return false;
      const safeFallbackId = String(fallbackInputId || '').trim();
      const blocks = Array.isArray(digestBlocks) ? digestBlocks.filter(Boolean) : [];
      if (!blocks.length) return false;

      const inserted = opts.appendDigestBlocksToRichEditor?.(safeEditorId, safeFallbackId, blocks);
      if (inserted) return true;

      const host = document.getElementById(safeEditorId);
      if (!host) return false;
      const importedHtml = blocks.join('<p><br></p><hr><p><br></p>');
      const quillRoot = host.classList.contains('ql-editor')
        ? host
        : host.querySelector('.ql-editor');
      const quillFromDom = quillRoot && window.Quill && typeof window.Quill.find === 'function'
        ? window.Quill.find(quillRoot)
        : null;
      if (quillFromDom && quillFromDom.clipboard) {
        const currentHtml = String(quillFromDom.root?.innerHTML || '').trim();
        const hasExistingDraft = !!currentHtml && currentHtml !== '<p><br></p>';
        const nextHtml = hasExistingDraft
          ? `${currentHtml}<p><br></p><hr><p><br></p>${importedHtml}`
          : importedHtml;
        quillFromDom.clipboard.dangerouslyPasteHTML(nextHtml || '<p><br></p>');
        const len = Math.max(0, quillFromDom.getLength() - 1);
        quillFromDom.setSelection(len, 0, 'user');
        quillFromDom.focus();
        return true;
      }

      if (host.isContentEditable || host.getAttribute('contenteditable') === 'true') {
        host.focus();
        const editorInsertAtCursor = window.TaskMDAEditor?.insertHtmlAtCursor;
        if (typeof editorInsertAtCursor === 'function') {
          const ok = editorInsertAtCursor(importedHtml);
          if (ok) return true;
        }
        host.insertAdjacentHTML('beforeend', importedHtml);
        host.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
      return false;
    }

    async function requestDigestImportForEditor(editorId, fallbackInputId, options) {
      const safeEditorId = String(editorId || '').trim();
      if (!safeEditorId) return false;
      const digestViewMode = opts.normalizeGlobalFeedDigestView?.(
        options?.digestView || opts.pickGlobalFeedDigestImportMode?.(),
        opts.getGlobalFeedDigestViewMode?.()
      );
      const picker = document.createElement('input');
      picker.type = 'file';
      picker.multiple = true;
      picker.accept = '.eml,.msg,.txt,.md,.html,.htm,.pdf,.doc,.docx,.odt,.rtf';
      picker.className = 'hidden';
      document.body.appendChild(picker);

      const files = await new Promise((resolve) => {
        picker.addEventListener('change', () => {
          const selected = Array.from(picker.files || []).filter(Boolean);
          resolve(selected);
        }, { once: true });
        picker.click();
      });
      picker.remove();
      if (!Array.isArray(files) || files.length === 0) return false;

      const digestBlocks = [];
      for (const file of files) {
        try {
          const digest = await opts.extractFeedDigestFromFile?.(file);
          const block = opts.buildDigestContentHtml?.(digest, file, digestViewMode);
          if (block) digestBlocks.push(block);
        } catch (error) {
          console.warn('Editor digest import failed:', error);
          opts.showToast?.(`Digest impossible pour ${file?.name || 'fichier'}`);
        }
      }
      if (!digestBlocks.length) return false;
      const inserted = appendDigestBlocksToEditorById(safeEditorId, fallbackInputId, digestBlocks);
      if (!inserted) {
        opts.showToast?.('Impossible d inserer le digest dans cet editeur');
        return false;
      }

      if (safeEditorId === 'global-feed-editor') {
        await opts.updateGlobalFeedMentionCounter?.();
      }
      if (safeEditorId === 'project-note-content-editor') {
        opts.scheduleProjectNoteDraftSave?.();
      }
      opts.showToast?.(`${digestBlocks.length} digest importe(s) dans l editeur.`);
      return true;
    }

    return {
      appendDigestBlocksToEditorById,
      requestDigestImportForEditor
    };
  }

  global.TaskMDAEditorInterop = {
    createModule
  };
}(window));
