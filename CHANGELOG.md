# Changelog - TaskMDA Team

## Correctif - Mai 2026 (warning Tailwind CDN local)

- UI shell (`taskmda-team.html` + `vendor/tailwindcss.js`):
  - suppression du warning console runtime Tailwind:
    - `cdn.tailwindcss.com should not be used in production...`
  - correction locale sans serveur/npm, sans impact fonctionnel sur le rendu existant.
- Verification:
  - warning Tailwind non affiche au chargement.

## Mise a jour incrementale - Mai 2026 (Lot 5: mini probe collaboratif executable - passe 45)

- Orchestrateur (`js/taskmda-team.js`):
  - ajout d un mini protocole executable de verification sync:
    - `runSharedQueueDebugProbe(durationMs)` (debug),
    - exposition `window.runSharedQueueDebugProbe`.
  - comportement:
    - capture snapshot files avant/apres une fenetre d observation,
    - calcule `deltaDropped`,
    - produit un verdict synthétique (`ok`/`warn`) + report detaille.
- Verification:
  - `node --check js/taskmda-team.js` OK

## Mise a jour incrementale - Mai 2026 (Lot 5: integrity guard debug files - passe 44)

- Orchestrateur (`js/taskmda-team.js`):
  - ajout d un controle d integrite leger en mode debug:
    - `validateSharedQueueIntegrityInDebug()`.
  - controles:
    - tailles invalides/negatives des files et sets in-flight,
    - warning si `isSharedWriteProcessing` actif avec file vide,
    - warning si cardinalite `sharedWriteQueuedIds` < profondeur file principale.
  - integration dans le reporter periodique (`startSharedQueueDebugReporter`).
- Effet attendu:
  - detection precoce d etats incoherents pendant les tests collaboratifs sans impact production.
- Verification:
  - `node --check js/taskmda-team.js` OK

## Mise a jour incrementale - Mai 2026 (Lot 5: reset metrics + export debug - passe 43)

- Orchestrateur (`js/taskmda-team.js`):
  - ajout de `resetSharedQueueMetrics()` pour reinitialiser les compteurs queue au reconnect/deconnect dossier partage.
  - ajout de `exportSharedQueueDebugSnapshot()` pour export compact de l etat agrege des 3 files en debug.
  - exposition debug globale: `window.exportSharedQueueDebugSnapshot`.
- Effet attendu:
  - comparaison de sessions collaborative plus fiable (compteurs remis a zero par session) + extraction rapide des metriques.
- Verification:
  - `node --check js/taskmda-team.js` OK

## Mise a jour incrementale - Mai 2026 (Lot 5: health guard debug queue - passe 42)

- Orchestrateur (`js/taskmda-team.js`):
  - ajout d un garde-fou sante des files collaboratives (mode debug uniquement):
    - detection d augmentation rapide des `dropped` agregees (3 files),
    - seuil: `SHARED_QUEUE_HEALTH_DROP_ALERT_THRESHOLD = 3`,
    - cooldown anti-spam: `SHARED_QUEUE_HEALTH_ALERT_COOLDOWN_MS = 30000`.
  - comportement:
    - toast discret debug (`Debug sync: hausse des echecs queue (+N)`),
    - log detaille `[sync-queue:health-alert]` avec snapshot agrege.
- Effet attendu:
  - detection rapide des degradations de synchronisation en tests collaboratifs, sans bruit excessif.
- Verification:
  - `node --check js/taskmda-team.js` OK

## Mise a jour incrementale - Mai 2026 (Lot 5: rapport debug agrege des files - passe 41)

- Orchestrateur (`js/taskmda-team.js`):
  - ajout d un rapport debug periodique agrege pour les 3 files collaboratives:
    - file evenements projet (`sharedWriteQueue`),
    - file messages globaux,
    - file workflow.
  - cadence: `SHARED_QUEUE_DEBUG_REPORT_INTERVAL_MS = 15000` (15s).
  - activation uniquement en mode debug (`taskmda_debug=1`) via:
    - `startSharedQueueDebugReporter()` au demarrage polling,
    - `stopSharedQueueDebugReporter()` a l arret polling.
- Effet attendu:
  - meilleure observabilite continue (debit, retries, drops, profondeur) pendant les tests collaboratifs.
- Verification:
  - `node --check js/taskmda-team.js` OK

## Mise a jour incrementale - Mai 2026 (Lot 5: dedup in-flight workflow/messages - passe 40)

- Orchestrateur (`js/taskmda-team.js`):
  - ajout de deduplication in-flight pour les files auxiliaires:
    - `globalMessageSharedQueuedIds` pour `globalMessageSharedDeleteQueue`,
    - `workflowSharedQueuedChangeIds` pour `workflowSharedWriteQueue`.
  - les enqueues ignorent desormais les doublons tant que le meme `messageId`/`changeId` est deja en attente.
  - nettoyage des ids in-flight apres traitement (succes/echec) + reset explicite lors de connexion/deconnexion dossier partage.
- Effet attendu:
  - reduction de la contention I/O et des ecritures redondantes en mode collaboratif.
- Verification:
  - `node --check js/taskmda-team.js` OK

## Mise a jour incrementale - Mai 2026 (Lot 5: files workflow/messages harmonisees - passe 39)

- Orchestrateur (`js/taskmda-team.js`):
  - extension de la discipline queue/backoff/metriques aux files auxiliaires:
    - `globalMessageSharedDeleteQueue`
    - `workflowSharedWriteQueue`
  - ajouts:
    - retry borné + backoff homogène via:
      - `writeGlobalMessageToSharedFolderWithRetry(...)`
      - `writeWorkflowChangeToSharedFolderWithRetry(...)`
    - métriques debug dédiées:
      - `globalMessageSharedQueueMetrics`
      - `workflowSharedQueueMetrics`
    - logging debug unifié via `logAuxSharedQueueMetrics(...)`.
- Effet attendu:
  - meilleure robustesse aux erreurs d ecriture transitoires et observabilite homogène des files collaboratives.
- Verification:
  - `node --check js/taskmda-team.js` OK

## Mise a jour incrementale - Mai 2026 (Lot 5: queue sync collaborative v1 - passe 38)

- Orchestrateur (`js/taskmda-team.js`):
  - optimisation de la file d ecriture collaborative `sharedWriteQueue`:
    - priorisation des enqueues par type d evenement (`DELETE_*` > `UPDATE_*` > `CREATE_*`),
    - backoff homogène centralisé avec jitter (`getSharedWriteBackoffDelayMs`),
    - métriques debug de file (`sharedWriteMetrics`) + snapshots via `logSharedWriteMetrics(...)`.
  - conservation du contrat fonctionnel existant (retry borne, fallback notification).
- Effet attendu:
  - meilleure stabilité de la synchronisation en charge et meilleure observabilité en mode debug.
- Verification:
  - `node --check js/taskmda-team.js` OK

## Mise a jour incrementale - Mai 2026 (Lot 3: instrumentation perf renderGlobalTasks - passe 37)

- Orchestrateur (`js/taskmda-team.js`):
  - ajout d une instrumentation legere en mode debug sur le wrapper `renderGlobalTasksWithEmptyState()`:
    - mesure de `renderGlobalTasksBase` via log `[perf] renderGlobalTasksBase(ms)= ...`
    - meta `viewMode`.
  - aucune incidence fonctionnelle hors mode debug (`taskmda_debug=1`).
- Effet attendu:
  - mesure objective des gains Lot 3 sur le rendu taches globales.
- Verification:
  - `node --check js/taskmda-team.js` OK

## Mise a jour incrementale - Mai 2026 (Lot 3: instrumentation perf renderProjects - passe 36)

- Orchestrateur (`js/taskmda-team.js`):
  - ajout d une instrumentation legere en mode debug dans `renderProjects()`:
    - timing global `[perf] renderProjects(ms)= ...`
    - meta de contexte (`reason`, `totalProjects`, `pageItems`, `currentPage`, `viewMode`).
  - aucune incidence fonctionnelle hors mode debug (`taskmda_debug=1`).
- Effet attendu:
  - mesure objective des gains Lot 3 sur les parcours liste projets.
- Verification:
  - `node --check js/taskmda-team.js` OK

## Mise a jour incrementale - Mai 2026 (Lot 3: patch incremental suppression bulk projets - passe 35)

- Orchestrateur (`js/taskmda-team.js`):
  - ajout de `tryRemoveProjectCardsIncremental(projectIds)` pour supprimer localement plusieurs cartes projet visibles.
  - integration dans `deleteSelectedProjectsBulk()`:
    - collecte des `projectId` supprimes,
    - tentative de patch DOM bulk,
    - fallback unique `renderProjects()` si patch incomplet/non applicable.
- Effet attendu:
  - suppression en masse plus fluide sur la liste projets, avec rerender complet reserve aux cas necessaires.
- Verification:
  - `node --check js/taskmda-team.js` OK

## Mise a jour incrementale - Mai 2026 (Lot 3: patch incremental suppression carte projet - passe 34)

- Orchestrateur (`js/taskmda-team.js`):
  - ajout de `tryRemoveProjectCardIncremental(projectId)` pour retirer localement une carte projet visible dans `#projects-container`.
  - integration dans `deleteCurrentProject(...)` (flux dashboard): tentative de suppression DOM cible avant fallback `renderProjects()`.
- Effet attendu:
  - suppression projet plus fluide en vue liste, avec rerender complet seulement si le patch n est pas applicable.
- Verification:
  - `node --check js/taskmda-team.js` OK

## Mise a jour incrementale - Mai 2026 (Lot 3: extension patch statut projet via edition - passe 33)

- Orchestrateur (`js/taskmda-team.js`):
  - extension du patch incrementel carte projet au flux `saveProjectEdits()`.
  - quand le statut projet change (incluant `termine` -> `en-cours`), tentative de patch DOM cible via `tryPatchProjectCardStatusIncremental(...)` avant fallback `renderProjects()`.
- Effet attendu:
  - transitions de statut plus fluides en vue liste, y compris les retours depuis `termine`.
- Verification:
  - `node --check js/taskmda-team.js` OK

## Mise a jour incrementale - Mai 2026 (Lot 3: patch incremental carte projet statut - passe 32)

- Orchestrateur (`js/taskmda-team.js`):
  - ajout de helpers incrementaux carte projet:
    - `getProjectStatusChipHtml(...)`
    - `getProjectStatusProgressClass(...)`
    - `tryPatchProjectCardStatusIncremental(projectId, nextStatus)`
  - `markProjectCompleted(...)` tente desormais un patch DOM cible (badge statut, barre de progression, libelle, bouton `Realise`) avant fallback `renderProjects()`.
- Effet attendu:
  - mutation de statut projet plus fluide en vue liste, avec rerender complet seulement si patch impossible.
- Verification:
  - `node --check js/taskmda-team.js` OK

## Mise a jour incrementale - Mai 2026 (Lot 3: extension gating sync/import projets - passe 31)

- Orchestrateur (`js/taskmda-team.js`):
  - extension de `isProjectsListViewActive()` sur des rafraichissements post-sync/import:
    - sync/chargement evenements
    - connexion dossier partage
    - bascule visibilite privee
    - import JSON
    - lecture dossiers projets
  - `renderProjects()` est desormais execute uniquement si la liste projets est visible.
- Effet attendu:
  - reduction de rerenders projets non visibles apres operations de sync/import.
- Verification:
  - `node --check js/taskmda-team.js` OK

## Mise a jour incrementale - Mai 2026 (Lot 3: extension gating renderProjects - passe 30)

- Orchestrateur (`js/taskmda-team.js`):
  - extension de `isProjectsListViewActive()` sur plusieurs flux de mutation pour eviter des `renderProjects()` hors vue liste:
    - notification nouvel evenement projet (`notifyNewEvent`)
    - edition projet (`saveProjectEdits`)
    - suppression projet (`deleteProject`)
    - completion projet (`markProjectCompleted`)
- Effet attendu:
  - reduction de rerenders complets non visibles lors d operations en contexte detail/global.
- Verification:
  - `node --check js/taskmda-team.js` OK

## Mise a jour incrementale - Mai 2026 (Lot 3: gating ciblé renderProjects - passe 29)

- Orchestrateur (`js/taskmda-team.js`):
  - ajout du helper `isProjectsListViewActive()`:
    - `workspaceMode === 'dashboard'`
    - ou `workspaceMode === 'project'` sans projet detail ouvert.
  - application sur le flux `conversion tache -> projet` pour eviter `renderProjects()` quand la liste projets n est pas visible.
- Effet attendu:
  - reduction d un rerender complet inutile apres conversion depuis contextes non-liste.
- Verification:
  - `node --check js/taskmda-team.js` OK

## Mise a jour incrementale - Mai 2026 (Lot 3: gating rerender taches globales - passe 28)

- Orchestrateur (`js/taskmda-team.js`):
  - ajout du helper `isGlobalTasksViewActive()`.
  - remplacement de plusieurs conditions directes `workspaceMode/globalWorkspaceView` pour ne rerendre `renderGlobalTasks()` que si la vue `tasks` globale est active.
  - application sur des parcours de mutation taches (archive/restaure/supprime/termine/deplacement), auto-archivage et rafraichissements UI.
- Effet attendu:
  - reduction des rerenders complets inutiles quand l utilisateur est sur une autre vue globale.
- Verification:
  - `node --check js/taskmda-team.js` OK

## Mise a jour incrementale - Mai 2026 (Lot 6: nettoyage final flags bound editor/workflow - passe 27)

- Editeur (`js/taskmda-editor.js`):
  - `dataset.boundEditorAction` -> `dataset.editorActionBound`
  - `dataset.boundDescriptionImageSelection` -> `dataset.editorDescriptionImageSelectionBound`
  - `dataset.boundDescriptionImage` -> `dataset.editorDescriptionImageBound`
- Workflow (`js/taskmda-workflow.js`):
  - `dataset.boundWorkflowWikiHelper` remplace par des flags explicites par bouton:
    - `dataset.workflowWikiSectionHelperBound`
    - `dataset.workflowWikiLinkHelperBound`
    - `dataset.workflowWikiPreviewHelperBound`
  - `dataset.boundWorkflowProcedureEditor` -> `dataset.workflowProcedureEditorActionBound`
- Verification:
  - `node --check js/taskmda-editor.js` OK
  - `node --check js/taskmda-workflow.js` OK

## Mise a jour incrementale - Mai 2026 (Lot 6: guard partage doc preview clarifie - passe 26)

- Documents preview (`js/taskmda-team.js`, `js/taskmda-doc.js`):
  - conservation du guard partage `inlineDocPreviewBound` pour eviter les double-bindings entre orchestrateur et bundle doc.
  - clarification par constante locale `DOC_PREVIEW_SHARED_BIND_FLAG` + commentaire d intention dans les deux fichiers.
- Effet attendu:
  - meilleure lisibilite du contrat inter-modules, sans changement de comportement.
- Verification:
  - `node --check js/taskmda-team.js` OK
  - `node --check js/taskmda-doc.js` OK

## Mise a jour incrementale - Mai 2026 (Lot 6: hygiene marker editor overlay - passe 25)

- Module editeur (`js/taskmda-editor.js`):
  - remplacement du marqueur generique `dataset.bound` sur l overlay image par `dataset.editorImageOverlayBound`.
- Effet attendu:
  - baisse du risque de collision de marquage et intention de binding plus explicite.
- Verification:
  - `node --check js/taskmda-editor.js` OK
  - `node --check js/taskmda-team.js` OK

