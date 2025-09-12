# 🐄🐂 Vache et Taureau Multijoueur

Un jeu compétitif en temps réel basé sur le célèbre jeu "Bulls and Cows" (Vache et Taureau). Les joueurs s'affrontent pour deviner un nombre secret de 4 chiffres en un minimum de tentatives.

## 🎮 Fonctionnalités

### 🎯 Gameplay
- **Jeu multijoueur** configurable (par défaut 4 joueurs par partie)
- **Temps réel** avec WebSocket pour une synchronisation instantanée
- **Système de classement** avec scores et rangs
- **Interface responsive** adaptée mobile et desktop

### 🎲 Règles du jeu
- **🐂 Taureau :** Chiffre correct à la bonne position
- **🐄 Vache :** Chiffre correct mais à la mauvaise position
- **🎯 Objectif :** Trouvez le nombre secret en moins de tentatives que vos adversaires

### 🌟 Fonctionnalités avancées
- **Rooms personnalisées** avec codes de partage
- **Spectateurs** peuvent rejoindre et regarder
- **Historique des tentatives** en temps réel
- **Système de notifications** toast
- **Gestion des déconnexions** et reconnexions automatiques

## 🚀 Installation et démarrage

### Prérequis
- Node.js >= 16.0.0
- npm >= 8.0.0

### Installation
```bash
# Cloner le projet
cd web-game

# Installer les dépendances
npm install

# Configurer l'environnement (optionnel)
cp .env.example .env
# Puis éditer .env pour ajuster MAX_PLAYERS_PER_ROOM

# Démarrer en mode développement
npm run dev

# Ou démarrer le serveur de production
npm start
```

## ⚙️ Configuration

### Variables d'environnement

Créez un fichier `.env` pour personnaliser votre serveur :

```bash
# Port du serveur
PORT=3000

# Nombre maximum de joueurs par room
MAX_PLAYERS_PER_ROOM=6
```

**Recommandations pour MAX_PLAYERS_PER_ROOM :**
- **4** (défaut) : Bon équilibre performance/fun
- **6-8** : Pour des groupes plus grands 
- **10+** : Possible mais interface plus complexe
- **Pas de limite théorique** : Le jeu peut supporter autant de joueurs que nécessaire

### Accès
- **Jeu :** http://localhost:3000
- **API Health :** http://localhost:3000/api/health
- **Liste des rooms :** http://localhost:3000/api/rooms

## 🏗️ Architecture

### Backend (Node.js + Socket.IO)
```
server.js
├── Express Server (API REST)
├── Socket.IO (WebSocket pour temps réel)
├── VacheTaureauGame (Logique du jeu)
└── Gestion des rooms et joueurs
```

### Frontend (Vanilla JS + CSS3)
```
public/
├── index.html (Interface principale)
├── css/style.css (Styles modernes et responsive)
└── js/
    ├── main.js (Point d'entrée et initialisation)
    ├── game.js (Logique côté client)
    └── ui.js (Gestion de l'interface utilisateur)
```

## 🎨 Interface utilisateur

### 📱 Écrans principaux
1. **Accueil** - Connexion et création de room
2. **Lobby** - Attente des joueurs et démarrage
3. **Jeu** - Interface de jeu principale
4. **Fin** - Résultats et classement final

### 🎨 Design
- **Thème sombre** moderne avec gradients
- **Animations CSS** fluides et réactives
- **Icons Font Awesome** pour les éléments visuels
- **Responsive design** mobile-first

## 🔧 Configuration

### Variables d'environnement
```bash
PORT=3000                    # Port du serveur
NODE_ENV=production         # Environnement (development/production)
```

### Personnalisation
- **Nombre max de joueurs :** Modifiable dans `VacheTaureauGame.addPlayer()`
- **Temps de nettoyage :** Configurable dans le setInterval de nettoyage
- **Limite de tentatives :** Ajustable selon les besoins

## 🌐 API REST

### Endpoints disponibles
```
GET /api/health          # État du serveur
GET /api/rooms           # Liste des rooms actives
GET /                    # Interface de jeu
```

### Réponses API
```json
// GET /api/health
{
  "status": "OK",
  "rooms": 5,
  "players": 12
}

// GET /api/rooms
[
  {
    "id": "ABC123",
    "players": 2,
    "maxPlayers": 4,
    "gameStarted": false,
    "gameEnded": false
  }
]
```

## 🔌 WebSocket Events

### Client vers Serveur
```javascript
// Rejoindre une room
socket.emit('join-room', { roomId, playerName });

// Démarrer la partie
socket.emit('start-game');

// Faire une tentative
socket.emit('make-guess', { guess: '1234' });
```

### Serveur vers Client
```javascript
// État du jeu mis à jour
socket.on('game-state', (gameState) => {});

// Résultat d'une tentative
socket.on('guess-result', (result) => {});

// Joueur a gagné
socket.on('player-won', (data) => {});

// Partie terminée
socket.on('game-ended', (gameState) => {});
```

## 🎯 Logique du jeu

### Algorithme de calcul
```javascript
// Calcul des vaches et taureaux
calculateBullsAndCows(secret, guess) {
  // 1. Identifier les taureaux (position exacte)
  // 2. Identifier les vaches (chiffre correct, position incorrecte)
  // 3. Éviter les doublons dans le comptage
}
```

### Système de score
```javascript
// Score basé sur le nombre de tentatives
score = Math.max(1000 - (tentatives - 1) * 100, 100);
```

## 🚀 Déploiement

### Déploiement simple
```bash
# Build et démarrage
npm run build
npm start
```

### Déploiement avec PM2
```bash
# Installation PM2
npm install -g pm2

# Démarrage avec PM2
pm2 start server.js --name "vache-taureau"
pm2 save
pm2 startup
```

### Variables d'environnement de production
```bash
export PORT=3000
export NODE_ENV=production
```

## 🧪 Tests et développement

### Mode debug
Accédez au jeu avec `?debug=true` pour activer les outils de debug :
```
http://localhost:3000/?debug=true
```

### Console de debug
```javascript
// Accès à l'application depuis la console
window.gameApp.getGameState()    // État actuel du jeu
window.gameApp.getCurrentRoom()  // Room actuelle
window.gameApp.isInGame()        // Dans une partie ?
```

## 📱 Fonctionnalités mobiles

- **Touch-friendly** - Boutons adaptés au tactile
- **Responsive design** - Interface adaptative
- **PWA ready** - Possibilité d'ajout à l'écran d'accueil
- **Offline detection** - Gestion de la perte de connexion

## 🔒 Sécurité

### Mesures implémentées
- **Validation des inputs** côté client et serveur
- **Rate limiting** pour éviter le spam
- **Sanitisation** des données utilisateur
- **CORS configuré** pour les domaines autorisés

### Recommandations production
- Utiliser HTTPS en production
- Configurer un proxy inverse (nginx)
- Limiter les connexions par IP
- Monitorer les performances

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -am 'Ajout nouvelle fonctionnalité'`)
4. Push la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Créer une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🆘 Support

- **Issues :** Utilisez les GitHub Issues pour les bugs
- **Questions :** Discussions GitHub pour les questions générales
- **Documentation :** README et commentaires dans le code

---

🎮 **Amusez-vous bien !** Que le meilleur gagne ! 🏆
