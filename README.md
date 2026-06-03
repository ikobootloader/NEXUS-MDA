# NEXUS MDA

> Application web de gestion de projets et de tâches collaborative et locale, sans serveur requis.

[![Version](https://img.shields.io/badge/version-2.0-blue.svg)]()
[![License](https://img.shields.io/badge/license-MIT-green.svg)]()
[![Platform](https://img.shields.io/badge/platform-Web-brightgreen.svg)]()
[![Author](https://img.shields.io/badge/author-Frédérick%20MURAT-blue.svg)]()

---

## 📋 Table des matières

- [Présentation](#-présentation)
- [Démarrage rapide](#-démarrage-rapide)
- [Fonctionnalités principales](#-fonctionnalités-principales)
- [Architecture technique](#-architecture-technique)
- [Nouveautés récentes](#-nouveautés-récentes)
- [Documentation](#-documentation)
- [Support](#-support)

---

## 🎯 Présentation

**NEXUS MDA** est une solution complète de gestion de projets, de tâches et de workflows organisationnels, conçue pour fonctionner en mode autonome ou collaboratif sans infrastructure serveur. L'application s'exécute entièrement dans le navigateur avec persistance locale et synchronisation collaborative optionnelle via dossier partagé.

### Caractéristiques distinctives

- ✅ **Aucun serveur requis** - Architecture 100% client
- 🔒 **Sécurité renforcée** - Chiffrement local AES-256-GCM
- 🤝 **Collaboration simplifiée** - Synchronisation via dossier partagé
- 📱 **Responsive** - Interface adaptative mobile/tablette/desktop
- 🎨 **Personnalisable** - Thèmes et configurations utilisateur

---

## 🚀 Démarrage rapide

### Prérequis

- Navigateur moderne : **Google Chrome** ou **Microsoft Edge** (recommandé)
- Espace de stockage local disponible (IndexedDB)
- Les dépendances frontend sont embarquées localement dans `vendor/` (pas de serveur applicatif, pas de npm)
- *(Optionnel)* Dossier partagé réseau pour collaboration

### Installation

1. **Télécharger** ou cloner le projet dans un répertoire local
2. **Ouvrir** le fichier [`taskmda-team.html`](./taskmda-team.html) dans votre navigateur
3. **Créer** votre mot de passe local lors de la première utilisation
4. *(Optionnel)* **Configurer** un dossier partagé pour activer la synchronisation

### Configuration collaborative (optionnelle)

1. Accéder au menu utilisateur → **Lier un dossier partagé**
2. Sélectionner un dossier accessible par les membres de l'équipe
3. Autoriser l'accès (File System Access API)
4. La synchronisation automatique est activée

> **Note** : La liaison au dossier est persistante et se reconnecte automatiquement au démarrage si les permissions sont valides.

---

## ⚡ Fonctionnalités principales

### 📊 Gestion de projets

- **Création** de projets solo ou collaboratifs
- **Vues multiples** : liste, kanban, timeline, calendrier
- **Éditeur enrichi** : insertion d'images, titres hiérarchiques (H1/H2/H3)
- **Gestion documentaire** : versionnement et association aux tâches
- **Discussion** et fil d'activité par projet

### ✅ Gestion des tâches

- **CRUD complet** avec sous-tâches et progression
- **Tâches récurrentes** : hebdomadaire, mensuelle, annuelle
- **Archivage** et restauration avec historique
- **Conversion** tâche → projet en un clic
- **Vues transverses** : consolidation multi-projets

### 🗂️ Organisation

#### Workflow organisationnel

Vue complète de l'organisation avec :
- **Cartographie métier** : services, groupes, processus
- **Organigramme** interactif avec hiérarchies
- **Modélisation de processus** : concepteur visuel par blocs
- **Flux non-linéaires** : branches conditionnelles, parallélisme
- **Gouvernance** : validation multi-niveaux, quorum
- **Plans de contingence** : gestion de crise et exercices
- **Analyses avancées** : matrices croisées, détection d'anomalies

#### Référentiels

- **Thématiques** et groupes métier réutilisables
- **Versions logicielles** : registre centralisé
- **Annuaire ESMS** : recherche PA/PH via FINESS
- **Générateur d'emails** : templates personnalisables
- **Surveillance de fichiers** : monitoring automatique

### 🔐 RGPD

- **Registre des traitements** : création, validation, archivage
- **Détection automatique** depuis contenus métier
- **Contrôles** et audits de conformité
- **Liaisons contextuelles** : projet, tâche, workflow
- **Exports** JSON/CSV pour reporting

### 📝 Collaboration

- **Membres** et invitations utilisateurs
- **Groupes** métier et utilisateurs
- **RBAC** : owner, manager, member
- **Rôles globaux** : admin application, manager workflow
- **Messagerie** directe inter-agents
- **Fil d'info** : posts collaboratifs avec mentions

### 📄 Gestion documentaire

- **Stockage hybride** : local (IndexedDB) ou disque partagé
- **Éditeur intégré** : texte, HTML, Markdown, tableur
- **Aperçu** : images, PDF, Office, texte
- **Versionnement** et métadonnées enrichies
- **Drag & drop** généralisé

### 🔔 Notifications

- **Centre de notifications** intégré
- **Alertes proactives** : mentions, affectations, validations
- **Surveillance de fichiers** : changements détectés en temps réel

---

## 🏗️ Architecture technique

### Stack technologique

- **Frontend** : HTML5, CSS3, JavaScript ES6+
- **Persistance** : IndexedDB (event-sourcing)
- **Synchronisation** : File System Access API
- **Sécurité** : Web Crypto API (AES-256-GCM)
- **Éditeur** : Quill.js
- **Graphiques** : Charting intégré
- **Tableur** : Tabulator + SheetJS

### Architecture modulaire

L'application est structurée en modules spécialisés :

#### Modules métier
- `taskmda-project.js` - Domaine projets
  - Projet notes: wrappers `escapeHtml`/`normalizeSearch` harmonises avec `taskmda-core-utils.js` (Lot 2)
- `taskmda-project-members-domain.js` - Domaine membres projet et RBAC projet
- `taskmda-task-lifecycle-domain.js` - Cycle de vie des tâches
- `taskmda-workflow.js` - Orchestration workflow
- `taskmda-global.js` - Domaines transverses (notes, docs, feed)
- `taskmda-global-doc-ref-utils.js` - Utilitaires refs documents inline (feed/notes)
- `taskmda-feed-digest-ui.js` - Utilitaires UI digest (mode compact/complet, resume)
- `taskmda-feed-digest-editor.js` - Import digest vers editeurs riches (notes/feed)
- `taskmda-feed-digest-mime.js` - Parsing MIME/email (EML/MSG) pour digest
- `taskmda-feed-digest-pdf.js` - Structuration/rendu digest PDF (pages, liens, markdown, extraction pdf2md)
- `taskmda-feed-digest-content.js` - Construction du rendu digest (email/pdf/autres)
- `taskmda-doc.js` - Gestion documentaire complète
- `taskmda-hierarchy.js` - Epic/Feature

#### Modules fonctionnels
- `taskmda-crypto.js` - Chiffrement et sécurité
- `taskmda-calendar.js` - Calendrier transverse
- `taskmda-recurrence.js` - Tâches récurrentes
- `taskmda-notifications.js` - Centre de notifications
- `taskmda-tasks.js` - Rendus et interactions de tâches
  - Export annuel: `formatExportDateTag` harmonise avec `taskmda-core-utils.js` (Lot 2)
  - Sous-taches: logique centralisee, orchestrateur en delegation directe (Lot 2)
- `taskmda-social.js` - UI sociale (feed/messages)
- `taskmda-comms-ui.js` - UI communication transverse
- `taskmda-admin-ui.js` - UI administration et habilitations
- `taskmda-notes-shared.js` - Composants de notes partagées
- `taskmda-via-annuaire.js` - Annuaire ESMS
- `taskmda-email-generator.js` - Générateur emails
- `taskmda-file-watcher.js` - Surveillance fichiers
- `taskmda-document-storage.js` - Stockage documents

#### Modules infrastructure
- `taskmda-core-utils.js` - Utilitaires purs
  - Centralise aussi `sharingModeBadge`, `matchesQuery`, `sanitizeFilenameSegment` (Lot 2)
  - Utilise aussi par `taskmda-file-watcher.js` et `taskmda-notes-shared.js` pour `escapeHtml` / `formatFileSize`
  - Centralise aussi `formatDate` pour l orchestrateur principal
  - Centralise aussi `formatDateTime(dateValue, emptyLabel)` pour projet-notes et file-watcher
  - Ajoute `createStateAccessors(state)` pour mutualiser les accesseurs d etat des modules domaine
- `taskmda-runtime-contract.js` - Contrat d'orchestration
- `taskmda-shell.js` - Shell transverse
- `taskmda-app-init.js` - Initialisation
- `taskmda-read-modal-zoom.js` - Accessibilité zoom de lecture
- `taskmda-ui.js` - Composants UI
- `taskmda-theme.js` - Gestion des thèmes
- `taskmda-editor.js` - Éditeur Quill
- `taskmda-team.js` - Orchestrateur principal

### Base de données

**Nom** : `taskmda-team-standalone`
**Version du schéma** : `DB_VERSION = 21`

#### Stores principaux

| Store | Description |
|-------|-------------|
| `events` | Event-sourcing projets |
| `snapshots` | États projetés |
| `globalTasks` | Tâches transverses |
| `globalDocs` | Documents transverses |
| `globalNotes` | Notes collaboratives |
| `globalPosts` | Fil d'information |
| `workflowProcesses` | Processus métier |
| `workflowAgents` | Agents organisationnels |
| `rgpdActivities` | Registre RGPD |
| `fileWatchers` | Surveillance fichiers |

*Voir section complète dans le fichier pour liste exhaustive (40+ stores)*

### Synchronisation collaborative

#### Mécanisme

1. **Écriture locale immédiate** (IndexedDB)
2. **Réplication asynchrone** vers dossier partagé
3. **Détection des changements** à l'ouverture
4. **Fusion intelligente** avec résolution de conflits

#### Structure du dossier partagé

```
projects/
  <projectId>/
    events/
      <timestamp>.json
```

#### Sécurité

- Clé partagée AES-256 par projet
- Double chiffrement : local + transport
- Format `v1-e2e-encrypted`
- Rétrocompatibilité JSON clair
- Aucune clé partagée persistée en clair dans le dossier partagé
- Écriture partagée refusée si la clé partagée est indisponible (pas de fallback JSON en clair)
- Détection automatique des anciens fichiers `shared-key.json` avec alerte explicite, sans import de clé en clair
- Action utilisateur disponible dans les notifications: `Marquer comme traité` pour mémoriser localement les projets legacy déjà audités
- UI dédiée de rattachement manuel d'un projet partagé (`projectId` + passphrase) pour importer la clé locale sans clé en clair sur disque

---

## 🆕 Nouveautés récentes

### Juin 2026

#### ✅ Correctif encodage badge de visibilité

- `js/taskmda-core-utils.js` corrige le libellé du badge `Privée` et les textes associés de visibilité.
- Impact utilisateur : le badge de visibilité des cartes de tâche ne présente plus de mojibake.

### Mai 2026

#### ✅ Refactor accessors d etat mutualises (phase 1)

- Ajout de `createStateAccessors(state)` dans `js/taskmda-core-utils.js`.
- Delegation des wrappers dupliques `getCurrentUser` / `getCurrentProjectId` / `getCurrentProjectState` dans:
  - `js/taskmda-project-members-domain.js`
  - `js/taskmda-task-lifecycle-domain.js`
  - `js/taskmda-app-init.js`
  - `js/taskmda-doc.js`
- Aucun changement fonctionnel attendu: appelants inchanges, fallback local conserve.

#### ✅ Refactor normalisation workflow harmonisee

- `js/taskmda-workflow.js`:
  - `normalizeText(...)` (graph) et `normalize(...)` (module principal) deleguent vers `TaskMDACoreUtils.normalizeSearch(...)`.
  - fallback local conserve pour eviter toute regression liee a l ordre de chargement.

#### ✅ Refactor thematiques notes projet/global factorisees

- `js/taskmda-team.js`:
  - ajout de `getNoteThemeLabels(note)` comme helper local unique.
  - `getProjectNoteThemeLabels(...)` et `getGlobalNoteThemeLabels(...)` reutilisent ce helper (aucun changement d appelants).

#### ✅ Refactor caret inline notes unifie

- `js/taskmda-team.js`:
  - `placeCaretAtEnd(...)` reutilise `placeCaretAtEndOfElement(...)`.
  - `placeCaretAtEndOfElement(...)` delegue au runtime notes inline quand disponible, avec fallback local conserve.

#### ✅ Refactor bindGlobalNav mutualise admin/comms

- `js/taskmda-admin-ui.js`:
  - expose `bindGlobalNavWithOptions(options, buttonId, view)` pour la navigation globale.
- `js/taskmda-comms-ui.js`:
  - reutilise ce helper quand disponible, avec fallback local pour robustesse.

#### ✅ Refactor setActivityPage runtime mutualise

- `js/taskmda-team.js`:
  - extraction d un setter unique `setActivityPageState(value)`.
  - reutilisation dans les runtimes navigation projet et filtres activite.

#### ✅ Refactor setGlobalNotesPage runtime mutualise

- `js/taskmda-team.js`:
  - extraction d un setter unique `setGlobalNotesPageState(value)`.
  - reutilisation dans les runtimes filtres notes globales (`setGlobalNotesPage`) et notes globales (`setPage`).

#### ✅ Refactor focus notes runtime mutualise

- `js/taskmda-team.js`:
  - extraction de `setGlobalNotesFocusNoteIdState(value)` et `setProjectNotesFocusNoteIdState(value)`.
  - reutilisation dans les runtimes notes (`setGlobalNotesFocusNoteId`, `setFocusNoteId`, `setProjectNotesFocusNoteId`).

#### ✅ Refactor feed filter mode runtime mutualise

- `js/taskmda-team.js`:
  - extraction de `setGlobalFeedFilterModeState(value)` pour normaliser le filtre feed.
  - reutilisation dans les runtimes feed/comms (`setGlobalFeedFilterMode`, `setFeedFilterMode`).

#### ✅ Refactor feed sort mode runtime normalise

- `js/taskmda-team.js`:
  - ajout de `setGlobalFeedSortModeState(value)` pour contraindre le tri feed a `asc`/`desc`.
  - reutilisation dans le runtime comms (`setFeedSortMode`).

#### ✅ Refactor feed focus runtime mutualise

- `js/taskmda-team.js`:
  - extraction de `setGlobalFeedFocusPostIdState(value)`.
  - reutilisation dans le runtime `TaskMDAGlobalFeed` (`setGlobalFeedFocusPostId`).

#### ✅ Refactor recherche globale runtime mutualisee

- `js/taskmda-team.js`:
  - extraction de `setGlobalSearchQueryState(value)`.
  - reutilisation dans `TaskMDAHeaderSearch` (`setGlobalSearchQuery`) et dans les resets de session/navigation.
  - correctif de regression applique: setter converti en fonction hoistee pour eviter une erreur d initialisation au chargement.

#### ✅ Refactor filtres notes projet runtime mutualises

- `js/taskmda-team.js`:
  - extraction de `setProjectNotesSearchQueryState(value)` et `setProjectNotesFilterModeState(value)`.
  - reutilisation dans `TaskMDAProjectNotesFiltersUI` (`setProjectNotesSearchQuery`, `setProjectNotesFilterMode`).

#### ✅ Refactor setters tableur runtime mutualises

- `js/taskmda-team.js`:
  - extraction de `setDocSpreadsheetColumnsState(value)` et `setDocSpreadsheetSheetNameState(value)`.
  - reutilisation dans `TaskMDADocEditorUI` (`setSpreadsheetColumns`, `setSpreadsheetSheetName`).

#### ✅ Refactor focus modal note globale mutualise

- `js/taskmda-team.js`:
  - extraction de `setGlobalReadModalNoteIdState(value)`.
  - reutilisation dans `TaskMDAGlobalNotesReadModalContent` (`setGlobalReadModalNoteId`).

#### ✅ Refactor filtre thematique notes globales mutualise

- `js/taskmda-team.js`:
  - extraction de `setGlobalNotesThemeFilterState(value)`.
  - reutilisation dans `TaskMDAGlobalNotesFiltersUI` (`setGlobalNotesThemeFilter`).

#### ✅ Refactor etat feed runtime mutualise

- `js/taskmda-team.js`:
  - extraction de `setGlobalFeedMentionCatalogCacheState(value)`.
  - reutilisation dans `TaskMDAGlobalFeed` (`setGlobalFeedMentionCatalogCache`).
  - simplification de `setGlobalFeedFilterMode` en reference directe vers `setGlobalFeedFilterModeState`.

#### ✅ Refactor setters reactions messages mutualises

- `js/taskmda-team.js`:
  - extraction de `setProjectReactionPickerMessageIdState(value)` et `setGlobalReactionPickerMessageIdState(value)`.
  - reutilisation dans `TaskMDAMessageReactionsOutsideUI` (`setProjectReactionPickerMessageId`, `setGlobalReactionPickerMessageId`).

#### ✅ Refactor setters calendrier global mutualises

- `js/taskmda-team.js`:
  - extraction des setters d etat `selectedDay/selectedMonth/viewMode/controlsExpanded/editingItemId`.
  - reutilisation dans `TaskMDAGlobalCalendar` (state runtime).

#### ✅ Refactor setters docs globales mutualises

- `js/taskmda-team.js`:
  - extraction de `setDocBindingInlineSavingState(value)`, `setCurrentDocBindingContextState(value)` et `setCurrentDocBindingCanEditState(value)`.
  - reutilisation dans `TaskMDAGlobalDocs` (state runtime).

#### ✅ UI notes: fond bloc documents lies

- `js/taskmda-global-notes-card-builder.js`:
  - ajout de la classe `note-linked-docs-block` sur le bloc "Documents lies".
- `css/taskmda-team.css`:
  - ajout d un background + bordure + radius pour ce bloc (clair/sombre).
  - meme habillage applique en lecture modale sur `#project-note-read-links` et `#global-read-links` (uniquement quand non vides).

#### ✅ Refactor setActivityPage unifie complet

- `js/taskmda-team.js`:
  - `setActivityPage(page)` delegue desormais a `setActivityPageState(page)`.
  - `setActivityPageState` est defini en fonction hoistee pour garantir un appel robuste.

#### ✅ Refactor filtres notes globales mutualises

- `js/taskmda-team.js`:
  - extraction des setters dedies `scope/origin/sort/tab` pour les notes globales.
  - reutilisation dans le runtime `TaskMDAGlobalNotes` pour eviter les affectations inline dupliquees.

#### ✅ Refactor recherche notes globales mutualisee

- `js/taskmda-team.js`:
  - extraction de `setGlobalNotesSearchQueryState(value)`.
  - reutilisation dans le runtime `TaskMDAGlobalNotes` (`setSearchQuery`).

#### ✅ Refactor selection multiple notes globales mutualisee

- `js/taskmda-team.js`:
  - extraction des helpers d etat de selection multiple (mode + add/remove/clear).
  - reutilisation dans le runtime `TaskMDAGlobalNotes` pour remplacer les lambdas inline.

#### ✅ Revue de code: suppression d un doublon d orchestration

- Suppression de definitions dupliquees de `discoverAndLoadExistingProjects` et `renderProjectGroups` dans `js/taskmda-team.js`.
- Conservation de la version robuste (chargement avec stats, gestion legacy et reconstruction locale).
- Effet attendu: moins d entropie et moins de risque de divergence comportementale.

#### ✅ Refactor Lot 1: orchestrateur aminci (groupes projet)

- Déplacement du rendu des groupes projet (`renderProjectGroups`) dans le module domaine `js/taskmda-project-members-domain.js`.
- `js/taskmda-team.js` conserve une délégation légère vers le runtime domaine.
- Déplacement du rendu des groupes utilisateurs projet (`renderProjectUserGroups`) dans le même module domaine.
- Déplacement du rendu des invitations projet (`renderProjectInvitations`) dans le même module domaine.
- Déplacement du rendu des membres projet (`renderProjectMembers`) dans le même module domaine.
- Déplacement du rendu des thématiques projet (`renderProjectThemes`) dans le même module domaine.
- Déplacement du rendu de la matrice des droits projet (`renderProjectPermissionMatrix`) dans le même module domaine.
- Déplacement du rendu des sélecteurs de rôles projet (`renderProjectRoleSelectors`) dans le même module domaine.
- Déplacement de l’autocomplétion annuaire des membres (`renderMemberDirectoryAutocomplete`) dans le même module domaine.
- Déplacement de l’action de bascule du détail des droits (`toggleProjectPermissionDetails`) dans le même module domaine.
- Déplacement des listeners DOM de collaboration projet dans `bindDom()` du même module domaine.
- Déplacement des listeners d’onglets de réglages projet (`overview/members/collab/themes/permissions/structure`) dans `bindDom()` du même module domaine.
- Déplacement de la logique `setProjectSettingsTab` dans le même module domaine (avec délégation/fallback côté orchestrateur).
- Déplacement de la logique d’attribution des rôles assignables (`getAssignableProjectRolesForUser`) dans le même module domaine.
- Réduction des wrappers globaux pass-through restants (`removeProjectMember`, `selectUserGroup`, `deleteUserGroup`) en délégations directes runtime.
- Suppression des wrappers pass-through `invitations/groupes/thématiques` côté orchestrateur avec délégation runtime directe et exposition `window.*` minimale.
- Suppression de doublons consécutifs d’appels `refreshLinkedPendingSummaries()` dans l’orchestrateur.
- Suppression d’un doublon d’appel `populateProjectDeadlineForm('project', null)` dans l’ouverture de la modale nouveau projet.
- Suppression des derniers wrappers de rendu collaboration restants (`renderProjectRoleSelectors`, `renderProjectMembers`, `renderProjectUserGroups`, `renderProjectPermissionMatrix`) au profit d’appels runtime directs.
- Correctif de compatibilité: ré-exposition `window.deleteProjectGroup` pour les actions inline `onclick` des cartes de groupes.
- Factorisation du rendu collaboration projet via un helper unique `renderProjectCollaborationPanels(...)` pour éviter les blocs de délégation répétés.
- Suppression de wrappers one-liner morts côté orchestrateur dans le périmètre notes globales (bulk/favoris), avec conservation des points d’entrée `window.*` actifs.
- Suppression du wrapper local `closeGlobalNotesBulkExportModal` avec délégation runtime directe.
- Suppression des wrappers locaux `openGlobalFeedReference` / `openGlobalFeedPost` au profit d’appels runtime directs (incluant `window.*`).
- Suppression de wrappers feed non utilisés (`refreshGlobalFeedFilterButtons`, `renderGlobalFeedSummary`) et inline de `publishGlobalFeedPost` dans le binding `TaskMDACommsUI`.
- Suppression du wrapper local `openGlobalFeedPostReadModal` avec exposition `window.*` directement branchée au runtime.
- Suppression de wrappers notes/fédération non utilisés (`buildGlobalNoteCardHtml`, `buildGlobalHubProjectNoteRef`, `parseGlobalHubProjectNoteRef`, wrapper local `openGlobalHubAggregatedNoteRead`) avec exposition runtime directe conservée.
- Suppression du wrapper one-liner local `publishGlobalFeedDigestFromFiles`; délégation inline directement dans le binding `TaskMDACommsUI`.
- Suppression du wrapper mort `resolveLinkedDocsForFeedPost` et remplacement de `window.openGlobalFeedReference` / `window.openGlobalFeedPost` par des fonctions nommées locales réutilisables (scope dépendances fiabilisé).
- Harmonisation de `window.openGlobalFeedPostReadModal` et `window.openGlobalHubAggregatedNoteRead` vers des fonctions nommées locales (même stratégie de délégation runtime).
- Factorisation des expositions `window.*` pass-through (notes/feed/actions lecture projet/calendrier/docs) via un helper unique `exposeRuntimeActionsToWindow(...)` pour réduire le volume répétitif côté orchestrateur.
- Harmonisation Lot 2: `normalizeSearch` du module projet-notes (`js/taskmda-project.js`) délègue désormais à `TaskMDACoreUtils.normalizeSearch` (avec fallback local et `trim` conservé).
- Harmonisation Lot 2: `escapeHtml` du module projet-notes (`js/taskmda-project.js`) délègue désormais à `TaskMDACoreUtils.escapeHtml` (avec fallback local conservé).
- Micro-factorisation Lot 2: simplification de `buildUnifiedCardHtml` (module projet-notes) avec variable locale `noteIdRaw` pour éviter les conversions répétées.
- Micro-factorisation Lot 2: simplification de `defaultProjectActionsRenderer` avec `noteIdRaw` centralisé avant échappement.
- Micro-factorisation Lot 2: simplification de `buildUnifiedCardHtml` avec variable locale `createdByRaw` pour éviter les conversions répétées de l’auteur.
- Micro-factorisation Lot 2: pré-normalisation locale des IDs de tâches liées (`linkedTaskIdsNormalized`) dans `buildUnifiedCardHtml`.
- Micro-factorisation Lot 2: extraction de `authorLabel` et `createdAtLabel` dans `buildUnifiedCardHtml` pour alléger le template.
- Micro-factorisation Lot 2: extraction de la logique de blob de recherche vers `buildNoteSearchBlob(...)` dans `renderUnifiedNotesList`.
- Lot 3 (phase 1): optimisation du rendu des notes projet (`js/taskmda-team.js`) avec `rerenderProjectNotesViewIfActive(...)` pour éviter les rerenders complets quand l’onglet actif n’est pas `notes`.
- Lot 3 (phase 2): `toggleProjectNoteFeedPublish` applique un patch incrémental d’une seule carte quand les filtres le permettent, avec fallback automatique sur rerender complet.
- Lot 3 (phase 3): `renderProjectNotes(...)` diffère le rendu complet quand l’onglet actif n’est pas `notes`, tout en conservant la mise à jour des options de liaison.
- Lot 3 (phase 4): consolidation des gardes de rendu via helper commun `isProjectNotesViewActive()` pour fiabiliser la logique incrémentale.
- Lot 3 (phase 5): factorisation du contexte de rendu des notes dans `buildProjectNotesRenderContext(...)` pour mutualiser les calculs entre rendu complet et patch carte.
- Lot 3 (phase 6): micro-optimisation de `renderProjectNotes(...)` en retardant la construction du contexte tant que le renderer Notes n’est pas confirmé disponible.
- Lot 3 (phase 7): le patch incrémental de carte réutilise le contexte de la vue filtrée (`visibleNotes`) pour limiter les recalculs et éviter les divergences.
- Lot 3 (phase 8): extraction du helper `filterVisibleProjectNotes(...)` pour unifier le filtrage thématique entre rendu complet et patch incrémental.
- Lot 3 (phase 9): suppression d’une lecture redondante des notes dans le patch incrémental (`notesAll` réutilisé pour recherche + filtrage).

#### ✅ Annuaire ESMS: recherche par numéro FINESS dans le champ texte

- Le champ de recherche ESMS accepte explicitement un numéro FINESS (ex: `010780521`).
- Une recherche directe FINESS (`nofinesset` / `nofinessej`) complète le filtrage départemental pour fiabiliser la remontée de l'établissement ciblé.

#### ✅ Bouton général projet contextuel

- Le bouton `Nouvelle tâche` dans un projet s'adapte à l'onglet actif:
- `Notes` ouvre `Nouvelle note`, `Documents` ouvre l'ajout de document, `Discussion` place le focus sur le composeur, sinon création de tâche.

#### ✅ Fil d'info: fallback de titre intelligent

- Si un post du fil n'a pas de titre, l'UI affiche en priorité le titre de la tâche référencée, sinon celui du projet référencé.

#### ✅ Référence interne (projets et tâches)

- Ajout du champ `Référence interne` dans les modales de création/édition des projets.
- Ajout du champ `Référence interne` dans la modale de création/édition des tâches.
- Persistance de la valeur dans les données projet/tâche pour index métier personnalisé.

#### ✅ Export annuel des tâches accomplies (Excel)

- Rubrique `Tâches` : ajout d un bouton `Export accomplies (Excel)`
- Export `.xlsx` annuel des tâches accomplies (projets + hors projet)
- Filtrage par année saisie (`YYYY`) et feuille tableur prête pour exploitation

### Avril 2026

#### 🗂️ Surveillance de fichiers

Nouveau module complet de monitoring automatique :
- Observateurs configurables par dossier
- Polling automatique (30s à 1h)
- Détection création/modification/suppression
- Support multi-formats (Excel, Word, PDF, CSV, images)
- Mode récursif pour sous-dossiers
- Notifications temps réel
- Historique complet avec filtres

#### 📧 Générateur d'emails

Templates personnalisables avec :
- Variables dynamiques (`{{app_name}}`, `{{user_name}}`, etc.)
- Éditeur riche HTML
- Export HTML/texte
- Ouverture `mailto:` pré-remplie

#### 📝 Notes collaboratives

Rubrique dédiée avec :
- Notes privées vs transverses
- Éditeur riche (Quill)
- Favoris et export HTML/ZIP
- Publication dans le fil d'info
- Sélection multiple et actions groupées

#### 📊 Workflow KPI

Vue synthétique de pilotage :
- Volumétrie et complétion
- Répartitions statut/priorité
- Charge par agent (top 8)
- Exports PDF/CSV

#### 🎨 Harmonisation UX

- Mode d'affichage boutons (icône/texte/mixte)
- Infobulles harmonisées
- Fermeture modale au clic externe
- Édition inline généralisée
- Couleur chrome personnalisable

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [`QUICKSTART.md`](docs/QUICKSTART.md) | Guide de démarrage rapide |
| [`CHANGELOG.md`](CHANGELOG.md) | Historique des versions |
| [`QA_REGRESSION_CHECKLIST.md`](docs/QA_REGRESSION_CHECKLIST.md) | Checklist de tests |
| [`RECURRENCE.md`](docs/RECURRENCE.md) | Tâches récurrentes (détails) |
| [`FILE_WATCHER.md`](docs/FILE_WATCHER.md) | Surveillance fichiers (technique) |
| [`QUICKSTART_FILE_WATCHER.md`](docs/QUICKSTART_FILE_WATCHER.md) | Surveillance fichiers (guide) |

---

## 🔒 Sécurité

### Chiffrement

- **Algorithme** : AES-256-GCM
- **Dérivation clés** : PBKDF2-SHA256
- **Standards** : OWASP 2024
- **Zero-knowledge** : données chiffrées en transit et au repos

### Confidentialité

- Aucune donnée transmise à des tiers
- Stockage 100% local ou réseau partagé
- Clés en mémoire uniquement (jamais sur disque)
- Verrouillage par mot de passe utilisateur

### Récupération

- Clé de récupération générée automatiquement
- Affichage et régénération depuis profil utilisateur
- Restauration d'accès en cas d'oubli

---

## 🧪 Tests recommandés

### Checklist fonctionnelle

- ✅ Navigation : dashboard, projets, tâches, calendrier, documents
- ✅ CRUD : projet, tâche, document, calendrier
- ✅ Récurrence : création et affichage des tâches récurrentes
- ✅ Workflow : CRUD entités, modèles, gouvernance, kanban
- ✅ Collaboration : membres, invitations, groupes, permissions
- ✅ Communication : notifications, emails, fil d'info
- ✅ Responsive : mobile, tablette, desktop
- ✅ Persistance : refresh, cohérence IndexedDB

### Non-régression

Consulter [`docs/QA_REGRESSION_CHECKLIST.md`](docs/QA_REGRESSION_CHECKLIST.md) pour la checklist détaillée.

---

## ⚠️ Limites connues

| Limitation | Description |
|------------|-------------|
| **SMTP** | Pas d'envoi email natif (utilisation `mailto:`) |
| **Authentification** | Pas d'authentification centralisée (application locale) |
| **Collaboration** | Dépendante du dossier partagé et permissions poste |
| **Navigateur** | Optimisé pour Chrome/Edge (File System Access API) |

---

## 💡 Débogage

### Mode debug

Activer les logs console :

```javascript
localStorage.setItem('taskmda_debug', '1')
```

Désactiver :

```javascript
localStorage.removeItem('taskmda_debug')
```

### Indicateur de synchronisation

L'icône dans le header indique l'état de synchronisation :
- 🔄 Rotation : synchronisation en cours
- ⏳ En attente : fichiers en file
- ❌ Erreur : échec de synchronisation

---

## 🤝 Support

Pour toute question ou problème :

1. Consulter la [documentation](#-documentation)
2. Vérifier les [limites connues](#️-limites-connues)
3. Activer le [mode debug](#-débogage)
4. Contacter l'équipe de support interne

---

## 📄 Licence

MIT License

Copyright (c) 2026 Frédérick MURAT

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## 🎯 Feuille de route

### Évolutions envisagées

- Modal "Rejoindre un projet partagé" avec scanner automatique
- Export/import de clés (fichier .key)
- Interface de gestion des clés partagées
- Rotation automatique des clés
- Révocation de membres
- Notifications temps réel (WebSocket/SSE)

---

<p align="center">
  <strong>NEXUS MDA</strong> - Gestion de projets collaborative sans serveur<br>
  Version 2.0 - Avril 2026<br>
  <br>
  Créé par <strong>Frédérick MURAT</strong><br>
  Licence MIT © 2026
</p>
