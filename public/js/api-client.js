// REST API client to replace Socket.IO
class APIClient {
  constructor(baseURL = '') {
    this.baseURL = baseURL;
    this.pollingInterval = null;
    this.pollingRate = 1000; // Poll every second
    this.eventHandlers = new Map();
    this.currentRoomId = null;
    this.currentPlayerId = null;
    this.isPolling = false;
  }

  // Event emitter pattern to mimic Socket.IO
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  emit(event, data) {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach(handler => handler(data));
  }

  // HTTP request wrapper
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Request failed');
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // API Methods
  async createRoom(playerName) {
    const data = await this.request('/api/rooms/create', {
      method: 'POST',
      body: JSON.stringify({ playerName })
    });

    if (data.success) {
      this.currentRoomId = data.roomId;
      this.currentPlayerId = data.playerId;
      this.startPolling();
      this.emit('roomCreated', data);
    }

    return data;
  }

  async joinRoom(roomId, playerName) {
    const data = await this.request('/api/rooms/join', {
      method: 'POST',
      body: JSON.stringify({ roomId, playerName })
    });

    if (data.success) {
      this.currentRoomId = roomId;
      this.currentPlayerId = data.playerId;
      this.startPolling();
      this.emit('roomJoined', data);
    }

    return data;
  }

  async listRooms() {
    return await this.request('/api/rooms/list');
  }

  async startGame() {
    const data = await this.request('/api/game/start', {
      method: 'POST',
      body: JSON.stringify({
        roomId: this.currentRoomId,
        playerId: this.currentPlayerId
      })
    });

    if (data.success) {
      this.emit('gameStarted', data.gameState);
    }

    return data;
  }

  async makeGuess(guess) {
    const data = await this.request('/api/game/guess', {
      method: 'POST',
      body: JSON.stringify({
        roomId: this.currentRoomId,
        playerId: this.currentPlayerId,
        guess
      })
    });

    if (data.success) {
      this.emit('guessResult', data);
    }

    return data;
  }

  async getGameState() {
    if (!this.currentRoomId) return null;

    try {
      const data = await this.request(`/api/game/state?roomId=${this.currentRoomId}`);
      return data.gameState;
    } catch (error) {
      console.error('Error getting game state:', error);
      return null;
    }
  }

  // Polling mechanism
  startPolling() {
    if (this.isPolling) return;

    this.isPolling = true;
    this.pollingInterval = setInterval(async () => {
      const gameState = await this.getGameState();
      if (gameState) {
        this.emit('gameStateUpdate', gameState);
      }
    }, this.pollingRate);

    // Emit connect event
    this.emit('connect');
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      this.isPolling = false;
      this.emit('disconnect');
    }
  }

  disconnect() {
    this.stopPolling();
    this.currentRoomId = null;
    this.currentPlayerId = null;
  }

  // Getter for connection status
  get connected() {
    return this.isPolling;
  }
}

// Export for use in game.js
window.APIClient = APIClient;
