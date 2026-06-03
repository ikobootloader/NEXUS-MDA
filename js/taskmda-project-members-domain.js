(function initTaskMdaProjectMembersDomainModule(global) {
  'use strict';

  function createModule(options) {
    const opts = options || {};
    const state = opts.state || {};

    const stateAccessors = (global.TaskMDACoreUtils && typeof global.TaskMDACoreUtils.createStateAccessors === 'function')
      ? global.TaskMDACoreUtils.createStateAccessors(state)
      : null;
    const getCurrentProjectId = stateAccessors
      ? stateAccessors.getCurrentProjectId
      : () => (typeof state.getCurrentProjectId === 'function' ? state.getCurrentProjectId() : null);
    const getCurrentProjectState = stateAccessors
      ? stateAccessors.getCurrentProjectState
      : () => (typeof state.getCurrentProjectState === 'function' ? state.getCurrentProjectState() : null);
    const getCurrentUser = stateAccessors
      ? stateAccessors.getCurrentUser
      : () => (typeof state.getCurrentUser === 'function' ? state.getCurrentUser() : null);

    function getSelectedUserGroupId() {
      return typeof state.getSelectedUserGroupId === 'function' ? state.getSelectedUserGroupId() : null;
    }

    function setSelectedUserGroupId(value) {
      if (typeof state.setSelectedUserGroupId === 'function') {
        state.setSelectedUserGroupId(value || null);
      }
    }

    function getSelectedProjectGroupId() {
      return typeof state.getSelectedProjectGroupId === 'function' ? state.getSelectedProjectGroupId() : null;
    }

    function setSelectedProjectGroupId(value) {
      if (typeof state.setSelectedProjectGroupId === 'function') {
        state.setSelectedProjectGroupId(value || null);
      }
    }

    async function addProjectMember() {
      const currentProjectId = getCurrentProjectId();
      const currentProjectState = getCurrentProjectState();
      if (!currentProjectId || !currentProjectState) return;
      if (!opts.canManageProjectCollaboration?.(currentProjectState)) {
        opts.showToast?.('Action non autorisee');
        return;
      }

      const input = document.getElementById('member-name-input');
      const roleInput = document.getElementById('member-role-input');
      const name = String(input?.value || '').trim();
      const selectedRoleKey = String(roleInput?.value || 'member').trim() || 'member';
      const role = opts.getProjectRoleMeta?.(selectedRoleKey)?.roleKey || 'member';
      const targetRoleBase = opts.normalizeProjectRole?.(selectedRoleKey) || 'member';
      const myRole = opts.normalizeProjectRole?.(opts.getMyProjectRole?.(currentProjectState)) || 'member';
      if (myRole === 'manager' && targetRoleBase !== 'member') {
        opts.showToast?.('Action non autorisee');
        return;
      }
      if (!name) {
        opts.showToast?.('Saisissez le nom du membre');
        input?.focus();
        return;
      }

      const users = await opts.getAllDecrypted?.('users', 'userId') || [];
      const directoryUsers = await opts.getAllDecrypted?.('directoryUsers', 'userId') || [];
      const byName = (entry) => opts.normalizeSearch?.(entry?.name || '') === opts.normalizeSearch?.(name);
      let user = users.find(byName);
      const directoryUser = directoryUsers.find(byName);
      if (!user && directoryUser) {
        user = {
          userId: directoryUser.userId,
          name: directoryUser.name,
          email: directoryUser.email || '',
          createdAt: Date.now()
        };
        await opts.putEncrypted?.('users', user, 'userId');
      }
      if (!user) {
        user = { userId: opts.uuidv4?.() || String(Date.now()), name, createdAt: Date.now() };
        await opts.putEncrypted?.('users', user, 'userId');
      }

      await opts.upsertDirectoryUser?.({
        userId: user.userId,
        name: user.name,
        email: user.email || '',
        source: 'member_add',
        lastSeenAt: Date.now()
      });

      const exists = (currentProjectState.members || []).some((m) => m.userId === user.userId);
      if (exists) {
        opts.showToast?.('Ce membre est déjà dans le projet');
        return;
      }

      const currentUser = getCurrentUser();
      const event = opts.createEvent?.(
        opts.EventTypes?.ADD_MEMBER,
        currentProjectId,
        currentUser?.userId,
        { userId: user.userId, role, displayName: user.name }
      );
      await opts.publishEvent?.(event);
      if (opts.getSharedFolderHandle?.()) {
        void opts.syncProjectEventsToSharedSpace?.(currentProjectId, [event]);
      }

      if (input) input.value = '';
      opts.showToast?.('Membre ajouté');
      opts.addNotification?.('Membre', `${user.name} a ete ajoute au projet`, currentProjectId);
      await opts.showProjectDetail?.(currentProjectId);
    }

    async function removeProjectMember(userId) {
      const currentProjectId = getCurrentProjectId();
      const currentProjectState = getCurrentProjectState();
      const currentUser = getCurrentUser();
      if (!currentProjectId || !currentProjectState || !userId) return;
      if (userId === currentUser?.userId) {
        opts.showToast?.('Vous ne pouvez pas vous retirer vous-même');
        return;
      }

      if (!opts.canManageProjectCollaboration?.(currentProjectState)) {
        opts.showToast?.('Action non autorisee');
        return;
      }

      const target = (currentProjectState.members || []).find((m) => m.userId === userId);
      if (!target) return;
      const myRole = opts.normalizeProjectRole?.(opts.getMyProjectRole?.(currentProjectState)) || 'member';
      const targetRole = opts.normalizeProjectRole?.(target.role) || 'member';
      if (myRole === 'manager' && targetRole !== 'member') {
        opts.showToast?.('Action non autorisee');
        return;
      }
      if (!global.confirm(`Retirer ${target.displayName || userId} du projet ?`)) return;

      const event = opts.createEvent?.(
        opts.EventTypes?.REMOVE_MEMBER,
        currentProjectId,
        currentUser?.userId,
        { userId }
      );
      await opts.publishEvent?.(event);
      if (opts.getSharedFolderHandle?.()) {
        void opts.syncProjectEventsToSharedSpace?.(currentProjectId, [event], { ensureRegistered: true });
      }
      opts.showToast?.('Membre retiré');
      opts.addNotification?.('Membre', 'Un membre a ete retire du projet', currentProjectId);
      await opts.showProjectDetail?.(currentProjectId);
    }

    async function createUserGroup() {
      const currentProjectId = getCurrentProjectId();
      const currentProjectState = getCurrentProjectState();
      const currentUser = getCurrentUser();
      if (!currentProjectId || !currentProjectState) return;
      if (!opts.canManageProjectCollaboration?.(currentProjectState)) {
        opts.showToast?.('Action non autorisee');
        return;
      }
      const nameInput = document.getElementById('user-group-name-input');
      const membersSelect = document.getElementById('user-group-members-input');
      const name = String(nameInput?.value || '').trim();
      if (!name) {
        opts.showToast?.('Nom de groupe utilisateurs requis');
        return;
      }
      const exists = (currentProjectState.userGroups || []).some(
        (g) => opts.normalizeSearch?.(g.name) === opts.normalizeSearch?.(name)
      );
      if (exists) {
        opts.showToast?.('Ce groupe utilisateurs existe deja');
        return;
      }
      const selectedIds = Array.from(membersSelect?.selectedOptions || []).map((o) => o.value).filter(Boolean);
      const event = opts.createEvent?.(
        opts.EventTypes?.CREATE_USER_GROUP,
        currentProjectId,
        currentUser?.userId,
        { groupId: opts.uuidv4?.() || String(Date.now()), name, memberUserIds: selectedIds }
      );
      await opts.publishEvent?.(event);
      if (opts.getSharedFolderHandle?.()) void opts.syncProjectEventsToSharedSpace?.(currentProjectId, [event]);
      if (nameInput) nameInput.value = '';
      opts.showToast?.('Groupe utilisateurs cree');
      await opts.showProjectDetail?.(currentProjectId);
    }

    async function updateUserGroupSelection() {
      const currentProjectId = getCurrentProjectId();
      const currentProjectState = getCurrentProjectState();
      const currentUser = getCurrentUser();
      const selectedUserGroupId = getSelectedUserGroupId();
      if (!currentProjectId || !currentProjectState || !selectedUserGroupId) return;
      if (!opts.canManageProjectCollaboration?.(currentProjectState)) {
        opts.showToast?.('Action non autorisee');
        return;
      }
      const exists = (currentProjectState.userGroups || []).some((g) => g.groupId === selectedUserGroupId);
      if (!exists) {
        opts.showToast?.('Selectionnez un groupe utilisateurs');
        return;
      }
      const membersSelect = document.getElementById('user-group-members-input');
      const selectedIds = Array.from(membersSelect?.selectedOptions || []).map((o) => o.value).filter(Boolean);
      const event = opts.createEvent?.(
        opts.EventTypes?.UPDATE_USER_GROUP,
        currentProjectId,
        currentUser?.userId,
        { groupId: selectedUserGroupId, changes: { memberUserIds: [...new Set(selectedIds)] } }
      );
      await opts.publishEvent?.(event);
      if (opts.getSharedFolderHandle?.()) void opts.syncProjectEventsToSharedSpace?.(currentProjectId, [event]);
      opts.showToast?.('Groupe utilisateurs mis a jour');
      await opts.showProjectDetail?.(currentProjectId);
    }

    async function deleteUserGroup(groupId) {
      const currentProjectId = getCurrentProjectId();
      const currentProjectState = getCurrentProjectState();
      const currentUser = getCurrentUser();
      if (!currentProjectId || !currentProjectState || !groupId) return;
      if (!opts.canManageProjectCollaboration?.(currentProjectState)) {
        opts.showToast?.('Action non autorisee');
        return;
      }
      const group = (currentProjectState.userGroups || []).find((g) => g.groupId === groupId);
      if (!group) return;
      if (!global.confirm(`Supprimer le groupe utilisateurs "${group.name}" ?`)) return;
      const event = opts.createEvent?.(
        opts.EventTypes?.DELETE_USER_GROUP,
        currentProjectId,
        currentUser?.userId,
        { groupId }
      );
      await opts.publishEvent?.(event);
      if (opts.getSharedFolderHandle?.()) void opts.syncProjectEventsToSharedSpace?.(currentProjectId, [event]);
      if (getSelectedUserGroupId() === groupId) setSelectedUserGroupId(null);
      opts.showToast?.('Groupe utilisateurs supprime');
      await opts.showProjectDetail?.(currentProjectId);
    }

    async function renderProjectUserGroups(state) {
      const list = document.getElementById('project-user-groups-list');
      const createBtn = document.getElementById('btn-create-user-group');
      const updateBtn = document.getElementById('btn-update-user-group');
      const membersSelect = document.getElementById('user-group-members-input');
      if (!list || !createBtn || !updateBtn || !membersSelect) return;

      const canManage = opts.canManageProjectCollaboration?.(state);
      createBtn.disabled = !canManage;
      createBtn.classList.toggle('opacity-50', !canManage);
      updateBtn.disabled = !canManage;
      updateBtn.classList.toggle('opacity-50', !canManage);
      membersSelect.disabled = !canManage;

      await opts.renderUserGroupMemberSelect?.(state);
      const members = await opts.getProjectMembersResolved?.(state) || [];
      const byId = new Map(members.map((m) => [m.userId, m.displayNameResolved]));
      const userGroups = state?.userGroups || [];

      if (userGroups.length === 0) {
        list.innerHTML = `
          <div class="empty-state-card">
            <p class="empty-state-title">Aucun groupe utilisateurs</p>
            <p class="empty-state-text">Regroupez des membres pour assigner plus vite les tâches collaboratives.</p>
            ${canManage ? '<button class="empty-state-cta" onclick="focusElementById(\'user-group-name-input\')">Créer un groupe utilisateurs</button>' : ''}
          </div>
        `;
        setSelectedUserGroupId(null);
        return;
      }

      if (!getSelectedUserGroupId() || !userGroups.find((g) => g.groupId === getSelectedUserGroupId())) {
        setSelectedUserGroupId(userGroups[0].groupId);
      }

      list.innerHTML = userGroups.map((group) => {
        const active = group.groupId === getSelectedUserGroupId();
        const memberNames = (group.memberUserIds || []).map((id) => byId.get(id) || opts.fallbackDirectoryName?.(id) || id);
        const groupName = opts.escapeHtml?.(group.name || 'Groupe') || (group.name || 'Groupe');
        const memberSummary = opts.escapeHtml?.(memberNames.join(', ') || 'Aucun membre') || (memberNames.join(', ') || 'Aucun membre');
        return `
          <div class="rounded-lg border ${active ? 'border-primary bg-blue-50' : 'border-slate-200 bg-white'} p-3">
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="text-sm font-semibold text-slate-800">${groupName}</p>
                <p class="text-xs text-slate-500 mt-1">${memberSummary}</p>
              </div>
              <div class="flex items-center gap-2 text-xs">
                <button onclick="selectUserGroup('${group.groupId}')" class="task-action-btn task-action-btn-subtle" data-action-kind="open">Selectionner</button>
                ${canManage ? `<button onclick="deleteUserGroup('${group.groupId}')" class="task-action-btn task-action-btn-danger" data-action-kind="danger">Supprimer</button>` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('');

      const selected = userGroups.find((g) => g.groupId === getSelectedUserGroupId());
      const selectedIds = new Set(selected?.memberUserIds || []);
      Array.from(membersSelect.options || []).forEach((opt) => {
        opt.selected = selectedIds.has(opt.value);
      });
    }

    async function renderProjectMembers(state) {
      const container = document.getElementById('project-members-list');
      const addBtn = document.getElementById('btn-add-member');
      const nameInput = document.getElementById('member-name-input');
      const roleInput = document.getElementById('member-role-input');
      if (!container || !addBtn || !nameInput || !roleInput) return;

      const members = await opts.getProjectMembersResolved?.(state) || [];
      const canManage = opts.canManageProjectCollaboration?.(state);
      const myRole = opts.normalizeProjectRole?.(opts.getMyProjectRole?.(state));
      renderProjectRoleSelectors(state);

      addBtn.disabled = !canManage;
      addBtn.classList.toggle('opacity-50', !canManage);
      nameInput.disabled = !canManage;
      roleInput.disabled = !canManage;
      await renderMemberDirectoryAutocomplete(state);

      if (members.length === 0) {
        container.innerHTML = '<p class="text-sm text-slate-500">Aucun membre dans ce projet.</p>';
        return;
      }

      const currentUser = getCurrentUser();
      container.innerHTML = members.map((member) => {
        const displayName = opts.escapeHtml?.(member.displayNameResolved || opts.fallbackDirectoryName?.(member.userId) || member.userId)
          || (member.displayNameResolved || opts.fallbackDirectoryName?.(member.userId) || member.userId);
        const normalizedRole = opts.normalizeProjectRole?.(member.role);
        const role = opts.escapeHtml?.(opts.getProjectRoleLabel?.(member.role) || '')
          || (opts.getProjectRoleLabel?.(member.role) || '');
        const canRemoveMember = canManage
          && member.userId !== currentUser?.userId
          && (myRole === 'owner' || normalizedRole === 'member');
        const removeBtn = canRemoveMember
          ? `<button onclick="removeProjectMember('${opts.escapeHtml?.(member.userId) || member.userId}')" class="task-action-btn task-action-btn-danger" data-action-kind="danger">Retirer</button>`
          : '';
        return `
          <div class="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 bg-slate-50">
            <div class="min-w-0">
              <p class="text-sm font-semibold text-slate-800 truncate">${displayName}</p>
              <p class="text-xs text-slate-500">Rôle: ${role}</p>
            </div>
            ${removeBtn}
          </div>
        `;
      }).join('');
    }

    async function renderMemberDirectoryAutocomplete(state) {
      const input = document.getElementById('member-name-input');
      const list = document.getElementById('member-name-options');
      if (!input || !list) return;
      const directoryUsers = await opts.getAllDecrypted?.('directoryUsers', 'userId');
      const existingMemberIds = new Set((state?.members || []).map((m) => m.userId));
      const names = Array.from(new Set(
        (directoryUsers || [])
          .filter((u) => u && u.userId && !existingMemberIds.has(u.userId))
          .map((u) => String(u.name || '').trim())
          .filter(Boolean)
      )).sort((a, b) => a.localeCompare(b, 'fr'));
      list.innerHTML = names.map((name) => `<option value="${opts.escapeHtml?.(name) || name}"></option>`).join('');
    }

    function getAssignableProjectRolesForUser(state = getCurrentProjectState()) {
      const myRole = opts.normalizeProjectRole?.(opts.getMyProjectRole?.(state));
      const catalog = opts.getProjectRoleCatalog?.() || [];
      if (myRole === 'owner') return catalog;
      if (myRole === 'manager') {
        return catalog.filter((item) => opts.normalizeProjectRoleBase?.(item?.baseRole) === 'member');
      }
      return [];
    }

    function renderProjectRoleSelectors(state = getCurrentProjectState()) {
      const roleInputs = [
        document.getElementById('member-role-input'),
        document.getElementById('invite-role-input')
      ].filter(Boolean);
      if (roleInputs.length === 0) return;
      const options = getAssignableProjectRolesForUser(state);
      roleInputs.forEach((input) => {
        const previous = String(input.value || '').trim();
        input.innerHTML = options.length === 0
          ? ''
          : options.map((item) => {
            const baseLabel = opts.getBaseProjectRoleLabel?.(item.baseRole) || String(item.baseRole || '');
            const label = item.isSystem ? item.label : `${item.label} (${baseLabel})`;
            return `<option value="${opts.escapeHtml?.(item.roleKey) || item.roleKey}">${opts.escapeHtml?.(label) || label}</option>`;
          }).join('');
        if (options.length === 0) {
          input.disabled = true;
          return;
        }
        input.disabled = false;
        const hasPrev = options.some((item) => item.roleKey === previous);
        input.value = hasPrev ? previous : options[0].roleKey;
      });
    }

    function selectUserGroup(groupId) {
      setSelectedUserGroupId(groupId || null);
      void renderProjectUserGroups(getCurrentProjectState());
    }

    async function sendInvitationEmail(inviteId) {
      const currentProjectId = getCurrentProjectId();
      const currentProjectState = getCurrentProjectState();
      const currentUser = getCurrentUser();
      if (!currentProjectId) return;
      if (!opts.canManageProjectCollaboration?.(currentProjectState)) {
        opts.showToast?.('Seuls Propriétaire/Manager peuvent envoyer des invitations');
        return;
      }
      const state = await opts.getProjectState?.(currentProjectId);
      const invite = (state?.invites || []).find((i) => i.inviteId === inviteId);
      if (!invite) return;

      const projectName = state?.project?.name || 'Projet';
      const roleLabel = opts.getProjectRoleLabel?.(invite.role) || 'membre';
      const typeLabel = invite.inviteType === 'agent' ? 'agent' : 'utilisateur';
      const subject = `[NEXUS MDA] Invitation projet: ${projectName}`;
      const body = [
        `Bonjour ${invite.displayName || ''},`,
        '',
        `Vous êtes invité(e) en tant que ${typeLabel} (${roleLabel}) sur le projet "${projectName}".`,
        '',
        'Merci de confirmer votre disponibilité et votre prise en charge.',
        '',
        `Envoyé par: ${currentUser?.name || 'Equipe projet'}`,
        `Date: ${new Date().toLocaleDateString('fr-FR')}`
      ].join('\n');

      opts.openMailto?.({ to: [invite.email], subject, body });

      const event = opts.createEvent?.(
        opts.EventTypes?.UPDATE_INVITE,
        currentProjectId,
        currentUser?.userId,
        { inviteId, changes: { status: 'sent', lastSentAt: Date.now() } }
      );
      await opts.publishEvent?.(event);
      if (opts.getSharedFolderHandle?.()) void opts.syncProjectEventsToSharedSpace?.(currentProjectId, [event]);
      await opts.showProjectDetail?.(currentProjectId);
    }

    async function updateInviteStatus(inviteId, status) {
      const currentProjectId = getCurrentProjectId();
      const currentProjectState = getCurrentProjectState();
      const currentUser = getCurrentUser();
      if (!currentProjectId || !inviteId) return;
      if (!opts.canManageProjectCollaboration?.(currentProjectState)) {
        opts.showToast?.('Seuls Propriétaire/Manager peuvent mettre à jour les invitations');
        return;
      }
      const normalized = ['pending', 'sent', 'accepted', 'declined'].includes(status) ? status : 'pending';
      const invite = (currentProjectState?.invites || []).find((i) => i.inviteId === inviteId);
      const myRole = opts.normalizeProjectRole?.(opts.getMyProjectRole?.(currentProjectState)) || 'member';
      if (normalized === 'accepted' && myRole === 'manager' && (opts.normalizeProjectRole?.(invite?.role) || 'member') !== 'member') {
        opts.showToast?.('Action non autorisee');
        return;
      }
      const event = opts.createEvent?.(
        opts.EventTypes?.UPDATE_INVITE,
        currentProjectId,
        currentUser?.userId,
        { inviteId, changes: { status: normalized } }
      );
      await opts.publishEvent?.(event);
      if (opts.getSharedFolderHandle?.()) void opts.syncProjectEventsToSharedSpace?.(currentProjectId, [event]);
      if (normalized === 'accepted' && invite) {
        const users = await opts.getAllDecrypted?.('users', 'userId') || [];
        let user = users.find((u) => opts.normalizeSearch?.(u.name) === opts.normalizeSearch?.(invite.displayName));
        if (!user) {
          user = {
            userId: opts.uuidv4?.() || String(Date.now()),
            name: invite.displayName,
            email: invite.email,
            createdAt: Date.now()
          };
          await opts.putEncrypted?.('users', user, 'userId');
        }
        await opts.upsertDirectoryUser?.({
          userId: user.userId,
          name: user.name,
          email: user.email || '',
          source: 'invite_accept',
          lastSeenAt: Date.now()
        });
        const memberExists = (currentProjectState?.members || []).some((m) => m.userId === user.userId);
        if (!memberExists) {
          const memberEvent = opts.createEvent?.(
            opts.EventTypes?.ADD_MEMBER,
            currentProjectId,
            currentUser?.userId,
            { userId: user.userId, role: invite.role || 'member', displayName: user.name }
          );
          await opts.publishEvent?.(memberEvent);
          if (opts.getSharedFolderHandle?.()) void opts.syncProjectEventsToSharedSpace?.(currentProjectId, [memberEvent]);
        }
      }
      opts.showToast?.(`Invitation marquée: ${normalized}`);
      await opts.showProjectDetail?.(currentProjectId);
    }

    async function addProjectInvite() {
      const currentProjectId = getCurrentProjectId();
      const currentProjectState = getCurrentProjectState();
      const currentUser = getCurrentUser();
      if (!currentProjectId || !currentProjectState) return;
      if (!opts.canManageProjectCollaboration?.(currentProjectState)) {
        opts.showToast?.('Seuls Propriétaire/Manager peuvent inviter');
        return;
      }

      const nameInput = document.getElementById('invite-name-input');
      const emailInput = document.getElementById('invite-email-input');
      const typeInput = document.getElementById('invite-type-input');
      const roleInput = document.getElementById('invite-role-input');
      const displayName = String(nameInput?.value || '').trim();
      const email = String(emailInput?.value || '').trim().toLowerCase();
      const inviteType = String(typeInput?.value || 'user').trim();
      const selectedRoleKey = String(roleInput?.value || 'member').trim() || 'member';
      const role = opts.getProjectRoleMeta?.(selectedRoleKey)?.roleKey || 'member';
      const targetRoleBase = opts.normalizeProjectRole?.(selectedRoleKey) || 'member';
      const myRole = opts.normalizeProjectRole?.(opts.getMyProjectRole?.(currentProjectState)) || 'member';
      if (myRole === 'manager' && targetRoleBase !== 'member') {
        opts.showToast?.('Action non autorisee');
        return;
      }

      if (!displayName) {
        opts.showToast?.('Nom invité requis');
        return;
      }
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!emailOk) {
        opts.showToast?.('Email professionnel invalide');
        return;
      }
      const exists = (currentProjectState.invites || []).some((inv) => opts.normalizeSearch?.(inv.email) === opts.normalizeSearch?.(email));
      if (exists) {
        opts.showToast?.('Cette adresse est déjà invitée');
        return;
      }

      const event = opts.createEvent?.(
        opts.EventTypes?.CREATE_INVITE,
        currentProjectId,
        currentUser?.userId,
        {
          inviteId: opts.uuidv4?.() || String(Date.now()),
          displayName,
          email,
          inviteType: inviteType === 'agent' ? 'agent' : 'user',
          role,
          status: 'pending'
        }
      );
      await opts.publishEvent?.(event);
      if (opts.getSharedFolderHandle?.()) void opts.syncProjectEventsToSharedSpace?.(currentProjectId, [event]);

      if (nameInput) nameInput.value = '';
      if (emailInput) emailInput.value = '';
      opts.showToast?.('Invitation créée');
      opts.addNotification?.('Invitation', `${displayName} invité(e)`, currentProjectId);
      await opts.showProjectDetail?.(currentProjectId);
    }

    function renderProjectInvitations(state) {
      const container = document.getElementById('project-invites-list');
      const btn = document.getElementById('btn-send-invite');
      if (!container || !btn) return;
      const canManage = opts.canManageProjectCollaboration?.(state);
      const myRole = opts.normalizeProjectRole?.(opts.getMyProjectRole?.(state));
      btn.disabled = !canManage;
      btn.classList.toggle('opacity-50', !canManage);

      const invites = state?.invites || [];
      if (invites.length === 0) {
        container.innerHTML = `
          <div class="empty-state-card">
            <p class="empty-state-title">Aucune invitation envoyée</p>
            <p class="empty-state-text">Invitez un utilisateur ou un agent pour activer la collaboration.</p>
            ${canManage ? '<button class="empty-state-cta" onclick="focusElementById(\'invite-email-input\')">Envoyer une invitation</button>' : ''}
          </div>
        `;
        return;
      }

      const statusClass = {
        pending: 'bg-amber-100 text-amber-700',
        sent: 'bg-blue-100 text-blue-700',
        accepted: 'bg-emerald-100 text-emerald-700',
        declined: 'bg-rose-100 text-rose-700'
      };

      container.innerHTML = invites
        .slice()
        .sort((a, b) => (b.invitedAt || 0) - (a.invitedAt || 0))
        .map((inv) => `
          <div class="rounded-lg border border-slate-200 bg-white p-3">
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="text-sm font-semibold text-slate-800">${opts.escapeHtml?.(inv.displayName || 'Invité') || (inv.displayName || 'Invité')}</p>
                <p class="text-xs text-slate-500">${opts.escapeHtml?.(inv.email || '') || (inv.email || '')} • ${(inv.inviteType === 'agent' ? 'Agent' : 'Utilisateur')} • ${opts.escapeHtml?.(opts.getProjectRoleLabel?.(inv.role || 'member') || 'member') || (opts.getProjectRoleLabel?.(inv.role || 'member') || 'member')}</p>
              </div>
              <span class="text-[10px] px-2 py-1 rounded-full font-semibold ${statusClass[inv.status] || statusClass.pending}">${opts.escapeHtml?.(inv.status || 'pending') || (inv.status || 'pending')}</span>
            </div>
            <div class="mt-2 flex flex-wrap gap-2 text-xs">
              ${canManage ? `<button onclick="sendInvitationEmail('${inv.inviteId}')" class="task-action-btn task-action-btn-subtle" data-action-kind="notify">Email</button>` : ''}
              ${canManage && (myRole === 'owner' || opts.normalizeProjectRole?.(inv.role) === 'member') ? `<button onclick="updateInviteStatus('${inv.inviteId}','accepted')" class="task-action-btn" data-action-kind="success">Accepté</button>` : ''}
              ${canManage ? `<button onclick="updateInviteStatus('${inv.inviteId}','declined')" class="task-action-btn task-action-btn-danger" data-action-kind="danger">Refusé</button>` : ''}
            </div>
          </div>
        `).join('');
    }

    async function createProjectGroup() {
      const currentProjectId = getCurrentProjectId();
      const currentProjectState = getCurrentProjectState();
      const currentUser = getCurrentUser();
      if (!currentProjectId || !currentProjectState) return;
      if (!opts.canManageProjectCollaboration?.(currentProjectState)) {
        opts.showToast?.('Seuls Propriétaire/Manager peuvent créer des groupes');
        return;
      }
      const nameInput = document.getElementById('group-name-input');
      const descInput = document.getElementById('group-description-input');
      const membersSelect = document.getElementById('group-members-input');
      const name = String(nameInput?.value || '').trim();
      const description = String(descInput?.value || '').trim();
      const selectedIds = Array.from(membersSelect?.selectedOptions || []).map((o) => o.value).filter(Boolean);
      if (!name) {
        opts.showToast?.('Nom de groupe requis');
        return;
      }
      const selectedProjectGroupId = getSelectedProjectGroupId();
      const editGroup = selectedProjectGroupId
        ? (currentProjectState.groups || []).find((g) => g.groupId === selectedProjectGroupId)
        : null;
      const exists = (currentProjectState.groups || []).some(
        (g) => opts.normalizeSearch?.(g.name) === opts.normalizeSearch?.(name) && (!editGroup || g.groupId !== editGroup.groupId)
      );
      if (exists) {
        opts.showToast?.('Ce groupe existe déjà');
        return;
      }

      const groupId = editGroup?.groupId || (opts.uuidv4?.() || String(Date.now()));
      if (editGroup) {
        const event = opts.createEvent?.(
          opts.EventTypes?.UPDATE_GROUP,
          currentProjectId,
          currentUser?.userId,
          { groupId, changes: { name, description } }
        );
        await opts.publishEvent?.(event);
        if (opts.getSharedFolderHandle?.()) void opts.syncProjectEventsToSharedSpace?.(currentProjectId, [event]);
      } else {
        const event = opts.createEvent?.(
          opts.EventTypes?.CREATE_GROUP,
          currentProjectId,
          currentUser?.userId,
          { groupId, name, description }
        );
        await opts.publishEvent?.(event);
        if (opts.getSharedFolderHandle?.()) void opts.syncProjectEventsToSharedSpace?.(currentProjectId, [event]);
      }

      const existingUserGroup = (currentProjectState.userGroups || []).find(
        (g) => g.groupId === groupId || opts.normalizeSearch?.(g.name) === opts.normalizeSearch?.(editGroup?.name || name)
      );
      if (existingUserGroup) {
        const eventUserGroupUpdate = opts.createEvent?.(
          opts.EventTypes?.UPDATE_USER_GROUP,
          currentProjectId,
          currentUser?.userId,
          { groupId: existingUserGroup.groupId, changes: { memberUserIds: [...new Set(selectedIds)], name, description } }
        );
        await opts.publishEvent?.(eventUserGroupUpdate);
        if (opts.getSharedFolderHandle?.()) void opts.syncProjectEventsToSharedSpace?.(currentProjectId, [eventUserGroupUpdate]);
      } else {
        const eventUserGroupCreate = opts.createEvent?.(
          opts.EventTypes?.CREATE_USER_GROUP,
          currentProjectId,
          currentUser?.userId,
          { groupId, name, memberUserIds: [...new Set(selectedIds)] }
        );
        await opts.publishEvent?.(eventUserGroupCreate);
        if (opts.getSharedFolderHandle?.()) void opts.syncProjectEventsToSharedSpace?.(currentProjectId, [eventUserGroupCreate]);
      }

      const refreshedAfterGroupSave = await opts.getProjectState?.(currentProjectId, { ignoreAccessCheck: true });
      const savedGroup = (refreshedAfterGroupSave?.groups || []).find((g) => g.groupId === groupId) || { name, description };
      const savedLinkedUserGroup = (refreshedAfterGroupSave?.userGroups || []).find(
        (ug) => ug.groupId === groupId || opts.normalizeSearch?.(ug.name) === opts.normalizeSearch?.(savedGroup.name || name)
      );
      const savedMemberUserIds = Array.from(
        new Set((savedLinkedUserGroup?.memberUserIds || selectedIds).map((id) => String(id || '').trim()).filter(Boolean))
      );
      await opts.upsertGlobalGroup?.({
        name: savedGroup.name || name,
        description: savedGroup.description || description,
        memberUserIds: savedMemberUserIds,
        projectId: currentProjectId
      });
      await opts.refreshGlobalTaxonomyCache?.();
      if (nameInput) nameInput.value = '';
      if (descInput) descInput.value = '';
      if (membersSelect) {
        Array.from(membersSelect.options || []).forEach((opt) => {
          opt.selected = false;
        });
      }
      setSelectedProjectGroupId(null);
      opts.showToast?.(editGroup ? 'Groupe modifié' : 'Groupe créé');
      opts.addNotification?.('Groupe', editGroup ? `Groupe ${name} modifié` : `Groupe ${name} créé`, currentProjectId);
      await opts.showProjectDetail?.(currentProjectId);
    }

    async function deleteProjectGroup(groupId) {
      const currentProjectId = getCurrentProjectId();
      const currentProjectState = getCurrentProjectState();
      const currentUser = getCurrentUser();
      if (!currentProjectId || !currentProjectState || !groupId) return;
      if (!opts.canManageProjectCollaboration?.(currentProjectState)) {
        opts.showToast?.('Seuls Propriétaire/Manager peuvent supprimer des groupes');
        return;
      }
      const groupName = opts.getGroupNameById?.(currentProjectState, groupId) || 'ce groupe';
      if (!global.confirm(`Supprimer le groupe "${groupName}" ?`)) return;
      const event = opts.createEvent?.(
        opts.EventTypes?.DELETE_GROUP,
        currentProjectId,
        currentUser?.userId,
        { groupId }
      );
      await opts.publishEvent?.(event);
      if (opts.getSharedFolderHandle?.()) void opts.syncProjectEventsToSharedSpace?.(currentProjectId, [event]);
      const linkedUserGroups = (currentProjectState.userGroups || []).filter(
        (g) => g.groupId === groupId || opts.normalizeSearch?.(g.name) === opts.normalizeSearch?.(groupName)
      );
      for (const userGroup of linkedUserGroups) {
        const userGroupDeleteEvent = opts.createEvent?.(
          opts.EventTypes?.DELETE_USER_GROUP,
          currentProjectId,
          currentUser?.userId,
          { groupId: userGroup.groupId }
        );
        await opts.publishEvent?.(userGroupDeleteEvent);
        if (opts.getSharedFolderHandle?.()) void opts.syncProjectEventsToSharedSpace?.(currentProjectId, [userGroupDeleteEvent]);
      }
      opts.showToast?.('Groupe supprimé');
      await opts.showProjectDetail?.(currentProjectId);
    }

    async function renderProjectGroups(state) {
      const container = document.getElementById('project-groups-list');
      const createBtn = document.getElementById('btn-create-group');
      const membersSelect = document.getElementById('group-members-input');
      if (!container || !createBtn || !membersSelect) return;
      const canManage = opts.canManageProjectCollaboration?.(state);
      createBtn.disabled = !canManage;
      createBtn.classList.toggle('opacity-50', !canManage);
      membersSelect.disabled = !canManage;

      await opts.renderProjectGroupMemberSelect?.(state);
      const members = await opts.getProjectMembersResolved?.(state) || [];
      const byId = new Map(members.map((m) => [m.userId, m.displayNameResolved]));

      const groups = state?.groups || [];
      if (groups.length === 0) {
        container.innerHTML = `
          <div class="empty-state-card">
            <p class="empty-state-title">Aucun groupe configuré</p>
            <p class="empty-state-text">Créez des groupes et assignez des membres pour faciliter la répartition.</p>
            ${canManage ? '<button class="empty-state-cta" onclick="focusElementById(\'group-name-input\')">Créer un groupe</button>' : ''}
          </div>
        `;
        setSelectedProjectGroupId(null);
        createBtn.textContent = 'Créer groupe';
        const groupNameInput = document.getElementById('group-name-input');
        const groupDescriptionInput = document.getElementById('group-description-input');
        if (groupNameInput) groupNameInput.value = '';
        if (groupDescriptionInput) groupDescriptionInput.value = '';
        Array.from(membersSelect.options || []).forEach((opt) => { opt.selected = false; });
        return;
      }

      if (getSelectedProjectGroupId() && !groups.find((g) => g.groupId === getSelectedProjectGroupId())) {
        setSelectedProjectGroupId(null);
      }

      container.innerHTML = groups.map((group) => {
        const active = group.groupId === getSelectedProjectGroupId();
        const assignedCount = (state?.tasks || []).filter((t) => t.groupId === group.groupId).length;
        const linkedUserGroup = (state?.userGroups || []).find((ug) =>
          ug.groupId === group.groupId || opts.normalizeSearch?.(ug.name) === opts.normalizeSearch?.(group.name)
        );
        const memberNames = (linkedUserGroup?.memberUserIds || []).map((id) => byId.get(id) || opts.fallbackDirectoryName?.(id) || id);
        const groupName = opts.escapeHtml?.(group.name) || group.name;
        const groupDescription = opts.escapeHtml?.(group.description || 'Sans description') || (group.description || 'Sans description');
        const memberSummary = opts.escapeHtml?.(memberNames.join(', ') || 'Aucun membre') || (memberNames.join(', ') || 'Aucun membre');
        return `
          <div class="rounded-lg border ${active ? 'border-primary bg-blue-50' : 'border-slate-200 bg-white'} p-3">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="text-sm font-semibold text-slate-800 truncate">${groupName}</p>
                <p class="text-xs text-slate-500 truncate">${groupDescription}</p>
                <p class="text-[11px] text-slate-500 mt-1">${assignedCount} tâche(s) • ${(linkedUserGroup?.memberUserIds || []).length} membre(s)</p>
                <p class="text-[11px] text-slate-500 truncate">${memberSummary}</p>
              </div>
              <div class="flex items-center gap-2 text-xs">
                <button onclick="selectProjectGroup('${group.groupId}')" class="task-action-btn task-action-btn-subtle" data-action-kind="edit">Modifier</button>
                ${canManage ? `<button onclick="deleteProjectGroup('${group.groupId}')" class="task-action-btn task-action-btn-danger" data-action-kind="danger">Supprimer</button>` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('');

      const selectedGroup = getSelectedProjectGroupId()
        ? (groups.find((g) => g.groupId === getSelectedProjectGroupId()) || null)
        : null;
      const linkedSelectedUserGroup = selectedGroup
        ? (state?.userGroups || []).find((ug) =>
            ug.groupId === selectedGroup.groupId || opts.normalizeSearch?.(ug.name) === opts.normalizeSearch?.(selectedGroup.name)
          )
        : null;
      const selectedIds = new Set(linkedSelectedUserGroup?.memberUserIds || []);
      Array.from(membersSelect.options || []).forEach((opt) => {
        opt.selected = selectedIds.has(opt.value);
      });
      const groupNameInput = document.getElementById('group-name-input');
      const groupDescriptionInput = document.getElementById('group-description-input');
      if (selectedGroup) {
        if (groupNameInput) groupNameInput.value = selectedGroup.name || '';
        if (groupDescriptionInput) groupDescriptionInput.value = selectedGroup.description || '';
      }
      createBtn.textContent = selectedGroup ? 'Enregistrer modifications' : 'Créer groupe';
    }

    function selectProjectGroup(groupId) {
      setSelectedProjectGroupId(groupId || null);
      void renderProjectGroups(getCurrentProjectState());
      const membersSelect = document.getElementById('group-members-input');
      if (membersSelect) membersSelect.focus();
    }

    async function updateProjectGroupMembers() {
      const currentProjectId = getCurrentProjectId();
      const currentProjectState = getCurrentProjectState();
      const currentUser = getCurrentUser();
      const selectedProjectGroupId = getSelectedProjectGroupId();
      if (!currentProjectId || !currentProjectState || !selectedProjectGroupId) return;
      if (!opts.canManageProjectCollaboration?.(currentProjectState)) {
        opts.showToast?.('Action non autorisee');
        return;
      }
      const group = (currentProjectState.groups || []).find((g) => g.groupId === selectedProjectGroupId);
      if (!group) {
        opts.showToast?.('Sélectionnez un groupe');
        return;
      }
      const membersSelect = document.getElementById('group-members-input');
      const selectedIds = Array.from(membersSelect?.selectedOptions || []).map((o) => o.value).filter(Boolean);
      const linked = (currentProjectState.userGroups || []).find(
        (ug) => ug.groupId === group.groupId || opts.normalizeSearch?.(ug.name) === opts.normalizeSearch?.(group.name)
      );
      const event = linked
        ? opts.createEvent?.(
            opts.EventTypes?.UPDATE_USER_GROUP,
            currentProjectId,
            currentUser?.userId,
            { groupId: linked.groupId, changes: { memberUserIds: [...new Set(selectedIds)], name: group.name } }
          )
        : opts.createEvent?.(
            opts.EventTypes?.CREATE_USER_GROUP,
            currentProjectId,
            currentUser?.userId,
            { groupId: group.groupId, name: group.name, memberUserIds: [...new Set(selectedIds)] }
          );
      await opts.publishEvent?.(event);
      if (opts.getSharedFolderHandle?.()) void opts.syncProjectEventsToSharedSpace?.(currentProjectId, [event]);
      opts.showToast?.('Membres du groupe mis à jour');
      await opts.showProjectDetail?.(currentProjectId);
    }

    async function addProjectTheme() {
      const currentProjectId = getCurrentProjectId();
      const currentProjectState = getCurrentProjectState();
      const currentUser = getCurrentUser();
      if (!currentProjectId || !currentProjectState) return;
      if (!opts.canManageProjectCollaboration?.(currentProjectState)) {
        opts.showToast?.('Seuls Propriétaire/Manager peuvent gérer les thèmes');
        return;
      }
      const input = document.getElementById('theme-name-input');
      const theme = String(input?.value || '').trim();
      if (!theme) {
        opts.showToast?.('Thématique requise');
        return;
      }
      const exists = (currentProjectState.themes || []).some(
        (t) => opts.normalizeSearch?.(t) === opts.normalizeSearch?.(theme)
      );
      if (exists) {
        opts.showToast?.('Thématique déjà présente');
        return;
      }
      const event = opts.createEvent?.(
        opts.EventTypes?.ADD_THEME,
        currentProjectId,
        currentUser?.userId,
        { theme }
      );
      await opts.publishEvent?.(event);
      if (opts.getSharedFolderHandle?.()) void opts.syncProjectEventsToSharedSpace?.(currentProjectId, [event]);
      await opts.upsertGlobalTheme?.(theme);
      await opts.refreshGlobalTaxonomyCache?.();
      if (input) input.value = '';
      opts.showToast?.('Thématique ajoutée');
      await opts.showProjectDetail?.(currentProjectId);
    }

    async function removeProjectTheme(theme) {
      const currentProjectId = getCurrentProjectId();
      const currentProjectState = getCurrentProjectState();
      const currentUser = getCurrentUser();
      if (!currentProjectId || !currentProjectState || !theme) return;
      if (!opts.canManageProjectCollaboration?.(currentProjectState)) {
        opts.showToast?.('Seuls Propriétaire/Manager peuvent gérer les thèmes');
        return;
      }
      const event = opts.createEvent?.(
        opts.EventTypes?.REMOVE_THEME,
        currentProjectId,
        currentUser?.userId,
        { theme }
      );
      await opts.publishEvent?.(event);
      if (opts.getSharedFolderHandle?.()) void opts.syncProjectEventsToSharedSpace?.(currentProjectId, [event]);
      opts.showToast?.('Thématique retirée');
      await opts.showProjectDetail?.(currentProjectId);
    }

    function renderProjectThemes(state) {
      const container = document.getElementById('project-themes-list');
      const btn = document.getElementById('btn-add-theme');
      if (!container || !btn) return;
      const canManage = opts.canManageProjectCollaboration?.(state);
      btn.disabled = !canManage;
      btn.classList.toggle('opacity-50', !canManage);
      const themes = state?.themes || [];
      if (themes.length === 0) {
        container.innerHTML = `
          <div class="empty-state-card">
            <p class="empty-state-title">Aucune thématique définie</p>
            <p class="empty-state-text">Ajoutez des thématiques pour faciliter la recherche transverse.</p>
            ${canManage ? '<button class="empty-state-cta" onclick="focusElementById(\'theme-name-input\')">Ajouter une thématique</button>' : ''}
          </div>
        `;
        return;
      }
      container.innerHTML = themes.map((theme) => `
        <span class="inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full bg-slate-200 text-slate-700">
          ${opts.escapeHtml?.(theme) || theme}
          ${canManage ? `<button onclick="removeProjectTheme(decodeURIComponent('${encodeURIComponent(theme)}'))" class="text-slate-600 hover:text-rose-700">x</button>` : ''}
        </span>
      `).join('');
    }

    function renderProjectPermissionMatrix(state) {
      const tbody = document.getElementById('project-permissions-matrix');
      const roleBadge = document.getElementById('project-permission-role-badge');
      const summary = document.getElementById('project-permission-summary');
      const details = document.getElementById('project-permissions-details');
      const toggle = document.getElementById('btn-toggle-permissions-details');
      if (!tbody) return;

      const roleRaw = opts.getMyProjectRole?.(state);
      const role = opts.normalizeProjectRole?.(roleRaw);
      const roleLabel = roleRaw ? opts.getProjectRoleLabel?.(roleRaw) : 'Aucun';
      if (roleBadge) {
        roleBadge.textContent = `Role: ${roleLabel}`;
        roleBadge.className = `text-xs font-semibold px-2 py-1 rounded-full ${
          role === 'owner'
            ? 'bg-amber-100 text-amber-800'
            : role === 'manager'
              ? 'bg-blue-100 text-blue-800'
              : role === 'member'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-100 text-slate-700'
        }`;
      }

      const rows = [
        { action: 'Lire le projet (taches, docs, discussion)', owner: true, manager: true, member: true },
        { action: 'Modifier les infos projet', owner: true, manager: true, member: false },
        { action: 'Supprimer le projet', owner: true, manager: false, member: false },
        { action: 'Creer une tache', owner: true, manager: true, member: true },
        { action: 'Editer/supprimer ses taches', owner: true, manager: true, member: true },
        { action: 'Editer/supprimer toutes les taches', owner: true, manager: true, member: false },
        { action: 'Changer statut de toute tache', owner: true, manager: true, member: false },
        { action: 'Envoyer un message', owner: true, manager: true, member: true },
        { action: 'Editer/supprimer tous les messages', owner: true, manager: true, member: false },
        { action: 'Consulter le journal activite', owner: true, manager: true, member: false },
        { action: 'Invitations / Groupes sur-mesure (avec membres) / Thematiques', owner: true, manager: true, member: false },
        { action: 'Gerer les membres du projet*', owner: true, manager: true, member: false }
      ];

      const roleRules = {
        owner: { label: opts.getProjectRoleLabel?.('owner'), description: 'Pilotage complet du projet', allowed: rows.filter((r) => r.owner).length, total: rows.length, chip: 'bg-amber-100 text-amber-800' },
        manager: { label: 'Manager', description: 'Gestion opérationnelle avancée', allowed: rows.filter((r) => r.manager).length, total: rows.length, chip: 'bg-blue-100 text-blue-800' },
        member: { label: 'Membre', description: 'Exécution et contribution', allowed: rows.filter((r) => r.member).length, total: rows.length, chip: 'bg-emerald-100 text-emerald-800' }
      };
      if (summary) {
        summary.innerHTML = ['owner', 'manager', 'member'].map((key) => {
          const rr = roleRules[key];
          const active = role === key ? ' ring-2 ring-indigo-200' : '';
          return `
            <div class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2${active}">
              <div class="flex items-center justify-between gap-2">
                <p class="text-sm font-semibold text-slate-800">${rr.label}</p>
                <span class="text-[11px] px-2 py-0.5 rounded-full font-semibold ${rr.chip}">${rr.allowed}/${rr.total}</span>
              </div>
              <p class="text-xs text-slate-500 mt-1">${rr.description}</p>
            </div>
          `;
        }).join('');
      }

      const renderCell = (allowed, isCurrentCol) => {
        const base = 'py-2 px-2 border-b border-slate-100';
        const current = isCurrentCol ? ' bg-indigo-50' : '';
        if (allowed) {
          return `<td class="${base}${current}"><span class="inline-flex items-center text-emerald-700 font-semibold" title="Autorisé"><span class="material-symbols-outlined text-base">check_circle</span></span></td>`;
        }
        return `<td class="${base}${current}"><span class="inline-flex items-center text-slate-400 font-semibold" title="Non autorisé"><span class="material-symbols-outlined text-base">remove_circle</span></span></td>`;
      };

      tbody.innerHTML = rows.map((row) => `
        <tr>
          <td class="py-2 pr-3 border-b border-slate-100 text-slate-700">${opts.escapeHtml?.(row.action) || row.action}</td>
          ${renderCell(row.owner, role === 'owner')}
          ${renderCell(row.manager, role === 'manager')}
          ${renderCell(row.member, role === 'member')}
        </tr>
      `).join('');

      const detailsOpen = opts.getProjectPermissionDetailsOpen?.() === true;
      if (details) {
        details.classList.toggle('hidden', !detailsOpen);
      }
      if (toggle) {
        toggle.textContent = detailsOpen ? 'Masquer le détail des droits' : 'Voir le détail des droits';
      }
    }

    function toggleProjectPermissionDetails() {
      const current = opts.getProjectPermissionDetailsOpen?.() === true;
      opts.setProjectPermissionDetailsOpen?.(!current);
      renderProjectPermissionMatrix(getCurrentProjectState());
    }

    function setProjectSettingsTab(tabKey) {
      const allowed = new Set(['overview', 'members', 'collab', 'themes', 'permissions', 'structure']);
      const next = allowed.has(String(tabKey || '')) ? String(tabKey) : 'members';
      opts.setProjectSettingsTabState?.(next);
      opts.applyProjectSettingsTabView?.();
    }

    function bindDom() {
      const bindEnterSubmit = (inputId, handler) => {
        const input = document.getElementById(inputId);
        if (!input || typeof handler !== 'function') return;
        input.addEventListener('keydown', async (e) => {
          if (e.key !== 'Enter') return;
          e.preventDefault();
          await handler();
        });
      };

      document.getElementById('btn-add-member')?.addEventListener('click', addProjectMember);
      bindEnterSubmit('member-name-input', addProjectMember);

      document.getElementById('btn-send-invite')?.addEventListener('click', addProjectInvite);
      bindEnterSubmit('invite-email-input', addProjectInvite);

      document.getElementById('btn-create-user-group')?.addEventListener('click', createUserGroup);
      document.getElementById('btn-update-user-group')?.addEventListener('click', updateUserGroupSelection);
      bindEnterSubmit('user-group-name-input', createUserGroup);

      document.getElementById('btn-create-group')?.addEventListener('click', createProjectGroup);
      bindEnterSubmit('group-name-input', createProjectGroup);

      document.getElementById('btn-add-theme')?.addEventListener('click', addProjectTheme);
      bindEnterSubmit('theme-name-input', addProjectTheme);

      document.getElementById('btn-toggle-permissions-details')?.addEventListener('click', () => {
        toggleProjectPermissionDetails();
      });

      document.getElementById('project-settings-tab-overview')?.addEventListener('click', () => setProjectSettingsTab('overview'));
      document.getElementById('project-settings-tab-members')?.addEventListener('click', () => setProjectSettingsTab('members'));
      document.getElementById('project-settings-tab-collab')?.addEventListener('click', () => setProjectSettingsTab('collab'));
      document.getElementById('project-settings-tab-themes')?.addEventListener('click', () => setProjectSettingsTab('themes'));
      document.getElementById('project-settings-tab-permissions')?.addEventListener('click', () => setProjectSettingsTab('permissions'));
      document.getElementById('project-settings-tab-structure')?.addEventListener('click', () => setProjectSettingsTab('structure'));
    }

    return {
      addProjectMember,
      removeProjectMember,
      createUserGroup,
      updateUserGroupSelection,
      deleteUserGroup,
      renderProjectUserGroups,
      renderProjectMembers,
      renderMemberDirectoryAutocomplete,
      getAssignableProjectRolesForUser,
      renderProjectRoleSelectors,
      selectUserGroup,
      sendInvitationEmail,
      updateInviteStatus,
      addProjectInvite,
      renderProjectInvitations,
      createProjectGroup,
      deleteProjectGroup,
      renderProjectGroups,
      selectProjectGroup,
      updateProjectGroupMembers,
      addProjectTheme,
      removeProjectTheme,
      renderProjectThemes,
      renderProjectPermissionMatrix,
      toggleProjectPermissionDetails,
      setProjectSettingsTab,
      bindDom
    };
  }

  global.TaskMDAProjectMembersDomain = {
    createModule
  };
}(window));
