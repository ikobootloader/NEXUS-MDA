(function initTaskMDAFeedDigestPdfModule(global) {
  'use strict';

  const PDF2MD_CDN_URL = 'https://esm.sh/@opendocsg/pdf2md@0.2.2?bundle';
  let pdf2MdModulePromise = null;

  function createModule(options = {}) {
    const escapeHtml = options.escapeHtml || ((value) => String(value || ''));
    const normalizeDigestText = options.normalizeDigestText || ((value) => String(value || '').trim());
    const sanitizeProjectDescriptionHtml = options.sanitizeProjectDescriptionHtml || ((value) => String(value || ''));
    const renderSafeMarkdown = options.renderSafeMarkdown || ((value) => String(value || ''));

    function buildPdfStructuredPage(pageItems, optionsInput = {}) {
      const items = Array.isArray(pageItems) ? pageItems : [];
      const pageHeight = Number(optionsInput?.pageHeight || 0);
      const tokens = items.map((item) => {
        const text = String(item?.str || '');
        const transform = Array.isArray(item?.transform) ? item.transform : [];
        const x = Number(transform[4] || 0);
        const y = Number(transform[5] || 0);
        const width = Math.max(0, Number(item?.width || 0));
        const height = Math.max(0.5, Number(item?.height || Math.abs(transform[0] || 0) || 0));
        const fontName = String(item?.fontName || '');
        return { text, x, y, width, height, fontName };
      }).filter((token) => token.text.trim().length > 0);
      if (!tokens.length) return { text: '', html: '' };

      function toFootnoteMarker(value) {
        const digits = String(value || '').replace(/\s+/g, '');
        return digits ? `[${digits}]` : '';
      }
      function isNumericMarker(value) {
        return /^\d{1,3}$/.test(String(value || '').trim());
      }
      function isMarkerOnlyLine(value) {
        const txt = String(value || '').trim();
        if (!txt) return false;
        return /^(\[?\d{1,3}\]?)([\s,;]+(\[?\d{1,3}\]?))*$/.test(txt);
      }
      function normalizeMarkerSequence(value) {
        const nums = String(value || '').match(/\d{1,3}/g);
        if (!nums || !nums.length) return '';
        const unique = nums.filter((n, idx) => nums.indexOf(n) === idx);
        return unique.map((n) => `[${n}]`).join(' ');
      }

      const heights = tokens.map((t) => t.height).filter((h) => Number.isFinite(h) && h > 0).sort((a, b) => a - b);
      const medianHeight = heights.length ? heights[Math.floor(heights.length / 2)] : 11;
      const lineTolerance = Math.max(1.8, medianHeight * 0.42);

      const rawLines = [];
      tokens.forEach((token) => {
        let best = null;
        let bestDist = Number.POSITIVE_INFINITY;
        for (const line of rawLines) {
          const dist = Math.abs(line.y - token.y);
          if (dist <= lineTolerance && dist < bestDist) {
            best = line;
            bestDist = dist;
          }
        }
        if (!best) {
          best = { y: token.y, tokens: [] };
          rawLines.push(best);
        }
        best.tokens.push(token);
      });

      const lines = rawLines.map((line) => {
        const row = [...line.tokens].sort((a, b) => a.x - b.x);
        let text = '';
        let prev = null;
        row.forEach((token) => {
          const currentText = String(token.text || '');
          if (!currentText) return;
          if (!prev) {
            text += currentText;
            prev = token;
            return;
          }
          const prevEndX = Number(prev.x || 0) + Number(prev.width || 0);
          const gap = Number(token.x || 0) - prevEndX;
          const noLeadingSpace = /^[,.;:!?%)\]\}]/.test(currentText);
          const superscriptLike = isNumericMarker(currentText)
            && Number(token.height || 0) < Number(prev.height || 0) * 0.86
            && Number(token.y || 0) > Number(prev.y || 0) + Math.max(0.6, Number(prev.height || 0) * 0.16)
            && gap < Math.max(10, Number(prev.height || 0));
          if (superscriptLike) text += toFootnoteMarker(currentText);
          else if (gap > Math.max(1.2, Number(prev.height || 0) * 0.12) && !noLeadingSpace) text += ` ${currentText}`;
          else text += currentText;
          prev = token;
        });
        const normalizedText = text.replace(/\s{2,}/g, ' ').trim();
        const startX = Math.min(...row.map((t) => Number(t.x || 0)));
        const endX = Math.max(...row.map((t) => Number(t.x || 0) + Number(t.width || 0)));
        const avgHeight = row.reduce((sum, t) => sum + Number(t.height || 0), 0) / Math.max(1, row.length);
        const boldishCount = row.filter((t) => /bold|black|heavy|demi/i.test(String(t.fontName || ''))).length;
        const boldRatio = boldishCount / Math.max(1, row.length);
        return { text: normalizedText, y: Number(line.y || 0), startX, endX, avgHeight, boldRatio };
      }).filter((line) => line.text.length > 0);
      if (!lines.length) return { text: '', html: '' };

      const startXs = lines.map((line) => line.startX).sort((a, b) => a - b);
      const minX = startXs[0];
      const maxX = startXs[startXs.length - 1];
      const xSpan = maxX - minX;
      let useTwoColumns = false;
      let splitX = 0;
      if (lines.length >= 9 && xSpan >= 180) {
        const q1 = startXs[Math.floor(startXs.length * 0.25)];
        const q3 = startXs[Math.floor(startXs.length * 0.75)];
        const gap = q3 - q1;
        if (gap >= Math.max(95, xSpan * 0.22)) {
          const leftCount = lines.filter((line) => line.startX <= (q1 + q3) / 2).length;
          const rightCount = lines.length - leftCount;
          if (leftCount >= 3 && rightCount >= 3) {
            useTwoColumns = true;
            splitX = (q1 + q3) / 2;
          }
        }
      }
      const ordered = [...lines].sort((a, b) => {
        const colA = useTwoColumns ? (a.startX <= splitX ? 0 : 1) : 0;
        const colB = useTwoColumns ? (b.startX <= splitX ? 0 : 1) : 0;
        if (colA !== colB) return colA - colB;
        if (Math.abs(a.y - b.y) > lineTolerance) return b.y - a.y;
        return a.startX - b.startX;
      });

      const orderedWithMarkers = [];
      for (const line of ordered) {
        const txt = String(line?.text || '').trim();
        if (!isMarkerOnlyLine(txt)) {
          orderedWithMarkers.push({ ...line, markerOnly: false });
          continue;
        }
        const markers = normalizeMarkerSequence(txt);
        if (!markers) continue;
        const last = orderedWithMarkers.length ? orderedWithMarkers[orderedWithMarkers.length - 1] : null;
        const nearPrevious = last
          && Math.abs(Number(last.y || 0) - Number(line.y || 0)) <= Math.max(42, medianHeight * 4)
          && Math.abs(Number(last.startX || 0) - Number(line.startX || 0)) <= Math.max(40, medianHeight * 3);
        if (nearPrevious && !last.markerOnly) last.text = `${String(last.text || '').trim()} ${markers}`.replace(/\s{2,}/g, ' ').trim();
        else orderedWithMarkers.push({ ...line, text: markers, markerOnly: true });
      }

      const topY = Math.max(...orderedWithMarkers.map((l) => l.y));
      const bottomY = Math.min(...orderedWithMarkers.map((l) => l.y));
      const pageSpanY = Math.max(1, topY - bottomY);
      const bottomBandY = bottomY + pageSpanY * 0.2;
      const effectivePageHeight = pageHeight > 0 ? pageHeight : topY + (medianHeight * 2);
      function isPotentialFootnoteLine(line) {
        const txt = String(line.text || '').trim();
        if (!txt || line.markerOnly) return false;
        const lowerArea = line.y <= bottomBandY || line.y <= effectivePageHeight * 0.2;
        const smallFont = line.avgHeight <= medianHeight * 0.9;
        const startsMarker = /^\[?\d{1,3}\]?[\s.).-]/.test(txt) || /^\d{1,3}$/.test(txt);
        return smallFont && lowerArea && (startsMarker || txt.length <= 90);
      }
      const footnotes = [];
      const bodyLines = [];
      orderedWithMarkers.forEach((line) => (isPotentialFootnoteLine(line) ? footnotes : bodyLines).push(line));

      function lineLooksLikeHeading(line) {
        const txt = String(line?.text || '').trim();
        if (!txt || txt.length > 140) return false;
        if (/^[\u2022\-*]\s/u.test(txt) || /^\d+\./.test(txt)) return false;
        const letters = txt.replace(/[^\p{L}]/gu, '');
        const upper = txt.replace(/[^\p{Lu}]/gu, '');
        const upperRatio = letters.length ? upper.length / letters.length : 0;
        const bigFont = Number(line.avgHeight || 0) >= medianHeight * 1.24;
        const boldish = Number(line.boldRatio || 0) >= 0.5;
        const shortish = txt.length <= 95;
        const endsLikeSentence = /[.!?;:]$/.test(txt);
        return ((bigFont && shortish) || (boldish && shortish) || (upperRatio > 0.7 && txt.length <= 80)) && !endsLikeSentence;
      }

      const blocks = [];
      let pendingBullet = false;
      for (const line of bodyLines) {
        let txt = String(line.text || '').trim();
        if (!txt) continue;
        if (line.markerOnly) {
          const previous = blocks.length ? blocks[blocks.length - 1] : null;
          if (previous && (previous.type === 'paragraph' || previous.type === 'list-item')) {
            previous.text = `${String(previous.text || '').trim()} ${txt}`.replace(/\s{2,}/g, ' ').trim();
            previous.lastY = line.y;
          } else blocks.push({ type: 'paragraph', text: txt, startX: line.startX, lastY: line.y });
          continue;
        }
        if (txt === '•' || txt === '.') {
          pendingBullet = true;
          continue;
        }
        if (pendingBullet) {
          txt = `• ${txt}`;
          pendingBullet = false;
        }
        const isHeading = lineLooksLikeHeading({ ...line, text: txt });
        const isListItem = /^[•\-–]\s+/.test(txt) || /^\d+\.\s+/.test(txt);
        const previous = blocks.length ? blocks[blocks.length - 1] : null;
        const verticalGap = previous ? Math.max(0, Number(previous.lastY || 0) - Number(line.y || 0)) : 0;
        const similarIndent = previous ? Math.abs(Number(previous.startX || 0) - Number(line.startX || 0)) <= Math.max(12, medianHeight * 1.6) : false;
        const canMerge = previous && previous.type === 'paragraph' && !isHeading && !isListItem && similarIndent && verticalGap <= Math.max(16, medianHeight * 1.7);
        if (isHeading) {
          const level = Number(line.avgHeight || 0) >= medianHeight * 1.45 ? 'h2' : 'h3';
          blocks.push({ type: 'heading', level, text: txt, startX: line.startX, lastY: line.y });
          continue;
        }
        if (isListItem) {
          blocks.push({ type: 'list-item', text: txt, startX: line.startX, lastY: line.y });
          continue;
        }
        if (canMerge) {
          const current = String(txt || '');
          const previousText = String(previous.text || '');
          const hyphenJoin = /-$/.test(previousText) && /^[a-zà-öø-ÿ]/i.test(current);
          previous.text = hyphenJoin ? `${previousText.slice(0, -1)}${current}` : `${previousText} ${current}`.replace(/\s{2,}/g, ' ').trim();
          previous.lastY = line.y;
        } else blocks.push({ type: 'paragraph', text: txt, startX: line.startX, lastY: line.y });
      }

      const textParts = [];
      const htmlParts = [];
      blocks.forEach((block) => {
        const value = String(block.text || '').trim();
        if (!value) return;
        textParts.push(value);
        if (block.type === 'heading') {
          const safeLevel = block.level === 'h2' ? 'h2' : 'h3';
          htmlParts.push(`<${safeLevel}>${escapeHtml(value)}</${safeLevel}>`);
        } else htmlParts.push(`<p>${escapeHtml(value)}</p>`);
      });
      if (footnotes.length > 0) {
        const footRows = footnotes.map((line) => String(line.text || '').trim()).filter(Boolean).map((line) => line.replace(/^(\d{1,3})(?=\s)/, '[$1]'));
        if (footRows.length) {
          textParts.push('');
          textParts.push('Notes de bas de page:');
          footRows.forEach((row) => textParts.push(row));
          htmlParts.push(`<details class="feed-digest-pdf-footnotes"><summary>Notes de bas de page (${footRows.length})</summary><ul>${footRows.map((row) => `<li>${escapeHtml(row)}</li>`).join('')}</ul></details>`);
        }
      }
      return { text: normalizeDigestText(textParts.join('\n')), html: htmlParts.join('') };
    }

    function renderPdfPageLinksHtml(links = [], pageNo = 1, anchorPrefix = 'feed-digest-pdf') {
      const list = Array.isArray(links) ? links.filter(Boolean) : [];
      if (!list.length) return '';
      const sectionId = `${anchorPrefix}-links-page-${Number(pageNo || 1)}`;
      return `<details id="${escapeHtml(sectionId)}" class="feed-digest-pdf-links"><summary>Liens detectes (${list.length})</summary><ul>${list.map((href, idx) => `<li id="${escapeHtml(`${sectionId}-ref-${idx + 1}`)}"><a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(href)}</a></li>`).join('')}</ul></details>`;
    }

    function linkifyPdfMarkersToPageLinksSection(html, links = [], pageNo = 1, anchorPrefix = 'feed-digest-pdf') {
      const source = String(html || '');
      const list = Array.isArray(links) ? links.filter(Boolean) : [];
      if (!source || !list.length) return source;
      const sectionId = `${anchorPrefix}-links-page-${Number(pageNo || 1)}`;
      return source.replace(/\[(\d{1,3})\]/g, (_full, n) => {
        const idx = Number(n);
        if (!Number.isFinite(idx) || idx < 1 || idx > list.length) return `[${n}]`;
        return `<a href="#${escapeHtml(sectionId)}" class="feed-digest-marker-link" title="Aller aux liens detectes de la page">[${escapeHtml(String(n))}]</a>`;
      });
    }

    function renderDigestDetailsList(details = []) {
      if (!Array.isArray(details) || !details.length) return '';
      return `<p>${details.map((item) => escapeHtml(item)).join(' • ')}</p>`;
    }

    function trimDigestTextForCompact(text, maxChars = 2600, maxLines = 28) {
      const source = normalizeDigestText(text);
      if (!source) return { text: '', truncated: false };
      const lines = source.split('\n');
      const clippedLines = lines.slice(0, maxLines);
      let joined = clippedLines.join('\n');
      let truncated = lines.length > maxLines;
      if (joined.length > maxChars) {
        joined = `${joined.slice(0, maxChars)}...`;
        truncated = true;
      }
      return { text: joined.trim(), truncated };
    }

    function renderDigestMarkdownHtml(markdownText) {
      const source = String(markdownText || '');
      if (!source.trim()) return '';
      try {
        if (globalThis.marked && typeof globalThis.marked.parse === 'function') {
          const parsed = globalThis.marked.parse(source, {
            gfm: true,
            breaks: true,
            headerIds: false,
            mangle: false
          });
          return sanitizeProjectDescriptionHtml(String(parsed || ''));
        }
      } catch (error) {
        console.warn('Markdown parse failed, fallback used:', error);
      }
      return sanitizeProjectDescriptionHtml(renderSafeMarkdown(source));
    }

    async function ensurePdf2MdModule() {
      if (pdf2MdModulePromise) return pdf2MdModulePromise;
      pdf2MdModulePromise = import(PDF2MD_CDN_URL)
        .then((mod) => mod?.default || mod)
        .catch((error) => {
          console.warn('pdf2md CDN unavailable, fallback to PDF.js extraction:', error);
          return null;
        });
      return pdf2MdModulePromise;
    }

    async function extractPdfMarkdownWithCdn(buffer) {
      try {
        const pdf2md = await ensurePdf2MdModule();
        if (typeof pdf2md !== 'function') return '';
        const markdown = await pdf2md(buffer);
        return normalizeDigestText(String(markdown || ''));
      } catch (error) {
        console.warn('pdf2md extraction failed, fallback to PDF.js extraction:', error);
        return '';
      }
    }

    return {
      buildPdfStructuredPage,
      renderPdfPageLinksHtml,
      linkifyPdfMarkersToPageLinksSection,
      renderDigestDetailsList,
      trimDigestTextForCompact,
      renderDigestMarkdownHtml,
      extractPdfMarkdownWithCdn
    };
  }

  global.TaskMDAFeedDigestPdf = { createModule };
}(window));
