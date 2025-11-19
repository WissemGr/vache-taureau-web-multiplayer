const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');

// Charger les variables d'environnement
require('dotenv').config();

// Configuration
const MAX_PLAYERS_PER_ROOM = parseInt(process.env.MAX_PLAYERS_PER_ROOM) || 4;
const PORT = process.env.PORT || 3000;

console.log(`🎮 Configuration: Maximum ${MAX_PLAYERS_PER_ROOM} joueurs par room`);

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'vache-taureau-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
app.use(express.static(path.join(__dirname, 'public')));

// Variables globales pour les parties
const gameRooms = new Map();
const players = new Map();

// Classe pour gérer le jeu Vache et Taureau
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
      canJoin: !this.gameStarted && this.players.length < MAX_PLAYERS_PER_ROOM // Nouvelle propriété
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

// Routes API
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', rooms: gameRooms.size, players: players.size });
});

app.get('/api/rooms', (req, res) => {
  const roomList = Array.from(gameRooms.values()).map(room => ({
    id: room.roomId,
    players: room.players.length,
    maxPlayers: MAX_PLAYERS_PER_ROOM,
    gameStarted: room.gameStarted,
    gameEnded: room.gameEnded
  }));
  res.json(roomList);
});

// WebSocket Events
io.on('connection', (socket) => {
  console.log(`👤 Nouveau joueur connecté: ${socket.id}`);

  // Rejoindre une room
  socket.on('join-room', ({ roomId, playerName }) => {
    if (!roomId || !playerName) {
      socket.emit('error', 'Room ID et nom de joueur requis');
      return;
    }

    // Créer la room si elle n'existe pas
    if (!gameRooms.has(roomId)) {
      gameRooms.set(roomId, new VacheTaureauGame(roomId));
    }

    const game = gameRooms.get(roomId);
    
    // Ajouter le joueur
    const result = game.addPlayer(socket, playerName);
    if (!result.success) {
      socket.emit('error', result.message);
      return;
    }

    // Enregistrer le joueur
    players.set(socket.id, {
      roomId,
      playerName,
      joinedAt: Date.now()
    });

    // Rejoindre la room Socket.IO
    socket.join(roomId);

    console.log(`🎮 ${playerName} a rejoint la room ${roomId}`);

    // Notifier tous les joueurs
    io.to(roomId).emit('player-joined', {
      playerName,
      gameState: game.getGameState()
    });

    // Envoyer l'état du jeu au nouveau joueur
    socket.emit('game-state', game.getGameState());
  });

  // Commencer la partie
  socket.on('start-game', () => {
    console.log(`🎮 Demande de démarrage reçue de ${socket.id}`);
    const player = players.get(socket.id);
    if (!player) {
      console.log('❌ Joueur non trouvé pour', socket.id);
      return;
    }

    const game = gameRooms.get(player.roomId);
    if (!game) {
      console.log('❌ Room non trouvée:', player.roomId);
      return;
    }

    console.log(`🎮 SERVEUR: Tentative de démarrage dans la room ${player.roomId}`);
    console.log(`🎮 SERVEUR: Joueurs dans la room:`, game.players.map(p => ({id: p.id, name: p.name})));
    console.log(`🎮 SERVEUR: Demandeur:`, {id: socket.id, name: player.name});
    console.log(`🎮 SERVEUR: Game state:`, {gameStarted: game.gameStarted, playersCount: game.players.length});
    
    if (game.startGame()) {
      io.to(player.roomId).emit('game-started', game.getGameState());
      console.log(`🚀 SERVEUR: Partie commencée avec succès dans la room ${player.roomId}`);
    } else {
      console.log(`❌ Impossible de démarrer la partie dans la room ${player.roomId}`);
    }
  });

  // Faire une tentative
  socket.on('make-guess', ({ guess }) => {
    const player = players.get(socket.id);
    if (!player) {
      socket.emit('error', 'Joueur non trouvé');
      return;
    }

    const game = gameRooms.get(player.roomId);
    if (!game) {
      socket.emit('error', 'Room non trouvée');
      return;
    }

    if (!game.gameStarted) {
      socket.emit('error', 'La partie n\'a pas encore commencé');
      return;
    }

    const result = game.makeGuess(socket.id, guess);
    
    if (result.success) {
      // Notifier le joueur de son résultat
      socket.emit('guess-result', result);
      
      // Notifier tous les joueurs de l'état mis à jour
      io.to(player.roomId).emit('game-state', game.getGameState());
      
      // Si quelqu'un a gagné
      if (result.isWinner) {
        io.to(player.roomId).emit('player-won', {
          winner: player.playerName,
          rank: result.rank,
          secretNumber: result.secretNumber,
          gameState: game.getGameState()
        });
      }
      
      // Si la partie est terminée
      if (result.gameEnded) {
        io.to(player.roomId).emit('game-ended', game.getGameState());
      }
    } else {
      socket.emit('error', result.message);
    }
  });

  // Déconnexion
  socket.on('disconnect', () => {
    const player = players.get(socket.id);
    if (player) {
      const game = gameRooms.get(player.roomId);
      if (game) {
        const shouldDeleteRoom = game.removePlayer(socket.id);
        
        // Notifier les autres joueurs
        io.to(player.roomId).emit('player-left', {
          playerName: player.playerName,
          gameState: game.getGameState()
        });

        // Supprimer la room si vide
        if (shouldDeleteRoom) {
          gameRooms.delete(player.roomId);
          console.log(`🗑️  Room ${player.roomId} supprimée`);
        }
      }
      
      players.delete(socket.id);
      console.log(`👋 ${player.playerName} a quitté la room ${player.roomId}`);
    }
  });
});

// Route pour servir le client
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

server.listen(PORT, () => {
  console.log(`🚀 Serveur Vache et Taureau démarré sur le port ${PORT}`);
  console.log(`🌐 Ouvrez http://localhost:${PORT} pour jouer`);
});

// Nettoyage périodique des rooms vides (toutes les 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [roomId, game] of gameRooms.entries()) {
    // Supprimer les rooms vides depuis plus de 5 minutes
    if (game.players.length === 0 && (now - game.createdAt) > 5 * 60 * 1000) {
      gameRooms.delete(roomId);
      console.log(`🧹 Room vide ${roomId} nettoyée`);
    }
  }
}, 5 * 60 * 1000);
