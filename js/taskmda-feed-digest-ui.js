(function initTaskMDAFeedDigestUiModule(global) {
  'use strict';

  const FEED_DIGEST_BULLET_MAX_CHARS = 900;
  const FEED_DIGEST_EXCERPT_MAX_CHARS = 50000;

  function createModule(options = {}) {
    const normalizeSearch = options.normalizeSearch || ((value) => String(value || '').trim().toLowerCase());
    const normalizeDigestText = options.normalizeDigestText || ((value) => String(value || '').trim());
    const storageKey = String(options.storageKey || '').trim();

    function normalizeGlobalFeedDigestView(value, fallback = 'compact') {
      const v = String(value || '').trim().toLowerCase();
      if (v === 'full' || v === 'complet') return 'full';
      if (v === 'compact') return 'compact';
      return fallback === 'full' ? 'full' : 'compact';
    }

    function pickGlobalFeedDigestImportMode() {
      const isFull = window.confirm(
        'Mode de digest pour cet import:\n\nOK = complet\nAnnuler = compact'
      );
      const normalized = isFull ? 'full' : 'compact';
      options.setViewMode?.(normalized);
      if (storageKey) localStorage.setItem(storageKey, normalized);
      return normalized;
    }

    function summarizeDigestText(text, maxBullets = 12) {
      const source = normalizeDigestText(text);
      if (!source) return { bullets: [], excerpt: '' };
      const lines = source
        .split(/\n+/)
        .map((line) => line.replace(/^[\s\-•*]+/, '').trim())
        .filter((line) => line.length >= 20);
      const sentences = source
        .split(/(?<=[.!?])\s+/)
        .map((line) => line.trim())
        .filter((line) => line.length >= 30);
      const candidates = lines.length >= maxBullets ? lines : lines.concat(sentences);
      const unique = [];
      const seen = new Set();
      candidates.forEach((item) => {
        const key = normalizeSearch(item).slice(0, 120);
        if (!key || seen.has(key)) return;
        seen.add(key);
        unique.push(item);
      });
      const bullets = unique
        .slice(0, maxBullets)
        .map((item) => item.length > FEED_DIGEST_BULLET_MAX_CHARS ? `${item.slice(0, FEED_DIGEST_BULLET_MAX_CHARS)}...` : item);
      return { bullets, excerpt: source.slice(0, FEED_DIGEST_EXCERPT_MAX_CHARS) };
    }

    return {
      normalizeGlobalFeedDigestView,
      pickGlobalFeedDigestImportMode,
      summarizeDigestText
    };
  }

  global.TaskMDAFeedDigestUI = {
    createModule
  };
}(window));
