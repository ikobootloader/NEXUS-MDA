/* --- taskmda-global-notes-ref.js --- */
(function initTaskMdaGlobalNotesRef(global) {
  'use strict';

  function buildGlobalHubProjectNoteRef(projectId, noteId) {
    const pid = encodeURIComponent(String(projectId || '').trim());
    const nid = encodeURIComponent(String(noteId || '').trim());
    return `project:${pid}:${nid}`;
  }

  function parseGlobalHubProjectNoteRef(refValue) {
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

  global.TaskMDAGlobalNotesRef = {
    buildGlobalHubProjectNoteRef,
    parseGlobalHubProjectNoteRef
  };
}(window));
