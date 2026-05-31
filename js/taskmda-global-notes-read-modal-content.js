/* --- taskmda-global-notes-read-modal-content.js --- */
(function initTaskMdaGlobalNotesReadModalContent(global) {
  'use strict';

  function createModule(options) {
    const opts = options || {};
    const state = opts.state || {};
    const actions = opts.actions || {};
    const helpers = opts.helpers || {};

    async function openGlobalNoteReadModal(noteId = '') {
      await actions.migrateLegacyInlineGlobalNoteAttachmentsOnce?.();
      const notesShared = global.TaskMDANotesShared;
      const nid = String(noteId || '').trim();
      if (!nid) return;
      const note = await actions.getGlobalNoteById?.(nid);
      if (!note) {
        helpers.showToast?.('Note introuvable');
        return;
      }
      const modal = document.getElementById('modal-global-read');
      const titleEl = document.getElementById('global-read-title');
      const metaEl = document.getElementById('global-read-meta');
      const badgesEl = document.getElementById('global-read-badges');
      const contentEl = document.getElementById('global-read-content');
      const tagsEl = document.getElementById('global-read-tags');
      const linksEl = document.getElementById('global-read-links');
      const editBtn = document.getElementById('btn-global-read-edit');
      const deleteBtn = document.getElementById('btn-global-read-delete');
      if (!modal || !titleEl || !metaEl || !badgesEl || !contentEl || !linksEl) return;

      const identity = actions.resolveKnownUserIdentity?.(
        String(note.createdBy || ''),
        String(note.createdByName || helpers.fallbackDirectoryName?.(note.createdBy || ''))
      );
      const author = String(identity?.name || note.createdByName || helpers.fallbackDirectoryName?.(note.createdBy || '')).trim() || 'Auteur';
      const visibility = helpers.normalizeGlobalNoteVisibility?.(note.visibility) || 'private';
      const theme = String(note.theme || '').trim();
      const tags = Array.isArray(note.tags) ? note.tags.map((tag) => String(tag || '').trim()).filter(Boolean) : [];
      const rawContentHtml = String(note.contentHtml || '').trim() || helpers.plainTextToRichHtml?.(String(note.content || '').trim()) || '';
      const contentHtml = helpers.sanitizeRichTextHtmlPreserve?.(helpers.stripInlineAttachedDocumentBlocksFromHtml?.(rawContentHtml) || rawContentHtml) || rawContentHtml;
      const inlineDocIds = new Set(actions.extractLinkedGlobalDocIdsFromHtml?.(rawContentHtml) || []);
      const storedLinkedDocIds = new Set(
        (Array.isArray(note.linkedDocIds) ? note.linkedDocIds : [])
          .map((id) => String(id || '').trim())
          .filter(Boolean)
      );
      const linkedDocs = (await actions.getAllGlobalDocs?.() || [])
        .filter((doc) => {
          const docId = String(doc?.id || '').trim();
          if (!docId) return false;
          if (inlineDocIds.has(docId) || storedLinkedDocIds.has(docId)) return true;
          return Array.isArray(doc?.linkedNoteIds) && doc.linkedNoteIds.map((id) => String(id || '').trim()).includes(nid);
        })
        .map((doc) => ({ id: String(doc?.id || '').trim(), name: String(doc?.name || 'Document').trim() || 'Document' }))
        .filter((doc) => doc.id);

      const titleText = String(note.title || '').trim() || 'Note sans titre';
      const metaText = `${author} • ${new Date(Number(note.updatedAt || note.createdAt || Date.now())).toLocaleString('fr-FR')}`;
      const badgeItems = [
        { label: visibility === 'transverse' ? 'Transverse' : 'Privee', className: visibility === 'transverse' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700' },
        note.shareToGlobalFeed ? { label: 'Dans le fil', className: 'bg-indigo-100 text-indigo-700' } : null,
        theme ? { label: theme, className: 'bg-emerald-100 text-emerald-700' } : null
      ].filter(Boolean);
      const badgesHtml = notesShared?.renderBadgeChips ? notesShared.renderBadgeChips(badgeItems) : '';
      const tagsHtml = notesShared?.renderTagChips ? notesShared.renderTagChips(tags, 'Aucun tag') : '<span class="text-xs text-slate-500">Aucun tag</span>';
      const docsHtml = linkedDocs.length
        ? `<div class="mt-2 flex flex-col gap-2">${linkedDocs.map((doc) => {
            const ref = actions.encodeDocumentPreviewRef?.({
              sourceType: 'standalone',
              id: doc.id,
              sourceProjectName: 'Hors projet'
            }) || '';
            if (notesShared?.renderInlineDocLinks) {
              return notesShared.renderInlineDocLinks([{
                name: doc.name,
                previewPayload: { refPayload: ref },
                downloadPayload: { refPayload: ref },
                deletePayload: actions.canManageGlobalNote?.(note) ? { noteId: nid, docId: doc.id } : null
              }], { previewLabel: 'Ouvrir', downloadLabel: 'Telecharger' });
            }
            return `<div class="flex flex-wrap items-center gap-2"><span class="inline-flex text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">${helpers.escapeHtml?.(doc.name) || doc.name}</span></div>`;
          }).join('')}</div>`
        : '<p class="text-xs text-slate-500 mt-1">Aucun document lie</p>';
      const linksHtml = `<p class="text-xs text-slate-500">Aucune tache liee</p>${docsHtml}`;

      if (notesShared?.applyReadModalContent) {
        notesShared.applyReadModalContent({
          titleId: 'global-read-title',
          titleText,
          metaId: 'global-read-meta',
          metaText,
          badgesId: 'global-read-badges',
          badgesHtml,
          contentId: 'global-read-content',
          contentHtml: contentHtml || '<p>Aucun contenu.</p>',
          tagsId: 'global-read-tags',
          tagsHtml,
          linksId: 'global-read-links',
          linksHtml
        });
        notesShared.bindInlineDocLinkActions?.('global-read-links', linkedDocs.map((doc) => {
          const ref = actions.encodeDocumentPreviewRef?.({
            sourceType: 'standalone',
            id: doc.id,
            sourceProjectName: 'Hors projet'
          }) || '';
          return {
            previewPayload: { refPayload: ref },
            downloadPayload: { refPayload: ref },
            deletePayload: actions.canManageGlobalNote?.(note) ? { noteId: nid, docId: doc.id } : null
          };
        }), {
          onPreview(payload) {
            const ref = String(payload?.refPayload || '').trim();
            if (!ref) return;
            actions.openDocumentPreviewByRef?.(ref);
          },
          onDownload(payload) {
            const ref = String(payload?.refPayload || '').trim();
            if (!ref) return;
            actions.downloadDocumentByRef?.(ref);
          },
          onDelete(payload) {
            const noteIdValue = String(payload?.noteId || '').trim();
            const docIdValue = String(payload?.docId || '').trim();
            if (!noteIdValue || !docIdValue) return;
            actions.deleteGlobalNoteLinkedDocument?.(noteIdValue, docIdValue);
          }
        });
      } else {
        titleEl.textContent = titleText;
        metaEl.textContent = metaText;
        badgesEl.innerHTML = badgesHtml;
        contentEl.innerHTML = contentHtml || '<p>Aucun contenu.</p>';
        if (tagsEl) tagsEl.innerHTML = tagsHtml;
        linksEl.innerHTML = linksHtml;
      }

      const canManage = !!actions.canManageGlobalNote?.(note);
      modal.dataset.canManage = canManage ? '1' : '0';
      if (editBtn) {
        editBtn.classList.toggle('hidden', !canManage);
        editBtn.setAttribute('data-note-id', nid);
      }
      if (deleteBtn) {
        deleteBtn.classList.toggle('hidden', !canManage);
        deleteBtn.setAttribute('data-note-id', nid);
      }
      const exportButtons = ['btn-global-read-export-html', 'btn-global-read-export-pdf', 'btn-global-read-export-docx', 'btn-global-read-export-txt'];
      exportButtons.forEach((id) => document.getElementById(id)?.setAttribute('data-note-id', nid));
      state.setGlobalReadModalLastFocusedElement?.(document.activeElement instanceof HTMLElement ? document.activeElement : null);
      state.setGlobalReadModalNoteId?.(nid);
      actions.resetGlobalReadInlineEditState?.();

      notesShared?.openModal?.('modal-global-read');
      if (!notesShared) {
        modal.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
      }
    }

    function closeGlobalReadModal() {
      actions.cancelGlobalReadInlineEdit?.({ silent: true });
      global.TaskMDANotesShared?.closeModal?.('modal-global-read');
      const modal = document.getElementById('modal-global-read');
      if (modal) {
        modal.removeAttribute('data-inline-edit');
        modal.removeAttribute('data-can-manage');
      }
      if (!global.TaskMDANotesShared?.closeModal && modal) {
        modal.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
      }
      state.setGlobalReadModalNoteId?.('');
      const focusBack = state.getGlobalReadModalLastFocusedElement?.();
      state.setGlobalReadModalLastFocusedElement?.(null);
      if (focusBack && typeof focusBack.focus === 'function' && document.contains(focusBack)) {
        requestAnimationFrame(() => {
          try { focusBack.focus(); } catch (_) {}
        });
      }
    }

    return {
      openGlobalNoteReadModal,
      closeGlobalReadModal
    };
  }

  global.TaskMDAGlobalNotesReadModalContent = {
    createModule
  };
}(window));
