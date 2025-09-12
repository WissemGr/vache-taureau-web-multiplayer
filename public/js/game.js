// Classe principale pour gérer le jeu côté client
class VacheTaureauClient {
  constructor() {
    this.socket = null;
    this.currentRoom = null;
    this.playerName = null;
    this.gameState = null;
    this.gameTimer = null;
    this.gameStartTime = null;
    this.isConnected = false;
    
    this.init();
  }

  init() {
    this.setupSocket();
    this.setupEventListeners();
    this.updateServerStats();
    
    // Auto-focus sur le champ nom
    document.getElementById('player-name').focus();
  }

  setupSocket() {
    this.socket = io();
    
    this.socket.on('connect', () => {
      console.log('🟢 Connecté au serveur');
      this.isConnected = true;
      this.updateServerStats();
      UI.showToast('Connecté au serveur', 'success');
    });

    this.socket.on('disconnect', () => {
      console.log('🔴 Déconnecté du serveur');
      this.isConnected = false;
      this.updateServerStats();
      UI.showToast('Connexion perdue', 'error');
    });

    this.socket.on('error', (message) => {
      console.error('❌ Erreur:', message);
      UI.showToast(message, 'error');
    });

    // Événement spécifique pour l'erreur de join-room
    this.socket.on('join-room-error', (message) => {
      console.error('❌ Erreur de connexion à la room:', message);
      UI.showToast(message, 'error');
      // Revenir à l'écran d'accueil si on ne peut pas rejoindre
      UI.showScreen('home-screen');
    });

    // Événements de room
    this.socket.on('player-joined', (data) => {
      UI.showToast(`${data.playerName} a rejoint la partie`, 'success');
      this.updateGameState(data.gameState);
    });

    this.socket.on('player-left', (data) => {
      UI.showToast(`${data.playerName} a quitté la partie`, 'warning');
      this.updateGameState(data.gameState);
    });

    this.socket.on('game-state', (gameState) => {
      this.updateGameState(gameState);
    });

    // Événements de jeu
    this.socket.on('game-started', (gameState) => {
      UI.showToast('🚀 La partie commence !', 'success');
      this.updateGameState(gameState);
      this.startGame();
    });

    this.socket.on('guess-result', (result) => {
      this.handleGuessResult(result);
    });

    this.socket.on('player-won', (data) => {
      UI.showToast(`🎉 ${data.winner} a trouvé le nombre !`, 'success');
      this.updateGameState(data.gameState);
    });

    this.socket.on('game-ended', (gameState) => {
      this.updateGameState(gameState);
      this.endGame();
    });
  }

