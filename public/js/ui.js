// Classe pour gérer l'interface utilisateur
class UI {
  static showScreen(screenId) {
    // Cacher tous les écrans
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.remove('active');
    });
    
    // Afficher l'écran demandé
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
      targetScreen.classList.add('active');
    }
  }

  static getCurrentScreen() {
    const activeScreen = document.querySelector('.screen.active');
    return activeScreen ? activeScreen.id : null;
  }

  static showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Icônes selon le type
    const icons = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    };
    
    toast.innerHTML = `
      <i class="${icons[type] || icons.info}"></i>
      <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Supprimer automatiquement
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, duration);
    
    // Limiter le nombre de toasts
    const toasts = container.querySelectorAll('.toast');
    if (toasts.length > 5) {
      container.removeChild(toasts[0]);
    }
  }

  static showFeedback(message, type = 'info') {
    const feedback = document.getElementById('input-feedback');
    feedback.textContent = message;
    feedback.className = `feedback ${type}`;
    
    // Animation
    feedback.style.opacity = '0';
    feedback.style.transform = 'translateY(-10px)';
    
    setTimeout(() => {
      feedback.style.transition = 'all 0.3s ease';
      feedback.style.opacity = '1';
      feedback.style.transform = 'translateY(0)';
    }, 10);
  }

  static clearFeedback() {
    const feedback = document.getElementById('input-feedback');
    feedback.textContent = '';
    feedback.className = 'feedback';
  }

  static setLoading(element, isLoading) {
    if (isLoading) {
      element.disabled = true;
      element.classList.add('loading');
      
      const originalText = element.innerHTML;
      element.dataset.originalText = originalText;
      element.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Chargement...';
    } else {
      element.disabled = false;
      element.classList.remove('loading');
      
      if (element.dataset.originalText) {
        element.innerHTML = element.dataset.originalText;
        delete element.dataset.originalText;
      }
    }
  }

  static animateElement(element, animation) {
    element.classList.add(animation);
    setTimeout(() => element.classList.remove(animation), 600);
  }

  static formatTime(milliseconds) {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  static createPlayerCard(player, isCurrentPlayer = false) {
    const card = document.createElement('div');
    card.className = 'player-card';
    if (isCurrentPlayer) card.classList.add('current-player');
    
    card.innerHTML = `
      <div class="player-avatar">
        <i class="fas fa-user"></i>
      </div>
      <div class="player-info">
        <div class="player-name">${player.name}</div>
        <div class="player-stats">
          <span class="attempts">${player.attempts || 0} tentative(s)</span>
          ${player.finished ? `<span class="rank">Rang ${player.rank}</span>` : ''}
        </div>
      </div>
    `;
    
    return card;
  }

  static updatePlayersList(players, currentPlayerId, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    players.forEach(player => {
      const isCurrentPlayer = player.id === currentPlayerId;
      const playerCard = UI.createPlayerCard(player, isCurrentPlayer);
      container.appendChild(playerCard);
    });
  }

  static showModal(title, content, buttons = []) {
    // Créer le modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    modalContent.innerHTML = `
      <div class="modal-header">
        <h3>${title}</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        ${content}
      </div>
      <div class="modal-footer">
        ${buttons.map(btn => 
          `<button class="btn-${btn.type || 'secondary'}" data-action="${btn.action}">${btn.text}</button>`
        ).join('')}
      </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Gestionnaires d'événements
    modal.querySelector('.modal-close').addEventListener('click', () => {
      UI.closeModal(modal);
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        UI.closeModal(modal);
      }
    });
    
    // Boutons d'action
    buttons.forEach(btn => {
      const buttonElement = modal.querySelector(`[data-action="${btn.action}"]`);
      if (buttonElement && btn.handler) {
        buttonElement.addEventListener('click', () => {
          btn.handler();
          UI.closeModal(modal);
        });
      }
    });
    
    // Animation d'entrée
    setTimeout(() => modal.classList.add('active'), 10);
    
    return modal;
  }

  static closeModal(modal) {
    modal.classList.remove('active');
    setTimeout(() => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    }, 300);
  }

  static createConfirmDialog(title, message, onConfirm, onCancel) {
    return UI.showModal(title, `<p>${message}</p>`, [
      {
        text: 'Annuler',
        type: 'secondary',
        action: 'cancel',
        handler: onCancel
      },
      {
        text: 'Confirmer',
        type: 'primary',
        action: 'confirm',
        handler: onConfirm
      }
    ]);
  }

  static showConnectionStatus(isConnected) {
    const indicator = document.querySelector('.connection-indicator') || (() => {
      const div = document.createElement('div');
      div.className = 'connection-indicator';
      document.body.appendChild(div);
      return div;
    })();
    
    indicator.className = `connection-indicator ${isConnected ? 'connected' : 'disconnected'}`;
    indicator.innerHTML = isConnected ? 
      '<i class="fas fa-wifi"></i> Connecté' : 
      '<i class="fas fa-wifi-slash"></i> Connexion perdue';
  }

  static highlightElement(element, duration = 2000) {
    element.classList.add('highlight');
    setTimeout(() => element.classList.remove('highlight'), duration);
  }

  static scrollToElement(element, behavior = 'smooth') {
    element.scrollIntoView({ behavior, block: 'center' });
  }

  static copyToClipboard(text) {
    if (navigator.clipboard) {
      return navigator.clipboard.writeText(text).then(() => {
        UI.showToast('Copié dans le presse-papiers !', 'success');
        return true;
      }).catch(() => {
        return UI.fallbackCopyToClipboard(text);
      });
    } else {
      return UI.fallbackCopyToClipboard(text);
    }
  }

  static fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        UI.showToast('Copié dans le presse-papiers !', 'success');
        return true;
      } else {
        UI.showToast('Impossible de copier', 'error');
        return false;
      }
    } catch (err) {
      document.body.removeChild(textArea);
      UI.showToast('Impossible de copier', 'error');
      return false;
    }
  }

  static formatNumber(num) {
    return new Intl.NumberFormat('fr-FR').format(num);
  }

  static formatDate(timestamp) {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date(timestamp));
  }

  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  static throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Validation des inputs
  static validateInput(input, type) {
    const validators = {
      playerName: (value) => {
        if (!value.trim()) return 'Le nom est requis';
        if (value.length > 20) return 'Le nom doit faire moins de 20 caractères';
        if (!/^[a-zA-Z0-9\s-_]+$/.test(value)) return 'Caractères non autorisés';
        return null;
      },
      
      roomId: (value) => {
        if (value && !/^[A-Z0-9]{4,10}$/.test(value)) {
          return 'L\'ID de room doit contenir 4-10 caractères (lettres et chiffres)';
        }
        return null;
      },
      
      guess: (value) => {
        if (!/^\d{4}$/.test(value)) return 'La tentative doit être un nombre de 4 chiffres';
        if (new Set(value.split('')).size !== 4) return 'Tous les chiffres doivent être différents';
        return null;
      }
    };
    
    const validator = validators[type];
    return validator ? validator(input.value) : null;
  }

  static showInputError(input, message) {
    input.classList.add('error');
    
    // Supprimer l'ancien message d'erreur
    const existingError = input.parentNode.querySelector('.input-error');
    if (existingError) {
      existingError.remove();
    }
    
    // Ajouter le nouveau message
    if (message) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'input-error';
      errorDiv.textContent = message;
      input.parentNode.appendChild(errorDiv);
    }
    
    // Animation shake
    UI.animateElement(input, 'shake');
  }

  static clearInputError(input) {
    input.classList.remove('error');
    const errorDiv = input.parentNode.querySelector('.input-error');
    if (errorDiv) {
      errorDiv.remove();
    }
  }

  // Gestion des sons (optionnel)
  static playSound(soundName) {
    // Ici vous pourriez ajouter des sons
    const sounds = {
      success: () => console.log('🔊 Son de succès'),
      error: () => console.log('🔊 Son d\'erreur'),
      notification: () => console.log('🔊 Son de notification'),
      win: () => console.log('🔊 Son de victoire')
    };
    
    const sound = sounds[soundName];
    if (sound) sound();
  }
}

