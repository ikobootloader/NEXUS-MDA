(function initTaskMdaNotesSharedModule(global) {
  'use strict';

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = String(value == null ? '' : value);
  }

  function setValue(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = String(value == null ? '' : value);
  }

  function setChecked(id, checked) {
    const el = document.getElementById(id);
    if (!el) return;
    el.checked = !!checked;
  }

  function setDisabled(id, disabled) {
    const el = document.getElementById(id);
    if (!el) return;
    el.disabled = !!disabled;
  }

  function setHidden(id, hidden) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('hidden', !!hidden);
  }

  function setHtml(id, html) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = String(html == null ? '' : html);
  }

  function setDataNoteId(id, noteId) {
    const el = document.getElementById(id);
    if (!el) return;
    el.setAttribute('data-note-id', String(noteId || '').trim());
  }

  function setJsonData(el, key, payload) {
    if (!el || !key) return;
    if (!payload) {
      el.removeAttribute(`data-${key}`);
      return;
    }
    try {
      el.setAttribute(`data-${key}`, encodeURIComponent(JSON.stringify(payload)));
    } catch (_) {
      el.removeAttribute(`data-${key}`);
    }
  }

  function encodePayloadAttr(payload) {
    if (!payload) return '';
    try {
      return encodeURIComponent(JSON.stringify(payload));
    } catch (_) {
      return '';
    }
  }

  function readJsonData(el, key) {
    if (!el || !key) return null;
    const raw = String(el.getAttribute(`data-${key}`) || '').trim();
    if (!raw) return null;
    try {
      return JSON.parse(decodeURIComponent(raw));
    } catch (_) {
      return null;
    }
  }

  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }

  function applyReadModalContent(config = {}) {
    setText(config.titleId, config.titleText || '');
    setText(config.metaId, config.metaText || '');
    setHtml(config.badgesId, config.badgesHtml || '');
    setHtml(config.contentId, config.contentHtml || '');
    setHtml(config.tagsId, config.tagsHtml || '');
    setHtml(config.linksId, config.linksHtml || '');
  }

  function applyEditorForm(config = {}) {
    setText(config.modalTitleId, config.modalTitle || '');
    setValue(config.titleInputId, config.title || '');
    setValue(config.themeInputId, config.theme || '');
    setValue(config.tagsInputId, config.tags || '');
    setChecked(config.visibilityInputId, config.isVisible === true);
    setChecked(config.shareInputId, config.share === true);
    setHidden(config.deleteBtnId, config.showDelete !== true);
    setHidden(config.saveBtnId, config.showSave !== true);
    setHidden(config.digestBtnId, config.showDigest !== true);
    setHidden(config.attachBtnId, config.showAttach !== true);
    setDisabled(config.titleInputId, config.disabled === true);
    setDisabled(config.themeInputId, config.disabled === true);
    setDisabled(config.tagsInputId, config.disabled === true);
    setDisabled(config.visibilityInputId, config.disabled === true);
    setDisabled(config.shareInputId, config.disabled === true);
    setDisabled(config.attachBtnId, config.disabled === true);
  }

  function renderBadgeChips(items = []) {
    return (Array.isArray(items) ? items : [])
      .map((item) => {
        const label = String(item?.label || '').trim();
        if (!label) return '';
        const className = String(item?.className || 'bg-slate-100 text-slate-700').trim();
        return `<span class="inline-flex text-[10px] px-2 py-1 rounded-full ${className} font-semibold">${escapeHtml(label)}</span>`;
      })
      .filter(Boolean)
      .join('');
  }

  function renderTagChips(tags = [], emptyLabel = 'Aucun tag') {
    const safeTags = (Array.isArray(tags) ? tags : [])
      .map((tag) => String(tag || '').trim())
      .filter(Boolean);
    if (!safeTags.length) return `<span class="text-xs text-slate-500">${escapeHtml(emptyLabel)}</span>`;
    return safeTags
      .map((tag) => `<span class="inline-flex text-[10px] px-2 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">#${escapeHtml(tag)}</span>`)
      .join('');
  }

  function renderInlineDocLinks(docs = [], options = {}) {
    const previewLabel = String(options.previewLabel || 'Aperçu');
    const downloadLabel = String(options.downloadLabel || 'Télécharger');
    return (Array.isArray(docs) ? docs : [])
      .map((doc, docIndex) => {
        const name = String(doc?.name || 'Document').trim() || 'Document';
        const hasPreview = !!doc?.previewPayload;
        const hasDownload = !!doc?.downloadPayload;
        const hasDelete = !!doc?.deletePayload;
        const previewPayload = hasPreview ? encodePayloadAttr(doc.previewPayload) : '';
        const downloadPayload = hasDownload ? encodePayloadAttr(doc.downloadPayload) : '';
        const deletePayload = hasDelete ? encodePayloadAttr(doc.deletePayload) : '';
        return `
          <div class="inline-flex items-center gap-1 mr-2 mb-1">
            <span class="inline-flex items-center text-xs text-slate-700">📎 ${escapeHtml(name)}</span>
            ${hasPreview ? `<button type="button" class="workspace-action-inline" data-action-kind="preview" data-action-label="${escapeHtml(previewLabel)}" data-doc-action="preview" data-doc-index="${docIndex}" data-preview-payload="${previewPayload}">${escapeHtml(previewLabel)}</button>` : ''}
            ${hasDownload ? `<button type="button" class="workspace-action-inline" data-action-kind="export" data-action-label="${escapeHtml(downloadLabel)}" data-doc-action="download" data-doc-index="${docIndex}" data-download-payload="${downloadPayload}">${escapeHtml(downloadLabel)}</button>` : ''}
            ${hasDelete ? `<button type="button" class="workspace-action-inline" data-action-kind="danger" data-action-label="Supprimer le document" data-doc-action="delete" data-doc-index="${docIndex}" data-delete-payload="${deletePayload}">Supprimer</button>` : ''}
          </div>
        `;
      })
      .join('');
  }

  function bindInlineDocLinkActions(containerId, docs, handlers = {}) {
    const host = document.getElementById(containerId);
    if (!host) return;
    const safeDocs = Array.isArray(docs) ? docs : [];
    host.querySelectorAll('[data-doc-action]').forEach((btn) => {
      const docIndex = Number.parseInt(String(btn.getAttribute('data-doc-index') || '-1'), 10);
      const doc = Number.isInteger(docIndex) && docIndex >= 0 ? (safeDocs[docIndex] || null) : null;
      const hasEmbeddedPayload =
        btn.hasAttribute('data-preview-payload')
        || btn.hasAttribute('data-download-payload')
        || btn.hasAttribute('data-delete-payload');
      if (hasEmbeddedPayload || !doc) return;
      setJsonData(btn, 'preview-payload', doc.previewPayload || null);
      setJsonData(btn, 'download-payload', doc.downloadPayload || null);
      setJsonData(btn, 'delete-payload', doc.deletePayload || null);
    });
    if (host.__taskMdaInlineDocBound) return;
    host.addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target.closest('[data-doc-action]') : null;
      if (!target) return;
      const action = String(target.getAttribute('data-doc-action') || '').trim();
      if (!action) return;
      event.preventDefault();
      event.stopPropagation();
      if (action === 'preview' && typeof handlers.onPreview === 'function') {
        handlers.onPreview(readJsonData(target, 'preview-payload'));
      } else if (action === 'download' && typeof handlers.onDownload === 'function') {
        handlers.onDownload(readJsonData(target, 'download-payload'));
      } else if (action === 'delete' && typeof handlers.onDelete === 'function') {
        handlers.onDelete(readJsonData(target, 'delete-payload'));
      }
    });
    host.__taskMdaInlineDocBound = true;
  }

  global.TaskMDANotesShared = {
    setText,
    setValue,
    setChecked,
    setDisabled,
    setHidden,
    setHtml,
    setDataNoteId,
    openModal,
    closeModal,
    applyReadModalContent,
    applyEditorForm,
    renderBadgeChips,
    renderTagChips,
    renderInlineDocLinks,
    bindInlineDocLinkActions
  };
}(window));
