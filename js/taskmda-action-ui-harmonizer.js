// taskmda-action-ui-harmonizer.js
// Harmonisation des boutons d'action et tooltips icones.
(function initTaskMdaActionUiHarmonizer(global) {
  'use strict';

  function create(deps = {}) {
    const normalizeActionButtonLabel = typeof deps.normalizeActionButtonLabel === 'function'
      ? deps.normalizeActionButtonLabel
      : (value) => String(value || '').replace(/\s+/g, ' ').trim();
    const normalizeActionToken = typeof deps.normalizeActionToken === 'function'
      ? deps.normalizeActionToken
      : (value) => normalizeActionButtonLabel(value).toLowerCase();
    const getWorkflowActionButtonsMode = typeof deps.getWorkflowActionButtonsMode === 'function'
      ? deps.getWorkflowActionButtonsMode
      : () => 'full';
    const isIconTooltipsEnabled = typeof deps.isIconTooltipsEnabled === 'function'
      ? deps.isIconTooltipsEnabled
      : () => true;

    let actionButtonsDecorateRaf = null;
    let actionButtonsObserver = null;
    let iconTooltipLayer = null;
    let iconTooltipTarget = null;

    function inferActionButtonKind(label, button) {
      const explicitKind = normalizeActionToken(button?.getAttribute?.('data-action-kind') || '');
      const knownKinds = new Set([
        'open', 'edit', 'convert', 'archive', 'danger', 'notify', 'save', 'create',
        'close', 'export', 'preview', 'sync', 'manage', 'submit', 'publish',
        'unarchive', 'template', 'registry', 'link', 'success', 'progress',
        'default', 'move_up', 'move_down'
      ]);
      if (explicitKind && knownKinds.has(explicitKind)) return explicitKind;
      const text = normalizeActionToken(label);
      if (/^\+\s*/.test(text)) return 'create';
      if (text.includes('open_in_new') || text.includes('launch')) return 'open';
      if (text.includes('sync_alt') || text.includes('swap_horiz')) return 'convert';
      if (text.includes('fermer') || text === 'close' || text.includes(' close')) return 'close';
      if (text.includes('edit') || text === 'edit') return 'edit';
      if (text.includes('dupliquer') || text.includes('duplicate') || text.includes('variante')) return 'template';
      if (text.includes('monter') || text.includes('move up')) return 'move_up';
      if (text.includes('descendre') || text.includes('move down')) return 'move_down';
      if (text.includes('filtre') || text.includes('filter')) return 'manage';
      if (text.includes('delete') || text === 'delete') return 'danger';
      if (text.includes('supprimer') || text.includes('delete')) return 'danger';
      if (text.includes('rejeter') || text.includes('reject')) return 'danger';
      if (text.includes('enregistrer') || text.includes('sauver') || text.includes('save')) return 'save';
      if (text.includes('export') || text.includes('telecharger') || text.includes('download')) return 'export';
      if (text.includes('apercu') || text.includes('preview')) return 'preview';
      if (text.includes('synchronis')) return 'sync';
      if (text.includes('restaurer') || text.includes('restore')) return 'sync';
      if (text.includes('gerer') || text.includes('manage')) return 'manage';
      if (text.includes('soumettre') || text.includes('submit')) return 'submit';
      if (text.includes('publier') || text.includes('publish')) return 'publish';
      if (text.includes('inject')) return 'create';
      if (text.includes('reactiv') || text.includes('desarchiv') || text.includes('unarchive')) return 'unarchive';
      if (text.includes('instancier') || text.includes('variante') || text.includes('template')) return 'template';
      if (text.includes('version') || text.includes('referentiel')) return 'registry';
      if (text.includes('lier') || text.includes('relier') || text.includes('link')) return 'link';
      if (text.includes('archiv')) return 'archive';
      if (text.includes('convert')) return 'convert';
      if (text.includes('modifier') || text.includes('edit')) return 'edit';
      if (text.includes('ouvrir')) return 'open';
      if (text.includes('valider') || text.includes('approuv')) return 'success';
      if (text.includes('termin')) return 'success';
      if (text.includes('en cours') || text.includes('statut')) return 'progress';
      if (text.includes('email') || text.includes('mail')) return 'notify';
      if (text.includes('checklist') || text.includes('cocher')) return 'success';
      if (text.includes('generer')) return 'create';
      if (text.includes('nouvelle tache') || text.includes('ajouter') || text.includes('creer')) return 'create';
      if (button?.classList?.contains('task-action-btn-danger') || button?.classList?.contains('card-quick-btn-danger')) return 'danger';
      if (button?.classList?.contains('task-action-btn-warn')) return 'archive';
      if (button?.classList?.contains('workflow-card-action-btn')) {
        if (button.classList.contains('is-danger')) return 'danger';
        if (button.classList.contains('is-primary')) return 'open';
      }
      return 'default';
    }

    function inferActionButtonIcon(label, button) {
      const kind = inferActionButtonKind(label, button);
      if (kind === 'danger') return 'delete';
      if (kind === 'save') return 'save';
      if (kind === 'close') return 'close';
      if (kind === 'move_up') return 'arrow_upward';
      if (kind === 'move_down') return 'arrow_downward';
      if (kind === 'export') return 'download';
      if (kind === 'preview') return 'visibility';
      if (kind === 'sync') return 'sync';
      if (kind === 'manage') return 'tune';
      if (kind === 'submit') return 'rate_review';
      if (kind === 'publish') return 'publish';
      if (kind === 'unarchive') return 'unarchive';
      if (kind === 'template') return 'content_copy';
      if (kind === 'registry') return 'inventory_2';
      if (kind === 'link') return 'link';
      if (kind === 'archive') return 'archive';
      if (kind === 'convert') return 'swap_horiz';
      if (kind === 'edit') return 'edit';
      if (kind === 'open') return 'visibility';
      if (kind === 'success') return 'task_alt';
      if (kind === 'progress') return 'play_arrow';
      if (kind === 'notify') return 'mail';
      if (kind === 'create') return 'add_circle';
      return 'more_horiz';
    }

    function sanitizeActionButtonLabel(rawValue) {
      let value = normalizeActionButtonLabel(rawValue);
      if (!value) return '';
      const iconTokens = [
        'open_in_new', 'swap_horiz', 'play_arrow', 'task_alt', 'add_circle',
        'content_copy', 'inventory_2',
        'delete', 'edit', 'visibility', 'archive', 'mail', 'download', 'save',
        'sync', 'settings', 'publish', 'unarchive', 'link', 'bolt', 'more_horiz', 'close',
        'restart_alt', 'filter_alt_off', 'filter_alt', 'search', 'tune', 'category',
        'upload', 'upload_file', 'add', 'info', 'help', 'check', 'done', 'undo'
      ];
      const leadingIconsRegex = new RegExp(`^(?:${iconTokens.join('|')})\\s+`, 'i');
      while (leadingIconsRegex.test(value)) {
        value = value.replace(leadingIconsRegex, '').trim();
      }
      return value;
    }

    function defaultFrenchActionLabel(actionKind) {
      if (actionKind === 'open') return 'Ouvrir';
      if (actionKind === 'edit') return 'Modifier';
      if (actionKind === 'convert') return 'Convertir';
      if (actionKind === 'archive') return 'Archiver';
      if (actionKind === 'danger') return 'Supprimer';
      if (actionKind === 'notify') return 'Notifier';
      if (actionKind === 'save') return 'Enregistrer';
      if (actionKind === 'create') return 'Ajouter';
      if (actionKind === 'close') return 'Fermer';
      if (actionKind === 'move_up') return 'Monter';
      if (actionKind === 'move_down') return 'Descendre';
      return 'Action';
    }

    function deriveActionButtonLabel(button) {
      if (!(button instanceof HTMLElement)) return '';
      const explicit = sanitizeActionButtonLabel(
        button.getAttribute('data-action-label')
        || button.getAttribute('aria-label')
        || button.getAttribute('title')
        || ''
      );
      if (explicit) return explicit;

      const existingLabelEl = button.querySelector('.taskmda-action-label');
      if (existingLabelEl) {
        const fromLabelEl = sanitizeActionButtonLabel(existingLabelEl.textContent || '');
        if (fromLabelEl) return fromLabelEl;
      }

      const clone = button.cloneNode(true);
      clone.querySelectorAll('.material-symbols-outlined, .taskmda-action-icon').forEach((node) => node.remove());
      return sanitizeActionButtonLabel(clone.textContent || '');
    }

    function ensureActionButtonDecor(button) {
      if (!(button instanceof HTMLElement)) return;
      if (button.dataset.actionUiDecorated === '1') return;
      const fallbackRaw = button.textContent || '';
      let label = deriveActionButtonLabel(button);
      if (!label) label = sanitizeActionButtonLabel(fallbackRaw);
      if (!label) return;
      const actionKind = inferActionButtonKind(label, button);
      if (!label) label = defaultFrenchActionLabel(actionKind);
      button.setAttribute('data-action-kind', actionKind);
      button.setAttribute('data-action-label', label);
      button.setAttribute('data-ui-tooltip', label);
      button.removeAttribute('title');
      button.setAttribute('aria-label', label);

      let iconEl = button.querySelector('.taskmda-action-icon, .material-symbols-outlined');
      if (!iconEl) {
        iconEl = document.createElement('span');
        iconEl.className = 'material-symbols-outlined taskmda-action-icon';
        iconEl.setAttribute('aria-hidden', 'true');
        iconEl.textContent = inferActionButtonIcon(label, button);
        button.insertBefore(iconEl, button.firstChild);
      } else {
        iconEl.classList.add('taskmda-action-icon');
      }

      let labelEl = button.querySelector('.taskmda-action-label');
      if (!labelEl) {
        const candidates = Array.from(button.children).filter((child) => (
          child instanceof HTMLElement
          && child !== iconEl
          && !child.classList.contains('material-symbols-outlined')
        ));
        let candidate = null;
        let candidateScore = -1;
        candidates.forEach((child) => {
          const raw = sanitizeActionButtonLabel(child.textContent || '');
          if (!raw) return;
          const score = normalizeActionToken(raw).length;
          if (score > candidateScore) {
            candidate = child;
            candidateScore = score;
          }
        });
        if (candidate) {
          candidate.classList.add('taskmda-action-label');
          labelEl = candidate;
        } else {
          labelEl = document.createElement('span');
          labelEl.className = 'taskmda-action-label';
          labelEl.textContent = label;
          Array.from(button.childNodes).forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE && String(node.textContent || '').trim()) {
              button.removeChild(node);
            }
          });
          button.appendChild(labelEl);
        }
      }
      if (labelEl && !normalizeActionButtonLabel(labelEl.textContent)) labelEl.textContent = label;
      button.dataset.actionUiDecorated = '1';
    }

    function inferTooltipLabelFromIconToken(token = '') {
      const key = normalizeActionToken(token);
      if (!key) return '';
      const map = new Map([
        ['add', 'Ajouter'],
        ['add_circle', 'Ajouter'],
        ['add_task', 'Ajouter'],
        ['link', 'Lier'],
        ['tune', 'Filtres'],
        ['filter_list', 'Filtres'],
        ['close', 'Fermer'],
        ['delete', 'Supprimer'],
        ['edit', 'Modifier'],
        ['visibility', 'Ouvrir'],
        ['save', 'Enregistrer'],
        ['mail', 'Notifier'],
        ['archive', 'Archiver'],
        ['unarchive', 'Restaurer'],
        ['sync', 'Synchroniser'],
        ['download', 'Exporter'],
        ['publish', 'Publier'],
        ['rate_review', 'Soumettre'],
        ['task_alt', 'Valider'],
        ['play_arrow', 'Mettre en cours'],
        ['content_copy', 'Modèle'],
        ['inventory_2', 'Référentiel'],
        ['logout', 'Déconnexion'],
        ['help', 'Aide'],
        ['notifications', 'Notifications'],
        ['dark_mode', 'Thème'],
        ['light_mode', 'Thème'],
        ['search', 'Recherche'],
        ['arrow_back', 'Retour'],
        ['menu', 'Menu']
      ]);
      return map.get(key) || '';
    }

    function inferTooltipLabelFromElement(el) {
      if (!(el instanceof HTMLElement)) return '';
      const byAttr = sanitizeActionButtonLabel(
        el.getAttribute('data-ui-tooltip')
        || el.getAttribute('data-action-label')
        || el.getAttribute('aria-label')
        || el.getAttribute('title')
        || ''
      );
      if (byAttr) return byAttr;

      const textClone = el.cloneNode(true);
      if (textClone?.querySelectorAll) {
        textClone.querySelectorAll('.taskmda-action-icon, .material-symbols-outlined, .tab-icon, .tab-overflow-item-icon').forEach((node) => node.remove());
      }
      const byText = sanitizeActionButtonLabel(textClone?.textContent || '');
      if (byText) return byText;

      const iconToken = String(el.querySelector('.taskmda-action-icon, .material-symbols-outlined')?.textContent || '').trim();
      const byIcon = inferTooltipLabelFromIconToken(iconToken);
      if (byIcon) return byIcon;

      const idToken = normalizeActionToken(el.id || '');
      if (idToken.includes('notification')) return 'Notifications';
      if (idToken.includes('help')) return 'Aide';
      if (idToken.includes('logout')) return 'Déconnexion';
      if (idToken.includes('filter')) return 'Filtres';
      if (idToken.includes('search')) return 'Recherche';
      if (idToken.includes('add')) return 'Ajouter';
      return '';
    }

    function isEligibleIconTooltipElement(el) {
      if (!(el instanceof HTMLElement)) return false;
      if (el.closest('.sidebar')) return false;
      if (el.closest('.workflow-quick-add-menu')) return false;
      return el.matches(
        'button.task-action-btn, button.card-quick-btn, button.workflow-card-action-btn, button.workflow-btn-light, button.workflow-btn-danger, button.workflow-btn-link-root, button.workspace-action-inline, a.workspace-action-inline, button[data-action-kind], button[data-action-label], a[data-action-kind], a[data-action-label], button.taskmda-modal-close-btn, button.rgpd-open-btn, button[data-rgpd-context-action], button[id^="rgpd-"][id$="-btn"], button#rgpd-filters-reset'
      );
    }

    function getIconTooltipLayer() {
      if (iconTooltipLayer && document.body?.contains(iconTooltipLayer)) return iconTooltipLayer;
      if (!document?.body) return null;
      const el = document.createElement('div');
      el.id = 'app-icon-tooltip-layer';
      el.className = 'app-icon-tooltip-layer hidden';
      el.setAttribute('aria-hidden', 'true');
      document.body.appendChild(el);
      iconTooltipLayer = el;
      return iconTooltipLayer;
    }

    function hideIconTooltipLayer() {
      const layer = getIconTooltipLayer();
      if (!layer) return;
      layer.classList.add('hidden');
      iconTooltipTarget = null;
    }

    function positionIconTooltipLayer(target) {
      const layer = getIconTooltipLayer();
      if (!layer || !(target instanceof HTMLElement)) return;
      const rect = target.getBoundingClientRect();
      const layerRect = layer.getBoundingClientRect();
      const margin = 10;
      let left = rect.left + (rect.width / 2) - (layerRect.width / 2);
      left = Math.max(8, Math.min(window.innerWidth - layerRect.width - 8, left));
      let top = rect.top - layerRect.height - margin;
      if (top < 8) top = rect.bottom + margin;
      layer.style.left = `${Math.round(left)}px`;
      layer.style.top = `${Math.round(top)}px`;
    }

    function showIconTooltipLayer(target) {
      if (getWorkflowActionButtonsMode() !== 'icon' || !isIconTooltipsEnabled()) return;
      if (!(target instanceof HTMLElement)) return;
      if (!isEligibleIconTooltipElement(target)) return;
      const label = sanitizeActionButtonLabel(target.getAttribute('data-ui-tooltip') || '');
      if (!label) return;
      const layer = getIconTooltipLayer();
      if (!layer) return;
      iconTooltipTarget = target;
      layer.textContent = label;
      layer.classList.remove('hidden');
      positionIconTooltipLayer(target);
    }

    function refreshIconTooltipLayerForTarget(target) {
      if (!(target instanceof HTMLElement)) return;
      if (iconTooltipTarget !== target) return;
      showIconTooltipLayer(target);
    }

    function ensureIconTooltipLayerBindings() {
      if (document.documentElement?.dataset.iconTooltipLayerBound === '1') return;
      if (!document?.body) return;
      document.documentElement.dataset.iconTooltipLayerBound = '1';

      const findTooltipTrigger = (node) => {
        const el = node instanceof Element ? node : null;
        if (!el) return null;
        const trigger = el.closest('[data-ui-tooltip]');
        return isEligibleIconTooltipElement(trigger) ? trigger : null;
      };

      document.addEventListener('mouseover', (event) => {
        const trigger = findTooltipTrigger(event.target);
        if (!trigger) return;
        showIconTooltipLayer(trigger);
      }, true);

      document.addEventListener('mouseout', (event) => {
        const from = findTooltipTrigger(event.target);
        if (!from) return;
        const to = event.relatedTarget instanceof Element ? event.relatedTarget.closest('[data-ui-tooltip]') : null;
        if (from === to) return;
        hideIconTooltipLayer();
      }, true);

      document.addEventListener('focusin', (event) => {
        const trigger = findTooltipTrigger(event.target);
        if (!trigger) return;
        showIconTooltipLayer(trigger);
      }, true);

      document.addEventListener('focusout', (event) => {
        const trigger = findTooltipTrigger(event.target);
        if (!trigger) return;
        const to = event.relatedTarget instanceof Element ? event.relatedTarget.closest('[data-ui-tooltip]') : null;
        if (trigger === to) return;
        hideIconTooltipLayer();
      }, true);

      window.addEventListener('scroll', () => {
        if (!iconTooltipTarget) return;
        positionIconTooltipLayer(iconTooltipTarget);
      }, true);

      window.addEventListener('resize', () => {
        if (!iconTooltipTarget) return;
        positionIconTooltipLayer(iconTooltipTarget);
      });
    }

    function ensureGlobalIconTooltips(root = document) {
      if (!root?.querySelectorAll) return;
      if (getWorkflowActionButtonsMode() !== 'icon' || !isIconTooltipsEnabled()) {
        root.querySelectorAll('[data-ui-tooltip]').forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (isEligibleIconTooltipElement(node)) node.removeAttribute('data-ui-tooltip');
        });
        hideIconTooltipLayer();
        return;
      }
      const selectors = 'button, a, [role="button"]';
      const candidates = [];
      if (root.matches?.(selectors)) candidates.push(root);
      root.querySelectorAll(selectors).forEach((node) => candidates.push(node));
      candidates.forEach((el) => {
        if (!(el instanceof HTMLElement)) return;
        if (!isEligibleIconTooltipElement(el)) {
          el.removeAttribute('data-ui-tooltip');
          return;
        }
        const hasIcon = !!el.querySelector('.taskmda-action-icon, .material-symbols-outlined');
        if (!hasIcon) return;
        const label = inferTooltipLabelFromElement(el);
        if (!label) return;
        el.setAttribute('data-ui-tooltip', label);
        if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', label);
        el.removeAttribute('title');
        el.querySelectorAll('[title]').forEach((child) => child.removeAttribute('title'));
      });
    }

    function harmonizeCreateCtaButtons(root = document) {
      if (!root?.querySelectorAll) return;
      const createButtonCatalog = [
        ['btn-global-doc-add', 'Ajouter doc hors projet'],
        ['btn-global-theme-add', 'Ajouter'],
        ['btn-global-group-add', 'Ajouter'],
        ['btn-global-role-add', 'Ajouter'],
        ['btn-software-add', 'Ajouter'],
        ['btn-add-member', 'Ajouter membre'],
        ['btn-create-user-group', 'Créer groupe utilisateurs'],
        ['btn-create-group', 'Créer groupe'],
        ['btn-add-theme', 'Ajouter'],
        ['btn-add-project-documents', 'Ajouter document(s)'],
        ['btn-task-assignee-quick-add', 'Ajouter'],
        ['btn-open-global-calendar-item-modal', 'Ajouter info hors projet'],
        ['rgpd-new-btn', 'Nouvelle activité'],
        ['workflow-quick-add-toggle', 'Ajouter']
      ];
      createButtonCatalog.forEach(([id, fallbackLabel]) => {
        const button = document.getElementById(id);
        if (!(button instanceof HTMLElement)) return;
        button.classList.add('taskmda-create-cta');
        button.setAttribute('data-action-kind', 'create');
        if (!button.getAttribute('data-action-label')) {
          const textLabel = String(button.textContent || '').replace(/\s+/g, ' ').trim();
          button.setAttribute('data-action-label', textLabel || fallbackLabel);
        }
        if (!button.getAttribute('aria-label')) {
          button.setAttribute('aria-label', button.getAttribute('data-action-label') || fallbackLabel);
        }
      });
    }

    function harmonizeSemanticActionButtons(root = document) {
      if (!root?.querySelectorAll) return;
      const actionButtonCatalog = [
        ['btn-send-invite', 'notify', 'Inviter'],
        ['btn-send-message', 'submit', 'Envoyer'],
        ['btn-global-send-message', 'submit', 'Envoyer'],
        ['global-doc-reset', 'default', 'Réinitialiser'],
        ['docs-filter-reset', 'default', 'Réinitialiser'],
        ['btn-global-feed-post', 'submit', 'Publier'],
        ['btn-global-feed-cancel', 'close', 'Annuler'],
        ['btn-global-feed-digest', 'convert', 'Synthétiser un document'],
        ['btn-project-note-digest', 'convert', 'Digérer document'],
        ['btn-global-feed-insert-mention', 'link', 'Insérer @mention'],
        ['btn-global-calendar-pin-theme', 'manage', 'Épingler la thématique'],
        ['btn-project-doc-select-all', 'manage', 'Tout sélectionner'],
        ['btn-project-doc-clear-selection', 'manage', 'Tout désélectionner'],
        ['btn-save-doc-binding', 'save', 'Enregistrer'],
        ['btn-save-doc-editor', 'save', 'Enregistrer'],
        ['btn-save-app-branding', 'save', 'Enregistrer'],
        ['btn-assign-app-admin', 'manage', 'Définir admin'],
        ['btn-reset-app-branding', 'default', 'Valeurs par défaut'],
        ['btn-reset-test-data', 'danger', 'Réinitialiser les données locales'],
        ['btn-via-annuaire-ror-save', 'save', 'Enregistrer'],
        ['btn-via-annuaire-ror-test', 'sync', 'Tester'],
        ['btn-via-annuaire-live-search', 'open', 'Rechercher'],
        ['btn-via-annuaire-live-prev', 'default', 'Page précédente'],
        ['btn-via-annuaire-live-next', 'default', 'Page suivante'],
        ['btn-remove-profile-photo', 'danger', 'Retirer'],
        ['btn-export-user-json', 'export', 'Exporter JSON'],
        ['btn-import-user-json', 'open', 'Importer JSON'],
        ['btn-hard-sync-global-identities', 'sync', 'Lancer le hard sync global'],
        ['btn-export-excel', 'export', 'Exporter projets et tâches (CSV Excel)'],
        ['btn-change-password', 'manage', 'Changer le mot de passe'],
        ['btn-show-recovery-key', 'open', 'Afficher la clé de récupération'],
        ['btn-regenerate-recovery-key', 'sync', 'Régénérer la clé']
      ];
      actionButtonCatalog.forEach(([id, actionKind, fallbackLabel]) => {
        const button = document.getElementById(id);
        if (!(button instanceof HTMLElement)) return;
        if (!button.getAttribute('data-action-kind')) button.setAttribute('data-action-kind', actionKind);
        if (!button.getAttribute('data-action-label')) {
          const textLabel = String(button.textContent || '').replace(/\s+/g, ' ').trim();
          button.setAttribute('data-action-label', textLabel || fallbackLabel);
        }
        if (!button.getAttribute('aria-label')) {
          button.setAttribute('aria-label', button.getAttribute('data-action-label') || fallbackLabel);
        }
      });
    }

    function harmonizeUtilityButtonsExclusions(root = document) {
      if (!root?.querySelectorAll) return;
      const utilityExclusionIds = [
        'btn-theme-toggle',
        'btn-notifications',
        'btn-open-app-help',
        'btn-sidebar-collapse',
        'btn-project-prev',
        'btn-project-next',
        'btn-toggle-global-message-sidebar',
        'btn-toggle-global-feed-composer',
        'btn-toggle-docs-upload',
        'btn-via-annuaire-config-toggle',
        'btn-via-annuaire-live-audit-toggle',
        'btn-toggle-project-description',
        'btn-project-settings-subnav-horizontal',
        'btn-project-settings-subnav-vertical',
        'btn-project-settings-work-focus',
        'btn-project-subnav-horizontal',
        'btn-project-subnav-vertical',
        'btn-project-work-focus'
      ];
      utilityExclusionIds.forEach((id) => {
        const button = document.getElementById(id);
        if (!(button instanceof HTMLElement)) return;
        button.dataset.actionUtility = 'excluded';
        button.removeAttribute('data-action-kind');
        button.removeAttribute('data-action-label');
        button.removeAttribute('data-ui-tooltip');
        delete button.dataset.actionUiDecorated;
      });

      root.querySelectorAll('.workflow-quick-add-menu .workflow-quick-add-item').forEach((button) => {
        if (!(button instanceof HTMLElement)) return;
        button.dataset.actionUtility = 'excluded';
        button.removeAttribute('data-action-kind');
        button.removeAttribute('data-action-label');
        button.removeAttribute('data-ui-tooltip');
        delete button.dataset.actionUiDecorated;
      });
    }

    function applyActionButtonsDisplayMode(root = document) {
      if (!root?.querySelectorAll) return;
      harmonizeCreateCtaButtons(root);
      harmonizeSemanticActionButtons(root);
      harmonizeUtilityButtonsExclusions(root);
      const selectors = [
        'button.task-action-btn',
        'button.card-quick-btn',
        'button.workflow-card-action-btn',
        'button.workflow-btn-light',
        'button.workflow-btn-danger',
        'button.workflow-btn-link-root',
        'button#workflow-quick-add-toggle',
        'button#workflow-filters-toggle',
        'button.workspace-action-inline',
        'a.workspace-action-inline',
        'button[data-action-kind]',
        'button[data-action-label]',
        'a[data-action-kind]',
        'a[data-action-label]',
        'button[id^="btn-workflow-"]',
        'button[data-wf-card-action]',
        'button[data-wf-flow-action]',
        'button[data-wf-flow-bulk-action]',
        'button[data-wf-designer-action]',
        'button[data-wf-designer-add-type]',
        'button[data-wf-governance-action]',
        'button[data-wf-governance-export]',
        'button[data-wf-analytics-action]',
        'button[data-wf-history-diff-toggle]',
        'button[data-wf-history-restore]',
        'button[data-wf-history-restore-fields]',
        'button.taskmda-modal-close-btn',
        'button.rgpd-open-btn',
        'button[data-rgpd-context-action]',
        'button[id^="rgpd-"][id$="-btn"]',
        'button#rgpd-filters-reset'
      ].join(', ');
      root.querySelectorAll(selectors).forEach((button) => {
        if (button instanceof HTMLElement && button.closest('.workflow-quick-add-menu')) return;
        if (button instanceof HTMLElement && button.dataset.actionUtility === 'excluded') return;
        ensureActionButtonDecor(button);
        button.removeAttribute('title');
        button.querySelectorAll('[title]').forEach((child) => child.removeAttribute('title'));
      });
      root.querySelectorAll('[data-ui-tooltip][title], [data-action-kind][title], [data-action-label][title]').forEach((node) => {
        node.removeAttribute('title');
      });
      ensureGlobalIconTooltips(root);
      ensureIconTooltipLayerBindings();
    }

    function scheduleActionButtonsDecorate() {
      if (actionButtonsDecorateRaf) cancelAnimationFrame(actionButtonsDecorateRaf);
      actionButtonsDecorateRaf = requestAnimationFrame(() => {
        actionButtonsDecorateRaf = null;
        applyActionButtonsDisplayMode(document);
      });
    }

    function ensureActionButtonsObserver() {
      if (actionButtonsObserver || !document?.body) return;
      actionButtonsObserver = new MutationObserver(() => {
        scheduleActionButtonsDecorate();
      });
      actionButtonsObserver.observe(document.body, { childList: true, subtree: true });
      scheduleActionButtonsDecorate();
    }

    global.TaskMDARefreshIconTooltip = refreshIconTooltipLayerForTarget;

    return {
      inferActionButtonKind,
      inferActionButtonIcon,
      sanitizeActionButtonLabel,
      deriveActionButtonLabel,
      ensureActionButtonDecor,
      inferTooltipLabelFromIconToken,
      inferTooltipLabelFromElement,
      isEligibleIconTooltipElement,
      ensureGlobalIconTooltips,
      getIconTooltipLayer,
      hideIconTooltipLayer,
      positionIconTooltipLayer,
      showIconTooltipLayer,
      ensureIconTooltipLayerBindings,
      harmonizeCreateCtaButtons,
      harmonizeSemanticActionButtons,
      harmonizeUtilityButtonsExclusions,
      applyActionButtonsDisplayMode,
      scheduleActionButtonsDecorate,
      ensureActionButtonsObserver
    };
  }

  global.TaskMDAActionUiHarmonizer = { create };
})(window);
