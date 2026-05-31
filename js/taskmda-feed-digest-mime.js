(function initTaskMDAFeedDigestMimeModule(global) {
  'use strict';

  const POSTAL_MIME_CDN_URL = 'https://esm.sh/postal-mime@2.4.4?bundle';
  let postalMimeModulePromise = null;

  function createModule(options = {}) {
    async function ensurePostalMimeModule() {
      if (postalMimeModulePromise) return postalMimeModulePromise;
      postalMimeModulePromise = import(POSTAL_MIME_CDN_URL)
        .then((mod) => mod?.default || mod)
        .catch((error) => {
          console.warn('postal-mime CDN unavailable, fallback parser used:', error);
          return null;
        });
      return postalMimeModulePromise;
    }

    function normalizeEmailAddressField(value) {
      if (!value) return '';
      if (typeof value === 'string') return options.decodeMimeEncodedWords?.(value) || String(value);
      if (Array.isArray(value)) {
        return value
          .map((entry) => normalizeEmailAddressField(entry))
          .filter(Boolean)
          .join(', ');
      }
      if (typeof value === 'object') {
        const singleName = String(value?.name || '').trim();
        const singleAddress = String(value?.address || '').trim();
        if (singleAddress) return singleName ? `${singleName} <${singleAddress}>` : singleAddress;
        if (Array.isArray(value?.value)) {
          return value.value
            .map((entry) => normalizeEmailAddressField(entry))
            .filter(Boolean)
            .join(', ');
        }
      }
      return '';
    }

    function stringifyPostalMimeHeaders(headers) {
      const rows = [];
      if (headers instanceof Map) {
        headers.forEach((value, key) => {
          rows.push(`${String(key || '')}: ${options.decodeMimeEncodedWords?.(String(value || '')) || String(value || '')}`);
        });
      } else if (Array.isArray(headers)) {
        headers.forEach((entry) => {
          const key = String(entry?.key || entry?.name || '').trim().toLowerCase();
          const value = entry?.value ?? entry?.line ?? '';
          if (!key) return;
          rows.push(`${key}: ${options.decodeMimeEncodedWords?.(String(value || '')) || String(value || '')}`);
        });
      }
      return rows.join('\n').trim();
    }

    async function parseEmlDigestWithPostalMime(rawBytesOrText) {
      try {
        const PostalMime = await ensurePostalMimeModule();
        if (!PostalMime || typeof PostalMime.parse !== 'function') return null;
        const parsed = await PostalMime.parse(rawBytesOrText);
        if (!parsed || typeof parsed !== 'object') return null;
        const sourceHtml = String(parsed.html || '').trim();
        const plainText = options.normalizeDigestText?.(String(parsed.text || '').trim()) || '';
        const htmlText = sourceHtml ? (options.normalizeDigestText?.(options.stripHtmlTagsForDigest?.(sourceHtml)) || '') : '';
        const text = plainText || htmlText;
        const subject = options.decodeMimeEncodedWords?.(String(parsed.subject || '').trim()) || String(parsed.subject || '').trim();
        const author = normalizeEmailAddressField(parsed.from);
        const recipients = [normalizeEmailAddressField(parsed.to), normalizeEmailAddressField(parsed.cc)].filter(Boolean).join(', ');
        const date = String(parsed.date || parsed.headers?.get?.('date') || '').trim();
        const headersDump = stringifyPostalMimeHeaders(parsed.headers);
        const attachments = Array.isArray(parsed.attachments)
          ? parsed.attachments.map((att) => ({
              mimeType: String(att?.mimeType || att?.contentType || 'application/octet-stream').trim(),
              fileName: String(att?.filename || '').trim(),
              disposition: String(att?.disposition || '').trim(),
              transferEncoding: String(att?.encoding || '').trim().toLowerCase(),
              payloadChars: Number(att?.content?.byteLength || att?.content?.length || 0) || 0
            }))
          : [];
        return { title: subject, author, recipients, date, text, sourceHtml, headersDump, attachments };
      } catch (error) {
        console.warn('postal-mime parse failed, fallback parser used:', error);
        return null;
      }
    }

    async function parseEmlDigest(raw, parseOptions = {}) {
      const rawBytes = parseOptions?.rawBytes;
      const postalParsed = await parseEmlDigestWithPostalMime(rawBytes instanceof Uint8Array ? rawBytes : String(raw || ''));
      if (postalParsed && (postalParsed.text || postalParsed.sourceHtml || postalParsed.title || postalParsed.author)) return postalParsed;
      const source = String(raw || '');
      const split = options.splitMimeHeaderAndBody?.(source) || { headerText: source, bodyText: '' };
      const headers = options.parseMimeHeaders?.(split.headerText) || new Map();
      const entity = options.parseMimeEntity?.(source, 'utf-8') || { plainParts: [], htmlParts: [], attachments: [] };
      const plainText = options.normalizeDigestText?.((entity.plainParts || []).join('\n\n')) || '';
      const sourceHtml = String((entity.htmlParts || []).join('\n\n') || '').trim();
      const htmlText = options.normalizeDigestText?.(options.stripHtmlTagsForDigest?.(sourceHtml)) || '';
      const text = plainText || htmlText;
      return {
        title: options.decodeMimeEncodedWords?.(headers.get('subject') || '') || '',
        author: options.decodeMimeEncodedWords?.(headers.get('from') || '') || '',
        recipients: options.decodeMimeEncodedWords?.(headers.get('to') || '') || '',
        date: options.decodeMimeEncodedWords?.(headers.get('date') || '') || '',
        text: options.normalizeDigestText?.(text) || text,
        sourceHtml,
        headersDump: options.stringifyMimeHeaders?.(headers) || '',
        attachments: Array.isArray(entity.attachments) ? entity.attachments : []
      };
    }

    function extractRfc822CandidateFromMsgRaw(raw) {
      const source = String(raw || '').replace(/\0+/g, '');
      if (!source.trim()) return '';
      const starters = ['\nFrom:', '\nDate:', '\nSubject:', '\nReturn-Path:', '\nMIME-Version:', '\nContent-Type:'];
      let startIdx = -1;
      for (const marker of starters) {
        const idx = source.indexOf(marker);
        if (idx >= 0 && (startIdx < 0 || idx < startIdx)) startIdx = idx;
      }
      if (startIdx < 0) {
        const alt = source.match(/(?:^|\n)(From|Date|Subject|Return-Path|MIME-Version|Content-Type):/i);
        startIdx = alt && typeof alt.index === 'number' ? alt.index : -1;
      }
      if (startIdx < 0) return '';
      let candidate = source.slice(Math.max(0, startIdx)).replace(/\r\n/g, '\n');
      const eofMarkers = ['\nFrom ???@???', '\n--__', '\n------=_Part_'];
      for (const marker of eofMarkers) {
        const idx = candidate.indexOf(marker);
        if (idx > 0 && idx > 1024) {
          candidate = candidate.slice(0, idx);
          break;
        }
      }
      if (!/\nContent-Type:/i.test(candidate) && !/\nMIME-Version:/i.test(candidate)) return '';
      if (!/\n\n/.test(candidate)) return '';
      return candidate.trim();
    }

    function extractHtmlFragmentFromMsgRaw(raw) {
      const source = String(raw || '').replace(/\0+/g, '');
      const lower = source.toLowerCase();
      let start = lower.indexOf('<html');
      if (start < 0) start = lower.indexOf('<!doctype html');
      if (start < 0) return '';
      let end = lower.indexOf('</html>', start);
      if (end >= 0) end += '</html>'.length;
      if (end < 0) end = Math.min(source.length, start + 400000);
      return String(source.slice(start, end) || '').trim();
    }

    function extractMsgHeaderField(raw, fieldName) {
      const source = String(raw || '').replace(/\0+/g, '');
      const re = new RegExp(`(?:^|\\n)${String(fieldName || '').replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\s*:\\s*([^\\n\\r]+)`, 'i');
      const match = source.match(re);
      return match ? (options.decodeMimeEncodedWords?.(String(match[1] || '').trim()) || String(match[1] || '').trim()) : '';
    }

    return {
      parseEmlDigest,
      extractRfc822CandidateFromMsgRaw,
      extractHtmlFragmentFromMsgRaw,
      extractMsgHeaderField
    };
  }

  global.TaskMDAFeedDigestMime = { createModule };
}(window));
