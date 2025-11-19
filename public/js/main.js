// Point d'entrée principal de l'application
class App {
  constructor() {
    this.game = null;
    this.isInitialized = false;
  }

  async init() {
    try {
      console.log('🚀 Initialisation de l\'application Vache et Taureau');
      
      // Vérifier le support du navigateur
      this.checkBrowserSupport();
      
      // Vérifier et restaurer la session
      this.checkSession();
      
      // Initialiser les composants
      await this.initializeComponents();
      
      // Démarrer l'application
      this.startApplication();
      
      console.log('✅ Application initialisée avec succès');
      this.isInitialized = true;
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation:', error);
      this.showInitializationError(error);
    }
  }

  checkSession() {
    try {
      if (window.sessionManager && window.sessionManager.hasActiveSession()) {
        const playerInfo = window.sessionManager.getPlayerInfo();
        
        // Vérifier si la session n'est pas expirée
        if (window.sessionManager.isSessionExpired()) {
          console.log('⏰ Session expirée, effacement...');
          window.sessionManager.clearSession();
          return;
        }
        
        console.log('🔄 Session trouvée:', playerInfo);
        
        // Pré-remplir le nom du joueur
        const playerNameInput = document.getElementById('player-name');
        if (playerNameInput && playerInfo.name) {
          playerNameInput.value = playerInfo.name;
        }
        
        // Afficher un message de restauration
        setTimeout(() => {
          UI.showToast(`👋 Bon retour ${playerInfo.name} !`, 'info');
        }, 1000);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de session:', error);
      window.sessionManager.clearSession();
    }
  }

  checkBrowserSupport() {
    const requiredFeatures = [
      'WebSocket' in window,
      'localStorage' in window,
      'JSON' in window,
      'Promise' in window
    ];

    const unsupportedFeatures = requiredFeatures.filter(feature => !feature);
    
    if (unsupportedFeatures.length > 0) {
      throw new Error('Votre navigateur ne supporte pas toutes les fonctionnalités requises');
    }
  }

  async initializeComponents() {
    // Initialiser les gestionnaires d'événements globaux
    this.setupGlobalEventListeners();
    
    // Initialiser la gestion des erreurs
    this.setupErrorHandling();
    
    // Initialiser les raccourcis clavier
    this.setupKeyboardShortcuts();
    
    // Vérifier la connexion réseau
    this.setupNetworkDetection();
    
    // Initialiser le jeu
    this.game = new VacheTaureauClient();
  }

  startApplication() {
    // Afficher l'écran d'accueil
    UI.showScreen('welcome-screen');
    
    // Auto-focus sur le champ nom
    const playerNameInput = document.getElementById('player-name');
    if (playerNameInput) {
      playerNameInput.focus();
    }
    
    // Vérifier les paramètres URL
    this.handleUrlParameters();
    
    // Afficher le message de bienvenue
    setTimeout(() => {
      UI.showToast('🎮 Bienvenue dans Vache et Taureau !', 'success');
    }, 1000);
  }

  setupGlobalEventListeners() {
    // Gestion de la fermeture de l'onglet/fenêtre
    window.addEventListener('beforeunload', (e) => {
      if (this.game && this.game.currentRoom) {
        e.preventDefault();
        e.returnValue = 'Êtes-vous sûr de vouloir quitter la partie ?';
        return e.returnValue;
      }
    });

    // Gestion du redimensionnement
    window.addEventListener('resize', UI.debounce(() => {
      this.handleWindowResize();
    }, 250));

    // Gestion des erreurs JavaScript globales
    window.addEventListener('error', (e) => {
      console.error('Erreur JavaScript:', e.error);
      UI.showToast('Une erreur inattendue s\'est produite', 'error');
    });

    // Gestion des promesses rejetées
    window.addEventListener('unhandledrejection', (e) => {
      console.error('Promesse rejetée:', e.reason);
      UI.showToast('Erreur de connexion', 'error');
    });
  }

  setupErrorHandling() {
    // Centralisation de la gestion des erreurs
    this.errorHandler = {
      network: (error) => {
        console.error('Erreur réseau:', error);
        UI.showToast('Problème de connexion réseau', 'error');
      },
      
      socket: (error) => {
        console.error('Erreur WebSocket:', error);
        UI.showToast('Connexion au serveur perdue', 'error');
      },
      
      validation: (error) => {
        console.warn('Erreur de validation:', error);
        UI.showToast(error.message, 'warning');
      },
      
      game: (error) => {
        console.error('Erreur de jeu:', error);
        UI.showToast('Erreur dans le jeu', 'error');
      }
    };
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Raccourcis uniquement si pas dans un input
      if (e.target.tagName === 'INPUT') return;

      switch (e.key) {
        case 'Escape':
          // Fermer les modals ou revenir en arrière
          this.handleEscapeKey();
          break;
          
        case 'F5':
          // Empêcher le refresh accidentel pendant une partie
          if (this.game && this.game.currentRoom && this.game.gameState?.gameStarted) {
            e.preventDefault();
            UI.showToast('Utilisez le bouton Quitter pour quitter la partie', 'warning');
          }
          break;
          
        case 'Enter':
          // Actions contextuelles selon l'écran
          this.handleEnterKey();
          break;
      }
    });
  }

  setupNetworkDetection() {
    // Détecter les changements de connexion réseau
    window.addEventListener('online', () => {
      UI.showToast('Connexion rétablie', 'success');
      if (this.game && !this.game.isConnected) {
        // Tenter de se reconnecter
        this.game.socket.connect();
      }
    });

    window.addEventListener('offline', () => {
      UI.showToast('Connexion perdue', 'error');
    });
  }

  handleUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Room ID dans l'URL
    const roomId = urlParams.get('room');
    if (roomId) {
      document.getElementById('room-id').value = roomId.toUpperCase();
      UI.showToast(`Room ${roomId} pré-remplie`, 'info');
    }

    // Nom de joueur dans l'URL (pour les tests)
    const playerName = urlParams.get('name');
    if (playerName) {
      document.getElementById('player-name').value = playerName;
    }

    // Mode debug
    const debug = urlParams.get('debug');
    if (debug === 'true') {
      console.log('🐛 Mode debug activé');
      window.gameApp = this; // Exposer l'app pour le debug
    }
  }

  handleWindowResize() {
    // Ajuster l'interface selon la taille de l'écran
    const isMobile = window.innerWidth <= 768;
    document.body.classList.toggle('mobile', isMobile);
    
    // Réajuster les hauteurs si nécessaire
    if (UI.getCurrentScreen() === 'game-screen') {
      this.adjustGameLayout();
    }
  }

  handleEscapeKey() {
    const currentScreen = UI.getCurrentScreen();
    
    switch (currentScreen) {
      case 'lobby-screen':
        if (this.game) {
          this.game.leaveRoom();
        }
        break;
        
      case 'game-screen':
        UI.createConfirmDialog(
          'Quitter la partie',
          'Êtes-vous sûr de vouloir quitter la partie en cours ?',
          () => this.game.leaveRoom(),
          () => {}
        );
        break;
        
      case 'end-screen':
        this.game.newRoom();
        break;
    }
  }

  handleEnterKey() {
    const currentScreen = UI.getCurrentScreen();
    
    switch (currentScreen) {
      case 'welcome-screen':
        const joinBtn = document.getElementById('join-btn');
        if (!joinBtn.disabled) {
          joinBtn.click();
        }
        break;
        
      case 'lobby-screen':
        const startBtn = document.getElementById('start-game-btn');
        if (!startBtn.disabled) {
          startBtn.click();
        }
        break;
        
      case 'game-screen':
        const submitBtn = document.getElementById('submit-guess-btn');
        if (!submitBtn.disabled) {
          submitBtn.click();
        }
        break;
    }
  }

  adjustGameLayout() {
    // Ajuster la hauteur des panneaux selon la taille de l'écran
    const gameContainer = document.querySelector('.game-container');
    if (gameContainer && window.innerHeight < 700) {
      gameContainer.style.height = `${window.innerHeight - 40}px`;
    }
  }

  showInitializationError(error) {
    document.body.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background: var(--bg-color);
        color: var(--text-color);
        font-family: 'Segoe UI', sans-serif;
        text-align: center;
        padding: 20px;
      ">
        <div style="
          background: var(--card-bg);
          padding: 40px;
          border-radius: 12px;
          box-shadow: var(--shadow);
          max-width: 500px;
        ">
          <h1 style="color: var(--danger-color); margin-bottom: 20px;">
            ❌ Erreur d'initialisation
          </h1>
          <p style="margin-bottom: 20px;">
            ${error.message || 'Une erreur inattendue s\'est produite'}
          </p>
          <button onclick="window.location.reload()" style="
            background: var(--primary-color);
            color: white;
            border: none;
            padding: 15px 25px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
          ">
            🔄 Recharger la page
          </button>
        </div>
      </div>
    `;
  }

  // Méthodes publiques pour le debug
  getGameState() {
    return this.game ? this.game.gameState : null;
  }

  getCurrentRoom() {
    return this.game ? this.game.currentRoom : null;
  }

  isInGame() {
    return this.game && this.game.gameState && this.game.gameState.gameStarted;
  }

  // Analytics simples (optionnel)
  trackEvent(event, data = {}) {
    console.log('📊 Event:', event, data);
    // Ici vous pourriez envoyer les données vers un service d'analytics
  }
}

// Initialisation de l'application quand le DOM est prêt
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🌟 DOM chargé, initialisation de l\'application...');
  
  // Créer et démarrer l'application
  window.gameApp = new App();
  await window.gameApp.init();
});

// Gestion des Service Workers pour le cache (optionnel)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Ici vous pourriez enregistrer un service worker pour le cache offline
    console.log('💾 Service Worker disponible');
  });
}

// Export pour les tests ou l'utilisation externe
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { App, VacheTaureauClient, UI };
}
