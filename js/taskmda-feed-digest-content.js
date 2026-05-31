(function initTaskMDAFeedDigestContentModule(global) {
  'use strict';

  function createModule(options = {}) {
    function sanitizeDigestHtmlFragment(html) {
      const source = String(html || '').trim();
      if (!source) return '';
      const sanitized = options.sanitizeProjectDescriptionHtml?.(source) || source;
      return options.applyProfanityFilterToHtml?.(sanitized) || sanitized;
    }

    function splitEmailBodyAndSignatureFromText(text) {
      const source = options.normalizeDigestText?.(text) || '';
      if (!source) return { bodyText: '', signatureText: '' };
      const lines = source.split('\n');
      const markerPatterns = [/^--\s*$/, /^--\s+/, /^cordialement[,.\s]*$/i, /^bien cordialement[,.\s]*$/i, /^merci[,.\s]*$/i, /^thanks[,.\s]*$/i, /^best regards[,.\s]*$/i, /^kind regards[,.\s]*$/i, /^sent from my/i];
      let markerIndex = -1;
      for (let i = Math.max(0, lines.length - 14); i < lines.length; i += 1) {
        const line = String(lines[i] || '').trim();
        if (!line) continue;
        if (markerPatterns.some((re) => re.test(line))) {
          markerIndex = i;
          break;
        }
      }
      if (markerIndex < 0) return { bodyText: source, signatureText: '' };
      const bodyText = options.normalizeDigestText?.(lines.slice(0, markerIndex).join('\n')) || '';
      const signatureText = options.normalizeDigestText?.(lines.slice(markerIndex).join('\n')) || '';
      return { bodyText, signatureText };
    }

    function splitEmailBodyAndSignatureFromHtml(html) {
      const source = String(html || '').trim();
      if (!source) return { bodyHtml: '', signatureHtml: '' };
      const root = document.createElement('div');
      root.innerHTML = source;
      const signatureNode = root.querySelector('.gmail_signature, .moz-signature, [data-smartmail="gmail_signature"], blockquote[type="cite"]');
      if (!signatureNode) {
        const plain = splitEmailBodyAndSignatureFromText(options.stripHtmlTagsForDigest?.(source) || source);
        return {
          bodyHtml: source,
          signatureHtml: plain.signatureText ? `<p>${options.escapeHtml?.(plain.signatureText).replace(/\n/g, '<br>')}</p>` : ''
        };
      }
      const signatureHtml = String(signatureNode.outerHTML || '').trim();
      signatureNode.remove();
      const bodyHtml = String(root.innerHTML || '').trim();
      return { bodyHtml, signatureHtml };
    }

    function buildDigestContentHtml(digest, file, displayMode = 'compact') {
      const effectiveMode = options.normalizeGlobalFeedDigestView?.(displayMode, 'compact') || 'compact';
      const sourceLabel = digest.kind === 'email' ? 'Email' : (digest.kind === 'pdf' ? 'PDF' : (digest.kind === 'office' ? 'DOCX/Office' : 'Document'));
      const createdLabel = new Date().toLocaleString('fr-FR');
      const title = String(digest.title || file?.name || 'Document').trim();
      const details = [];
      if (digest.sourceAuthor) details.push(`Expediteur: ${digest.sourceAuthor}`);
      if (digest.sourceDate) details.push(`Date source: ${digest.sourceDate}`);
      if (digest.degraded && !digest.unavailableReason) details.push('Extraction partielle (fallback binaire)');
      if (digest.unavailableReason) details.push(`Parser manquant: ${digest.unavailableReason}`);

      let compactPanelHtml = '';
      let fullPanelHtml = '';
      if (digest.kind === 'email') {
        const htmlFragment = String(digest.sourceHtml || '').trim();
        const subject = String(digest.title || file?.name || 'Sans objet').trim();
        const sender = String(digest.sourceAuthor || '').trim() || '-';
        const recipients = String(digest.sourceRecipients || '').trim() || '-';
        const splitText = splitEmailBodyAndSignatureFromText(String(digest.text || ''));
        const splitHtml = splitEmailBodyAndSignatureFromHtml(htmlFragment);
        const bodyHtmlRaw = String(splitHtml.bodyHtml || '').trim();
        const signatureHtmlRaw = String(splitHtml.signatureHtml || '').trim();
        const bodyHtml = sanitizeDigestHtmlFragment(bodyHtmlRaw) || (splitText.bodyText ? `<p>${options.escapeHtml?.(splitText.bodyText).replace(/\n/g, '<br>')}</p>` : '');
        const signatureHtml = sanitizeDigestHtmlFragment(signatureHtmlRaw) || (splitText.signatureText ? `<p>${options.escapeHtml?.(splitText.signatureText).replace(/\n/g, '<br>')}</p>` : '');
        const compactBody = options.trimDigestTextForCompact?.(splitText.bodyText || digest.text || '', options.compactTextMaxChars || 3200, options.compactTextMaxLines || 34) || { text: '', truncated: false };
        const compactSig = options.trimDigestTextForCompact?.(splitText.signatureText || '', 420, 8) || { text: '', truncated: false };
        compactPanelHtml = `<p><strong>Expediteur:</strong> ${options.escapeHtml?.(sender)}</p><p><strong>Destinataires:</strong> ${options.escapeHtml?.(recipients)}</p><p><strong>Objet:</strong> ${options.escapeHtml?.(subject || '-')}</p><p><strong>Message:</strong></p>${compactBody.text ? `<pre class="feed-digest-excerpt">${options.escapeHtml?.(compactBody.text)}</pre>` : '<p>Aucun message detecte.</p>'}<p><strong>Signature:</strong></p>${compactSig.text ? `<pre class="feed-digest-excerpt">${options.escapeHtml?.(compactSig.text)}</pre>` : '<p>-</p>'}${compactBody.truncated ? '<p class="feed-digest-compact-note">Mode compact: message complet en mode "Complet".</p>' : ''}`;
        fullPanelHtml = `<p><strong>Expediteur:</strong> ${options.escapeHtml?.(sender)}</p><p><strong>Destinataires:</strong> ${options.escapeHtml?.(recipients)}</p><p><strong>Objet:</strong> ${options.escapeHtml?.(subject || '-')}</p><p><strong>Message:</strong></p>${bodyHtml || (splitText.bodyText ? `<pre class="feed-digest-excerpt">${options.escapeHtml?.(splitText.bodyText)}</pre>` : '<p>Aucun message detecte.</p>')}<p><strong>Signature:</strong></p>${signatureHtml || (splitText.signatureText ? `<pre class="feed-digest-excerpt">${options.escapeHtml?.(splitText.signatureText)}</pre>` : '<p>-</p>')}`;
      } else if (digest.kind === 'pdf') {
        const metadataLines = Array.isArray(digest.metadataLines) ? digest.metadataLines.filter(Boolean) : [];
        const pagesHtml = String(digest.pagesHtml || '').trim();
        const pagesPreviewHtml = String(digest.pagesPreviewHtml || '').trim();
        const markdownSource = String(digest.markdownSource || '').trim();
        const compactText = options.trimDigestTextForCompact?.(digest.text || '', options.compactTextMaxChars || 3200, options.compactTextMaxLines || 34) || { text: '', truncated: false };
        const compactMarkdown = markdownSource ? options.renderDigestMarkdownHtml?.((options.trimDigestTextForCompact?.(markdownSource, options.compactTextMaxChars || 3200, options.compactTextMaxLines || 34) || {}).text || '') : '';
        const fullMarkdown = markdownSource ? options.renderDigestMarkdownHtml?.(markdownSource) : '';
        compactPanelHtml = `${options.renderDigestDetailsList?.(details) || ''}${metadataLines.length ? `<pre class="feed-digest-excerpt">${options.escapeHtml?.(metadataLines.join('\n'))}</pre>` : ''}${compactMarkdown ? `<section class="feed-digest-plain-content">${compactMarkdown}</section>` : ''}${pagesPreviewHtml ? `<section class="feed-digest-pdf-pages">${pagesPreviewHtml}</section>` : ''}${!compactMarkdown && compactText.text ? `<details><summary>Texte</summary><pre class="feed-digest-excerpt">${options.escapeHtml?.(compactText.text)}</pre></details>` : ''}${compactText.truncated ? '<p class="feed-digest-compact-note">Mode compact: pages et texte complets disponibles en mode "Complet".</p>' : ''}`;
        fullPanelHtml = `${options.renderDigestDetailsList?.(details) || ''}${metadataLines.length ? `<details open><summary>Metadonnees PDF</summary><pre class="feed-digest-excerpt">${options.escapeHtml?.(metadataLines.join('\n'))}</pre></details>` : ''}${fullMarkdown ? `<details open><summary>Contenu reconstruit (Markdown)</summary><section class="feed-digest-plain-content">${fullMarkdown}</section></details>` : ''}${pagesHtml ? `<details open><summary>Contenu structure par pages</summary><section class="feed-digest-pdf-pages">${pagesHtml}</section></details>` : ''}${!fullMarkdown && digest.text ? `<details><summary>Texte complet</summary><pre class="feed-digest-excerpt">${options.escapeHtml?.(String(digest.text || ''))}</pre></details>` : ''}${!fullMarkdown && !digest.text ? `<p>Aucun texte exploitable detecte.</p>` : ''}`;
      } else {
        const sourceText = String(digest.text || '').trim();
        const compactText = options.trimDigestTextForCompact?.(sourceText, options.compactTextMaxChars || 3200, options.compactTextMaxLines || 34) || { text: '', truncated: false };
        const compactRendered = digest.kind === 'markdown' ? options.renderDigestMarkdownHtml?.(compactText.text) : options.escapeHtml?.(compactText.text).replace(/\n/g, '<br>');
        const fullRendered = digest.kind === 'markdown' ? options.renderDigestMarkdownHtml?.(sourceText) : options.escapeHtml?.(sourceText).replace(/\n/g, '<br>');
        const compactBody = compactText.text ? `<section class="feed-digest-plain-content">${compactRendered}</section>` : `<p>Aucun contenu exploitable detecte.</p>`;
        const fullBody = sourceText ? `<section class="feed-digest-plain-content">${fullRendered}</section>` : `<p>Aucun contenu exploitable detecte.</p>`;
        compactPanelHtml = `${options.renderDigestDetailsList?.(details) || ''}${compactBody}${compactText.truncated ? '<p class="feed-digest-compact-note">Mode compact: contenu complet disponible en mode "Complet".</p>' : ''}`;
        fullPanelHtml = `${options.renderDigestDetailsList?.(details) || ''}${fullBody}`;
      }
      const selectedPanelHtml = effectiveMode === 'full' ? fullPanelHtml : compactPanelHtml;
      const modeLabel = effectiveMode === 'full' ? 'Complet' : 'Compact';
      return options.applyProfanityFilterToHtml?.(`<div class="feed-digest-block" data-feed-digest-kind="${options.escapeHtml?.(String(digest.kind || 'document'))}" data-feed-digest-view="${options.escapeHtml?.(effectiveMode)}"><h3>Actualite extraite - ${options.escapeHtml?.(title)}</h3><div class="feed-digest-panels"><section class="feed-digest-panel-${options.escapeHtml?.(effectiveMode)}">${selectedPanelHtml}</section></div><div class="feed-digest-meta-box"><p><strong>Source:</strong> ${options.escapeHtml?.(sourceLabel)} • <strong>Digest:</strong> ${options.escapeHtml?.(createdLabel)} • <strong>Mode:</strong> ${options.escapeHtml?.(modeLabel)}</p></div></div>`) || '';
    }

    return {
      sanitizeDigestHtmlFragment,
      splitEmailBodyAndSignatureFromText,
      splitEmailBodyAndSignatureFromHtml,
      buildDigestContentHtml
    };
  }

  global.TaskMDAFeedDigestContent = { createModule };
}(window));