## Mise a jour incrementale - Mai 2026 (Lot 6: hygiene flags toggles/select - passe 24)

- Orchestrateur (`js/taskmda-team.js`):
  - remplacement de marqueurs `dataset` semi-generiques par des noms explicites:
    - `dataset.toggleBound` -> `dataset.multiSelectToggleBound`
    - `dataset.toggleClickBound` -> `dataset.projectDocToggleClickBound`
    - `dataset.changeBound` -> `dataset.projectDocTaskChangeBound`
- Effet attendu:
  - marqueurs de binding plus lisibles et moins sujets aux collisions inter-zones.
- Verification:
  - `node --check js/taskmda-team.js` OK

## Mise a jour incrementale - Mai 2026 (Lot 6: hygiene guards dataset docs projet - passe 23)

- Orchestrateur (`js/taskmda-team.js`):
  - remplacement de `dataset.bound` par des flags explicites dans le selecteur de taches des documents projet:
    - `dataset.projectDocSelectAllBound`
    - `dataset.projectDocClearSelectionBound`
    - `dataset.projectDocTaskOptionsBound`
    - `dataset.projectDocTaskFilterBound`
- Effet attendu:
  - suppression des marqueurs generiques restants sur cette zone et reduction du risque de collision de bindings.
- Verification:
  - `node --check js/taskmda-team.js` OK

## Correctif - Mai 2026 (notes globales: recursion cache)

- Orchestrateur (`js/taskmda-team.js`):
  - correction de `getAllGlobalNotesCached()` qui appelait par erreur `getAllGlobalNotesCached()` (recursion infinie).
  - lecture source restauree vers `getAllDecrypted('globalNotes', 'noteId')`.
- Verification:
  - `node --check js/taskmda-team.js` OK

## Mise a jour incrementale - Mai 2026 (Lot 6: hygiene guards dataset notes projet - passe 22)

- Notes projet (`js/taskmda-team.js`):
  - remplacement des flags dataset generiques/restants par des noms explicites:
    - `dataset.boundThemeSync` -> `dataset.projectNoteThemeInputBound` / `dataset.projectNoteThemeKnownBound`
    - `dataset.noteAutosaveBound` -> `dataset.projectNoteAutosaveBound`
    - `dataset.noteDraftBound` -> `dataset.projectNoteDraftBound`
- Effet attendu:
  - reduction du risque de collisions de marquage entre modales et bindings heterogenes.
- Verification:
  - `node --check js/taskmda-team.js` OK

## Mise a jour incrementale - Mai 2026 (Lot 6: harmonisation guards dataset notes globales - passe 21)

- Notes globales (`js/taskmda-team.js`):
  - remplacement de guards generiques `dataset.bound` par des flags explicites:
    - `dataset.globalNoteTagsKnownBound`
    - `dataset.globalNoteLinkedTaskBound`
  - zone concernee: binding des listeners `tags connus` + `tache liee` dans l ouverture de la modale note globale.
- Effet attendu:
  - reduction du risque de collision de marquage entre bindings heterogenes.
- Verification:
  - `node --check js/taskmda-team.js` OK

## Mise a jour incrementale - Mai 2026 (Lot 6: micro-factorisation scans DOM feed - passe 20)

- Fil d info (`js/taskmda-global.js`):
  - factorisation des scans DOM repetes des menus export feed dans un helper local:
    - `forEachOpenGlobalFeedExportMenu(visitor)`
  - reutilisation de ce helper dans:
    - `toggleGlobalFeedExportMenu(...)`
    - `handleGlobalFeedExportMenuDocumentClick(...)`
- Effet attendu:
  - suppression de duplication, maintenance plus simple, logique de fermeture centralisee.
- Verification:
  - `node --check js/taskmda-global.js` OK

## Mise a jour incrementale - Mai 2026 (Lot 6: hygiene listeners global-messages - passe 19)

- Module messages globaux (`js/taskmda-global.js`):
  - ajout d une garde d idempotence dans `TaskMDAGlobalMessages.createModule(...).bindDom()`:
    - `let bound = false`
    - `if (bound) return; bound = true;`
- Effet attendu:
  - evite les double-bindings de listeners en cas de rebind involontaire.
- Verification:
  - `node --check js/taskmda-global.js` OK

## Mise a jour incrementale - Mai 2026 (Lot 3: patch DOM feed creation - passe 18)

- Fil d info (`js/taskmda-global.js`):
  - `publishGlobalFeedPost(...)` (branche creation) tente desormais une insertion incrementale de la carte au lieu d un rerender complet direct.
  - ajout du helper `tryInsertGlobalFeedPostIncremental(post)`:
    - recalcul scope feed courant,
    - generation de la carte du nouveau post,
    - insertion DOM selon l ordre du scope filtre/tri (ancre suivante disponible, sinon append),
    - support du cas liste vide (remplacement de l etat vide),
    - mise a jour du resume feed (`renderGlobalFeedSummary`).
  - fallback automatique conserve vers `actions.renderGlobalFeed()` si insertion impossible.
- Verification:
  - `node --check js/taskmda-global.js` OK

## Mise a jour incrementale - Mai 2026 (Lot 3: patch DOM feed edition - passe 17)

- Fil d info (`js/taskmda-global.js`):
  - `publishGlobalFeedPost(...)` (branche edition) tente desormais un patch incremental de la carte editee avant fallback rerender complet.
  - ajout du helper `tryPatchGlobalFeedPostEditIncremental(post)`:
    - recalcul scope feed courant,
    - regeneration de la carte cible uniquement (`buildGlobalFeedCardsHtml([post])`),
    - remplacement DOM de la carte `#global-feed-post-*`,
    - mise a jour du resume feed (`renderGlobalFeedSummary`).
  - fallback automatique conserve vers `actions.renderGlobalFeed()` si patch impossible (carte absente, post filtre, etc.).
- Verification:
  - `node --check js/taskmda-global.js` OK

## Mise a jour incrementale - Mai 2026 (Lot 3: patch DOM feed suppression - passe 16)

- Fil d info (`js/taskmda-team.js`):
  - ajout de `tryPatchGlobalFeedPostDeleteIncremental(postId)`:
    - suppression locale de la carte `#global-feed-post-*` quand la vue feed est active,
    - mise a jour du resume feed via runtime (`renderGlobalFeedSummary`) quand possible,
    - fallback automatique sur `renderGlobalFeed()` complet si patch non applicable ou vue vide.
  - `deleteGlobalFeedPost(...)` utilise maintenant ce patch incremental avant fallback complet.
- Effet attendu:
  - suppression plus fluide des posts visibles, moins de rerenders complets.
- Verification:
  - `node --check js/taskmda-team.js` OK

## Mise a jour incrementale - Mai 2026 (Lot 4: read-model documents globaux - passe 15)

- Documents globaux (`js/taskmda-team.js`):
  - ajout d un read-model memoire court (`GLOBAL_DOCS_READ_MODEL_TTL_MS = 1200ms`) avec cache liste + index `byId`.
  - ajout des helpers:
    - `invalidateGlobalDocsReadModel()`
    - `getAllGlobalDocsCached()`
    - `getGlobalDocByIdCached(docId)`
  - branchement des principaux consommateurs Notes/Feed/Read-modal vers `getAllGlobalDocsCached()`.
  - invalidation explicite ajoutee sur ecritures/suppressions `globalDocs` dans les parcours edition/liaison/docs.
  - invalidation defensive apres `deleteGlobalDocument(...)` et `addStandaloneDocuments(...)`.
- Verification:
  - `node --check js/taskmda-team.js` OK

## Mise a jour incrementale - Mai 2026 (Lot 4: read-model notes globales - passe 14)

- Notes globales (`js/taskmda-team.js`):
  - ajout d un read-model memoire court (`GLOBAL_NOTES_READ_MODEL_TTL_MS = 1200ms`) avec cache liste + index `byId`.
  - ajout des wrappers centralises:
    - `getAllGlobalNotesCached()`
    - `getGlobalNoteByIdCached(noteId)`
    - `putGlobalNoteCached(note)` (avec invalidation)
    - `deleteGlobalNoteByIdCached(noteId)` (avec invalidation)
  - branchement des parcours notes (edition/suppression/migration + actions runtime modules) vers ces wrappers.
- Effet attendu:
  - diminution des lectures IndexedDB redondantes dans les cycles UI notes.
- Verification:
  - `node --check js/taskmda-team.js` OK

## Mise a jour incrementale - Mai 2026 (Lot 4: read-model feed global - passe 13)

- Fil d info (`js/taskmda-team.js`):
  - ajout d un read-model memoire court pour le scope de rendu feed (`GLOBAL_FEED_READ_MODEL_TTL_MS = 1200ms`).
  - `renderGlobalFeed()` reutilise `getGlobalFeedRenderScopeCached(...)` au lieu de relire systematiquement le scope.
  - invalidation explicite du cache sur ecritures `globalPosts` (creation, mise a jour, suppression logique, sync dossier partage) et sur la passerelle runtime `putGlobalPost`.
- Effet attendu:
  - reduction des lectures redondantes IndexedDB lors des interactions feed rapprochées.
- Verification:
  - `node --check js/taskmda-team.js` OK

## Mise a jour incrementale - Mai 2026 (Lot 3: harmonisation rerender feed - passe 12)

- Fil d info (`js/taskmda-team.js`):
  - ajout du helper `isGlobalFeedViewActive()` (source unique de verite).
  - remplacement des conditions repetees `workspaceMode/globalWorkspaceView` sur les rerenders `renderGlobalFeed()` post-mutation/sync.
  - harmonisation de deux injections runtime `isGlobalFeedView` pour reutiliser le helper.
- Effet attendu:
  - moins de duplication conditionnelle, maintenance plus simple, risque de divergence reduit.
- Verification:
  - `node --check js/taskmda-team.js` OK

## Correctif - Mai 2026 (messages projet: allMessages undefined)

- Correction dans `js/taskmda-team.js`:
  - suppression d un bloc residuel hors fonction qui referencait `allMessages` sans declaration, provoquant `Uncaught ReferenceError`.
  - reintegration du controle de coherences `projectReactionPickerMessageId` au debut de `renderMessages(messages)`.
- Verification:
  - `node --check js/taskmda-team.js` OK

## Mise a jour incrementale - Mai 2026 (Lot 3: rendu incremental fil d info global - passe 11)

- Fil d info global (`js/taskmda-team.js`):
  - `deleteGlobalFeedPost(...)` n impose plus un rerender complet hors vue active `Feed`.
  - rendu conserve a l identique quand la vue `Feed` est visible.
- Verification:
  - `node --check js/taskmda-team.js` OK

## Mise a jour incrementale - Mai 2026 (Lot 3: rendu incremental notes globales - passe 10)

- Notes globales (`js/taskmda-global.js`):
  - ajout de `isGlobalNotesViewActive()` et `rerenderGlobalNotesViewIfActive()`.
  - les mutations `favori`, `publication fil` et `suppression multiple` evitent desormais le rerender complet quand la rubrique `Notes` globale n est pas visible.
  - comportement conserve quand la vue Notes est active (rerender normal).
- Verification:
  - `node --check js/taskmda-global.js` OK

## Mise a jour incrementale - Mai 2026 (Lot 2: audit code mort post-refactor - passe 9)

- Orchestrateur (`js/taskmda-team.js`):
  - suppression de fonctions orphelines non referencees apres verification:
    - `escapeOdsWhereValue`
    - `isProjectResourceLockedByOther`
    - `refreshGlobalMessageHiddenPeersForCurrentUser`
    - `renderMessagesLegacy`
    - `triggerWorkspaceRevealAnimation`
  - correction de structure locale suite a suppression (retrait d un bloc residuel legacy dans la zone messages).
- Verification:
  - `node --check js/taskmda-team.js` OK

## Mise a jour incrementale - Mai 2026 (Lot 2: centralisation utilitaires purs - passe 8)

- Orchestrateur:
  - suppression de `getSubtaskProgress` devenu orphelin dans `js/taskmda-team.js` (logique sous-taches deja deleguee au module `js/taskmda-tasks.js`).
- Effet attendu:
  - reduction d entropie (code mort retire) apres harmonisation sous-taches.

## Mise a jour incrementale - Mai 2026 (Lot 2: centralisation utilitaires purs - passe 7)

- Orchestrateur:
  - simplification des helpers sous-taches dans `js/taskmda-team.js` (`parseSubtasks`, `getSubtaskProgress`, `buildSubtaskProgressHtml`, `mergeSubtasksWithExisting`) vers des delegations directes `TaskMDATasks`.
  - suppression des fallbacks metier locaux dupliques; fallback minimal de surete conserve.
- Effet attendu:
  - reduction nette du code duplique entre orchestrateur et module `js/taskmda-tasks.js`.
  - maintenance concentree dans le module taches.

## Mise a jour incrementale - Mai 2026 (Lot 2: centralisation utilitaires purs - passe 6)

- Module taches (`js/taskmda-tasks.js`):
  - `formatExportDateTag` delegue desormais prioritairement a `TaskMDACoreUtils.formatExportDateTag`.
  - adaptation de format conservee (`_` -> `-`) pour garder la nomenclature de fichier historique cote export taches.
  - fallback local conserve si core-utils indisponible.
- Effet attendu:
  - reduction de duplication de logique de tag date d export.
  - convergence progressive des utilitaires d export.

## Mise a jour incrementale - Mai 2026 (Lot 2: centralisation utilitaires purs - passe 5)

- Core utils:
  - ajout de `formatDateTime(dateValue, emptyLabel)` dans `js/taskmda-core-utils.js`.
- Modules:
  - `js/taskmda-project.js`: `formatDateTime` delegue a `TaskMDACoreUtils.formatDateTime(..., '-')`.
  - `js/taskmda-file-watcher.js`: `formatDate` delegue a `TaskMDACoreUtils.formatDateTime(..., 'Jamais')`.
- Effet attendu:
  - alignement du formatage date/heure entre modules avec etiquette vide parametrable.
  - reduction de duplication locale.

## Mise a jour incrementale - Mai 2026 (Lot 2: centralisation utilitaires purs - passe 4)

- Projet notes (`js/taskmda-project.js`):
  - harmonisation des wrappers `escapeHtml` et `normalizeSearch` avec references `TaskMDACoreUtils` resolues une seule fois au chargement du module.
  - fallback local conserve (comportement stable) si `TaskMDACoreUtils` indisponible.
- Effet attendu:
  - reduction du bruit repetitif dans les helpers projet-notes.
  - alignement style delegation core avec les autres modules.

## Mise a jour incrementale - Mai 2026 (Lot 2: centralisation utilitaires purs - passe 3)

- Core utils:
  - ajout de `formatDate(dateValue)` dans `js/taskmda-core-utils.js`.
- Orchestrateur:
  - `js/taskmda-team.js` delegue `formatDate` a `TaskMDACoreUtils`.
- Effet attendu:
  - alignement du formatage de date sur un utilitaire unique.
  - baisse de duplication locale dans l orchestrateur.

## Mise a jour incrementale - Mai 2026 (Lot 2: centralisation utilitaires purs - passe 2)

- Modules:
  - `js/taskmda-file-watcher.js`: `escapeHtml` et `formatFileSize` deleguent desormais prioritairement a `TaskMDACoreUtils` (fallback local conserve).
  - `js/taskmda-notes-shared.js`: `escapeHtml` delegue desormais prioritairement a `TaskMDACoreUtils` (fallback local conserve).
- Effet attendu:
  - reduction des duplications de helpers transverses.
  - comportements alignes entre modules UI.

