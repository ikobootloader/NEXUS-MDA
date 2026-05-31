/* --- taskmda-global-notes-renderer.js --- */
(function initTaskMdaGlobalNotesRenderer(global) {
  'use strict';

  class TaskMdaGlobalNotesRenderer {
    constructor(deps) {
      const input = deps || {};
      this.state = input.state || {};
      this.actions = input.actions || {};
      this.helpers = input.helpers || {};
      this.buildGlobalNoteCardHtml = typeof input.buildGlobalNoteCardHtml === 'function'
        ? input.buildGlobalNoteCardHtml
        : () => '';
      this.updateGlobalNotesBulkDeleteUi = typeof input.updateGlobalNotesBulkDeleteUi === 'function'
        ? input.updateGlobalNotesBulkDeleteUi
        : () => {};
    }

    async collectGlobalNotesAggregationContext() {
      const allNotesRaw = await this.actions.getAllGlobalNotes?.();
      const notesGlobal = (Array.isArray(allNotesRaw) ? allNotesRaw : []).filter((note) => !Number(note?.archivedAt || 0));
      const aggregatedProjectNotes = [];
      const me = String(this.state.getCurrentUserId?.() || '').trim();
      if (me) {
        const projects = await this.actions.getAllProjects?.();
        const ownProjects = (Array.isArray(projects) ? projects : [])
          .filter((project) => String(project?.createdBy || '').trim() === me);
        for (const project of ownProjects) {
          const projectId = String(project?.projectId || '').trim();
          if (!projectId) continue;
          const projectState = await this.actions.getProjectState?.(projectId);
          if (!projectState?.project) continue;
          const projectName = String(projectState.project?.name || 'Projet').trim() || 'Projet';
          const projectNotes = (this.actions.getProjectNotesForState?.(projectState) || []).filter((note) => !Number(note?.archivedAt || 0));
          projectNotes.forEach((note) => {
            const sourceNoteId = String(note?.noteId || '').trim();
            if (!sourceNoteId) return;
            aggregatedProjectNotes.push({
              ...note,
              noteId: this.actions.buildGlobalHubProjectNoteRef?.(projectId, sourceNoteId) || sourceNoteId,
              __origin: 'project',
              __originProjectId: projectId,
              __originProjectName: projectName,
              __originNoteId: sourceNoteId
            });
          });
        }
      }
      return { me, notesGlobal, aggregatedProjectNotes };
    }

    async collectGlobalNotesLinkedDocsContext() {
      const allGlobalDocsRaw = await this.actions.getAllGlobalDocs?.();
      const linkedDocsByNoteId = new Map();
      const linkedDocCountByNoteId = new Map();
      (Array.isArray(allGlobalDocsRaw) ? allGlobalDocsRaw : []).forEach((doc) => {
        const docId = String(doc?.id || '').trim();
        if (!docId) return;
        const docName = String(doc?.name || 'Document').trim() || 'Document';
        const linkedNoteIds = Array.isArray(doc?.linkedNoteIds) ? doc.linkedNoteIds : [];
        linkedNoteIds.forEach((noteId) => {
          const nid = String(noteId || '').trim();
          if (!nid) return;
          if (!linkedDocsByNoteId.has(nid)) linkedDocsByNoteId.set(nid, []);
          linkedDocsByNoteId.get(nid).push({ id: docId, name: docName });
          linkedDocCountByNoteId.set(nid, Number(linkedDocCountByNoteId.get(nid) || 0) + 1);
        });
      });
      return { linkedDocsByNoteId, linkedDocCountByNoteId };
    }

    filterAndSortGlobalNotes(notes, options = {}) {
      const rows = Array.isArray(notes) ? notes : [];
      const currentUserId = String(options.currentUserId || '').trim();
      const queryNeedle = this.helpers.normalizeSearch?.(String(options.searchQuery || '')) || '';
      const originFilter = String(options.originFilter || 'all');
      const scopeFilter = String(options.scopeFilter || 'all');
      const tabMode = String(options.tabMode || 'all');
      const themeFilter = String(options.themeFilter || 'all');
      const sortMode = String(options.sortMode || 'recent');
      return rows
        .filter((note) => {
          const noteOrigin = String(note?.__origin || 'global');
          if (originFilter === 'global' && noteOrigin !== 'global') return false;
          if (originFilter === 'project' && noteOrigin !== 'project') return false;
          const isProjectOrigin = noteOrigin === 'project';
          if (isProjectOrigin) {
            if (scopeFilter !== 'all') return false;
            if (tabMode === 'private' || tabMode === 'transverse') return false;
            if (tabMode === 'mine' && String(note.createdBy || '').trim() !== currentUserId) return false;
            if (tabMode === 'favorites' && Number(note.favoriteAt || 0) <= 0) return false;
            if (tabMode === 'published' && note.shareToGlobalFeed !== true) return false;
          }
          const visibility = this.helpers.normalizeGlobalNoteVisibility?.(note.visibility) || 'private';
          if (!isProjectOrigin) {
            if (visibility === 'private' && !this.actions.isAppAdmin?.(currentUserId) && String(note.createdBy || '').trim() !== currentUserId) return false;
            if (scopeFilter === 'private' && visibility !== 'private') return false;
            if (scopeFilter === 'transverse' && visibility !== 'transverse') return false;
            if (tabMode === 'mine' && String(note.createdBy || '').trim() !== currentUserId) return false;
            if (tabMode === 'favorites' && Number(note.favoriteAt || 0) <= 0) return false;
            if (tabMode === 'private' && visibility !== 'private') return false;
            if (tabMode === 'transverse' && visibility !== 'transverse') return false;
            if (tabMode === 'published' && note.shareToGlobalFeed !== true) return false;
          }
          if (themeFilter !== 'all') {
            const match = (this.actions.getGlobalNoteThemeLabels?.(note) || []).some(
              (label) => (this.helpers.normalizeCatalogKey?.(label) || '') === themeFilter
            );
            if (!match) return false;
          }
          if (!queryNeedle) return true;
          const blob = this.helpers.normalizeSearch?.([
            note.title,
            note.content,
            note.theme,
            ...(Array.isArray(note.tags) ? note.tags : [])
          ].join(' ')) || '';
          return blob.includes(queryNeedle);
        })
        .sort((a, b) => {
          const favoriteDiff = Number(b.favoriteAt || 0) - Number(a.favoriteAt || 0);
          if (favoriteDiff !== 0) return favoriteDiff;
          if (sortMode === 'oldest') return Number(a.updatedAt || a.createdAt || 0) - Number(b.updatedAt || b.createdAt || 0);
          if (sortMode === 'favorites') {
            const af = Number(a.favoriteAt || 0);
            const bf = Number(b.favoriteAt || 0);
            if ((af > 0) !== (bf > 0)) return bf - af;
            if (af !== bf) return bf - af;
            return Number(b.updatedAt || b.createdAt || 0) - Number(a.updatedAt || a.createdAt || 0);
          }
          if (sortMode === 'alpha') return String(a.title || '').localeCompare(String(b.title || ''), 'fr');
          return Number(b.updatedAt || b.createdAt || 0) - Number(a.updatedAt || a.createdAt || 0);
        });
    }

    renderGlobalNotesResults(options = {}) {
      const host = options.host;
      const countEl = options.countEl || null;
      const paginationContainer = options.paginationContainer || null;
      const filtered = Array.isArray(options.filtered) ? options.filtered : [];
      const linkedDocsByNoteId = options.linkedDocsByNoteId instanceof Map ? options.linkedDocsByNoteId : new Map();
      const linkedDocCountByNoteId = options.linkedDocCountByNoteId instanceof Map ? options.linkedDocCountByNoteId : new Map();
      const currentUserId = String(options.currentUserId || '').trim();
      if (!host) return;
      if (countEl) {
        const n = filtered.length;
        const selected = Number(this.state.getSelectedCount?.() || 0);
        countEl.textContent = this.state.getBulkSelectionMode?.()
          ? `${n} note${n > 1 ? 's' : ''} • ${selected} selectionnee${selected > 1 ? 's' : ''} • favoris prioritaires`
          : `${n} note${n > 1 ? 's' : ''} • favoris prioritaires`;
      }
      if (!filtered.length) {
        host.innerHTML = `
          <div class="workspace-empty-state">
            <span class="workspace-empty-icon material-symbols-outlined" aria-hidden="true">sticky_note_2</span>
            <p class="workspace-empty-title">Aucune note pour ces criteres</p>
            <p class="workspace-empty-text">Essayez un autre filtre ou creez une nouvelle note.</p>
          </div>
        `;
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
      }
      const page = Number(this.state.getPage?.() || 1) || 1;
      const perPage = Number(this.actions.getGlobalNotesPerPage?.() || 8) || 8;
      const pagination = this.actions.paginateItems?.(filtered, page, perPage) || { pageItems: filtered, currentPage: 1 };
      this.state.setPage?.(pagination.currentPage);
      if (this.state.getBulkSelectionMode?.()) {
        host.innerHTML = (pagination.pageItems || [])
          .filter((note) => String(note?.__origin || '') !== 'project')
          .map((note) => {
            const identity = this.actions.resolveKnownUserIdentity?.(
              String(note.createdBy || ''),
              String(note.createdByName || this.helpers.fallbackDirectoryName?.(note.createdBy || ''))
            );
            return this.buildGlobalNoteCardHtml(note, {
              canManage: this.actions.canManageGlobalNote?.(note),
              authorName: identity?.name || note.createdByName || this.helpers.fallbackDirectoryName?.(note.createdBy || ''),
              bulkSelectionMode: this.state.getBulkSelectionMode?.(),
              isSelectedForBulkDelete: this.state.isNoteSelected?.(String(note.noteId || '').trim()),
              linkedDocs: linkedDocsByNoteId.get(String(note.noteId || '').trim()) || []
            });
          }).join('');
        if (!host.innerHTML) {
          host.innerHTML = `
            <div class="workspace-empty-state">
              <span class="workspace-empty-icon material-symbols-outlined" aria-hidden="true">sticky_note_2</span>
              <p class="workspace-empty-title">Aucune note globale selectionnable</p>
              <p class="workspace-empty-text">Les notes projet restent visibles hors mode selection multiple.</p>
            </div>
          `;
        }
      } else {
        const escapeHtml = this.helpers.escapeHtml || ((value) => String(value || ''));
        host.innerHTML = (pagination.pageItems || []).map((note) => {
            if (String(note?.__origin || '') === 'project') {
              const identity = this.actions.resolveKnownUserIdentity?.(
                String(note.createdBy || ''),
                String(note.createdByName || this.helpers.fallbackDirectoryName?.(note.createdBy || ''))
              );
              return `
                <article id="global-note-${escapeHtml(String(note.noteId || ''))}" class="global-note-card rounded-xl border border-slate-200 bg-white p-4 cursor-pointer" onclick="openGlobalHubAggregatedNoteRead('${escapeHtml(String(note.noteId || ''))}')">
                  <div class="flex flex-wrap items-center gap-2 mb-2">
                    <span class="inline-flex text-[10px] px-2 py-1 rounded-full bg-violet-100 text-violet-700 font-semibold">Projet: ${escapeHtml(String(note.__originProjectName || 'Projet'))}</span>
                    ${note.shareToGlobalFeed ? '<span class="inline-flex text-[10px] px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 font-semibold">Dans le fil</span>' : ''}
                  </div>
                  <h4 class="text-base font-bold text-slate-800">${escapeHtml(note.title || 'Note sans titre')}</h4>
                  <p class="mt-1 text-xs text-slate-500">${escapeHtml(identity?.name || note.createdByName || this.helpers.fallbackDirectoryName?.(note.createdBy || ''))} • ${new Date(Number(note.createdAt || Date.now())).toLocaleString('fr-FR')}</p>
                </article>
              `;
            }
            const identity = this.actions.resolveKnownUserIdentity?.(
              String(note.createdBy || ''),
              String(note.createdByName || this.helpers.fallbackDirectoryName?.(note.createdBy || ''))
            );
            return this.buildGlobalNoteCardHtml(note, {
              canManage: this.actions.canManageGlobalNote?.(note),
              authorName: identity?.name || note.createdByName || this.helpers.fallbackDirectoryName?.(note.createdBy || ''),
              bulkSelectionMode: this.state.getBulkSelectionMode?.(),
              isSelectedForBulkDelete: this.state.isNoteSelected?.(String(note.noteId || '').trim()),
              linkedDocs: linkedDocsByNoteId.get(String(note.noteId || '').trim()) || []
            });
          }).join('');
        }
      this.actions.renderPagination?.('global-notes-pagination', pagination, 'setGlobalNotesPage', 'notes');
    }

    finalizeGlobalNotesRenderUi() {
      const tabs = {
        all: document.getElementById('global-notes-tab-all'),
        mine: document.getElementById('global-notes-tab-mine'),
        favorites: document.getElementById('global-notes-tab-favorites'),
        private: document.getElementById('global-notes-tab-private'),
        transverse: document.getElementById('global-notes-tab-transverse'),
        published: document.getElementById('global-notes-tab-published')
      };
      const tabMode = String(this.state.getTabMode?.() || 'all');
      Object.entries(tabs).forEach(([key, btn]) => {
        if (!btn) return;
        btn.classList.toggle('view-tab-active', key === tabMode);
      });
      const focusId = String(this.state.getFocusNoteId?.() || '').trim();
      if (focusId) {
        this.state.setFocusNoteId?.('');
        setTimeout(() => {
          document.getElementById(`global-note-${focusId}`)?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
        }, 40);
      }
      this.updateGlobalNotesBulkDeleteUi();
      global.TaskMDANotesShared?.bindInlineDocLinkActions?.('global-notes-list', null, {
        onPreview: (payload) => {
          const ref = String(payload?.refPayload || '').trim();
          if (!ref) return;
          this.actions.openDocumentPreviewByRef?.(ref);
        },
        onDownload: (payload) => {
          const ref = String(payload?.refPayload || '').trim();
          if (!ref) return;
          this.actions.downloadDocumentByRef?.(ref);
        }
      });
    }
  }

  function create(deps) {
    return new TaskMdaGlobalNotesRenderer(deps);
  }

  global.TaskMDAGlobalNotesRenderer = { create };
}(window));
