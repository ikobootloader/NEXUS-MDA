/* --- taskmda-global-notes-navigation.js --- */
(function initTaskMdaGlobalNotesNavigation(global) {
  'use strict';

  function create(options) {
    const opts = options || {};
    const state = opts.state || {};
    const actions = opts.actions || {};
    const helpers = opts.helpers || {};

    function buildGlobalHubProjectNoteRef(projectId, noteId) {
      if (global.TaskMDAGlobalNotesRef?.buildGlobalHubProjectNoteRef) {
        return global.TaskMDAGlobalNotesRef.buildGlobalHubProjectNoteRef(projectId, noteId);
      }
      const pid = encodeURIComponent(String(projectId || '').trim());
      const nid = encodeURIComponent(String(noteId || '').trim());
      return `project:${pid}:${nid}`;
    }

    function parseGlobalHubProjectNoteRef(refValue) {
      if (global.TaskMDAGlobalNotesRef?.parseGlobalHubProjectNoteRef) {
        return global.TaskMDAGlobalNotesRef.parseGlobalHubProjectNoteRef(refValue);
      }
      const source = String(refValue || '').trim();
      if (!source.startsWith('project:')) return null;
      const payload = source.slice('project:'.length);
      const sepIndex = payload.indexOf(':');
      if (sepIndex <= 0) return null;
      const pid = decodeURIComponent(payload.slice(0, sepIndex));
      const nid = decodeURIComponent(payload.slice(sepIndex + 1));
      if (!pid || !nid) return null;
      return { projectId: pid, noteId: nid };
    }

    async function openGlobalHubAggregatedNoteRead(noteRef) {
      const parsed = parseGlobalHubProjectNoteRef(noteRef);
      if (!parsed) {
        actions.openGlobalNoteReadModal?.(String(noteRef || '').trim());
        return;
      }
      await actions.showProjectDetail?.(parsed.projectId, { resetScroll: false });
      const currentProjectState = state.getCurrentProjectState?.();
      if (!currentProjectState?.project) {
        helpers.showToast?.('Projet introuvable');
        return;
      }
      const noteExists = (actions.getProjectNotesForState?.(currentProjectState) || []).some(
        (item) => String(item?.noteId || '').trim() === String(parsed.noteId || '').trim()
      );
      if (!noteExists) {
        helpers.showToast?.('Note projet introuvable');
        return;
      }
      actions.setProjectView?.('notes');
      state.setProjectNotesFocusNoteId?.(String(parsed.noteId || '').trim());
      actions.renderProjectNotes?.(currentProjectState);
      setTimeout(() => {
        actions.openProjectNoteReadModal?.(parsed.noteId);
      }, 40);
    }

    return {
      buildGlobalHubProjectNoteRef,
      parseGlobalHubProjectNoteRef,
      openGlobalHubAggregatedNoteRead
    };
  }

  global.TaskMDAGlobalNotesNavigation = { create };
}(window));