## Mise a jour incrementale - Mai 2026 (Lot 2: centralisation utilitaires purs - passe 1)

- Core utils:
  - ajout de `sharingModeBadge`, `matchesQuery`, `sanitizeFilenameSegment` dans `js/taskmda-core-utils.js`.
- Orchestrateur:
  - `js/taskmda-team.js` delegue maintenant ces fonctions a `TaskMDACoreUtils` (suppression de logique locale dupliquee).
- Effet attendu:
  - reduction des duplications structurelles et du risque d incoherence entre vues.

## Mise a jour incrementale - Mai 2026 (Lot 1: cloture extraction rendu digest)

- Orchestrateur:
  - extraction des derniers blocs digest restants (`split email body/signature`, `buildDigestContentHtml`, sanitation fragment) vers `js/taskmda-feed-digest-content.js`.
  - `js/taskmda-team.js` conserve des delegations minces via `feedDigestContentRuntime`.
  - ajout du script `taskmda-feed-digest-content.js` dans `taskmda-team.html` avant l orchestrateur.
- Effet attendu:
  - cloture du gisement digest du Lot 1 (UI + editor + MIME + PDF + content).
  - reduction supplementaire de la taille et du couplage de `js/taskmda-team.js`.

## Mise a jour incrementale - Mai 2026 (Lot 1: extraction loader pdf2md)

- Orchestrateur:
  - deplacement de `ensurePdf2MdModule` et de la logique `extractPdfMarkdownWithCdn` vers `js/taskmda-feed-digest-pdf.js`.
  - `js/taskmda-team.js` conserve une delegation mince de `extractPdfMarkdownWithCdn` via `feedDigestPdfRuntime`.
- Effet attendu:
  - amincissement supplementaire du bloc digest dans l orchestrateur.
  - centralisation complete des concerns PDF digest dans un module unique.

## Mise a jour incrementale - Mai 2026 (Lot 1: extraction digest PDF/render helpers)

- Orchestrateur:
  - extraction des helpers de structuration/rendu digest PDF vers `js/taskmda-feed-digest-pdf.js` (`buildPdfStructuredPage`, liens de page, trim compact, rendu markdown).
  - `js/taskmda-team.js` conserve des delegations minces via `feedDigestPdfRuntime`.
  - ajout du script `taskmda-feed-digest-pdf.js` dans `taskmda-team.html` avant l orchestrateur.
- Effet attendu:
  - nouvelle reduction du volume du bloc digest dans le fichier central.
  - meilleure maintenabilite des regles de rendu PDF dans un module dedie.

## Mise a jour incrementale - Mai 2026 (Lot 1: extraction digest MIME/email)

- Orchestrateur:
  - extraction du parsing MIME/email (`parseEmlDigest`, fallback `msg`, pont `postal-mime`) vers `js/taskmda-feed-digest-mime.js`.
  - `js/taskmda-team.js` conserve des delegations minces via `feedDigestMimeRuntime`.
  - suppression dans l orchestrateur des fonctions MIME devenues obsoletes (`postal-mime` loader + normalisation en-tetes email associee).
  - ajout du script `taskmda-feed-digest-mime.js` dans `taskmda-team.html` avant l orchestrateur.
- Effet attendu:
  - reduction nette du bloc digest dans le fichier central.
  - maintenance facilitee du parsing email dans un module metier dedie.

## Mise a jour incrementale - Mai 2026 (Lot 1: extraction digest editor)

- Orchestrateur:
  - extraction de `appendDigestBlocksToRichEditor` et `importProjectNoteDigestFromFiles` vers `js/taskmda-feed-digest-editor.js`.
  - `js/taskmda-team.js` conserve des wrappers de delegation minces via `feedDigestEditorRuntime`.
  - ajout du script `taskmda-feed-digest-editor.js` dans `taskmda-team.html` avant l orchestrateur.
- Effet attendu:
  - baisse supplementaire de la taille et du couplage du fichier central.
  - logique d import digest des editeurs centralisee dans un module metier/UI dedie.

## Mise a jour incrementale - Mai 2026 (Lot 1: extraction UI digest fil d info)

- Orchestrateur:
  - extraction des helpers UI digest (`normalizeGlobalFeedDigestView`, `pickGlobalFeedDigestImportMode`, `summarizeDigestText`) vers `js/taskmda-feed-digest-ui.js`.
  - `js/taskmda-team.js` conserve des delegations runtime minces via `feedDigestUiRuntime`.
  - ajout du script `taskmda-feed-digest-ui.js` dans `taskmda-team.html` avant l orchestrateur.
- Effet attendu:
  - reduction du bruit metier/UI digest dans le fichier central.
  - point unique de maintenance pour le comportement compact/complet des imports digest.

## Mise a jour incrementale - Mai 2026 (Lot 1: extraction utilitaires refs docs inline)

- Orchestrateur:
  - extraction des helpers docs inline (`buildInlineAttachedDocumentHtml`, `extractLinkedGlobalDocIdsFromHtml`, `stripInlineAttachedDocumentBlocksFromHtml`) vers un module dedie `js/taskmda-global-doc-ref-utils.js`.
  - `js/taskmda-team.js` conserve des delegations minces via `globalDocRefUtilsRuntime`.
  - ajout du script `taskmda-global-doc-ref-utils.js` dans `taskmda-team.html` avant l orchestrateur.
- Effet attendu:
  - reduction du volume et du couplage dans `js/taskmda-team.js`.
  - regroupement metier plus lisible pour la gestion des references documents inline.

## Mise a jour incrementale - Mai 2026 (Lot 1: global feed wrappers + fiabilisation scope)

- Global feed (orchestrateur):
  - suppression du wrapper one-liner local `publishGlobalFeedDigestFromFiles`; delegation inline dans le binding `TaskMDACommsUI`.
  - suppression du wrapper mort `resolveLinkedDocsForFeedPost` dans `js/taskmda-team.js`.
  - ajout de fonctions nommees locales `openGlobalFeedReference` et `openGlobalFeedPost`, puis exposition `window.*` associee.
  - harmonisation de `openGlobalFeedPostReadModal` et `openGlobalHubAggregatedNoteRead` en fonctions nommees locales avec exposition `window.*`.
  - factorisation des assignations `window.*` pass-through vers runtimes (`global-notes`, `global-feed`, `project-read-actions-ui`, `global-calendar`, `global-docs`) via helper unique `exposeRuntimeActionsToWindow(...)`.
  - objectif: reduire le bruit orchestrateur et fiabiliser les injections cross-modules (scope lexical explicite).

## Mise a jour incrementale - Mai 2026 (Lot 2: harmonisation utilitaire recherche)

- Projet notes (`js/taskmda-project.js`):
  - harmonisation de `normalizeSearch` avec `TaskMDACoreUtils.normalizeSearch` (delegation prioritaire + fallback local).
  - comportement conserve (`trim` final) pour eviter toute regression de filtrage.
  - harmonisation de `escapeHtml` avec `TaskMDACoreUtils.escapeHtml` (delegation prioritaire + fallback local).
  - micro-factorisation de `buildUnifiedCardHtml`: suppression de normalisations repetitives de `noteId` via variable locale unique `noteIdRaw`.
  - micro-factorisation de `defaultProjectActionsRenderer`: normalisation `noteIdRaw` centralisee avant echappement HTML.
  - micro-factorisation de `buildUnifiedCardHtml`: centralisation de `createdByRaw` pour eviter la repetition de conversions lors de la resolution auteur.
  - micro-factorisation de `buildUnifiedCardHtml`: pre-normalisation de `linkedTaskIds` (`linkedTaskIdsNormalized`) pour simplifier la resolution des labels de taches liees.
  - micro-factorisation de `buildUnifiedCardHtml`: extraction de `authorLabel` et `createdAtLabel` pour simplifier le template de carte.
  - micro-factorisation de `renderUnifiedNotesList`: extraction du blob de recherche dans `buildNoteSearchBlob(...)` pour reduire la duplication de logique de filtrage.

## Mise a jour incrementale - Mai 2026 (Lot 3: rendu incrementel notes projet - phase 1)

- Notes projet (`js/taskmda-team.js`):
  - ajout du helper `rerenderProjectNotesViewIfActive(...)`.
  - les mutations `pin/feed/archive/restore/delete` n imposent plus de rerender complet si la vue active n est pas `notes`.
  - le rendu reste coherent: l entree dans l onglet `notes` declenche deja `renderProjectNotes(...)`.
  - objectif: reduire les rerenders inutiles et ameliorer la fluidite hors vue Notes.
  - phase 2: patch incrementel carte unique sur `toggleProjectNoteFeedPublish` via `tryPatchProjectNoteCardIncremental(...)` quand les filtres n impactent pas presence/ordre (sinon fallback rerender complet).
  - phase 3: `renderProjectNotes(...)` differe le rendu complet hors onglet `notes` (conserve la mise a jour des options de liaison taches), pour reduire les recalculs inutiles.
  - phase 4: consolidation de garde via helper `isProjectNotesViewActive()` reutilise par `renderProjectNotes`, `rerenderProjectNotesViewIfActive` et la strategie incrementale.
  - phase 5: factorisation de la preparation des maps de rendu notes dans `buildProjectNotesRenderContext(...)` (reuse rendu complet + patch incremental carte).
  - phase 6: micro-optimisation `renderProjectNotes(...)`: construction du contexte de rendu retardee apres verification de disponibilite du renderer Notes.
  - phase 7: `tryPatchProjectNoteCardIncremental(...)` reutilise le contexte de la vue filtree (`visibleNotes`) pour eviter un recalcul partiel divergent.
  - phase 8: extraction d un helper commun `filterVisibleProjectNotes(...)` pour unifier le filtrage thematique entre rendu complet et patch incremental.
  - phase 9: suppression d une lecture redondante des notes dans `tryPatchProjectNoteCardIncremental(...)` (source unique `notesAll` pour la recherche note + filtrage visible).

## Mise a jour incrementale - Mai 2026 (Revue code: suppression doublon critique)

- Orchestrateur:
  - suppression d une definition dupliquee de `discoverAndLoadExistingProjects` dans `js/taskmda-team.js`.
  - suppression d une definition dupliquee de `renderProjectGroups` dans `js/taskmda-team.js`.
  - conservation de la version robuste (stats de chargement, gestion legacy shared-key, rattachement de cle, reconstruction locale).
  - conservation de la version `renderProjectGroups` la plus complete (membres, selection, edition groupe).
  - objectif: eliminer un risque d entropie et de divergence fonctionnelle silencieuse.

## Mise a jour incrementale - Mai 2026 (Lot 1: orchestrateur aminci)

- Groupes projet:
  - extraction du rendu `renderProjectGroups` vers `js/taskmda-project-members-domain.js`.
  - `js/taskmda-team.js` conserve un wrapper de delegation mince vers `projectMembersDomainRuntime`.
  - injection explicite des dependances de rendu (membres resolus, echappement HTML, fallback annuaire) dans le module domaine.
- Groupes utilisateurs projet:
  - extraction du rendu `renderProjectUserGroups` vers `js/taskmda-project-members-domain.js`.
  - `js/taskmda-team.js` conserve un wrapper de delegation mince vers `projectMembersDomainRuntime`.
- Invitations projet:
  - extraction du rendu `renderProjectInvitations` vers `js/taskmda-project-members-domain.js`.
  - `js/taskmda-team.js` conserve un wrapper de delegation mince vers `projectMembersDomainRuntime`.
- Membres projet:
  - extraction du rendu `renderProjectMembers` vers `js/taskmda-project-members-domain.js`.
  - `js/taskmda-team.js` conserve un wrapper de delegation mince vers `projectMembersDomainRuntime`.
- Thematiques projet:
  - extraction du rendu `renderProjectThemes` vers `js/taskmda-project-members-domain.js`.
  - `js/taskmda-team.js` conserve un wrapper de delegation mince vers `projectMembersDomainRuntime`.
- Matrice des droits projet:
  - extraction du rendu `renderProjectPermissionMatrix` vers `js/taskmda-project-members-domain.js`.
  - conservation de l etat `projectPermissionDetailsOpen` dans l orchestrateur, injecte en lecture au module domaine.
  - `js/taskmda-team.js` conserve un wrapper de delegation mince vers `projectMembersDomainRuntime`.
  - extraction de l action `toggleProjectPermissionDetails` vers le module domaine, avec listener orchestrateur deleguant prioritairement au runtime.
- Selecteurs de roles projet:
  - extraction du rendu `renderProjectRoleSelectors` vers `js/taskmda-project-members-domain.js`.
  - `js/taskmda-team.js` conserve un wrapper de delegation mince vers `projectMembersDomainRuntime`.
- Attribution des roles projet:
  - extraction de `getAssignableProjectRolesForUser` vers `js/taskmda-project-members-domain.js`.
  - `js/taskmda-team.js` supprime sa version locale et injecte `getProjectRoleCatalog` + `normalizeProjectRoleBase` au module domaine.
- Autocompletion annuaire des membres:
  - extraction de `renderMemberDirectoryAutocomplete` vers `js/taskmda-project-members-domain.js`.
  - `js/taskmda-team.js` conserve un wrapper de delegation mince vers `projectMembersDomainRuntime`.
- Binds DOM collaboration projet:
  - extraction des listeners `membres/invitations/groupes/thematiques/permissions` vers `bindDom()` dans `js/taskmda-project-members-domain.js`.
  - simplification de `js/taskmda-team.js` avec un appel unique `projectMembersDomainRuntime.bindDom()`.
  - extraction des listeners d onglets `settings` projet (`overview/members/collab/themes/permissions/structure`) vers `bindDom()` du module domaine.
  - extraction de `setProjectSettingsTab` vers `js/taskmda-project-members-domain.js` (validation onglet + application vue via dependances injectees).
  - `js/taskmda-team.js` conserve un wrapper de delegation avec fallback local.
  - reduction des wrappers pass-through restants (`removeProjectMember`, `selectUserGroup`, `deleteUserGroup`) en assignations globales directes vers le runtime.
  - suppression du bloc de wrappers pass-through `invitations/groupes/thematiques` dans `js/taskmda-team.js`; remplacement par appels runtime directs + exposition `window.*` minimale pour les handlers `onclick`.
  - nettoyage mecanique de doublons consecutifs `refreshLinkedPendingSummaries()` dans `js/taskmda-team.js` (notes/projets/global), sans changement fonctionnel attendu.
  - suppression d un doublon d appel `populateProjectDeadlineForm('project', null)` dans `openNewProjectModal` (`js/taskmda-team.js`).
  - suppression des derniers wrappers de rendu collaboration dans `js/taskmda-team.js` (`renderProjectRoleSelectors`, `renderProjectMembers`, `renderProjectUserGroups`, `renderProjectPermissionMatrix`) au profit d appels runtime directs.
  - correctif de compatibilite handlers inline: exposition globale `window.deleteProjectGroup` restauree pour les actions `onclick` rendues par le module domaine.
  - factorisation du rendu collaboration projet dans `renderProjectCollaborationPanels(...)` (`js/taskmda-team.js`) pour supprimer les blocs de delegation repetes.
