/* --- taskmda-global-notes-card-builder.js --- */
(function initTaskMdaGlobalNotesCardBuilder(global) {
  'use strict';

  class TaskMdaGlobalNotesCardBuilder {
    constructor(deps) {
      const input = deps || {};
      this.state = input.state || {};
      this.actions = input.actions || {};
      this.helpers = input.helpers || {};
    }

    build(note, options = {}) {
      const notesShared = global.TaskMDANotesShared;
      const canManage = !!options.canManage;
      const bulkSelectionMode = !!options.bulkSelectionMode;
      const isSelectedForBulkDelete = !!options.isSelectedForBulkDelete;
      const author = String(options.authorName || note.createdByName || this.helpers.fallbackDirectoryName?.(note.createdBy || '') || 'Auteur');
      const visibility = this.helpers.normalizeGlobalNoteVisibility?.(note.visibility) || 'private';
      const theme = String(note.theme || '').trim();
      const tags = Array.isArray(note.tags) ? note.tags.map((tag) => String(tag || '').trim()).filter(Boolean) : [];
      const linkedDocs = Array.isArray(options.linkedDocs) ? options.linkedDocs : [];
      const isFavorite = Number(note.favoriteAt || 0) > 0;
      const rawContentHtml = String(note.contentHtml || '').trim() || this.helpers.plainTextToRichHtml?.(String(note.content || '').trim()) || '';
      const cleanedContentHtml = this.helpers.sanitizeRichTextHtmlPreserve?.(this.helpers.stripInlineAttachedDocumentBlocksFromHtml?.(rawContentHtml) || rawContentHtml) || rawContentHtml;
      const previewText = (this.helpers.getProjectDescriptionPlainText?.(cleanedContentHtml || this.helpers.plainTextToRichHtml?.(String(note.content || '').trim()) || '') || '')
        .replace(/\s+/g, ' ')
        .trim();
      const focusNoteId = String(this.state.getFocusNoteId?.() || '').trim();
      const isFocused = focusNoteId === String(note.noteId || '').trim();
      const escapeHtml = this.helpers.escapeHtml || ((value) => String(value || ''));
      return `
        <article id="global-note-${escapeHtml(note.noteId)}" class="global-note-card rounded-xl border ${isFocused ? 'border-blue-400 shadow-[0_0_0_2px_rgba(59,130,246,0.14)]' : 'border-slate-200'} bg-white p-4 cursor-pointer ${isSelectedForBulkDelete ? 'is-bulk-selected' : ''}" onclick="openGlobalNoteReadModal('${escapeHtml(note.noteId)}')">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                ${bulkSelectionMode ? `
                  <label class="taskmda-bulk-checkbox-wrap" onclick="event.stopPropagation()">
                    <input type="checkbox" class="taskmda-bulk-checkbox-input" data-note-id="${escapeHtml(note.noteId)}" ${isSelectedForBulkDelete ? 'checked' : ''} ${canManage ? '' : 'disabled'} onchange="toggleGlobalNoteBulkSelection('${escapeHtml(note.noteId)}', this.checked)" aria-label="Selectionner la note ${escapeHtml(note.title || '')}">
                    <span class="taskmda-bulk-checkbox-label">Selection</span>
                  </label>
                ` : ''}
                <span class="inline-flex text-[10px] px-2 py-1 rounded-full ${visibility === 'transverse' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'} font-semibold">${visibility === 'transverse' ? 'Transverse' : 'Privee'}</span>
                ${note.shareToGlobalFeed ? '<span class="inline-flex text-[10px] px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 font-semibold">Dans le fil</span>' : ''}
                ${isFavorite ? '<span class="inline-flex text-[10px] px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-semibold">Favori</span>' : ''}
                ${linkedDocs.length > 0 ? `<span class="inline-flex text-[10px] px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 font-semibold">${linkedDocs.length} document(s) lie(s)</span>` : ''}
                ${theme ? `<span class="inline-flex text-[10px] px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold">${escapeHtml(theme)}</span>` : ''}
              </div>
              <h4 class="mt-2 text-base font-bold text-slate-800">${escapeHtml(note.title || 'Note sans titre')}</h4>
              <p class="mt-1 text-xs text-slate-500">${escapeHtml(author)} • ${new Date(Number(note.createdAt || Date.now())).toLocaleString('fr-FR')}</p>

              <div class="collapsible-wrapper">
                <div class="collapsible-content is-collapsed">
                  <div class="mt-3 ql-snow">
                    <div class="ql-editor p-0 text-sm text-slate-600 markdown-content" style="min-height: auto; overflow-y: hidden; cursor: inherit;">
                      ${cleanedContentHtml || this.helpers.plainTextToRichHtml?.(note.content || 'Aucun contenu.') || ''}
                    </div>
                  </div>
                </div>
                <button type="button" class="collapsible-toggle hidden" ${previewText.length ? `title="${escapeHtml(previewText.slice(0, 160))}"` : ''}>
                  <span class="label">Afficher le descriptif</span>
                </button>
              </div>

              ${tags.length ? `<div class="mt-3 flex flex-wrap gap-1">${tags.map((tag) => `<span class="inline-flex text-[10px] px-2 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">#${escapeHtml(tag)}</span>`).join('')}</div>` : ''}
              ${linkedDocs.length ? `
                <div class="mt-3 note-linked-docs-block">
                  <p class="text-xs font-semibold text-slate-600 mb-1">Documents lies (${linkedDocs.length})</p>
                  <div class="flex flex-wrap items-center gap-2">
                    ${linkedDocs.slice(0, 4).map((doc) => {
                      const ref = this.actions.encodeDocumentPreviewRef?.({
                        sourceType: 'standalone',
                        id: doc.id,
                        sourceProjectName: 'Hors projet'
                      }) || '';
                      if (notesShared?.renderInlineDocLinks) {
                        return notesShared.renderInlineDocLinks([{
                          name: String(doc.name || 'Document'),
                          previewPayload: { refPayload: ref },
                          downloadPayload: { refPayload: ref }
                        }]);
                      }
                      return `<span class="inline-flex text-[10px] px-2 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">${escapeHtml(String(doc.name || 'Document'))}</span>`;
                    }).join('')}
                    ${linkedDocs.length > 4 ? `<span class="inline-flex text-[10px] px-2 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">+${linkedDocs.length - 4}</span>` : ''}
                  </div>
                </div>
              ` : ''}
            </div>
            ${canManage ? `
              <div class="flex items-center gap-1" onclick="event.stopPropagation();">
                <button type="button" class="task-action-btn" data-action-kind="edit" data-action-label="Modifier la note" aria-label="Modifier la note" title="Modifier" onclick="openGlobalNoteEditor('${escapeHtml(note.noteId)}')"><span class="material-symbols-outlined taskmda-action-icon" aria-hidden="true">edit</span></button>
                <button type="button" class="task-action-btn task-action-btn-subtle" data-action-kind="manage" data-action-label="${isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}" aria-label="${isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}" title="${isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}" onclick="toggleGlobalNoteFavorite('${escapeHtml(note.noteId)}')"><span class="material-symbols-outlined taskmda-action-icon" aria-hidden="true">tune</span></button>
                <button type="button" class="task-action-btn task-action-btn-subtle" data-action-kind="notify" data-action-label="Publier dans le fil" aria-label="Publier dans le fil" title="${note.shareToGlobalFeed ? 'Retirer du fil' : 'Publier dans le fil'}" onclick="toggleGlobalNoteFeedPublish('${escapeHtml(note.noteId)}')"><span class="material-symbols-outlined taskmda-action-icon" aria-hidden="true">mail</span></button>
                <button type="button" class="task-action-btn task-action-btn-subtle" data-action-kind="open" data-action-label="Ouvrir la note" aria-label="Ouvrir la note" title="Ouvrir" onclick="openGlobalNoteReadModal('${escapeHtml(note.noteId)}')"><span class="material-symbols-outlined taskmda-action-icon" aria-hidden="true">sync_alt</span></button>
                <div class="relative inline-block">
                  <button type="button" class="task-action-btn task-action-btn-subtle" data-action-kind="export" data-action-label="Menu d'export" aria-label="Menu d'export" title="Exporter (HTML/PDF/DOCX/TXT)" onclick="toggleGlobalNoteExportMenu('${escapeHtml(note.noteId)}', event)" aria-haspopup="true" aria-expanded="false" id="export-menu-btn-${escapeHtml(note.noteId)}"><span class="material-symbols-outlined taskmda-action-icon" aria-hidden="true">download</span></button>
                  <div id="export-menu-${escapeHtml(note.noteId)}" class="hidden absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-slate-200 z-50 overflow-hidden" role="menu" onclick="event.stopPropagation();">
                    <button type="button" class="export-menu-item w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2" onclick="exportGlobalNote('${escapeHtml(note.noteId)}', 'html'); closeGlobalNoteExportMenu('${escapeHtml(note.noteId)}');" role="menuitem"><span class="material-symbols-outlined" style="font-size: 16px;">code</span>Exporter HTML</button>
                    <button type="button" class="export-menu-item w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2" onclick="exportGlobalNoteAsPdf('${escapeHtml(note.noteId)}'); closeGlobalNoteExportMenu('${escapeHtml(note.noteId)}');" role="menuitem"><span class="material-symbols-outlined" style="font-size: 16px;">picture_as_pdf</span>Exporter PDF</button>
                    <button type="button" class="export-menu-item w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2" onclick="exportGlobalNoteAsDocx('${escapeHtml(note.noteId)}'); closeGlobalNoteExportMenu('${escapeHtml(note.noteId)}');" role="menuitem"><span class="material-symbols-outlined" style="font-size: 16px;">description</span>Exporter DOCX</button>
                    <button type="button" class="export-menu-item w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2" onclick="exportGlobalNote('${escapeHtml(note.noteId)}', 'txt'); closeGlobalNoteExportMenu('${escapeHtml(note.noteId)}');" role="menuitem"><span class="material-symbols-outlined" style="font-size: 16px;">text_snippet</span>Exporter TXT</button>
                  </div>
                </div>
                <button type="button" class="task-action-btn task-action-btn-danger" data-action-kind="danger" data-action-label="Supprimer la note" aria-label="Supprimer la note" title="Supprimer" onclick="deleteGlobalNote('${escapeHtml(note.noteId)}')"><span class="material-symbols-outlined taskmda-action-icon" aria-hidden="true">delete</span></button>
              </div>
            ` : ''}
          </div>
          </div>
        </article>
      `;
    }
  }

  function create(deps) {
    return new TaskMdaGlobalNotesCardBuilder(deps);
  }

  global.TaskMDAGlobalNotesCardBuilder = { create };
}(window));