// Ajout des styles pour les modals et autres éléments UI
const additionalStyles = `
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.modal-overlay.active {
  opacity: 1;
}

.modal-content {
  background: var(--card-bg);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  transform: translateY(20px);
  transition: transform 0.3s ease;
}

.modal-overlay.active .modal-content {
  transform: translateY(0);
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-close {
  background: none;
  border: none;
  color: var(--text-color);
  font-size: 24px;
  cursor: pointer;
  padding: 5px;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  text-align: right;
}

.modal-footer button {
  margin-left: 10px;
}

.connection-indicator {
  position: fixed;
  top: 20px;
  left: 20px;
  padding: 10px 15px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  z-index: 999;
  transition: all 0.3s ease;
}

.connection-indicator.connected {
  background: rgba(46, 204, 113, 0.2);
  color: var(--secondary-color);
  border: 1px solid var(--secondary-color);
}

.connection-indicator.disconnected {
  background: rgba(231, 76, 60, 0.2);
  color: var(--danger-color);
  border: 1px solid var(--danger-color);
}

.input-error {
  color: var(--danger-color);
  font-size: 12px;
  margin-top: 5px;
  animation: fadeIn 0.3s ease;
}

.input.error {
  border-color: var(--danger-color) !important;
  background: rgba(231, 76, 60, 0.1) !important;
}

.highlight {
  animation: highlight 2s ease;
}

@keyframes highlight {
  0%, 100% { background: transparent; }
  50% { background: rgba(52, 152, 219, 0.3); }
}

.loading {
  pointer-events: none;
  opacity: 0.7;
}
`;

// Injecter les styles supplémentaires
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);