- Global notes/feed (orchestrateur):
  - suppression de wrappers one-liner morts (non utilises) pour les actions bulk notes globales (`setGlobalNotesPage` local, bulk selection/delete helpers, favorite helper, ouverture modal export).
  - conservation des points d entree globaux actifs via `window.*` relies directement au runtime.
  - suppression du wrapper local `closeGlobalNotesBulkExportModal` et bascule vers appels runtime directs.
  - suppression des wrappers locaux `openGlobalFeedReference` / `openGlobalFeedPost`; remplacement par appels runtime directs (locaux + `window.*`).
  - suppression de wrappers feed non utilises (`refreshGlobalFeedFilterButtons`, `renderGlobalFeedSummary`) et inline de `publishGlobalFeedPost` dans `TaskMDACommsUI.bind`.
  - suppression du wrapper local `openGlobalFeedPostReadModal`; exposition `window.*` directement branchee sur le runtime.
  - suppression de wrappers notes/federation non utilises (`buildGlobalNoteCardHtml`, `buildGlobalHubProjectNoteRef`, `parseGlobalHubProjectNoteRef`, `openGlobalHubAggregatedNoteRead` local), avec exposition `window.*` directe runtime conservee pour l ouverture agregée.

## Mise a jour incrementale - Mai 2026 (Refactor Editor module boundary)

- Editeur projet:
  - encapsulation de `js/taskmda-editor.js` dans une IIFE stricte `initTaskMDAEditorModule(global)` pour aligner le pattern module du projet.
  - suppression du monkey-patching direct de `applyProjectDescriptionEditorAction`; remplacement par une fonction explicite `applyProjectDescriptionEditorActionEnhanced`.
  - exposition d une API module `window.TaskMDAEditor` (`insertHtmlAtCursor`, `ensureProjectDescriptionQuillEditor`, `initProjectDescriptionEditors`, actions editor) avec alias globaux de compatibilite pour ne pas casser l orchestrateur existant.
  - conservation du comportement `emoji` via appel explicite a la version enhanced dans les binds toolbar.
  - correction interop digest: dans `appendDigestBlocksToEditorById` (`js/taskmda-team.js`), appel explicite de `window.TaskMDAEditor.insertHtmlAtCursor` pour eviter le conflit de signature avec le helper local `insertHtmlAtCursor(editable, html)`.
  - extraction de l interop digest-editeur vers `js/taskmda-editor-interop.js` (`TaskMDAEditorInterop.createModule`) avec delegation runtime depuis `js/taskmda-team.js`.
  - chargement du module `taskmda-editor-interop.js` dans `taskmda-team.html` avant `taskmda-team.js`.
  - extraction de `requestDigestImportForEditor` vers `TaskMDAEditorInterop` (picker fichiers + extraction digest + insertion + post-traitements), avec wrapper de delegation dans `js/taskmda-team.js`.
  - suppression des fallbacks dupliques dans `js/taskmda-team.js` pour `appendDigestBlocksToEditorById` et `requestDigestImportForEditor`: wrappers runtime purs, logique conservee uniquement dans `TaskMDAEditorInterop`.
  - simplification de wrappers `globalFeedRuntime` dans `js/taskmda-team.js` (`publishGlobalFeedDigestFromFiles`, `resolveLinkedDocsForFeedPost`, `publish/open/reference`, `refresh/render summary`) avec appels optionnels directs pour reduire le bruit orchestration.
  - `renderGlobalFeed` (`js/taskmda-team.js`) bascule en orchestration pure: suppression de la branche fallback locale (filtrage/tri/rendu scope) et delegation complete a `TaskMDAGlobalFeed.prepareGlobalFeedRenderScope` + `buildGlobalFeedCardsHtml`, avec garde explicite "module indisponible".
  - `renderGlobalNotes` bascule egalement en orchestration pure: extraction du scope/rendu vers `TaskMDAGlobalNotes.renderGlobalNotes` (`js/taskmda-global.js`) et conservation dans `js/taskmda-team.js` du pre-hook migration + layout seulement.
  - enrichissement de l etat injecte a `TaskMDAGlobalNotes` (getters `search/scope/origin/sort/theme`) et injection de `renderGlobalNotesThemeTabs` pour une orchestration Notes complete cote module.
  - harmonisation de wrappers orchestrateur `TaskMDAAppInit` dans `js/taskmda-team.js` (`initApp`, `handleSelectFolder`, `handleContinueWithoutFolder`, `handleLogout`) vers des delegations compactes avec fallback d erreur identique.
  - simplification des wrappers `discussionInputUiRuntime` dans `js/taskmda-team.js` (`insertTextAtCursor`, `setDiscussionInputPlaceholder`, `getDiscussionInputPlainText`, `getDiscussionInputHtml`, `clearDiscussionInput`) avec delegation prioritaire module et fallback minimal.
  - simplification des wrappers `attachmentsUiRuntime` dans `js/taskmda-team.js` (`readMessageFiles`, `renameFileExtension`, `optimizeMessageAttachment`, `buildInlineMessageImageHtml`, `insertImageFilesIntoDiscussionInput`) avec delegations compactes et fallback conserve.
  - simplification du lot wrappers `docStorageBindingRuntime` a fallback trivial dans `js/taskmda-team.js` (`resetDocumentPreviewInlineEditingState`, `canUseSharedFilesystemDocumentStorage`, `resolve/hydrateDocumentDataForRuntime`, `inferStorage*FromPath`, `maybeRelocateStoredDocumentByTheme`) avec delegations compactes.
  - harmonisation des wrappers `docPreviewInlineUiRuntime` dans `js/taskmda-team.js` (`normalize/getFieldValue`, `mergeContextDoc`, `refreshInlineDisplay`, `start/init inline edit`) en style delegation compacte, sans changement de logique fallback.
  - harmonisation d un lot `taskLifecycleDomainRuntime` dans `js/taskmda-team.js` (`close/open task convert modal`, `open task create modal with status`, `openTaskModal`, `archive/toggleSubtask/removeAttachment`) en delegations compactes.
  - harmonisation d un lot `projectMembersDomainRuntime` dans `js/taskmda-team.js` (invitations, groupes projet, themes projet, membres projet, groupes utilisateurs) en delegations compactes.
  - harmonisation d un lot `shellUiRuntime` / `viaAnnuaireUiRuntime` dans `js/taskmda-team.js` (delegations compactes avec fallback UI conserve quand necessaire).
  - harmonisation du lot preview modal (`docPreviewModalUiRuntime` / `docStorageBindingRuntime`) dans `js/taskmda-team.js` avec delegations compactes sur `resolve/open/close` preview et fallback modal conserve.
  - harmonisation d un lot `globalDocsRuntime` / `docStorageBindingRuntime` dans `js/taskmda-team.js` (upload modal, preview/download by ref, binding modal/read mode/actions, readDocumentFilesFromInput) en delegations compactes avec fallbacks conserves.
  - harmonisation complementaire `taskLifecycleDomainRuntime` / `docStorageBindingRuntime` / `appInitRuntime` / `viaAnnuaireUiRuntime` dans `js/taskmda-team.js` (wrappers et handlers evenements compactes, comportement conserve).
  - harmonisation finale des wrappers restants `globalNotesRuntime` / `editorInteropRuntime` dans `js/taskmda-team.js` (delegations compactes, comportement conserve).
  - passe finale de ce cycle: reduction supplementaire des wrappers runtime (app init, message group channel, storage path display) et baisse du compteur `if (runtime?....)` de 46 a 40.
  - factorisation de la fermeture modale tache (escape + backdrop) via helper unique `closeTaskModalAndResetWithFallback`, reduction de duplication et compteur wrappers runtime a 39.
  - passe de compactage supplementaire: remplacement de checks runtime inline par delegations via references locales (global docs/feed/preview + calendar/notes render bridges), compteur `if (runtime?....)` reduit de 39 a 23.
  - passe de balayage final des wrappers: conversion massive en delegations via references locales (`shell`, `annuaire`, `preview inline/modal`, `attachments`, `discussion input`), compteur `if (runtime?....)` reduit de 23 a 3.

## Mise a jour incrementale - Mai 2026 (Refactor Global Notes: selection multiple deleguee au module)

- Orchestrateur / Notes globales:
  - extraction de la logique de selection multiple des notes globales hors `js/taskmda-team.js` vers le module `TaskMDAGlobalNotes` dans `js/taskmda-global.js`.
  - deplacement des comportements `toggle/select all/delete` de la selection bulk et de la mise a jour UI associee dans le module domaine.
  - deplacement des actions `favori` et `publication/retrait fil` (`toggleGlobalNoteFavorite`, `toggleGlobalNoteFeedPublish`) dans le module domaine.
  - deplacement des exports de note globale (`exportGlobalNote`, `exportGlobalNoteAsPdf`, `exportGlobalNoteAsDocx`) dans le module domaine.
  - deplacement de la gestion du menu export note (`toggleGlobalNoteExportMenu`, `closeGlobalNoteExportMenu`) dans le module domaine.
  - deplacement de la fermeture au clic exterieur des menus export de notes (`handleGlobalNotesExportMenuDocumentClick`) dans le module domaine.
  - deplacement de l export multiple des notes selectionnees (`exportSelectedGlobalNotesAsZip`) dans le module domaine, incluant les formats HTML/TXT/PDF/DOCX.
  - deplacement du helper PDF notes (`generatePdfBlobForNote`) dans le module domaine, avec wrapper de compatibilite dans l orchestrateur.
  - deplacement des exports du fil d information (`exportGlobalFeedPost`, `exportGlobalFeedPostAsPdf`, `exportGlobalFeedPostAsDocx`) dans le module domaine `TaskMDAGlobalFeed`.
  - deplacement de la gestion du menu export du fil (`toggleGlobalFeedExportMenu`, `closeGlobalFeedExportMenu`) et de sa fermeture au clic exterieur (`handleGlobalFeedExportMenuDocumentClick`) dans le module domaine.
  - suppression des wrappers feed redondants dans `js/taskmda-team.js`; exposition `window.*` des actions export feed directement depuis `globalFeedRuntime` (pattern aligne avec `globalNotesRuntime`).
  - extension de `TaskMDAProjectReadActionsUI` (`js/taskmda-project.js`) pour exposer `exportProjectNote`, `toggleProjectNoteExportMenu`, `closeProjectNoteExportMenu`.
  - alignement orchestrateur: exposition `window.*` des actions export note projet via `projectReadActionsUiRuntime` (suppression des affectations globales en dur pre-runtime).
  - deplacement complet du corps metier export note projet (HTML/TXT/PDF/DOCX) dans `TaskMDAProjectReadActionsUI` avec injections explicites; suppression du bloc volumineux equivalent dans `js/taskmda-team.js` et retrait du chemin transitoire `exportProjectNoteRaw`.
  - deplacement de `openGlobalFeedPostReadModal` vers `TaskMDAGlobalFeed` (lecture detail post + refs/documents lies + binder actions inline), avec delegation runtime dans `js/taskmda-team.js`.
  - deplacement de `buildGlobalNoteCardHtml` vers `TaskMDAGlobalNotes` (rendu carte notes globales, badges, docs lies, actions inline), avec wrapper de delegation dans `js/taskmda-team.js`.
  - deplacement de `buildGlobalHubProjectNoteRef`, `parseGlobalHubProjectNoteRef` et `openGlobalHubAggregatedNoteRead` vers `TaskMDAGlobalNotes`, avec wrappers de delegation dans l orchestrateur.
  - extraction de l agregation des notes globales + notes projet proprietaire (`collectGlobalNotesAggregationContext`) dans `TaskMDAGlobalNotes`, avec consommation directe depuis `renderGlobalNotes`.
  - extraction du bloc de filtrage/tri de `renderGlobalNotes` vers `TaskMDAGlobalNotes.filterAndSortGlobalNotes` (filtres origine/visibilite/theme/recherche + tris recent/oldest/favorites/alpha).
  - extraction du rendu pagine de `renderGlobalNotes` vers `TaskMDAGlobalNotes.renderGlobalNotesResults` (comptage, etat vide, branche selection multiple, branche renderer unifie, fallback cartes, pagination).
  - extraction du post-traitement UI de `renderGlobalNotes` vers `TaskMDAGlobalNotes.finalizeGlobalNotesRenderUi` (tabs actives, focus scroll, refresh bulk UI, bind preview/download inline docs).
  - extraction du pre-traitement des documents lies des notes globales vers `TaskMDAGlobalNotes.collectGlobalNotesLinkedDocsContext` (maps `linkedDocsByNoteId` / `linkedDocCountByNoteId`).
  - segmentation supplementaire par outil: creation de `js/taskmda-global-notes-renderer.js` avec classe `TaskMdaGlobalNotesRenderer` (pipeline notes globales), utilisee par `TaskMDAGlobalNotes` pour l agregation, les docs lies et le filtrage/tri.
  - delegation complete du rendu/finalisation des notes globales depuis `TaskMDAGlobalNotes` vers `TaskMdaGlobalNotesRenderer` (`renderGlobalNotesResults`, `finalizeGlobalNotesRenderUi`) pour garder `js/taskmda-global.js` plus mince.
  - ajout d un builder de cartes dedie `js/taskmda-global-notes-card-builder.js` (`TaskMdaGlobalNotesCardBuilder`) et delegation de `buildGlobalNoteCardHtml` pour separer la composition HTML du pipeline de rendu.
  - ajout d un utilitaire dedie `js/taskmda-global-notes-ref.js` (`TaskMDAGlobalNotesRef`) pour `buildGlobalHubProjectNoteRef` / `parseGlobalHubProjectNoteRef`, consomme depuis `TaskMDAGlobalNotes`.
  - regroupement thematique UI (Notes): extraction du menu export vers `js/taskmda-global-notes-export-menu.js` (`toggle/close/outside-click`), avec delegation depuis `TaskMDAGlobalNotes`.
  - regroupement thematique UI (Read Modal): extraction de `TaskMDAGlobalReadActionsUI` et `TaskMDAGlobalReadInlineUI` de `js/taskmda-global.js` vers `js/taskmda-global-read-actions-ui.js` et `js/taskmda-global-read-inline-ui.js`.
  - regroupement thematique UI (Notes Filters): extraction de `TaskMDAGlobalNotesFiltersUI` de `js/taskmda-global.js` vers `js/taskmda-global-notes-filters-ui.js`.
  - regroupement thematique Notes (Navigation): extraction de la navigation des refs notes projet (`build/parse/openGlobalHubAggregatedNoteRead`) vers `js/taskmda-global-notes-navigation.js` avec delegation depuis `TaskMDAGlobalNotes`.
  - lot Notes-Read: extraction du contenu de `openGlobalNoteReadModal` hors `js/taskmda-team.js` vers `js/taskmda-global-notes-read-modal-content.js` (hydration read modal, docs lies, binds preview/download/delete), avec delegation runtime.
  - lot Notes-Read (suite): extraction de `closeGlobalReadModal` dans le meme module `js/taskmda-global-notes-read-modal-content.js`, avec delegation runtime depuis `js/taskmda-team.js`.
  - lot Notes-Read (suite): extraction de `beginGlobalReadInlineEdit` et `saveGlobalReadInlineEdit` vers `js/taskmda-global-notes-read-inline-edit.js`, avec delegation runtime et conservation des helpers inline existants.
  - lot Notes-Read (suite): extraction de `canInlineEditGlobalReadModal` et `cancelGlobalReadInlineEdit` dans `js/taskmda-global-notes-read-inline-edit.js`, avec delegation runtime depuis `js/taskmda-team.js`.
  - lot Notes-Read (suite): extraction de `isElementInsideGlobalReadInlineEdit` et `placeCaretAtEndOfElement` vers `js/taskmda-global-notes-read-inline-edit.js`, avec wrappers de delegation dans `js/taskmda-team.js`.
  - lot Notes-Read (suite): extraction de `ensureGlobalReadInlineQuillUi` et `resetGlobalReadInlineEditState` vers `js/taskmda-global-notes-read-inline-edit.js`, avec wrappers de delegation et etat Quill injecte (`setInlineQuill`).
  - exposition des wrappers globaux associes (`window.exportGlobalNote*`) depuis le runtime module pour conserver la compatibilite des handlers `onclick`.
  - `js/taskmda-team.js` conserve des wrappers fins de delegation (`updateGlobalNotesBulkDeleteUi`, `setGlobalNotesBulkSelectionMode`, `toggleGlobalNoteBulkSelection`, `selectAllVisibleGlobalNotesForBulkDelete`, `deleteSelectedGlobalNotes`).
  - injection explicite des dependances metier via `createModule` (etat bulk, selection courante, droits de suppression, suppression store, desindexation feed, rafraichissement feed).
  - objectif: reduire le poids de l orchestrateur et poursuivre la trajectoire de refactor par domaines sans changement fonctionnel attendu.

