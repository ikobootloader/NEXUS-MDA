(function initTaskMDAGlobalDocRefUtilsModule(global) {
  'use strict';

  function createModule(options = {}) {
    const escapeHtml = options.escapeHtml || ((value) => String(value || ''));
    const encodeDocumentPreviewRef = options.encodeDocumentPreviewRef || (() => '');

    function buildInlineAttachedDocumentHtml(doc = {}) {
      const docId = String(doc?.id || '').trim();
      if (!docId) return '';
      const ref = encodeDocumentPreviewRef({
        sourceType: 'standalone',
        id: docId,
        sourceProjectName: 'Hors projet'
      });
      const label = escapeHtml(String(doc?.name || 'Document').trim() || 'Document');
      const safeRef = escapeHtml(ref);
      const safeDocId = escapeHtml(docId);
      return `
        <p data-doc-id="${safeDocId}">
          <span class="inline-flex items-center gap-2 flex-wrap">
            <span>📎 ${label}</span>
            <a href="#" data-open-doc-ref="${safeRef}" data-doc-id="${safeDocId}" class="workspace-action-inline" data-action-kind="preview" data-action-label="Aperçu">Aperçu</a>
            <a href="#" data-download-doc-ref="${safeRef}" data-doc-id="${safeDocId}" class="workspace-action-inline" data-action-kind="export" data-action-label="Télécharger">Télécharger</a>
          </span>
        </p>
      `;
    }

    function extractLinkedGlobalDocIdsFromHtml(html = '') {
      const source = String(html || '').trim();
      if (!source) return [];
      const wrapper = document.createElement('div');
      wrapper.innerHTML = source;
      const ids = new Set();
      wrapper.querySelectorAll('[data-doc-id]').forEach((node) => {
        const id = String(node.getAttribute('data-doc-id') || '').trim();
        if (id) ids.add(id);
      });
      return Array.from(ids);
    }

    function stripInlineAttachedDocumentBlocksFromHtml(html = '') {
      const source = String(html || '').trim();
      if (!source) return '';
      const wrapper = document.createElement('div');
      wrapper.innerHTML = source;
      wrapper.querySelectorAll('[data-doc-id]').forEach((node) => node.remove());
      wrapper.querySelectorAll('[data-open-doc-ref],[data-download-doc-ref]').forEach((node) => {
        const block = node.closest('p,div,li');
        if (block) block.remove();
      });
      wrapper.querySelectorAll('p,div,li').forEach((node) => {
        const txt = String(node.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
        if (!txt) return;
        if (txt.includes('aperçu') && txt.includes('télécharger') && txt.includes('📎'.toLowerCase())) {
          node.remove();
        }
      });
      return String(wrapper.innerHTML || '').trim();
    }

    return {
      buildInlineAttachedDocumentHtml,
      extractLinkedGlobalDocIdsFromHtml,
      stripInlineAttachedDocumentBlocksFromHtml
    };
  }

  global.TaskMDAGlobalDocRefUtils = {
    createModule
  };
}(window));
