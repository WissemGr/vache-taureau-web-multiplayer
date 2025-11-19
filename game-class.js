// Exported VacheTaureauGame class for testing
class VacheTaureauGame {
  constructor(roomId) {
    this.roomId = roomId;
    this.secretNumber = this.generateSecretNumber();
    this.players = [];
    this.gameStarted = false;
    this.gameEnded = false;
    this.winner = null;
    this.attempts = new Map(); // playerId -> [attempts]
    this.createdAt = Date.now();
  }

  generateSecretNumber() {
    const digits = [];
    while (digits.length < 4) {
      const digit = Math.floor(Math.random() * 10);
      if (!digits.includes(digit)) {
        digits.push(digit);
      }
    }
    // Éviter que le nombre commence par 0
    if (digits[0] === 0 && digits.length > 1) {
      [digits[0], digits[1]] = [digits[1], digits[0]];
    }
    return digits.join('');
  }

  addPlayer(socket, playerName) {
    // Vérifier si le jeu a déjà commencé
    if (this.gameStarted) {
      return {
        success: false,
        message: "Impossible de rejoindre : la partie a déjà commencé"
      };
    }

    // Vérifier le nombre maximum de joueurs
    const MAX_PLAYERS_PER_ROOM = 4;
    if (this.players.length >= MAX_PLAYERS_PER_ROOM) {
      return {
        success: false,
        message: `Room complète (maximum ${MAX_PLAYERS_PER_ROOM} joueurs)`
      };
    }

    const player = {
      id: socket.id,
      name: playerName,
      attempts: [],
      finished: false,
      rank: null,
      score: 0
    };

    this.players.push(player);
    this.attempts.set(socket.id, []);
    return { success: true, message: "Joueur ajouté avec succès" };
  }

  removePlayer(playerId) {
    this.players = this.players.filter(p => p.id !== playerId);
    this.attempts.delete(playerId);

    // Si plus de joueurs, terminer la partie
    if (this.players.length === 0) {
      return true; // Room should be deleted
    }
    return false;
  }

  validateGuess(guess) {
    if (!/^\d{4}$/.test(guess)) {
      return { valid: false, message: "La tentative doit être un nombre de 4 chiffres" };
    }

    const digits = guess.split('');
    if (new Set(digits).size !== 4) {
      return { valid: false, message: "Tous les chiffres doivent être différents" };
    }

    return { valid: true };
  }

  calculateBullsAndCows(guess) {
    let bulls = 0;
    let cows = 0;

    const secretDigits = this.secretNumber.split('');
    const guessDigits = guess.split('');

    // Calculer les taureaux (bulls)
    for (let i = 0; i < 4; i++) {
      if (secretDigits[i] === guessDigits[i]) {
        bulls++;
        secretDigits[i] = 'X'; // Marquer comme utilisé
        guessDigits[i] = 'Y'; // Marquer comme utilisé
      }
    }

    // Calculer les vaches (cows)
    for (let i = 0; i < 4; i++) {
      if (guessDigits[i] !== 'Y') { // Si pas déjà utilisé pour un bull
        const index = secretDigits.indexOf(guessDigits[i]);
        if (index !== -1) {
          cows++;
          secretDigits[index] = 'X'; // Marquer comme utilisé
        }
      }
    }

    return { bulls, cows };
  }

  makeGuess(playerId, guess) {
    if (!this.gameStarted) {
      return { success: false, message: "La partie n'a pas encore commencé" };
    }

    if (this.gameEnded) {
      return { success: false, message: "La partie est terminée" };
    }

    const player = this.players.find(p => p.id === playerId);
    if (!player) {
      return { success: false, message: "Joueur non trouvé" };
    }

    if (player.finished) {
      return { success: false, message: "Vous avez déjà terminé" };
    }

    const validation = this.validateGuess(guess);
    if (!validation.valid) {
      return { success: false, message: validation.message };
    }

    const { bulls, cows } = this.calculateBullsAndCows(guess);
    const attemptNumber = player.attempts.length + 1;

    const attempt = {
      number: attemptNumber,
      guess,
      cows,
      bulls,
      timestamp: Date.now()
    };

    player.attempts.push(attempt);

    // Vérifier si le joueur a gagné
    if (bulls === 4) {
      player.finished = true;
      player.rank = this.getNextRank();
      player.score = this.calculateScore(attemptNumber);

      // Si c'est le premier à finir
      if (player.rank === 1) {
        this.winner = player;
      }

      // Vérifier si tous les joueurs ont fini
      if (this.players.every(p => p.finished)) {
        this.gameEnded = true;
      }
    }

    return {
      success: true,
      attempt,
      isWinner: bulls === 4,
      rank: player.rank,
      gameEnded: this.gameEnded,
      secretNumber: bulls === 4 ? this.secretNumber : null
    };
  }

  getNextRank() {
    const finishedPlayers = this.players.filter(p => p.finished);
    return finishedPlayers.length;
  }

  calculateScore(attempts) {
    // Score inversement proportionnel au nombre de tentatives
    return Math.max(1000 - (attempts - 1) * 100, 100);
  }

  getGameState() {
    const MAX_PLAYERS_PER_ROOM = 4;
    return {
      roomId: this.roomId,
      secretNumber: this.gameEnded ? this.secretNumber : null,
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        attempts: p.attempts.length,
        finished: p.finished,
        rank: p.rank,
        score: p.score,
        lastAttempt: p.attempts[p.attempts.length - 1] || null
      })),
      gameStarted: this.gameStarted,
      gameEnded: this.gameEnded,
      winner: this.winner,
      maxPlayers: MAX_PLAYERS_PER_ROOM,
      canJoin: !this.gameStarted && this.players.length < MAX_PLAYERS_PER_ROOM
    };
  }

  startGame() {
    if (this.players.length < 1) {
      return false;
    }
    this.gameStarted = true;
    return true;
  }
}

module.exports = VacheTaureauGame;