## Mise a jour incrementale - Mai 2026 (Annuaire: recherche par numero FINESS dans le champ texte)

- Referentiels / Annuaire ESMS:
  - le champ texte de recherche (`Nom etablissement`) accepte maintenant explicitement la saisie d un numero FINESS.
  - ajout d un chemin de recherche direct par FINESS (`nofinesset` / `nofinessej`) en complement du filtrage departemental.
  - fusion + dedoublonnage des resultats pour garantir la remontee de l etablissement cible quand un FINESS est saisi.
  - mise a jour du placeholder UI: `Nom etablissement ou FINESS (optionnel)`.

## Mise a jour incrementale - Mai 2026 (Miniatures automatiques des documents)

- Documents (global + projet):
  - generation locale automatique d une miniature a l import pour les images (`image/*`) et les PDF (`application/pdf`, page 1 via `pdf.js`).
  - stockage de la miniature dans les metadonnees document (`thumbnailDataUrl`) pour affichage immediat dans les cartes.
  - fallback conserve sur icone document quand aucune miniature n est disponible (formats non pris en charge ou echec rendu).
  - affichage de la miniature a gauche des cartes documents dans les vues `Documents` (transverse et projet), avec style dedie clair/sombre.
  - correctif de propagation: la miniature est maintenant conservee dans tous les flux de persistence concernes (`globalDocs` et creation/lecture des cartes projet), ce qui corrige les cas ou elle etait generee mais non affichee.
  - fallback icone par type active (image, PDF, tableur, Word, presentation, texte, archive, generique).

## Mise a jour incrementale - Mai 2026 (Dashboard fil d info: retour ligne Projet)

- Dashboard / fil d information:
  - correctif du parsing des retours ligne dans `renderDashboardNews` (`split('\n')` au lieu de `split('\\n')`) pour conserver la separation entre le titre de tache et la ligne `Projet: ...`.
  - normalisation defensive du titre de carte pour forcer un retour ligne avant `Projet:` quand la mention est collee au titre.
  - ajustement CSS `.dashboard-news-text` avec `white-space: pre-line` pour afficher correctement le saut de ligne.

## Mise a jour incrementale - Mai 2026 (Bouton general projet contextuel)

- Projet / ergonomie:
  - le bouton general `Nouvelle Tache` (`#btn-add-task`) adapte maintenant son action a l onglet projet actif.
  - onglet `Notes` -> ouverture de la modale `Nouvelle note`.
  - onglet `Documents` -> ouverture de la modale d ajout de document.
  - onglet `Discussion` -> focus automatique du composeur de message.
  - autres onglets de travail -> creation de tache (comportement historique conserve).
  - le libelle/icone/etat desactive du bouton sont synchronises selon la vue active et les droits.
  - correctif UX: infobulle/tooltip du bouton synchronisee avec l action contextuelle (plus de tooltip fige `Nouvelle Tache`).

## Mise a jour incrementale - Mai 2026 (Fil d info: fallback titre references)

- Fil d information transverse:
  - quand un post n a pas de titre explicite, le titre affiche prend desormais en priorite la reference tache, puis la reference projet, avant le fallback `Sans titre`.
  - correction appliquee dans le module domaine `js/taskmda-global.js` (`taskmda-global-feed`).

## Mise a jour incrementale - Mai 2026 (Reference interne projets/taches)

- Projets:
  - ajout d un champ `Reference interne` dans les modales `Nouveau projet` et `Modifier le projet`.
  - sauvegarde de la reference dans les payloads `CREATE_PROJECT` et `UPDATE_PROJECT`.
- Taches:
  - ajout d un champ `Reference interne` dans la modale de creation/edition de tache.
  - sauvegarde de la reference pour les taches projet (`CREATE_TASK` / `UPDATE_TASK`) et les taches hors projet (`globalTasks`).

## Mise a jour incrementale - Mai 2026 (Refactor documentaire taskmda-team.js)

- Orchestrateur:
  - ajout de commentaires de maintenance sur le bloc indicateurs UI de chargement/synchronisation (`showLoading`, `runWithLoading`, `runWithoutGlobalLoading`, `setInlineSaveIndicator`, `updateSyncStatus`, `updateBackgroundSyncStatus`).
  - objectif: preparer l extraction modulaire progressive sans modifier le comportement fonctionnel.
  - extraction du bloc harmonisation modales vers `js/taskmda-modal-ui-harmonizer.js` (icones labels modaux + normalisation boutons fermer).
  - `js/taskmda-team.js` conserve des wrappers fins pour limiter l impact et garder l orchestration centrale stable.
  - extraction du bloc harmonisation boutons d action/tooltips vers `js/taskmda-action-ui-harmonizer.js` (decor action buttons, catalogues semantiques, couche tooltip, observers DOM).
  - `js/taskmda-team.js` conserve des wrappers de compatibilite et injecte les dependances UI (`normalizeAction*`, mode d affichage, option tooltips).

## Mise a jour incrementale - Mai 2026 (Export annuel taches accomplies Excel)

- Taches (rubrique transverse):
  - ajout d un bouton `Export accomplies (Excel)` dans la barre d actions de la vue Taches.
  - export annuel des taches au format `.xlsx` (projets + hors projet), avec saisie de l annee cible (`YYYY`).
  - filtre metier sur les taches accomplies (`status = termine`) et conservation des metadonnees utiles (source, projet, responsable, thematique, dates, visibilite, archivage, description).
  - implementation regroupee dans le module domaine `js/taskmda-tasks.js` via `exportCompletedTasksYearXlsx`.

## Mise a jour incrementale - Mai 2026 (Refactor ciblé taskmda-team.js)

- Orchestrateur:
  - ajout d un helper `getGlobalTasksRenderContext` pour mutualiser la collecte des taches globales et des etats projet associes.
  - reduction des lectures IndexedDB redondantes lors du rendu de la rubrique `Taches` (base + post-traitement empty state).
  - ajout de commentaires de maintenance sur le cycle de rendu global des taches (cache contexte + post-traitement UI).
  - aucun changement fonctionnel attendu sur les vues/filters existants.
  - lot 2: factorisation de la modale detail tache avec helpers `getGlobalTaskDetailModalElements` et `renderGlobalTaskDetailCommonSection` pour reduire la duplication entre `openGlobalTaskDetails` et `openProjectTaskDetails` (sans changement de comportement attendu).
  - lot 3: factorisation du rendu des pieces jointes de la modale detail tache via `renderGlobalTaskDetailAttachments` (cas piece jointe simple + cas documents projet lies), sans changement fonctionnel attendu.
  - lot 4: factorisation du wiring des actions footer de la modale detail tache (`convert/email/edit/archive/delete`) via `wireGlobalTaskDetailActions`, avec callbacks injectes par contexte (global/projet), sans changement fonctionnel attendu.
  - lot 5: factorisation de l initialisation du contexte detail tache (`currentGlobalTaskDetailContext`, `currentGlobalTaskDetailResolved`, `currentGlobalTaskDetailRef`) via `buildTaskDetailContextPayload` et `setAndRenderTaskDetailContext`, sans changement fonctionnel attendu.
  - lot 6: factorisation de la preparation commune des variables de modale (`canEdit/canArchive/canDelete`, `sourceProjectName`, `groupName`, `canToggleSubtasks`) via `buildTaskDetailModalCommonMeta`, sans changement fonctionnel attendu.
  - lot 7: factorisation de la construction du bloc `resolved` projet via `buildProjectTaskResolved`, reutilise dans `openProjectTaskDetails` et `setAndRenderTaskDetailContext`.

## Mise a jour incrementale - Mai 2026 (Correctif Mes documents: AbortError showOpenFilePicker)

- Documents:
  - correction de `pickLinkedDocuments` dans `js/taskmda-team.js` pour intercepter `AbortError` (annulation utilisateur de la boite de dialogue `showOpenFilePicker`).
  - l annulation est maintenant traitee comme un cas normal (retour `[]`) sans erreur non capturee en console.

## Mise a jour incrementale - Mai 2026 (Durcissement securite chiffrement partage)

- Securite:
  - suppression de la persistance de cle partagee en clair dans le dossier partage (`shared-key.json` n est plus ecrit ni importe).
  - suppression du fallback d ecriture d evenements en JSON clair quand la cle partagee est indisponible.
  - ecriture partagee strictement chiffree: si la cle partagee manque, l ecriture est refusee.
  - activation du mode partage durcie: passphrase requise lorsqu aucune cle partagee locale n existe.
  - micro-lot migration legacy: detection des fichiers historiques `shared-key.json` dans les projets partages, ignorage volontaire de ces fichiers et alerte UI explicite (toast + notification).
  - action UI ajoutee dans la notification legacy: bouton `Marquer comme traite` qui enregistre localement les projets deja audites et evite la reaffichage de l alerte a la reconnexion.
  - correctif runtime: correction d un `ReferenceError` sur `auditedLegacySharedKeys` lors de la connexion dossier partage (scope de variable dans `discoverAndLoadExistingProjects`).
  - correctif collaboration: lors de la decouverte d un projet avec evenements `v1-e2e-encrypted` sans cle locale, demande de passphrase pour deriver/rattacher la cle partagee localement, puis chargement du projet.
  - ajout d une UI dediee `Rattacher un projet partage` (projectId + passphrase) dans Referentiels > Identite pour eviter les prompts successifs lors du premier rattachement.
  - fiabilisation rattachement partage: validation de la passphrase contre les evenements chiffrés avant persistance de la cle locale, et lecture des evenements tolerante fichier par fichier (skip des payloads invalides/incompatibles).
  - UX rattachement partage: message d erreur inline explicite dans la modale (`Passphrase incorrecte pour ce projectId`) a la place d un toast generique.
  - clarification UX collaboration: renommage des libelles `Mode de collaboration` / `Visibilite lecture` pour distinguer clairement partage inter-utilisateurs vs regle d acces, et repositionnement visuel de `Visibilite lecture` sous `Mode de collaboration` dans la modale d edition projet.
  - stabilisation lecture partagee: en cas de mismatch de cle (OperationError/DataError), marquage local du projet en etat `cle invalide`, limitation des warnings console (throttle) et arret des tentatives de lecture `onlyNew` jusqu a nouveau rattachement valide.
  - correctif UX modale edition projet: la `Phrase secrete` est maintenant pre-remplie avec la valeur deja enregistree (`joinPassphrase`) quand le projet est en mode collaboratif.
  - hygiene logs console: deduplication session des warnings `legacy shared-key.json` et `project not accessible` (une seule emission par projectId).
  - robustesse acces projets collaboratifs: si un projet est en lecture privee mais qu une cle partagee locale valide existe deja pour ce `projectId`, le projet reste visible apres reconnexion dossier (evite les disparitions dues aux derives d identite locale).
  - UX explicite: ajout d un badge `Acces par cle locale` sur les cartes projet (grille + carrousel) quand l acces est accorde via cle partagee locale en contexte collaboratif.
  - ajustement UX: badge `Acces par cle locale` rendu plus discret (icone cle compacte + infobulle) pour reduire la charge visuelle.
  - correctif fallback local chiffre: en mode reconstruction collaborative, l etat local `localState` n est plus supprime tant que l historique partage n est pas lisible/complet (presence `CREATE_PROJECT`), avec restauration automatique du snapshot local si la reconstruction produit un etat incomplet.
  - indicateur UI sync: ajout d une notification explicite `Reconstruction ignoree (historique incomplet)` avec liste des `projectId` concernes, pour diagnostic sans console.
  - hygiene console complementaire: messages attendus `legacy shared-key` et `project not accessible` passes en `console.info` (toujours deduplices) pour reduire les faux signaux d alerte.
  - robustesse liaison dossier: gestion explicite du `NotFoundError` si le dossier collaboratif a ete supprime/deplace (toast + notification utilisateur + nettoyage automatique de la liaison sauvegardee, sans boucle silencieuse).
  - fiabilisation creation collaborative: le bootstrap de copie vers l espace partage est maintenant attendu et verifie (plus de fire-and-forget), avec retour utilisateur explicite en cas de synchro incomplete.
  - correctif anti-duplication collaborative: ingestion `CREATE_TASK` rendue idempotente par `taskId` (evite la creation de doublons lors de reconnexions/synchronisations).
  - clarte UX detail projet: affichage explicite `Cree par ...` dans l en-tete projet (en plus des avatars/membres), et enrichissement du `CREATE_PROJECT` avec `createdByName` a la source.
  - garde-fou diagnostic evenements: trace dedupe `CREATE_TASK` par `eventId` (replay) et `taskId` (doublon logique), avec throttling console pour identifier rapidement une source amont qui reemet des creations.
  - correctif affichage createur projet: les cartes projet resolvent desormais le nom du createur en priorite depuis `members[].displayName`, puis `createdByName`, puis fallback identifiant (au lieu d afficher trop souvent `Utilisateur <id>`).
  - retro-correction auto identite createur: quand le createur ouvre un projet et que son nom manque, l application publie un `ADD_MEMBER` de backfill avec `displayName` (sync partagee), et `ADD_MEMBER` devient upsert (mise a jour du nom si le membre existe deja).
  - UX discrete: micro-notification `Identite createur synchronisee` (dedupee par projet) lors du premier backfill reussi.
  - robustesse identite createur legacy: backfill autorise via alias d utilisateur (pas seulement userId strict), et mise a jour de `project.createdByName` lors de la reception d un `ADD_MEMBER` correspondant au createur.
  - invitation collaborative par email: ajout d un bouton `Preparer email de rattachement (BCC auto)` dans la section Invitations, avec destinataires cibles auto en BCC et option explicite `Inclure la passphrase` (desactivee par defaut recommandee).
  - mailto etendu: support des champs `cc` et `bcc` dans le helper `openMailto`.

## Mise a jour incrementale - Mai 2026 (Dependances frontend localisees)

- Conformite mode local:
  - remplacement des references CDN runtime dans `taskmda-team.html` par des references locales `vendor/*`.
  - ajout des bibliotheques frontend en local dans `vendor/` (idb, marked, tabulator, xlsx, pdfjs, mammoth, quill, html2canvas, html2pdf, tailwind runtime).
  - `pdf.worker.min.js` pointe maintenant vers `vendor/pdf.worker.min.js`.

## Socle runtime courant (modules charges)

