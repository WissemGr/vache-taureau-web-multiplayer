const store = require('./store');

describe('Store', () => {
  // Clear all data before each test
  beforeEach(() => {
    // Clear all rooms
    const rooms = store.getAllRooms();
    rooms.forEach(room => store.deleteRoom(room.id));

    // Clear any test players
    store.removePlayer('test-player-1');
    store.removePlayer('test-player-2');
  });

  describe('Room operations', () => {
    describe('createRoom', () => {
      test('should create a room with provided data', () => {
        const roomData = {
          name: 'Test Room',
          game: { players: [] }
        };

        store.createRoom('room-1', roomData);
        const room = store.getRoom('room-1');

        expect(room).toBeDefined();
        expect(room.name).toBe('Test Room');
        expect(room.game.players).toEqual([]);
        expect(room.createdAt).toBeDefined();
        expect(room.lastActivity).toBeDefined();
      });

      test('should set timestamps on room creation', () => {
        const beforeCreate = Date.now();
        store.createRoom('room-2', { test: true });
        const room = store.getRoom('room-2');
        const afterCreate = Date.now();

        expect(room.createdAt).toBeGreaterThanOrEqual(beforeCreate);
        expect(room.createdAt).toBeLessThanOrEqual(afterCreate);
        expect(room.lastActivity).toBeGreaterThanOrEqual(beforeCreate);
        expect(room.lastActivity).toBeLessThanOrEqual(afterCreate);
      });
    });

    describe('getRoom', () => {
      test('should retrieve existing room', () => {
        store.createRoom('room-3', { value: 'test' });
        const room = store.getRoom('room-3');

        expect(room).toBeDefined();
        expect(room.value).toBe('test');
      });

      test('should return undefined for non-existent room', () => {
        const room = store.getRoom('non-existent');
        expect(room).toBeUndefined();
      });

      test('should update lastActivity when getting room', () => {
        store.createRoom('room-4', { test: true });
        const room1 = store.getRoom('room-4');
        const firstActivity = room1.lastActivity;

        // Wait a tiny bit
        const start = Date.now();
        while (Date.now() - start < 5) { }

        const room2 = store.getRoom('room-4');
        expect(room2.lastActivity).toBeGreaterThanOrEqual(firstActivity);
      });
    });

    describe('updateRoom', () => {
      test('should update room data', () => {
        store.createRoom('room-5', { value: 'original' });
        store.updateRoom('room-5', { value: 'updated', newField: 'new' });

        const room = store.getRoom('room-5');
        expect(room.value).toBe('updated');
        expect(room.newField).toBe('new');
      });

      test('should update lastActivity on update', () => {
        store.createRoom('room-6', { test: true });
        const room1 = store.getRoom('room-6');
        const firstActivity = room1.lastActivity;

        // Wait a tiny bit
        const start = Date.now();
        while (Date.now() - start < 5) { }

        store.updateRoom('room-6', { updated: true });
        const room2 = store.getRoom('room-6');
        expect(room2.lastActivity).toBeGreaterThanOrEqual(firstActivity);
      });

      test('should do nothing if room does not exist', () => {
        store.updateRoom('non-existent', { value: 'test' });
        const room = store.getRoom('non-existent');
        expect(room).toBeUndefined();
      });
    });

    describe('deleteRoom', () => {
      test('should delete existing room', () => {
        store.createRoom('room-7', { test: true });
        expect(store.getRoom('room-7')).toBeDefined();

        store.deleteRoom('room-7');
        expect(store.getRoom('room-7')).toBeUndefined();
      });

      test('should not throw error when deleting non-existent room', () => {
        expect(() => store.deleteRoom('non-existent')).not.toThrow();
      });
    });

    describe('getAllRooms', () => {
      test('should return empty array when no rooms', () => {
        const rooms = store.getAllRooms();
        expect(rooms).toEqual([]);
      });

      test('should return all rooms', () => {
        store.createRoom('room-8', { name: 'Room 8' });
        store.createRoom('room-9', { name: 'Room 9' });

        const rooms = store.getAllRooms();
        expect(rooms).toHaveLength(2);
        expect(rooms.find(r => r.id === 'room-8')).toBeDefined();
        expect(rooms.find(r => r.id === 'room-9')).toBeDefined();
      });

      test('should include room ID in returned data', () => {
        store.createRoom('room-10', { test: true });
        const rooms = store.getAllRooms();

        const room = rooms.find(r => r.id === 'room-10');
        expect(room).toBeDefined();
        expect(room.id).toBe('room-10');
        expect(room.test).toBe(true);
      });
    });
  });

  describe('Player operations', () => {
    describe('addPlayer', () => {
      test('should add player with provided data', () => {
        const playerData = {
          name: 'Alice',
          roomId: 'room-1'
        };

        store.addPlayer('player-1', playerData);
        const player = store.getPlayer('player-1');

        expect(player).toBeDefined();
        expect(player.name).toBe('Alice');
        expect(player.roomId).toBe('room-1');
        expect(player.connectedAt).toBeDefined();
      });

      test('should set connectedAt timestamp', () => {
        const before = Date.now();
        store.addPlayer('player-2', { name: 'Bob' });
        const player = store.getPlayer('player-2');
        const after = Date.now();

        expect(player.connectedAt).toBeGreaterThanOrEqual(before);
        expect(player.connectedAt).toBeLessThanOrEqual(after);
      });
    });

    describe('getPlayer', () => {
      test('should retrieve existing player', () => {
        store.addPlayer('player-3', { name: 'Charlie' });
        const player = store.getPlayer('player-3');

        expect(player).toBeDefined();
        expect(player.name).toBe('Charlie');
      });

      test('should return undefined for non-existent player', () => {
        const player = store.getPlayer('non-existent');
        expect(player).toBeUndefined();
      });
    });

    describe('removePlayer', () => {
      test('should remove existing player', () => {
        store.addPlayer('player-4', { name: 'David' });
        expect(store.getPlayer('player-4')).toBeDefined();

        store.removePlayer('player-4');
        expect(store.getPlayer('player-4')).toBeUndefined();
      });

      test('should not throw error when removing non-existent player', () => {
        expect(() => store.removePlayer('non-existent')).not.toThrow();
      });
    });
  });

  describe('cleanup', () => {
    test('should remove rooms older than maxAge', () => {
      // Create an old room by manipulating lastActivity
      store.createRoom('old-room', { test: true });
      const oldRoom = store.getRoom('old-room');
      oldRoom.lastActivity = Date.now() - 7200000; // 2 hours ago

      // Create a new room
      store.createRoom('new-room', { test: true });

      // Cleanup rooms older than 1 hour
      store.cleanup(3600000);

      expect(store.getRoom('old-room')).toBeUndefined();
      expect(store.getRoom('new-room')).toBeDefined();
    });

    test('should not remove recent rooms', () => {
      store.createRoom('recent-room', { test: true });
      store.cleanup(3600000);

      expect(store.getRoom('recent-room')).toBeDefined();
    });

    test('should use default maxAge of 1 hour', () => {
      store.createRoom('test-room', { test: true });
      const room = store.getRoom('test-room');

      // Set lastActivity to 2 hours ago
      room.lastActivity = Date.now() - 7200000;

      store.cleanup(); // Use default maxAge

      expect(store.getRoom('test-room')).toBeUndefined();
    });

    test('should keep rooms within maxAge', () => {
      store.createRoom('test-room-2', { test: true });
      const room = store.getRoom('test-room-2');

      // Set lastActivity to 30 minutes ago
      room.lastActivity = Date.now() - 1800000;

      store.cleanup(); // Use default maxAge of 1 hour

      expect(store.getRoom('test-room-2')).toBeDefined();
    });
  });

  describe('Integration tests', () => {
    test('should handle complete room lifecycle', () => {
      // Create room
      store.createRoom('lifecycle-room', { status: 'active' });

      // Add players
      store.addPlayer('p1', { name: 'Player 1', roomId: 'lifecycle-room' });
      store.addPlayer('p2', { name: 'Player 2', roomId: 'lifecycle-room' });

      // Get room and verify
      let room = store.getRoom('lifecycle-room');
      expect(room).toBeDefined();

      // Update room
      store.updateRoom('lifecycle-room', { status: 'in-progress' });
      room = store.getRoom('lifecycle-room');
      expect(room.status).toBe('in-progress');

      // Remove players
      store.removePlayer('p1');
      expect(store.getPlayer('p1')).toBeUndefined();

      // Delete room
      store.deleteRoom('lifecycle-room');
      expect(store.getRoom('lifecycle-room')).toBeUndefined();
    });

    test('should handle multiple concurrent rooms', () => {
      for (let i = 1; i <= 5; i++) {
        store.createRoom(`room-${i}`, { number: i });
      }

      const rooms = store.getAllRooms();
      expect(rooms).toHaveLength(5);

      // Delete odd rooms
      store.deleteRoom('room-1');
      store.deleteRoom('room-3');
      store.deleteRoom('room-5');

      const remainingRooms = store.getAllRooms();
      expect(remainingRooms).toHaveLength(2);
      expect(remainingRooms.find(r => r.id === 'room-2')).toBeDefined();
      expect(remainingRooms.find(r => r.id === 'room-4')).toBeDefined();
    });
  });
});
