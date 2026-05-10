(function initTaskMdaTasksModule(global) {
  'use strict';

  function parseSubtasks(textValue, idFactory) {
    if (!textValue) return [];
    const makeId = typeof idFactory === 'function'
      ? idFactory
      : (() => `${Date.now()}-${Math.random().toString(16).slice(2)}`);
    return String(textValue)
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(label => ({ id: makeId(), label, done: false }));
  }

  function getSubtaskProgress(task) {
    const subtasks = Array.isArray(task && task.subtasks) ? task.subtasks : [];
    const total = subtasks.length;
    const done = subtasks.filter(st => Boolean(st && st.done)).length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, percent };
  }

  function buildSubtaskProgressHtml(task, compact = false) {
    const stats = getSubtaskProgress(task);
    if (!stats.total) return '';
    const wrapperClass = compact ? 'subtask-progress subtask-progress-compact' : 'subtask-progress';
    return [
      `<div class="${wrapperClass}">`,
      '  <div class="subtask-progress-head">',
      `    <span class="subtask-progress-title">Sous-taches (${stats.done}/${stats.total})</span>`,
      `    <span class="subtask-progress-percent">${stats.percent}%</span>`,
      '  </div>',
      '  <div class="subtask-progress-track">',
      `    <div class="subtask-progress-fill" style="width:${stats.percent}%"></div>`,
      '  </div>',
      '</div>'
    ].join('\n');
  }

  function mergeSubtasksWithExisting(existingSubtasks, subtasksParsed, normalizeSearchFn, idFactory) {
    if (!Array.isArray(subtasksParsed)) return [];
    const existing = Array.isArray(existingSubtasks) ? existingSubtasks : [];
    const used = new Set();
    const normalize = typeof normalizeSearchFn === 'function'
      ? normalizeSearchFn
      : (value => String(value || '').trim().toLowerCase());
    const makeId = typeof idFactory === 'function'
      ? idFactory
      : (() => `${Date.now()}-${Math.random().toString(16).slice(2)}`);

    return subtasksParsed.map((nextSt) => {
      const matchIndex = existing.findIndex((oldSt, idx) => (
        !used.has(idx) && normalize(oldSt && oldSt.label) === normalize(nextSt && nextSt.label)
      ));
      if (matchIndex >= 0) {
        used.add(matchIndex);
        const matched = existing[matchIndex];
        return {
          id: (matched && matched.id) || (nextSt && nextSt.id) || makeId(),
          label: (nextSt && nextSt.label) || '',
          done: Boolean(matched && matched.done)
        };
      }
      return {
        id: (nextSt && nextSt.id) || makeId(),
        label: (nextSt && nextSt.label) || '',
        done: false
      };
    });
  }

  function formatExportDateTag(dateValue) {
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue || Date.now());
    const yyyy = String(date.getFullYear());
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mi = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}${mm}${dd}-${hh}${mi}`;
  }

  function buildCompletedTasksYearWorkbook(rows, year) {
    if (!global.XLSX || !global.XLSX.utils) return null;
    const list = Array.isArray(rows) ? rows : [];
    const sheetRows = list.map((row) => ({
      annee: Number(year) || '',
      source: String(row?.source || ''),
      projet: String(row?.projectName || ''),
      task_id: String(row?.taskId || ''),
      titre: String(row?.title || ''),
      statut: String(row?.status || ''),
      urgence: String(row?.urgency || ''),
      responsable: String(row?.assignee || ''),
      groupe: String(row?.groupName || ''),
      thematique: String(row?.theme || ''),
      date_demande: String(row?.requestDate || ''),
      date_limite: String(row?.dueDate || ''),
      date_accomplie: String(row?.completedAt || ''),
      archivee: String(row?.archived || ''),
      visibilite: String(row?.visibility || ''),
      description: String(row?.description || '')
    }));
    const headers = [
      'annee',
      'source',
      'projet',
      'task_id',
      'titre',
      'statut',
      'urgence',
      'responsable',
      'groupe',
      'thematique',
      'date_demande',
      'date_limite',
      'date_accomplie',
      'archivee',
      'visibilite',
      'description'
    ];
    const workbook = global.XLSX.utils.book_new();
    const worksheet = global.XLSX.utils.json_to_sheet(sheetRows, { header: headers });
    worksheet['!autofilter'] = { ref: `A1:P${Math.max(1, sheetRows.length + 1)}` };
    worksheet['!cols'] = [
      { wch: 8 }, { wch: 14 }, { wch: 26 }, { wch: 18 },
      { wch: 36 }, { wch: 12 }, { wch: 10 }, { wch: 24 },
      { wch: 24 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
      { wch: 20 }, { wch: 10 }, { wch: 14 }, { wch: 60 }
    ];
    global.XLSX.utils.book_append_sheet(workbook, worksheet, 'Taches accomplies');
    return workbook;
  }

  function exportCompletedTasksYearXlsx(rows, year, fileBaseName) {
    const workbook = buildCompletedTasksYearWorkbook(rows, year);
    if (!workbook || !global.XLSX || typeof global.XLSX.writeFile !== 'function') return '';
    const safeBase = String(fileBaseName || 'taskmda_taches_accomplies').trim() || 'taskmda_taches_accomplies';
    const filename = `${safeBase}_${Number(year) || 'annee'}_${formatExportDateTag(Date.now())}.xlsx`;
    global.XLSX.writeFile(workbook, filename);
    return filename;
  }

  global.TaskMDATasks = {
    parseSubtasks,
    getSubtaskProgress,
    buildSubtaskProgressHtml,
    mergeSubtasksWithExisting,
    buildCompletedTasksYearWorkbook,
    exportCompletedTasksYearXlsx
  };
}(window));