- `js/taskmda-crypto.js`
- `js/taskmda-ui.js`
- `js/taskmda-theme.js`
- `js/taskmda-notifications.js`
- `js/taskmda-recurrence.js`
- `js/taskmda-tasks.js`
- `js/taskmda-social.js`
- `js/taskmda-editor.js`
- `js/taskmda-workflow.js`
- `js/taskmda-shell.js`
- `js/taskmda-project.js`
- `js/taskmda-project-members-domain.js`
- `js/taskmda-task-lifecycle-domain.js`
- `js/taskmda-doc.js`
- `js/taskmda-app-init.js`
- `js/taskmda-comms-ui.js`
- `js/taskmda-admin-ui.js`
- `js/taskmda-hierarchy.js`
- `js/taskmda-notes-shared.js`
- `js/taskmda-document-storage.js`
- `js/taskmda-calendar.js`
- `js/taskmda-global.js`
- `js/taskmda-email-generator.js`
- `js/taskmda-file-watcher.js`
- `js/taskmda-core-utils.js`
- `js/taskmda-runtime-contract.js`
- `js/taskmda-via-annuaire.js`
- `js/taskmda-read-modal-zoom.js`
- `js/taskmda-team.js`

## Mise a jour incrementale - Mai 2026 (Correctif critique: stack overflow edition document)

- Correctif bloquant:
  - correction d'une recursion infinie (Maximum call stack size exceeded) lors du clic sur le bouton "Modifier" d'un document dans la vue Documents.
  - cause: le module `TaskMDAGlobalDocs` dans `js/taskmda-global.js` exportait une fonction `resolveDocumentForBinding` non definie localement, creant une boucle circulaire avec l'orchestrateur `js/taskmda-team.js`.
  - solution: ajout de l'implementation manquante de `resolveDocumentForBinding` dans le module `TaskMDAGlobalDocs` (ligne 623).
  - solution: suppression de `resolveDocumentForBinding` des actions passees au runtime `globalDocsRuntime` dans l'orchestrateur (ligne 33715).
  - le module possede desormais sa propre implementation autonome de `resolveDocumentForBinding`, eliminant la dependance circulaire.

## Mise a jour incrementale - Mai 2026 (Zoom de texte dans les modales de lecture)

- UX / Accessibilite:
  - ajout d'un module dedie `js/taskmda-read-modal-zoom.js` pour la gestion du zoom de texte dans les modales de lecture.
  - controles de zoom (A- / A+) ajoutes dans toutes les modales de lecture:
    - `modal-project-note-read` : lecture de notes de projet
    - `modal-global-read` : lecture de notes globales / posts du fil d'info
    - `modal-doc-preview` : previsualisation de documents
  - plage de zoom: 70% a 200% par increments de 10%
  - indicateur visuel du niveau de zoom actuel (100% par defaut)
  - persistance de la preference utilisateur dans localStorage
  - application automatique du zoom lors de l'ouverture des modales
  - boutons desactives automatiquement aux limites min/max

## Mise a jour incrementale - Mai 2026 (Recurrence UI + echeance taches recurrentes)

- Correctif encodage:
  - `js/taskmda-recurrence.js` : libellés et commentaires UTF-8 (remplacement des séquences corrompues par du texte français correct et des séquences Unicode `\u2713` / `\u26A0`).
  - correctifs ponctuels de mojibake dans `js/taskmda-global.js` et `js/taskmda-doc.js` (messages « piece jointe de tache »).
- Correctif echeance affichee (complement):
  - `taskDueDateKey` : pour une tache avec `recurring.enabled`, la date canonique de la prochaine occurrence est desormais `dueDate` (YMD) si presente, avant le calcul flexible `deadlineDate` / `deadlineMode` qui pouvait rester sur l ancienne occurrence.
  - rollover : alignement supplementaire de `deadlineAt` sur la prochaine date.

## Mise a jour incrementale - Mai 2026 (Taches recurrentes: rollover echeance affichee)

- Correctif:
  - apres « Realise » sur une occurrence, le rollover ne mettait a jour que `dueDate` ; l UI et `normalizeTaskOrProjectDeadline` privilegient `deadlineDate` quand le mode echeance est `date`, ce qui laissait cartes / fiche en retard sur l ancienne date.
  - le rollover aligne desormais `deadlineMode`, `deadlineDate` et reinitialise les champs mois/annee/periode pour rester coherent avec la prochaine occurrence.

## Mise a jour incrementale - Mai 2026 (Notes globales: correctif barre latérale Thématiques)

- Correctif bloquant:
  - `renderGlobalNotesThemeTabs` avait été fusionné par erreur dans `TaskMDAMessageReactionsOutsideUI` au lieu de `TaskMDAGlobalNotesFiltersUI` : l’orchestrateur appelait une méthode absente, donc aucun onglet ne s’affichait sous « Thématiques ».
  - fonction déplacée et exportée depuis `TaskMDAGlobalNotesFiltersUI` ; regroupement aligné sur les notes de projet (tags comme facettes, sinon champ `theme`, sinon « Sans thematique ») ; filtre de liste synchronisé dans `renderGlobalNotes`.

## Mise a jour incrementale - Mai 2026 (Notes globales: thématique modale + barre latérale)

- Correctif UX / données:
  - la modale « Nouvelle note » utilisait un champ `global-note-theme` de type `hidden` sans contrôle visible : la thématique saisie n’était pas portée par la note, donc aucun onglet dans la barre latérale « Thématiques » de la rubrique Notes.
  - ajout d’un couple champ texte + liste « Thématiques existantes… » (référentiel + thèmes déjà présents sur des notes), aligné sur le comportement de l’upload documentaire global.
  - branchement des événements de synchronisation champ / liste dans `TaskMDADocThemePickersUI` (shell).
  - harmonisation du thème utilisé pour les pièces jointes : priorité au champ thématique explicite, puis au premier tag, puis `General`.

## Mise a jour incrementale - Mai 2026 (Scission module calendrier)

- Refactor sans impact fonctionnel:
  - extraction du module `TaskMDAGlobalCalendar` hors du bundle `js/taskmda-global.js`,
  - ajout du fichier dedie `js/taskmda-calendar.js` (domaine calendrier transverse),
  - mise a jour du chargement runtime dans `taskmda-team.html` (script calendrier dedie),
  - `js/taskmda-global.js` conserve les domaines transverses hors calendrier (notes/docs/feed/messages).

## Mise a jour incrementale - Mai 2026 (Amincissement orchestrateur calendrier)

- Refactor sans impact fonctionnel:
  - suppression des wrappers `renderGlobalCalendarThemePins` et `initGlobalCalendarPinnedThemesState` dans `js/taskmda-team.js`,
  - suppression des wrappers `setGlobalCalendarControlsExpanded` et `toggleGlobalCalendarThemeActionsMenu` dans `js/taskmda-team.js`,
  - appels directs au runtime `globalCalendarRuntime` aux points d usage.

## Mise a jour incrementale - Mai 2026 (Passe d amaigrissement rapide orchestrateur)

- Refactor sans impact fonctionnel:
  - suppression des wrappers `renderGlobalCalendarDelegated` et `renderGlobalNotesDelegated` dans `js/taskmda-team.js`,
  - remplacement des appels par execution directe runtime avec fallback (`globalCalendarRuntime` / `globalNotesRuntime`),
  - suppression des wrappers sidebar legacy (ouverture/fermeture mobile + collapse) dans `js/taskmda-team.js`,
  - remplacement des appels locaux par appels directs `shellUiRuntime`.

## Mise a jour incrementale - Mai 2026 (Amincissement wrappers calendrier modale)

- Refactor sans impact fonctionnel:
  - suppression des wrappers orchestrateur `setGlobalCalendarItemFormEditing`, `openGlobalCalendarItemModal`, `closeGlobalCalendarItemModal`, `resetStandaloneCalendarForm`,
  - remplacement des appels internes par appels directs runtime `globalCalendarRuntime` (avec garde optionnelle),
  - conservation de l API `window.openGlobalCalendarItemModal` pour compatibilite des actions HTML existantes.

## Mise a jour incrementale - Mai 2026 (Simplification bindings communication)

- Refactor sans impact fonctionnel:
  - simplification du binding `TaskMDACommsUI` dans `js/taskmda-team.js`,
  - suppression des lambdas de relais `runtime ?? local` pour feed/messages au profit de callbacks directs nommes,
  - reduction du bruit orchestration sur le bloc communication transverse.

## Mise a jour incrementale - Mai 2026 (Vague global-notes: onglets thematiques delegues module)

- Refactor sans impact fonctionnel:
  - extraction du rendu des onglets thematiques des notes globales vers `js/taskmda-global.js` (`TaskMDAGlobalNotesFiltersUI.renderGlobalNotesThemeTabs`),
  - `js/taskmda-team.js` conserve une facade delegante avec fallback local minimal,
  - suppression du helper local dedie `updateGlobalNotesThemesToggleMeta` dans l orchestrateur (logique de badge migree cote module),
  - injection explicite de `normalizeCatalogKey` et `escapeHtml` dans le runtime `globalNotesFiltersUiRuntime`.

## Mise a jour incrementale - Mai 2026 (Vague global-calendar: theme pins delegues module)

- Refactor sans impact fonctionnel:
  - extraction du rendu des thématiques epinglees calendrier vers `js/taskmda-global.js` (`TaskMDAGlobalCalendar.renderGlobalCalendarThemePins`),
  - `js/taskmda-team.js` passe en facade delegante stricte (suppression du fallback local de rendu),
  - injection explicite de `escapeHtml` dans le runtime `globalCalendarRuntime` pour le rendu des options/chips.

## Mise a jour incrementale - Mai 2026 (Vague globale: suppression fallbacks orchestrateur)

- Refactor sans impact fonctionnel:
  - suppression du fallback local de `renderGlobalNotesThemeTabs` dans `js/taskmda-team.js`,
  - suppression du fallback local de `renderGlobalCalendarThemePins` dans `js/taskmda-team.js`,
  - l orchestrateur conserve uniquement des facades minces delegant vers les modules globaux.

## Mise a jour incrementale - Mai 2026 (Vague global-calendar: etat pins internalise module)

- Refactor sans impact fonctionnel:
  - migration de l initialisation des pins calendrier vers `TaskMDAGlobalCalendar.initGlobalCalendarPinnedThemesState`,
  - migration de la normalisation + persistance des pins calendrier vers `TaskMDAGlobalCalendar.syncPinnedCalendarThemeState`,
  - suppression dans `js/taskmda-team.js` de la logique locale associee (cles pinned + read/write array + state init/sync),
  - conservation d une facade orchestrateur minimale pour `initGlobalCalendarPinnedThemesState`.

## Mise a jour incrementale - Mai 2026 (Vague global-calendar: controles UI internalises module)

- Refactor sans impact fonctionnel:
  - migration de `setGlobalCalendarControlsExpanded` vers `TaskMDAGlobalCalendar`,
  - migration de `toggleGlobalCalendarThemeActionsMenu` vers `TaskMDAGlobalCalendar`,
  - suppression dans l orchestrateur de la persistance locale associee (`GLOBAL_CALENDAR_CONTROLS_EXPANDED_KEY`),
  - `js/taskmda-team.js` conserve des facades minces delegant vers le runtime calendrier.

## Mise a jour incrementale - Mai 2026 (Vague annuaire: etat internalise module + orchestrateur aminci)

- Refactor sans impact fonctionnel:
  - suppression complete des wrappers legacy ROR dans `js/taskmda-team.js` (delegation module uniquement).
  - suppression d un bloc supplementaire de facades annuaire mortes dans `js/taskmda-team.js` (audit/live-search wrappers non utilises hors module).
  - internalisation de l etat annuaire (live search, cache departements, flags/settings ROR, caches ROR) dans `js/taskmda-via-annuaire.js` via `initialState` + fallback state API.
  - extraction du rendu panneau settings annuaire et du wiring evenements dans `js/taskmda-via-annuaire.js`.
  - simplification de `syncViaAnnuaireDepartmentsFromApi` cote orchestrateur en fallback minimal.
  - reduction des injections `state/actions` annuaire dans l orchestrateur pour limiter le couplage.

## Mise a jour incrementale - Mai 2026 (Vague feed: rendu carte module, orchestrateur allege)

- Architecture:
  - extension du module metier `js/taskmda-global.js` (namespace `TaskMDAGlobalFeed`).
- Refactor sans impact fonctionnel:
  - extraction de la passe A du rendu feed (chargement/recherche/filtres/tri/scope) vers `TaskMDAGlobalFeed.prepareGlobalFeedRenderScope`.
  - extraction de la resolution des documents lies vers `TaskMDAGlobalFeed.resolveLinkedDocsForFeedPost`.
  - extraction de la passe B du rendu des cartes vers `TaskMDAGlobalFeed.buildGlobalFeedCardsHtml` (cartes manuelles, cartes notes, refs, docs lies, menus export).
  - `js/taskmda-team.js` conserve `renderGlobalFeed` comme facade d orchestration et delegue desormais le rendu des cartes au module feed.
  - suppression du bloc legacy de rendu cartes feed dans `js/taskmda-team.js`.
  - simplification du wrapper orchestrateur `resolveLinkedDocsForFeedPost` (delegation module + garde minimale).
  - renforcement du script de coherence doc/code `scripts/check-doc-coherence.ps1`:
    - verification README + CHANGELOG vs scripts charges par `taskmda-team.html`,
    - mode `-StrictChangelog` pour controle bloquant de la coherence CHANGELOG,
    - mode par defaut: README bloquant, CHANGELOG informatif (historique non bloquant).
  - extraction d utilitaires purs supplementaires vers `js/taskmda-core-utils.js`:
    - `getInitials`,
    - `stringToColor`,
    - `normalizeActionButtonLabel`,
    - `normalizeActionToken`.
  - extraction de normalisations annuaire vers `js/taskmda-core-utils.js`:
    - `normalizeViaAnnuaireLiveDomain`,
    - `normalizeViaAnnuaireDepartmentCode`,
    - `normalizeViaAnnuaireLiveSortKey`.
  - extraction supplementaire d utilitaires annuaire purs vers `js/taskmda-core-utils.js`:
    - `buildViaAnnuaireLiveResultRef`,
    - `sortViaAnnuaireLiveResults`,
    - `buildViaAnnuairePublicFicheUrl`,
    - `normalizeViaAnnuaireComparableText`,
    - `normalizeViaAnnuaireComparablePhone`,
    - `normalizeViaAnnuaireComparableEmail`,
    - `tokenizeViaAnnuaireComparableText`,
    - `computeViaAnnuaireTokenOverlap`,
    - `buildViaAnnuaireRecommendedAddress`,
    - `computeViaAnnuaireDiceSimilarity`,
    - `normalizeViaAnnuaireRorEndpoint`,
    - `normalizeViaAnnuaireRorSettings`.
  - extraction du parsing ROR vers `js/taskmda-core-utils.js`:
    - `extractViaAnnuaireRorEmailFromOrganization`,
    - `extractViaAnnuaireRorEmailFromPayload`,
    - `extractViaAnnuaireRorOrganizationFromPayload`,
    - `extractViaAnnuaireRorTelecomValue`,
    - `extractViaAnnuaireRorOrganizationAddress`,
    - `buildViaAnnuaireRorLookupUrlsFromEndpoint`.
  - nouveau module UI `js/taskmda-via-annuaire.js`:
    - extraction du rendu du panneau annuaire live (`renderViaAnnuaireLiveSearchPanel`),
    - extraction de la lecture des entrées UI (`readViaAnnuaireLiveSearchInputs`),
    - extraction du pipeline de recherche live:
      - `mapViaAnnuaireLiveResultItem`,
      - `filterViaAnnuaireRecordsBySearchInput`,
      - `runViaAnnuaireLiveSearch`,
    - extraction du pipeline audit live:
      - `buildViaAnnuaireAuditField`,
      - `computeViaAnnuaireAuditFromRows`,
      - `runViaAnnuaireAuditForRows`,
      - `toggleViaAnnuaireAuditDetails`,
      - `applyViaAnnuaireAuditRecommendedAddress`,
    - extraction de l enrichissement email ROR des lignes live:
      - `enrichViaAnnuaireRowsWithRorEmail`,
    - orchestration par injection depuis `js/taskmda-team.js` (runtime `TaskMDAViaAnnuaireUI`).
  - `js/taskmda-team.js` reutilise ces utilitaires via wrappers `core-utils`.