  setupEventListeners() {
    // Écran d'accueil
    document.getElementById('join-btn').addEventListener('click', () => {
      this.joinRoom();
    });

    document.getElementById('create-room-btn').addEventListener('click', () => {
      this.createRoom();
    });

    // Entrée avec Enter
    document.getElementById('player-name').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.joinRoom();
    });

    document.getElementById('room-id').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.joinRoom();
    });

    // Lobby
    document.getElementById('start-game-btn').addEventListener('click', () => {
      this.startGameRequest();
    });

    document.getElementById('leave-room-btn').addEventListener('click', () => {
      this.leaveRoom();
    });

    document.getElementById('copy-link-btn').addEventListener('click', () => {
      this.copyRoomLink();
    });

    // Jeu
    document.getElementById('submit-guess-btn').addEventListener('click', () => {
      this.submitGuess();
    });

    document.getElementById('guess-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.submitGuess();
    });

    document.getElementById('guess-input').addEventListener('input', (e) => {
      this.validateGuessInput(e.target);
    });

    document.getElementById('quit-game-btn').addEventListener('click', () => {
      this.leaveRoom();
    });

    // Fin de partie
    document.getElementById('play-again-btn').addEventListener('click', () => {
      this.playAgain();
    });

    document.getElementById('new-room-btn').addEventListener('click', () => {
      this.newRoom();
    });
  }

  // Gestion des rooms
  joinRoom() {
    const playerName = document.getElementById('player-name').value.trim();
    const roomId = document.getElementById('room-id').value.trim() || this.generateRoomId();

    if (!playerName) {
      UI.showToast('Veuillez entrer votre nom', 'error');
      return;
    }

    if (playerName.length > 20) {
      UI.showToast('Le nom doit faire moins de 20 caractères', 'error');
      return;
    }

    this.playerName = playerName;
    this.currentRoom = roomId;

    this.socket.emit('join-room', { roomId, playerName });
    
    // Passer au lobby
    UI.showScreen('lobby-screen');
    this.updateLobbyInfo();
  }

  createRoom() {
    const playerName = document.getElementById('player-name').value.trim();

    if (!playerName) {
      UI.showToast('Veuillez entrer votre nom', 'error');
      return;
    }

    // Générer un nouvel ID de room
    const roomId = this.generateRoomId();
    document.getElementById('room-id').value = roomId;
    
    this.joinRoom();
  }

  leaveRoom() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket.connect();
    }
    
    this.currentRoom = null;
    this.gameState = null;
    this.stopTimer();
    
    UI.showScreen('welcome-screen');
    this.clearInputs();
  }

  // Gestion du jeu
  startGameRequest() {
    console.log('🚀 BOUTON CLICKÉ: Tentative de démarrage de la partie...');
    console.log('🚀 État actuel:', {
      gameState: this.gameState,
      currentRoom: this.currentRoom,
      socketConnected: this.socket.connected
    });
    this.socket.emit('start-game');
    console.log('🚀 Événement start-game envoyé au serveur');
  }

  startGame() {
    UI.showScreen('game-screen');
    document.getElementById('game-room-id').textContent = this.currentRoom;
    
    // Commencer le timer
    this.gameStartTime = Date.now();
    this.startTimer();
    
    // Focus sur l'input de tentative
    document.getElementById('guess-input').focus();
    
    // Réinitialiser l'interface
    this.clearAttempts();
    this.clearFeedback();
  }

  submitGuess() {
    const guessInput = document.getElementById('guess-input');
    const guess = guessInput.value.trim();

    if (!this.validateGuess(guess)) {
      return;
    }

    // Désactiver temporairement le bouton
    const submitBtn = document.getElementById('submit-guess-btn');
    submitBtn.disabled = true;

    this.socket.emit('make-guess', { guess });

    // Vider l'input
    guessInput.value = '';
    
    // Réactiver le bouton après un délai
    setTimeout(() => {
      submitBtn.disabled = false;
      guessInput.focus();
    }, 500);
  }

  handleGuessResult(result) {
    if (result.success) {
      // Ajouter la tentative à l'historique
      this.addAttemptToHistory(result.attempt);
      
      if (result.isWinner) {
        const rank = result.rank;
        const message = rank === 1 ? 
          '🎉 Félicitations ! Vous avez gagné !' : 
          `🎉 Bravo ! Vous êtes ${this.getRankText(rank)} !`;
        
        UI.showFeedback(message, 'success');
        UI.showToast(message, 'success');
      } else {
        const { cows, bulls } = result.attempt;
        const message = `${cows} 🐄 vache${cows > 1 ? 's' : ''}, ${bulls} 🐂 taureau${bulls > 1 ? 'x' : ''}`;
        UI.showFeedback(message, 'info');
      }
    }
  }

  endGame() {
    this.stopTimer();
    UI.showScreen('end-screen');
    this.updateEndScreen();
  }

  // Validation
  validateGuess(guess) {
    if (!/^\d{4}$/.test(guess)) {
      UI.showFeedback('La tentative doit être un nombre de 4 chiffres', 'error');
      this.shakeInput();
      return false;
    }

    const digits = guess.split('');
    if (new Set(digits).size !== 4) {
      UI.showFeedback('Tous les chiffres doivent être différents', 'error');
      this.shakeInput();
      return false;
    }

    return true;
  }

  validateGuessInput(input) {
    // Supprimer les caractères non-numériques
    input.value = input.value.replace(/[^0-9]/g, '');
    
    // Limiter à 4 chiffres
    if (input.value.length > 4) {
      input.value = input.value.slice(0, 4);
    }
  }

  // Interface utilisateur
  updateGameState(gameState) {
    console.log('📊 UPDATE GAME STATE appelé:', {
      newGameState: gameState,
      currentScreen: UI.getCurrentScreen(),
      hasPlayers: gameState?.players?.length || 0
    });
    
    this.gameState = gameState;

    if (UI.getCurrentScreen() === 'lobby-screen') {
      console.log('📊 Appel updateLobby depuis updateGameState');
      this.updateLobby();
    } else if (UI.getCurrentScreen() === 'game-screen') {
      this.updateGamePlayers();
    }
  }

  updateLobbyInfo() {
    document.getElementById('current-room-id').textContent = this.currentRoom;
    
    // Lien de partage
    const roomLink = `${window.location.origin}/?room=${this.currentRoom}`;
    document.getElementById('room-link').value = roomLink;
  }

  updateLobby() {
    if (!this.gameState) return;

    const playersContainer = document.getElementById('players-container');
    const startBtn = document.getElementById('start-game-btn');

    console.log('🔍 DEBUG updateLobby complet:', {
      gameState: this.gameState,
      playersCount: this.gameState.players.length,
      gameStarted: this.gameState.gameStarted,
      startBtnExists: !!startBtn,
      startBtnDisabled: startBtn?.disabled
    });

    if (!startBtn) {
      console.error('❌ ERREUR: Bouton start-game-btn introuvable !');
      return;
    }

    // Afficher les joueurs
    playersContainer.innerHTML = '';
    this.gameState.players.forEach((player, index) => {
      const playerTag = document.createElement('div');
      playerTag.className = 'player-tag';
      if (index === 0) playerTag.classList.add('host');
      
      playerTag.innerHTML = `
        <span>${player.name}</span>
        ${player.id === this.socket.id ? ' (Vous)' : ''}
      `;
      
      playersContainer.appendChild(playerTag);
    });

    // Activer le bouton start pour le host
    const isHost = this.gameState.players.length > 0 && 
                   this.gameState.players[0].id === this.socket.id;
    console.log('🎮 Debug lobby:', {
      playersCount: this.gameState.players.length,
      firstPlayerId: this.gameState.players[0]?.id,
      mySocketId: this.socket.id,
      isHost: isHost,
      gameStarted: this.gameState.gameStarted,
      buttonShouldBeDisabled: !isHost
    });
    
    // Le bouton doit être activé si on est l'hôte, point final !
    const shouldDisable = !isHost;
    startBtn.disabled = shouldDisable;
    
    // Ajouter des styles visuels pour debugging
    if (shouldDisable) {
      startBtn.style.backgroundColor = '#ccc';
      startBtn.style.cursor = 'not-allowed';
      startBtn.title = isHost ? 'Attendez plus de joueurs' : 'Seul l\'hôte peut démarrer';
    } else {
      startBtn.style.backgroundColor = '';
      startBtn.style.cursor = 'pointer';
      startBtn.title = 'Cliquez pour commencer la partie';
    }

    if (this.gameState.gameStarted) {
      this.startGame();
    }
  }

  updateGamePlayers() {
    if (!this.gameState) return;

    const playersList = document.getElementById('game-players-list');
    playersList.innerHTML = '';

    this.gameState.players.forEach(player => {
      const playerItem = document.createElement('div');
      playerItem.className = 'game-player-item';
      
      if (player.id === this.socket.id) {
        playerItem.classList.add('current-player');
      }
      
      if (player.finished) {
        playerItem.classList.add('finished');
      }

      playerItem.innerHTML = `
        <div class="player-name">
          ${player.name}
          ${player.id === this.socket.id ? ' (Vous)' : ''}
          ${player.rank ? `<span class="player-rank rank-${player.rank}">#${player.rank}</span>` : ''}
        </div>
        <div class="player-stats">
          ${player.attempts} tentative${player.attempts > 1 ? 's' : ''}
          ${player.finished ? ` - ${player.score} pts` : ''}
        </div>
      `;

      playersList.appendChild(playerItem);
    });
  }

  updateEndScreen() {
    if (!this.gameState) return;

    // Révéler le nombre secret
    document.getElementById('revealed-secret').textContent = this.gameState.secretNumber;

    // Créer le classement
    const leaderboard = document.getElementById('final-leaderboard');
    leaderboard.innerHTML = '';

    const sortedPlayers = [...this.gameState.players]
      .filter(p => p.finished)
      .sort((a, b) => a.rank - b.rank);

    sortedPlayers.forEach(player => {
      const item = document.createElement('div');
      item.className = 'leaderboard-item';
      
      const rankEmoji = ['', '🥇', '🥈', '🥉'][player.rank] || '🏆';
      
      item.innerHTML = `
        <div class="leaderboard-rank">${rankEmoji}</div>
        <div class="leaderboard-player">
          <strong>${player.name}</strong>
          <br><small>${player.attempts} tentative${player.attempts > 1 ? 's' : ''}</small>
        </div>
        <div class="leaderboard-score">${player.score} pts</div>
      `;

      leaderboard.appendChild(item);
    });

    // Message de victoire
    const winner = this.gameState.players.find(p => p.rank === 1);
    const winnerAnnouncement = document.getElementById('winner-announcement');
    
    if (winner) {
      const isWinner = winner.id === this.socket.id;
      winnerAnnouncement.innerHTML = isWinner ? 
        '🎉 Félicitations ! Vous avez gagné !' : 
        `🎉 ${winner.name} a remporté la partie !`;
    }
  }

  // Utilitaires
  addAttemptToHistory(attempt) {
    const attemptsList = document.getElementById('attempts-list');
    
    const attemptItem = document.createElement('div');
    attemptItem.className = 'attempt-item';
    attemptItem.innerHTML = `
      <div class="attempt-number">#${attempt.number}</div>
      <div class="attempt-guess">${attempt.guess}</div>
      <div class="attempt-result">
        <div class="cows">${attempt.cows} 🐄</div>
        <div class="bulls">${attempt.bulls} 🐂</div>
      </div>
    `;

    // Animation d'entrée
    attemptItem.style.opacity = '0';
    attemptItem.style.transform = 'translateY(-20px)';
    
    attemptsList.insertBefore(attemptItem, attemptsList.firstChild);
    
    // Animer l'apparition
    setTimeout(() => {
      attemptItem.style.transition = 'all 0.3s ease';
      attemptItem.style.opacity = '1';
      attemptItem.style.transform = 'translateY(0)';
    }, 10);

    // Scroll vers le haut
    attemptsList.scrollTop = 0;
  }

  startTimer() {
    this.gameTimer = setInterval(() => {
      const elapsed = Date.now() - this.gameStartTime;
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      
      document.getElementById('game-timer').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
  }

  stopTimer() {
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
      this.gameTimer = null;
    }
  }

  generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  getRankText(rank) {
    const ranks = ['', '1er', '2ème', '3ème', '4ème'];
    return ranks[rank] || `${rank}ème`;
  }

  shakeInput() {
    const input = document.getElementById('guess-input');
    input.classList.add('shake');
    setTimeout(() => input.classList.remove('shake'), 500);
  }

  clearInputs() {
    document.getElementById('player-name').value = '';
    document.getElementById('room-id').value = '';
    document.getElementById('guess-input').value = '';
  }

  clearAttempts() {
    document.getElementById('attempts-list').innerHTML = '';
  }

  clearFeedback() {
    const feedback = document.getElementById('input-feedback');
    feedback.textContent = '';
    feedback.className = 'feedback';
  }

  copyRoomLink() {
    const roomLink = document.getElementById('room-link');
    roomLink.select();
    roomLink.setSelectionRange(0, 99999);
    
    try {
      document.execCommand('copy');
      UI.showToast('Lien copié dans le presse-papiers !', 'success');
    } catch (err) {
      UI.showToast('Impossible de copier le lien', 'error');
    }
  }

  playAgain() {
    // Retourner au lobby de la même room
    UI.showScreen('lobby-screen');
    this.clearAttempts();
    this.clearFeedback();
    this.stopTimer();
  }

  newRoom() {
    this.leaveRoom();
  }

  updateServerStats() {
    const statsElement = document.getElementById('server-stats');
    if (this.isConnected) {
      statsElement.innerHTML = '<i class="fas fa-circle" style="color: #2ecc71;"></i> Connecté au serveur';
    } else {
      statsElement.innerHTML = '<i class="fas fa-circle" style="color: #e74c3c;"></i> Connexion...';
    }
  }
}

// Auto-join si room dans l'URL
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const roomFromUrl = urlParams.get('room');
  
  if (roomFromUrl) {
    document.getElementById('room-id').value = roomFromUrl;
  }
});
