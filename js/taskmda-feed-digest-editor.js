(function initTaskMDAFeedDigestEditorModule(global) {
  'use strict';

  function createModule(options = {}) {
    function appendDigestBlocksToRichEditor(editorId, fallbackInputId, digestBlocksHtml = []) {
      const blocks = Array.isArray(digestBlocksHtml) ? digestBlocksHtml.filter(Boolean) : [];
      if (!blocks.length) return false;
      const importedHtml = blocks.join('<p><br></p><hr><p><br></p>');
      const quill = options.getQuillEditor?.(editorId);
      const fallbackInput = document.getElementById(fallbackInputId);
      if (quill) {
        const currentHtml = String(quill.root.innerHTML || '').trim();
        const hasExistingDraft = !!currentHtml && currentHtml !== '<p><br></p>';
        const nextHtml = hasExistingDraft
          ? `${currentHtml}<p><br></p><hr><p><br></p>${importedHtml}`
          : importedHtml;
        quill.clipboard.dangerouslyPasteHTML(nextHtml || '<p><br></p>');
        const len = Math.max(0, quill.getLength() - 1);
        quill.setSelection(len, 0, 'user');
        quill.focus();
        if (fallbackInput) {
          fallbackInput.value = options.sanitizeProjectDescriptionHtml?.(String(quill.root.innerHTML || '')) || '';
        }
        return true;
      }
      if (fallbackInput) {
        const currentValue = String(fallbackInput.value || '').trim();
        const stripped = options.stripHtmlTagsForDigest?.(importedHtml) || '';
        fallbackInput.value = currentValue
          ? `${currentValue}\n\n--------------------\n\n${stripped}`
          : stripped;
        fallbackInput.focus();
        return true;
      }
      return false;
    }

    async function importProjectNoteDigestFromFiles(fileList, optionsOverride = {}) {
      const files = Array.from(fileList || []).filter(Boolean);
      if (!files.length) return;
      const currentMode = options.getGlobalFeedDigestViewMode?.() || 'compact';
      const digestViewMode = options.normalizeGlobalFeedDigestView?.(optionsOverride?.digestView || currentMode, currentMode) || 'compact';
      const digestBlocks = [];
      for (const file of files) {
        try {
          const digest = await options.extractFeedDigestFromFile?.(file);
          const block = options.buildDigestContentHtml?.(digest, file, digestViewMode);
          if (block) digestBlocks.push(block);
        } catch (error) {
          console.warn('Note digest import failed:', error);
          options.showToast?.(`Digest impossible pour ${file?.name || 'fichier'}`);
        }
      }
      if (!digestBlocks.length) return;
      const inserted = appendDigestBlocksToRichEditor('project-note-content-editor', 'project-note-content', digestBlocks);
      if (!inserted) return;
      options.scheduleProjectNoteDraftSave?.();
      options.showToast?.(`${digestBlocks.length} digest importe(s) dans la note.`);
    }

    return {
      appendDigestBlocksToRichEditor,
      importProjectNoteDigestFromFiles
    };
  }

  global.TaskMDAFeedDigestEditor = {
    createModule
  };
}(window));