## Mise a jour incrementale - Mai 2026 (Regroupement docs bundle)

- Architecture:
  - fusion des modules js/taskmda-doc-storage-binding.js, js/taskmda-doc-preview-inline-ui.js, js/taskmda-doc-preview-modal-ui.js en un bundle unique js/taskmda-doc.js,
  - conservation des namespaces runtime (TaskMDADocStorageBinding, TaskMDADocPreviewInlineUI, TaskMDADocPreviewModalUI).
- Refactor sans impact fonctionnel:
  - mise a jour du chargement HTML vers un seul script documents,
  - suppression des trois anciens fichiers taskmda-doc-*.

## Mise a jour incrementale - Mai 2026 (Vague 2: doc storage binding, wrappers documents projet)

- Architecture:
  - extension du module metier `js/taskmda-doc-storage-binding.js`.
  - ajout du module UI `js/taskmda-doc-preview-inline-ui.js`.
  - ajout du module UI `js/taskmda-doc-preview-modal-ui.js`.
- Refactor sans impact fonctionnel:
  - deplacement des wrappers de lecture de fichiers documents projet dans la facade `doc-storage-binding`:
    - `readProjectDocumentFiles`,
    - `readCreateProjectDocumentFiles`,
    - `readEditProjectDocumentFiles`.
  - extraction de la resolution du contexte d apercu document vers la facade `doc-storage-binding`:
    - source `standalone`,
    - source `project-doc`,
    - source `task-attachment`,
    - hydratation runtime + evaluation des droits d edition.
  - extraction de la persistance inline des metadonnees d apercu document (name/theme/notes/sharingMode) vers `doc-storage-binding`, avec anti-redundance d ecriture et publication des evenements projet.
  - extraction du scheduling inline d apercu document (debounce + finalisation + reset timers) vers `doc-storage-binding`.
  - extraction de la couche UI d edition inline d apercu document vers `doc-preview-inline-ui` (rendu editable + interactions clavier/souris).
  - extraction du noyau modal d apercu document vers `doc-preview-modal-ui` (parsing ref, labels source, format path, rendu metadata).
  - extraction du moteur de rendu du contenu d apercu document vers `doc-preview-modal-ui` (image/pdf/texte/fallback).
  - suppression du rendu duplique dans `taskmda-team.js` pour `openDocumentPreview` (delegation principale vers `doc-preview-modal-ui`, fallback minimal conserve).
  - extraction de la fermeture de l apercu document vers `doc-preview-modal-ui` (fermeture modal, reset contexte, rerender post-fermeture via callback).
  - suppression du fallback local de fermeture/rerender dans `taskmda-team.js` pour `closeDocumentPreview` (delegation complete au module modal, fallback minimal de masquage uniquement).
  - suppression des fallbacks locaux metadata/parsing dans `openDocumentPreview` (delegation directe au module `doc-preview-modal-ui`, garde-fou minimal conserve pour le rendu si module absent).
  - suppression des wrappers residuels `parseDocumentPreviewRef`, `getDocumentPreviewSourceLabel`, `formatDocumentStoragePathForDisplay` dans `taskmda-team.js` (appels directs au module `doc-preview-modal-ui`).
  - demarrage extraction `global-docs` hors orchestrateur:
    - migration dans `TaskMDAGlobalDocs` de `resolveDocumentForBinding`,
    - migration de `deleteGlobalDocument`,
    - migration de `addStandaloneDocuments`,
    - delegation prioritaire de `taskmda-team.js` vers le module (fallback local conserve).
  - extraction de `renderGlobalDocs` vers `TaskMDAGlobalDocs` avec delegation prioritaire de l orchestrateur et garde anti-recursion.
  - suppression du fallback local de rendu documents dans `taskmda-team.js` (delegation complete `renderGlobalDocs` -> module `TaskMDAGlobalDocs`, garde minimale si module absent).
  - suppression des fallbacks locaux de `resolveDocumentForBinding`, `deleteGlobalDocument`, `addStandaloneDocuments` dans `taskmda-team.js` (delegation complete vers `TaskMDAGlobalDocs`, garde minimale si module absent).
  - internalisation dans `TaskMDAGlobalDocs` de l inline-edit binding docs (`initDocumentBindingInlineEditing`) et de la copie chemin (`copyDocumentBindingStoragePath`), avec wrappers orchestrateur reduits a la delegation.
  - suppression des fallbacks locaux des wrappers `initDocumentBindingInlineEditing` et `copyDocumentBindingStoragePath` dans `taskmda-team.js` (delegation complete au module `TaskMDAGlobalDocs`).
  - migration vers `TaskMDAGlobalDocs` du flux preview/docs upload:
    - `openGlobalDocUploadModal`,
    - `closeGlobalDocUploadModal`,
    - `openDocumentPreviewByRef`,
    - `downloadDocumentByRef`,
    - wrappers orchestrateur reduits a la delegation.
  - suppression des fallbacks locaux pour ces wrappers dans `taskmda-team.js` (delegation complete au module `TaskMDAGlobalDocs`).
  - `js/taskmda-team.js` delegue desormais ces flux au domaine `doc-storage-binding` (fallback conserve).
## Mise a jour incrementale - Mai 2026 (Vague 2: lifecycle + document storage binding)

- Architecture:
  - ajout du module metier `js/taskmda-doc-storage-binding.js`,
  - ajout du domaine `doc-storage-binding` dans le registre d orchestration.
- Refactor sans impact fonctionnel:
  - extraction et delegation supplementaire du domaine `Tasks lifecycle`:
    - `saveTaskFromModal`,
    - `closeTaskModalAndReset`,
    - handlers annexes de modale tache,
    - `removeAttachment`,
    - flux modale de conversion tache -> projet (open/close/confirm/Enter).
  - delegation de la logique de stockage documents (read/write fallback, hydration runtime, relocation par theme/scope) vers la facade `doc-storage-binding`.

## Mise a jour incrementale - Mai 2026 (Vague 2: Tasks lifecycle, tranche 1)

- Architecture:
  - ajout du module metier `js/taskmda-task-lifecycle-domain.js`, raccorde par injection de dependances depuis l orchestrateur,
  - ajout du domaine `task-lifecycle-domain` dans le registre d orchestration.
- Refactor sans impact fonctionnel:
  - extraction de l ouverture de modale tache (projet/hors projet + mode edition) hors `js/taskmda-team.js`,
  - extraction des transitions lifecycle: `toggleTaskStatus`, `markProjectTaskDone`, `editTask`, `deleteTask`, `archiveTask`, `toggleSubtask`,
  - `js/taskmda-team.js` delegue desormais ces operations au module domaine pour limiter l entropie et alleger l orchestrateur.

## Mise a jour incrementale - Avril 2026 (Referentiels: Generateur email)

- Referentiels:
  - ajout d un nouvel onglet `Generateur email`,
  - ajout d un module dedie `js/taskmda-email-generator.js` pour eviter de surcharger l orchestrateur principal,
  - templates email parametrables (to/cc/bcc, objet, contenu riche),
  - support de variables dynamiques (`{{app_name}}`, `{{user_name}}`, `{{date}}`, `{{project_name}}`, `{{task_title}}`, `{{status}}`),
  - actions d export pratique: copier HTML, copier texte, ouverture pre-remplie via `mailto:`,
  - persistance locale des templates dans `appSettings` (application locale sans serveur/npm).

## Mise a jour incrementale - Avril 2026 (Fil d info / Notes / Dashboard / Activite / UX cartes)

- Fil d info:
  - ajout d un titre optionnel sur les posts manuels (`global-feed-title`) avec persistance creation/edition,
  - affichage du titre dans les cartes + integration dans la recherche du fil,
  - ajout d un bouton `Lire` (modale de lecture confortable, sans edition),
  - ajout d un menu `Exporter` par post avec formats `HTML`, `PDF`, `DOCX`, `TXT`.
- Notes globales:
  - ajout d un bouton `Lire` sur les cartes de notes pour ouverture en modale de lecture.
- Dashboard:
  - ajustement de la logique `Une`:
    - la Une ne peut provenir que d un post manuel redige par un utilisateur,
    - en absence de post manuel, pas de Une; affichage des infos compactes automatiques uniquement.
- Activite projet:
  - correction d un bug de recuperation des evenements en mode chiffre:
    - conservation de champs indexables en clair dans `events` (`projectId`, `timestamp`, `type`, `author`),
    - fallback retrocompatibilite pour anciens enregistrements non indexables.
  - ajout de la pagination du journal d activite (avec conservation des filtres).
- Harmonisation des cartes projet:
  - actions masquables/affichables au survol-focus sur les cartes de taches (liste + kanban),
  - kanban projet aligne sur le comportement de la rubrique `Taches` (actions en overlay, sans espace reserve),
  - extension du meme comportement overlay aux cartes `Documents` (projet + documents transverses).

## Version actuelle - Avril 2026

### Nouvelle fonctionnalité - Avril 2026 (Surveillance de fichiers)

- **Référentiels / Surveillance fichiers**:
  - ajout d'un nouvel onglet `Surveillance fichiers` dans la section Référentiels,
  - création d'observateurs pour surveiller automatiquement les modifications de fichiers dans un dossier,
  - système de polling configurable (intervalle de 30 secondes à 1 heure),
  - détection de 3 types d'événements: création, modification, suppression de fichiers,
  - support de multiples formats de fichiers:
    - Excel (`.xlsx`, `.xls`, `.xlsm`, `.xlsb`)
    - Word (`.docx`, `.doc`, `.docm`)
    - PDF (`.pdf`)
    - CSV (`.csv`)
    - Texte (`.txt`, `.md`)
    - Images (`.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`)
    - Patterns personnalisés (ex: `rapport_*.pdf`)
  - mode récursif pour observer les sous-dossiers,
  - notifications automatiques intégrées au centre de notifications,
  - configuration fine des notifications par type d'événement,
  - interface complète:
    - liste en cartes avec statut visuel (actif/pausé),
    - modale de création/édition avec sélection de dossier (File System Access API),
    - modale de détail avec:
      - informations (statut, fréquence, récursif, dernière vérification),
      - actions rapides (pause/reprise, vérification manuelle, modifier, supprimer),
      - liste des fichiers surveillés (nom, taille),
      - historique complet des changements avec filtres (tous, créés, modifiés, supprimés),
  - modules autonomes:
    - `js/taskmda-file-watcher.js`: moteur de surveillance (polling, détection, notifications),
    - `js/taskmda-file-watcher-ui.js`: interface utilisateur (modales, actions, rendu),
  - migration DB_VERSION 21 avec 3 nouveaux stores IndexedDB:
    - `fileWatchers`: configuration des observateurs,
    - `fileWatcherSnapshots`: état de référence des fichiers (métadonnées),
    - `fileWatcherEvents`: historique des changements détectés,
  - documentation complète:
    - `docs/FILE_WATCHER.md`: documentation technique et architecture,
    - `docs/QUICKSTART_FILE_WATCHER.md`: guide rapide utilisateur avec exemples.

## Version actuelle - Avril 2026

### Correctif - Avril 2026 (Workflow: fin du seed automatique)

- Workflow:
  - suppression de l injection automatique du jeu d exemple au demarrage (`ensureSeedData` n est plus appele dans `init`),
  - apres reinitialisation locale complete, la vue Workflow reste vide (plus de reliquat `Maison de l autonomie / Service Evaluation / Pole instruction / Agent referent`).
  - le bouton d injection manuelle du jeu exemple reste disponible si besoin.

### Micro-lot securite - Avril 2026 (seed exemple Workflow verrouille)

- Workflow:
  - ajout d un flag admin explicite local (`mode seed`) avant toute possibilite d injection de jeu exemple,
  - bouton `Injecter jeu d exemple` masque par defaut, visible uniquement si:
    - utilisateur admin,
    - flag `mode seed` active.
  - ajout d un bouton admin `Activer/Désactiver mode seed`.
  - double confirmation renforcee:
    - activation du mode seed: confirmation + saisie du token `ACTIVER_SEED`,
    - injection du jeu exemple: confirmation + saisie du token `INJECTER`.

### Mise a jour incrementale - Avril 2026 (Notes globales - mini lot qualite UX)

- Rubrique `Notes` (transverse/privee):
  - ajout de l onglet `Favoris` dans les filtres rapides,
  - ajout d un marquage `Favori` par note (action directe depuis la carte),
  - ajout d une action `Exporter` (HTML) depuis chaque carte.
- Selection multiple:
  - ajout du mode `Selection multiple` dans la barre Notes globale,
  - ajout du bouton `Tout selectionner` (toggle auto vers `Tout deselectionner`),
  - suppression en masse des notes selectionnees (avec controle des droits).
- Export multi-notes:
  - remplacement des deux actions directes par un bouton unique `Export ZIP`,
  - ajout d une modale compacte de choix de format (`ZIP HTML` ou `ZIP TXT`),
  - generation d un ZIP local sans serveur/npm (format ZIP standard, non compresse).
- Pagination:
  - pagination dediee a la liste des notes globales (`global-notes-pagination`) pour garder une navigation fluide sur gros volumes.
- Tri:
  - nouveau tri `Favoris d abord` dans la liste des notes globales.
- Navigation:
  - la rubrique `Notes` est placee juste apres `Taches` dans la sidebar.

### Mise a jour incrementale - Avril 2026 (Rubrique Notes transverse + privee)

- Navigation:
  - ajout d une rubrique globale `Notes` dans la sidebar transverse.
- Stockage:
  - nouveau store IndexedDB `globalNotes` (DB_VERSION `20`) avec indexes `createdAt/updatedAt/createdBy/visibility/theme`.
- UX Notes:
  - liste de notes avec recherche, filtres de portee (`privee/transverse`), onglets rapides (`Toutes`, `Mes notes`, `Publiees dans le fil`) et tri.
  - creation/edition via modale dediee avec editeur riche (Quill/fallback), tags, thematique et mode de visibilite.
  - mode lecture pour les notes transverses non proprietaire (edition reservee auteur/admin).
- Integration Fil d info:
  - publication optionnelle d une note globale dans le fil via un post lie (`ref global-note`).
  - references `global-note` cliquables depuis le fil (ouverture directe de la note).
- Recherche globale:
  - indexation des notes transverses/privees dans la recherche d en-tete avec ouverture contextuelle.

### Mise a jour incrementale - Avril 2026 (Lot technique 1 - stockage documents sur disque)

- Documents:
  - ajout d un module dedie `js/taskmda-document-storage.js` pour isoler la logique de stockage fichier.
  - nouvel enregistrement par defaut sur disque partage (quand le dossier est lie) avec chemin structure:
    - horodatage,
    - rubrique source (upload projet/note/global),
    - scope (projet/global),
    - projet,
    - thematique.
  - fallback automatique vers stockage `data:` en base locale si ecriture disque indisponible.
- Compatibilite:
  - apercu et telechargement hydrates a la demande depuis le chemin disque (`storagePath`) si `data` absent.
  - edition document: ouverture compatible avec hydratation automatique du contenu.
  - re-liaison/rattachement de document conserve les metadonnees de stockage (`storageMode`, `storagePath`, etc.).

