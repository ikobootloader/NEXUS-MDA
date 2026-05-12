// taskmda-modal-ui-harmonizer.js
// Harmonisation des modales (icones de labels + boutons fermer).
(function initTaskMdaModalUiHarmonizer(global) {
  'use strict';

  function create(deps = {}) {
    const normalizeSearch = typeof deps.normalizeSearch === 'function'
      ? deps.normalizeSearch
      : (value) => String(value || '').toLowerCase();
    const normalizeActionButtonLabel = typeof deps.normalizeActionButtonLabel === 'function'
      ? deps.normalizeActionButtonLabel
      : (value) => String(value || '').replace(/\s+/g, ' ').trim();
    const scheduleActionButtonsDecorate = typeof deps.scheduleActionButtonsDecorate === 'function'
      ? deps.scheduleActionButtonsDecorate
      : () => {};

    let modalFieldIconsObserver = null;
    let modalFieldIconsRaf = null;
    let modalCloseButtonsObserver = null;
    let modalCloseButtonsRaf = null;

    function normalizeModalLabelText(value) {
      const raw = String(value || '').replace(/\s+/g, ' ').trim();
      if (!raw) return '';
      return normalizeSearch(raw);
    }

    function inferModalFieldIcon(labelText, fieldId = '') {
      const text = normalizeModalLabelText(labelText);
      const idText = normalizeModalLabelText(fieldId);
      const blob = `${text} ${idText}`;
      if (!blob) return '';
      if (blob.includes('nombre') || blob.includes('occurrence')) return 'tag';
      if (blob.includes('visibilite') || blob.includes('lecture')) return 'visibility';
      if (blob.includes('titre') || blob.includes('nom')) return 'title';
      if (blob.includes('description') || blob.includes('resume') || blob.includes('commentaire') || blob.includes('notes')) return 'description';
      if (blob.includes('demande')) return 'calendar_clock';
      if (blob.includes('echeance') || (blob.includes('date') && !blob.includes('creation'))) return 'event';
      if (blob.includes('email')) return 'mail';
      if (blob.includes('mot de passe') || blob.includes('password') || blob.includes('passphrase')) return 'password';
      if (blob.includes('photo') || blob.includes('avatar') || blob.includes('image')) return 'image';
      if (blob.includes('document') || blob.includes('fichier') || blob.includes('piece jointe') || blob.includes('piece-jointe')) return 'attach_file';
      if (blob.includes('statut')) return 'flag';
      if (blob.includes('urgence') || blob.includes('priorite') || blob.includes('criticite')) return 'priority_high';
      if (blob.includes('theme') || blob.includes('thematique') || blob.includes('tag')) return 'sell';
      if (blob.includes('jour') || blob.includes('semaine') || blob.includes('mois') || blob.includes('annuelle')) return 'calendar_month';
      if (blob.includes('groupe')) return 'groups';
      if (blob.includes('membre') || blob.includes('assigne') || blob.includes('responsable') || blob.includes('owner')) return 'group';
      if (blob.includes('service')) return 'apartment';
      if (blob.includes('communaute')) return 'public';
      if (blob.includes('role')) return 'badge';
      if (blob.includes('permission') || blob.includes('habilitation')) return 'admin_panel_settings';
      if (blob.includes('competence') || blob.includes('skill')) return 'psychology';
      if (blob.includes('processus')) return 'account_tree';
      if (blob.includes('etape')) return 'stairs';
      if (blob.includes('tache')) return 'task';
      if (blob.includes('flux')) return 'compare_arrows';
      if (blob.includes('logiciel')) return 'apps';
      if (blob.includes('procedure')) return 'rule';
      if (blob.includes('scope') || blob.includes('perimetre')) return 'crop_free';
      if (blob.includes('rattachement') || blob.includes('associer')) return 'hub';
      if (blob.includes('mode')) return 'tune';
      if (blob.includes('validation') || blob.includes('approb')) return 'fact_check';
      if (blob.includes('type') || blob.includes('categorie')) return 'category';
      if (blob.includes('couleur')) return 'palette';
      if (blob.includes('icone') || blob.includes('icone')) return 'emoji_symbols';
      if (blob.includes('duree') || blob.includes('delai')) return 'timer';
      if (blob.includes('ordre') || blob.includes('ordre')) return 'format_list_numbered';
      if (blob.includes('entree') || blob.includes('input')) return 'input';
      if (blob.includes('sortie') || blob.includes('output')) return 'output';
      if (blob.includes('declencheur') || blob.includes('trigger')) return 'notifications_active';
      if (blob.includes('onglet') || blob.includes('tab')) return 'tab';
      if (blob.includes('lien') || blob.includes('url')) return 'link';
      if (blob.includes('recurrence')) return 'event_repeat';
      if (blob.includes('intervalle')) return 'tune';
      return '';
    }

    function decorateModalFieldLabels(root = document) {
      if (!root?.querySelectorAll) return;
      const modalSelectors = '[id^="modal-"], #workflow-modal, #workflow-detail-modal, #workflow-modal-body';
      const modalNodes = root.matches?.(modalSelectors)
        ? [root]
        : Array.from(root.querySelectorAll(modalSelectors));
      modalNodes.forEach((modal) => {
        const labels = modal.querySelectorAll('label, .workflow-form-label, .global-calendar-item-modal-label');
        labels.forEach((label) => {
          if (!(label instanceof HTMLElement)) return;
          if (label.dataset.modalIconDecorated === '1') return;
          const existingIcon = label.querySelector('.modal-field-icon, .material-symbols-outlined');
          if (existingIcon) {
            label.classList.add('modal-label-with-icon');
            label.dataset.modalIconDecorated = '1';
            return;
          }
          if (label.matches('summary')) return;
          if (label.querySelector('input, select, textarea, button')) return;
          const rawText = String(label.textContent || '').replace(/\s+/g, ' ').trim();
          if (!rawText) return;
          if (normalizeModalLabelText(rawText).includes('parametres avances')) return;
          const forId = String(label.getAttribute('for') || '').trim();
          const iconName = inferModalFieldIcon(rawText, forId);
          if (!iconName) return;
          const iconEl = document.createElement('span');
          iconEl.className = 'material-symbols-outlined modal-field-icon modal-field-icon-auto';
          iconEl.setAttribute('aria-hidden', 'true');
          iconEl.textContent = iconName;
          label.classList.add('modal-label-with-icon');
          label.insertBefore(iconEl, label.firstChild);
          label.dataset.modalIconDecorated = '1';
        });
      });
    }

    function scheduleModalFieldIconsDecorate() {
      if (modalFieldIconsRaf) cancelAnimationFrame(modalFieldIconsRaf);
      modalFieldIconsRaf = requestAnimationFrame(() => {
        modalFieldIconsRaf = null;
        decorateModalFieldLabels(document);
      });
    }

    function ensureModalFieldIconsObserver() {
      if (modalFieldIconsObserver || !document?.body) return;
      modalFieldIconsObserver = new MutationObserver(() => {
        scheduleModalFieldIconsDecorate();
      });
      modalFieldIconsObserver.observe(document.body, { childList: true, subtree: true });
      scheduleModalFieldIconsDecorate();
    }

    function isCloseSemanticButton(button) {
      if (!(button instanceof HTMLElement)) return false;
      const id = String(button.id || '').trim().toLowerCase();
      const txt = String(button.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
      const aria = String(button.getAttribute('aria-label') || '').trim().toLowerCase();
      const title = String(button.getAttribute('title') || '').trim().toLowerCase();
      if (id.includes('close')) return true;
      if (aria.includes('fermer') || title.includes('fermer')) return true;
      if (txt === '×' || txt === 'x' || txt.includes('fermer')) return true;
      const icon = String(button.querySelector('.material-symbols-outlined')?.textContent || '').trim().toLowerCase();
      return icon === 'close';
    }

    function applyUnifiedCloseStyle(button) {
      if (!(button instanceof HTMLElement)) return;
      button.classList.add('taskmda-modal-close-btn');
      button.setAttribute('type', 'button');
      if (!button.getAttribute('aria-label')) button.setAttribute('aria-label', 'Fermer');
      const iconEl = button.querySelector('.material-symbols-outlined');
      if (iconEl) {
        iconEl.textContent = 'close';
        iconEl.setAttribute('aria-hidden', 'true');
      }
      const label = normalizeActionButtonLabel(button.textContent || '');
      if (!label || label === '×' || label.toLowerCase() === 'x') {
        button.textContent = 'Fermer';
      } else if (!/fermer/i.test(label)) {
        button.textContent = 'Fermer';
      }
    }

    function normalizeModalCloseButtons(root = document) {
      if (!root?.querySelectorAll) return;
      const modalSelector = '[id^="modal-"], #workflow-detail-modal';
      const modals = root.matches?.(modalSelector) ? [root] : Array.from(root.querySelectorAll(modalSelector));
      modals.forEach((modal) => {
        if (!(modal instanceof HTMLElement)) return;
        const panel = modal.firstElementChild instanceof HTMLElement ? modal.firstElementChild : modal;
        if (panel) panel.classList.add('taskmda-modal-panel-unified');

        const closeButtons = Array.from(modal.querySelectorAll('button')).filter(isCloseSemanticButton);
        if (closeButtons.length > 0) {
          closeButtons.forEach((btn) => applyUnifiedCloseStyle(btn));
          return;
        }

        if (modal.dataset.modalCloseInjected === '1') return;
        const injectedBtn = document.createElement('button');
        injectedBtn.type = 'button';
        injectedBtn.className = 'taskmda-modal-close-btn taskmda-modal-close-btn-injected';
        injectedBtn.textContent = 'Fermer';
        injectedBtn.setAttribute('aria-label', 'Fermer');
        injectedBtn.addEventListener('click', () => {
          modal.classList.add('hidden');
        });
        panel.prepend(injectedBtn);
        modal.dataset.modalCloseInjected = '1';
      });
      scheduleActionButtonsDecorate();
    }

    function scheduleModalCloseButtonsNormalize() {
      if (modalCloseButtonsRaf) cancelAnimationFrame(modalCloseButtonsRaf);
      modalCloseButtonsRaf = requestAnimationFrame(() => {
        modalCloseButtonsRaf = null;
        normalizeModalCloseButtons(document);
      });
    }

    function ensureModalCloseButtonsObserver() {
      if (modalCloseButtonsObserver || !document?.body) return;
      modalCloseButtonsObserver = new MutationObserver(() => {
        scheduleModalCloseButtonsNormalize();
      });
      modalCloseButtonsObserver.observe(document.body, { childList: true, subtree: true });
      scheduleModalCloseButtonsNormalize();
    }

    return {
      normalizeModalLabelText,
      inferModalFieldIcon,
      decorateModalFieldLabels,
      scheduleModalFieldIconsDecorate,
      ensureModalFieldIconsObserver,
      isCloseSemanticButton,
      applyUnifiedCloseStyle,
      normalizeModalCloseButtons,
      scheduleModalCloseButtonsNormalize,
      ensureModalCloseButtonsObserver
    };
  }

  global.TaskMDAModalUiHarmonizer = { create };
})(window);
