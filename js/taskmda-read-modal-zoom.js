/**
 * Module de gestion du zoom de texte dans les modales de lecture
 * ================================================================
 *
 * Fonctionnalités :
 * - Augmentation/diminution de la taille des caractères
 * - Persistance de la préférence utilisateur (localStorage)
 * - Application automatique à toutes les modales de lecture
 * - Contrôles visuels avec indicateur de niveau
 *
 * Modales supportées :
 * - modal-project-note-read (notes de projet)
 * - modal-global-read (notes globales / fil d'info)
 * - modal-doc-preview (prévisualisation de documents)
 *
 * @module TaskMDAReadModalZoom
 * @version 1.0
 * @date 2026-05-05
 */

(function(window) {
  'use strict';

  /**
   * Namespace principal du module
   */
  const TaskMDAReadModalZoom = {

    // ========================================
    // CONFIGURATION
    // ========================================

    /**
     * Configuration du module
     */
    config: {
      // Clé de stockage localStorage pour la préférence de zoom
      storageKey: 'taskmda_read_modal_zoom_level',

      // Niveau de zoom par défaut (100%)
      defaultZoomLevel: 100,

      // Niveau minimum de zoom (70%)
      minZoomLevel: 70,

      // Niveau maximum de zoom (200%)
      maxZoomLevel: 200,

      // Incrément de zoom (10% par clic)
      zoomIncrement: 10,

      // Sélecteurs des conteneurs de contenu dans chaque modale
      contentSelectors: [
        '#project-read-content',       // Fiche projet (lecture)
        '#project-note-read-content',  // Notes de projet
        '#global-read-content',        // Notes globales / fil d'info
        '#doc-preview-content'         // Prévisualisation de documents
      ]
    },

    // ========================================
    // ÉTAT
    // ========================================

    /**
     * État actuel du module
     */
    state: {
      currentZoomLevel: 100,
      isInitialized: false
    },

    // ========================================
    // INITIALISATION
    // ========================================

    /**
     * Initialise le module
     * - Charge la préférence utilisateur
     * - Configure les listeners d'événements
     * - Applique le zoom initial
     */
    init: function() {
      if (this.state.isInitialized) {
        console.warn('[ReadModalZoom] Module déjà initialisé');
        return;
      }

      // Charger la préférence utilisateur
      this.loadZoomPreference();

      // Appliquer le zoom initial à tous les conteneurs
      this.applyZoomToAllContainers();

      // Marquer comme initialisé
      this.state.isInitialized = true;

      console.log('[ReadModalZoom] Module initialisé - Niveau:', this.state.currentZoomLevel + '%');
    },

    // ========================================
    // GESTION DU ZOOM
    // ========================================

    /**
     * Charge la préférence de zoom depuis localStorage
     */
    loadZoomPreference: function() {
      try {
        const savedLevel = localStorage.getItem(this.config.storageKey);
        if (savedLevel !== null) {
          const level = parseInt(savedLevel, 10);
          if (level >= this.config.minZoomLevel && level <= this.config.maxZoomLevel) {
            this.state.currentZoomLevel = level;
            return;
          }
        }
      } catch (e) {
        console.warn('[ReadModalZoom] Erreur chargement préférence:', e);
      }

      // Par défaut
      this.state.currentZoomLevel = this.config.defaultZoomLevel;
    },

    /**
     * Sauvegarde la préférence de zoom dans localStorage
     */
    saveZoomPreference: function() {
      try {
        localStorage.setItem(this.config.storageKey, this.state.currentZoomLevel.toString());
      } catch (e) {
        console.warn('[ReadModalZoom] Erreur sauvegarde préférence:', e);
      }
    },

    /**
     * Augmente le niveau de zoom
     * @returns {boolean} true si le zoom a été modifié
     */
    increaseZoom: function() {
      const newLevel = this.state.currentZoomLevel + this.config.zoomIncrement;

      if (newLevel <= this.config.maxZoomLevel) {
        this.state.currentZoomLevel = newLevel;
        this.applyZoomToAllContainers();
        this.saveZoomPreference();
        this.updateZoomIndicators();
        return true;
      }

      return false;
    },

    /**
     * Diminue le niveau de zoom
     * @returns {boolean} true si le zoom a été modifié
     */
    decreaseZoom: function() {
      const newLevel = this.state.currentZoomLevel - this.config.zoomIncrement;

      if (newLevel >= this.config.minZoomLevel) {
        this.state.currentZoomLevel = newLevel;
        this.applyZoomToAllContainers();
        this.saveZoomPreference();
        this.updateZoomIndicators();
        return true;
      }

      return false;
    },

    /**
     * Réinitialise le zoom au niveau par défaut
     */
    resetZoom: function() {
      this.state.currentZoomLevel = this.config.defaultZoomLevel;
      this.applyZoomToAllContainers();
      this.saveZoomPreference();
      this.updateZoomIndicators();
    },

    // ========================================
    // APPLICATION DU ZOOM
    // ========================================

    /**
     * Applique le zoom actuel à tous les conteneurs de contenu
     */
    applyZoomToAllContainers: function() {
      this.config.contentSelectors.forEach(selector => {
        this.applyZoomToContainer(selector);
      });
    },

    /**
     * Applique le zoom à un conteneur spécifique
     * @param {string} selector - Sélecteur CSS du conteneur
     */
    applyZoomToContainer: function(selector) {
      const container = document.querySelector(selector);
      if (container) {
        container.style.fontSize = this.state.currentZoomLevel + '%';
      }
    },

    // ========================================
    // INTERFACE UTILISATEUR
    // ========================================

    /**
     * Met à jour les indicateurs visuels de zoom dans toutes les modales
     */
    updateZoomIndicators: function() {
      // Mise à jour des indicateurs de niveau
      const indicators = document.querySelectorAll('.read-modal-zoom-level');
      indicators.forEach(indicator => {
        indicator.textContent = this.state.currentZoomLevel + '%';
      });

      // Mise à jour de l'état des boutons
      this.updateZoomButtons();
    },

    /**
     * Met à jour l'état des boutons de zoom (activé/désactivé)
     */
    updateZoomButtons: function() {
      // Boutons d'augmentation
      const increaseBtns = document.querySelectorAll('.btn-zoom-increase');
      increaseBtns.forEach(btn => {
        if (this.state.currentZoomLevel >= this.config.maxZoomLevel) {
          btn.disabled = true;
          btn.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
          btn.disabled = false;
          btn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
      });

      // Boutons de diminution
      const decreaseBtns = document.querySelectorAll('.btn-zoom-decrease');
      decreaseBtns.forEach(btn => {
        if (this.state.currentZoomLevel <= this.config.minZoomLevel) {
          btn.disabled = true;
          btn.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
          btn.disabled = false;
          btn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
      });
    },

    /**
     * Configure les listeners d'événements pour les boutons de zoom
     * À appeler après l'initialisation du DOM
     */
    bindEventListeners: function() {
      // Boutons d'augmentation
      document.querySelectorAll('.btn-zoom-increase').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          this.increaseZoom();
        });
      });

      // Boutons de diminution
      document.querySelectorAll('.btn-zoom-decrease').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          this.decreaseZoom();
        });
      });

      // Boutons de réinitialisation
      document.querySelectorAll('.btn-zoom-reset').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          this.resetZoom();
        });
      });

      console.log('[ReadModalZoom] Event listeners configurés');
    },

    // ========================================
    // UTILITAIRES
    // ========================================

    /**
     * Récupère le niveau de zoom actuel
     * @returns {number} Le niveau de zoom actuel (70-200)
     */
    getCurrentZoomLevel: function() {
      return this.state.currentZoomLevel;
    },

    /**
     * Définit le niveau de zoom
     * @param {number} level - Le nouveau niveau de zoom (70-200)
     * @returns {boolean} true si le niveau a été modifié
     */
    setZoomLevel: function(level) {
      const validLevel = Math.max(
        this.config.minZoomLevel,
        Math.min(this.config.maxZoomLevel, level)
      );

      if (validLevel !== this.state.currentZoomLevel) {
        this.state.currentZoomLevel = validLevel;
        this.applyZoomToAllContainers();
        this.saveZoomPreference();
        this.updateZoomIndicators();
        return true;
      }

      return false;
    }
  };

  // ========================================
  // EXPORT
  // ========================================

  // Exposer le module globalement
  window.TaskMDAReadModalZoom = TaskMDAReadModalZoom;

  // Auto-initialisation au chargement du DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      TaskMDAReadModalZoom.init();
      TaskMDAReadModalZoom.bindEventListeners();
    });
  } else {
    // DOM déjà chargé
    TaskMDAReadModalZoom.init();
    TaskMDAReadModalZoom.bindEventListeners();
  }

})(window);