### Mise a jour incrementale - Avril 2026 (Deadlines flexibles Projets + Taches)

- Projets:
  - ajout d un bloc d echeance configurable a la creation et a l edition:
    - `Date precise`
    - `Mois`
    - `Annee`
    - `Periode (debut / fin)`
  - affichage de l echeance dans l entete projet et sur les cartes projet (dashboard / vue projets).
  - stockage harmonise (`deadlineMode`, `deadlineDate`, `deadlineMonth`, `deadlineYear`, `deadlineStart`, `deadlineEnd`, `deadlineAt`).
- Taches:
  - ajout d un mode d echeance flexible dans la modale de creation/edition avec les memes 4 formats.
  - conservation de la compatibilite avec la logique existante (tri, focus/chrono, timeline, calendrier) via `dueDate` derive automatiquement.
  - affichage adapte dans les rendus (cartes, listes, timeline, detail) pour montrer le format choisi (mois/annee/periode).
  - edition inline de la date limite convertie explicitement en mode `date precise`.
- Import:
  - normalisation des taches importees pour conserver/deriver le nouveau modele d echeance.

### Mise a jour incrementale - Avril 2026 (Workflow UX - alignement filtres Carte)

- Workflow / Carte:
  - correction CSS de la zone filtres des liaisons pour afficher `Rechercher une liaison...` et `Tri` sur la meme ligne en desktop.
  - comportement responsive conserve: retour en empilement sur petits ecrans.
  - ajustement applique dans `css/taskmda-workflow.css` (source de style active Workflow).

### Mise a jour incrementale - Avril 2026 (Hierarchie Epic/Feature finalisee)

- Projets / Structure:
  - KPIs hierarchiques ajoutes dans l onglet `Structure` (taches actives, avec/sans feature, terminees, completion).
  - actions rapides ajoutees:
    - deplacement `Feature -> Epic`
    - reassignment `Tache -> Feature`
  - drag & drop natif dans `Structure`:
    - `Feature -> Epic` par glisser-deposer
    - `Tache -> Feature` via liste de taches draggable et zones de depot par feature
    - zone `Sans feature` pour detacher rapidement une tache
- Taches projet/transverses:
  - affichage du badge `Epic` en plus du badge `Feature` sur les cartes et details.
  - filtres projet enrichis `Epic` + `Feature` (avec dependance dynamique Epic -> Features).
- Exports CSV:
  - export projets enrichi (`epics`, `features`, `taches_avec_feature`, `taches_sans_feature`).
  - export taches enrichi (`epic_id`, `epic`, `feature_id`, `feature`).

### Mise a jour incrementale - Avril 2026 (Annuaire ESMS + Audit divergences + UX)

- Referentiels / Annuaire ESMS:
  - stabilisation du connecteur Annuaire Sante FHIR (`gateway.api.esante.gouv.fr`) avec support endpoint configure + cle API optionnelle selon plan.
  - normalisation automatique des endpoints gateway (`/fhir` converti en `/fhir/v2`).
  - renforcement des requetes FHIR `Organization` (construction via `URLSearchParams`, variantes de recherche FINESS nettoyees).
  - garde-fous anti-bruit reseau:
    - pre-check unique de disponibilite/authentification avant enrichissement,
    - arret des appels d enrichissement en cas de `401/403` ou `400` persistant,
    - affichage explicite de la raison d indisponibilite.
  - ajout d un panneau de configuration API repliable/depliable (toggle) avec persistance locale de l etat.
  - libelle du toggle clarifie avec icones (`Afficher config API` / `Masquer config API`).
- Audit divergences FINESS vs FHIR:
  - ajout d un mode `Audit` activable depuis l annuaire.
  - badge par ligne + detail au clic des champs compares (nom, ville, adresse, telephone, email).
  - statuts introduits: `OK`, `Proche`, `Incomplet`, `Different`.
  - recapitulatif des compteurs par ligne (OK / Proche / Incomplet / Different).
  - moteur de proximite semantique pour limiter les faux positifs:
    - normalisation casse/accents/ponctuation,
    - similarite texte (Dice),
    - overlap de tokens,
    - detection d inclusion.
  - ajout d une recommandation `adresse enrichie` et action locale `Utiliser l adresse enrichie` quand l adresse FHIR est plus informative.
  - correction d un bug de boucle de rendu/audit (stabilisation UX en mode audit ON).
- UI Referentiels:
  - barre d onglets ajustee pour integrer le bouton d aide sur la meme ligne, a droite.
- Taches:
  - animation de completion sur carte (`pouce leve` flottant + fade) lors d un passage a `termine`.

### Mise a jour incrementale - Avril 2026 (UX/UI + Workflow KPI)

- Projets:
  - harmonisation de la vue `Projets` en panneaux separes (zone overview/filtres/actions + zone cartes).
  - fiabilisation du mode `Archives` (bascule, retour dashboard -> projets, etat d affichage).
  - ajustements visuels des cartes (barre top, coherence panel et filtres).
- Projet detail:
  - corrections de visibilite des actions contextuelles (ex: `Restaurer` uniquement pour les archives).
  - harmonisation des fonds `#project-overview-panel` et `#project-work-panel` selon les styles demandes.
- Sidebar/header:
  - integration visuelle du bloc marque dans la sidebar.
  - sidebar etendue sur toute la hauteur de page.
- Fil d info:
  - bloc `Nouveau post d'information` remonte au-dessus du fil et de la recherche.
  - bloc replie par defaut, depliage a la demande.
- Messagerie:
  - panneau `Agents connus` en mode toggle (ouvrir/reduire).
  - ajustement des proportions (panneau agents + zone conversation).
  - barre d envoi modernisee avec bouton `Envoyer` rectangulaire a bords arrondis.
- Onglet `Plus (x)`:
  - menu complementaire epingle au clic.
  - fermeture au second clic.
  - suppression de l ouverture au survol.
- Workflow:
  - ajout de la vue `KPI` dans `Pilotage`.
  - KPI: synthese volume, completion, bloquees, a valider, en cours, priorite haute.
  - KPI: repartitions par statut/priorite + charge par agent (top 8).
  - styles dedies clairs/sombres (`css/taskmda-workflow.css`).

### ✨ Nouvelles fonctionnalités
#### Workflow (MVP integre)
- Ajout de la rubrique principale `Workflow` dans la navigation.
- Nouveau module `js/taskmda-workflow.js` + styles `css/taskmda-workflow.css`.
- Vues disponibles: `Carte`, `Organisation`, `Agents`, `Taches`, `Procedures`, `Logiciels metiers`.
- Panneau detail lateral editable avec sauvegarde/suppression.
- CRUD finalise cote UI pour toutes les entites Workflow:
  - creation `communautes`, `services`, `groupes`, `agents`, `taches`, `procedures`, `logiciels`
  - edition/suppression via panneau detail sur toutes les entites
- Niveau 2 (structuration avancee) ajoute:
  - filtres combines `service` + `groupe` + `agent` persistes dans `workflowLayout`
  - dependances inter-taches (`prerequisiteTaskIds`, `dependentTaskIds`) avec synchronisation des liens reciproques
  - liens transverses inter-services via `relatedServiceIds`
  - hierarchie agents/manager visible dans les vues `Carte`, `Organisation` et `Agents`
  - versioning leger automatique des procedures (incrementation auto + historique en metadata)
  - mode lecture seule Workflow pour non-admin application (edition reservee a l'admin)
- Niveau 3 (workflow enrichi) ajoute:
  - statuts workflow et validation simple des taches (`todo`, `in_progress`, `blocked`, `ready_for_review`, `done`, `approved`)
  - checklist d'execution structuree par tache avec edition et completion rapide
  - actions rapides en fiche tache: demarrer, cocher checklist, valider
  - vue `Kanban` workflow (colonnes par statut) pour pilotage operationnel
  - vue `Journal` basee sur `workflowAudit` pour tracer les evenements
  - notifications internes (toasts + audit `notify`) sur transitions et validations
- Correctifs Niveau 3:
  - correction du layout Kanban (colonnes stables + scroll horizontal) pour eviter le debordement/coupure visuelle
  - correction des libelles Workflow mal encodes (accents dans les boutons/onglets)
  - optimisation performance: ecriture Workflow locale immediate + sync dossier partage en file asynchrone (non bloquante UI)
- Integration transverse modules existants:
  - ponts explicites Workflow <-> taches globales, documents globaux, themes et groupes referentiels
  - liens croises bidirectionnels materialises via `metadata.workflowRefs` dans `globalTasks`, `globalDocs`, `globalThemes`, `globalGroups`
  - affichage des ponts transverses dans la fiche detail des taches/procedures workflow
- Procedures wiki:
  - integration d'un editeur riche (Quill si disponible, fallback contenteditable) dans la fiche procedure
  - persistance HTML wiki via `wikiBodyHtml` sur `workflowProcedures`
  - evolution vers "PAGE WIKI MODE OPERATOIRE" avec:
    - sommaire auto (H1/H2/H3)
    - liens internes type wiki (`[[Titre]]` ou `[[Titre|Libelle]]`)
    - apercu wiki navigable vers les procedures ciblees
    - aide contextuelle sous l'editeur (exemples de syntaxe wiki)
- RBAC Workflow granulaire:
  - edition autorisee pour `admin application` OU `manager workflow` (agent mappe + `rbacHints`)
  - configuration manager workflow depuis la fiche agent (`metadata.userId`, `rbacHints`)
  - migration UI `Auto-lier comptes agents` + migration auto au chargement (une fois) pour pre-remplir `metadata.userId`
- Ergonomie Workflow:
  - remplacement du panneau lateral fixe par une modale detail large et confortable
  - fermeture uniquement explicite (bouton `X` / `Esc`) pour eviter les fermetures involontaires pendant copier-coller
- Lot 3 (demarrage architecture + tracabilite):
  - decoupage initial en modules `taskmda-workflow-store.js`, `taskmda-workflow-graph.js`, `taskmda-workflow-ui.js`
  - ajout du store `workflowHistory` (historique d'entites + restauration simple depuis la fiche detail)
  - journalisation des modifications workflow (save, quick update task, delete, restore)
  - comparaison avant/apres par liste de champs modifies + restauration selective de champs depuis l'historique
- Fil d'info - digestion documentaire:
  - nouveau bouton `Digerer document` dans le composeur du fil d'info
  - ingestion locale de fichiers `.eml/.txt/.html/.pdf/.docx` vers une actualite resumee
  - extraction PDF/DOCX avancee si librairies presentes (`pdfjsLib`, `mammoth`), sinon fallback binaire best-effort
  - chargement direct des librairies `pdf.js` et `mammoth` dans l'interface pour activer l'extraction PDF/DOCX
- Donnees seed de demarrage pour illustrer la structure metier.
- Migration IndexedDB vers `DB_VERSION = 13` avec nouveaux stores:
  - `workflowCommunities`, `workflowServices`, `workflowGroups`
  - `workflowAgents`, `workflowTasks`, `workflowProcedures`
  - `workflowSoftware`, `workflowLayout`, `workflowAudit`, `workflowHistory`

#### 🔎 Récurrence des tâches
- **Tâches récurrentes** : Création de tâches qui se répètent automatiquement
- **Types de récurrence** :
  - Hebdomadaire (avec sélection de plusieurs jours)
  - Mensuelle (avec sélection de plusieurs jours du mois)
  - Annuelle (avec sélection de plusieurs dates MM-DD)
- **Options de fin** :
  - Infini : Récurrence sans limite
  - Nombre d'occurrences : Défini le nombre de fois que la tâche se répète
  - Jusqu'à une date : Termine la récurrence à une date spécifiée
- **Intervalles personnalisables** : Configuration du nombre de périodes (1, 2, 3, etc.)
- **Interface intégrée** : Formulaire de configuration dans le modal de tâche
- **Compatible** : Tâches de projet et tâches hors projet (global)
- **Synchronisable** : Récurrence persistée et synchronisée en mode collaboratif

### 📔 Nouveaux fichiers
- `js/taskmda-recurrence.js` - Moteur de récurrence et utilitaires
- `js/taskmda-recurrence-ui.js` - Gestion UI et formulaire
- `docs/RECURRENCE.md` - Documentation technique complète
- `docs/QUICKSTART_RECURRENCE.md` - Guide rapide et exemples

### 📋 Anciennes nouvelles - Mars 2026

### ✨ Anciennes fonctionnalités

#### Chiffrement E2E et projets privés/partagés
- **Projets privés** : Stockés localement uniquement, non synchronisés
- **Projets partagés** : Synchronisation avec chiffrement E2E (AES-256-GCM)
- **Passphrase optionnelle** : Facilite le partage entre collaborateurs
- **Double chiffrement** : Local (mot de passe utilisateur) + Transport (clé partagée)
- **Badges visuels** : 🔒 PRIVÉ vs 🔥 PARTAGÉ 🔑

#### Amélioration UX
- **Édition du nom d'utilisateur** : Clic sur icône crayon dans l'en-tête
- **Interface de création** : Choix du mode (privé/partagé) avec radio buttons
- **Champ passphrase** : Affiché conditionnellement pour projets partagés

### 🔧 Améliorations techniques

#### Base de données
- **Store `sharedKeys`** : Ajouté pour stocker les clés partagées (chiffrées)
- **DB_VERSION 3** : Migration automatique

#### Synchronisation
- **Chargement automatique** : Découverte des projets existants lors de la connexion
- **Chiffrement E2E** : Tous les événements synchronisés sont chiffrés
- **Format v1-e2e-encrypted** : Nouveau format pour les fichiers du dossier partagé
- **Rétrocompatibilité** : Support des anciens fichiers JSON en clair

#### Module crypto
- 6 nouvelles fonctions pour chiffrement E2E :
  - `generateSharedKey()` - Génération clé AES-256
  - `exportSharedKey()` / `importSharedKey()` - Import/export
  - `deriveSharedKeyFromPassphrase()` - Dérivation PBKDF2
  - `encryptWithSharedKey()` / `decryptWithSharedKey()` - Chiffrement/déchiffrement

### 🐛 Corrections

#### Synchronisation multi-postes
- **Fix** : Les projets existants sont maintenant chargés lors de la connexion
- **Fonction** : `discoverAndLoadExistingProjects()` ajoutée
- **Paramètre** : `onlyNew` dans `readEventsFromSharedFolder()`

#### UUID
- **Fix** : Implémentation UUID en ligne (élimination dépendance CDN)

#### Base de données
- **Fix** : Pattern singleton pour éviter les fermetures de connexion
- **Fix** : `getDatabase()` synchrone

### 📡 Documentation

- README.md : Section sécurité complète et synthétique
- CHIFFREMENT_INDEXEDDB.md : Architecture technique détaillée
- TEST_CHIFFREMENT.md : Plan de test avec 14 scénarios
- PROJET.md : Spécifications event-sourcing

### 🔐 Sécurité

- **Aucune donnée en clair** : Tout est chiffré (local + transport)
- **Zero-knowledge** : Le dossier partagé ne contient que des données chiffrées
- **Clés en mémoire** : Jamais stockées sur disque
- **Standards** : AES-256-GCM, PBKDF2-SHA256, OWASP 2024

---

## Prochaines évolutions possibles

- Modal "Rejoindre un projet partagé" avec scanner automatique
- Export/import de clés (.key file)
- Gestion des clés partagées (interface dédiée)
- Rotation des clés
- Révocation de membres
- Notifications en temps réel
