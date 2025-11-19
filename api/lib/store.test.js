const store = require('./store');

describe('Store', () => {
  // Clear all data before each test
  beforeEach(async () => {
    // Clear all rooms
    const rooms = await store.getAllRooms();
    for (const room of rooms) {
      await store.deleteRoom(room.id);
    }

    // Clear any test players
    await store.removePlayer('test-player-1');
    await store.removePlayer('test-player-2');
  });

  describe('Room operations', () => {
    describe('createRoom', () => {
      test('should create a room with provided data', async () => {
        const roomData = {
          name: 'Test Room',
          game: { players: [] }
        };

        await store.createRoom('room-1', roomData);
        const room = await store.getRoom('room-1');

        expect(room).toBeDefined();
        expect(room.name).toBe('Test Room');
        expect(room.game.players).toEqual([]);
        expect(room.createdAt).toBeDefined();
        expect(room.lastActivity).toBeDefined();
      });

      test('should set timestamps on room creation', async () => {
        const beforeCreate = Date.now();
        await store.createRoom('room-2', { test: true });
        const room = await store.getRoom('room-2');
        const afterCreate = Date.now();

        expect(room.createdAt).toBeGreaterThanOrEqual(beforeCreate);
        expect(room.createdAt).toBeLessThanOrEqual(afterCreate);
        expect(room.lastActivity).toBeGreaterThanOrEqual(beforeCreate);
        expect(room.lastActivity).toBeLessThanOrEqual(afterCreate);
      });
    });

    describe('getRoom', () => {
      test('should retrieve existing room', async () => {
        await store.createRoom('room-3', { value: 'test' });
        const room = await store.getRoom('room-3');

        expect(room).toBeDefined();
        expect(room.value).toBe('test');
      });

      test('should return null for non-existent room', async () => {
        const room = await store.getRoom('non-existent');
        expect(room).toBeNull();
      });

      test('should update lastActivity when getting room', async () => {
        await store.createRoom('room-4', { test: true });
        const room1 = await store.getRoom('room-4');
        const firstActivity = room1.lastActivity;

        // Wait a tiny bit
        const start = Date.now();
        while (Date.now() - start < 5) { }

        const room2 = await store.getRoom('room-4');
        expect(room2.lastActivity).toBeGreaterThanOrEqual(firstActivity);
      });
    });

    describe('updateRoom', () => {
      test('should update room data', async () => {
        await store.createRoom('room-5', { value: 'original' });
        await store.updateRoom('room-5', { value: 'updated', newField: 'new' });

        const room = await store.getRoom('room-5');
        expect(room.value).toBe('updated');
        expect(room.newField).toBe('new');
      });

      test('should update lastActivity on update', async () => {
        await store.createRoom('room-6', { test: true });
        const room1 = await store.getRoom('room-6');
        const firstActivity = room1.lastActivity;

        // Wait a tiny bit
        const start = Date.now();
        while (Date.now() - start < 5) { }

        await store.updateRoom('room-6', { updated: true });
        const room2 = await store.getRoom('room-6');
        expect(room2.lastActivity).toBeGreaterThanOrEqual(firstActivity);
      });

      test('should do nothing if room does not exist', async () => {
        await store.updateRoom('non-existent', { value: 'test' });
        const room = await store.getRoom('non-existent');
        expect(room).toBeNull();
      });
    });

    describe('deleteRoom', () => {
      test('should delete existing room', async () => {
        await store.createRoom('room-7', { test: true });
        expect(await store.getRoom('room-7')).toBeDefined();

        await store.deleteRoom('room-7');
        expect(await store.getRoom('room-7')).toBeNull();
      });

      test('should not throw error when deleting non-existent room', async () => {
        await expect(store.deleteRoom('non-existent')).resolves.not.toThrow();
      });
    });

    describe('getAllRooms', () => {
      test('should return empty array when no rooms', async () => {
        const rooms = await store.getAllRooms();
        expect(rooms).toEqual([]);
      });

      test('should return all rooms', async () => {
        await store.createRoom('room-8', { name: 'Room 8' });
        await store.createRoom('room-9', { name: 'Room 9' });

        const rooms = await store.getAllRooms();
        expect(rooms).toHaveLength(2);
        expect(rooms.find(r => r.id === 'room-8')).toBeDefined();
        expect(rooms.find(r => r.id === 'room-9')).toBeDefined();
      });

      test('should include room ID in returned data', async () => {
        await store.createRoom('room-10', { test: true });
        const rooms = await store.getAllRooms();

        const room = rooms.find(r => r.id === 'room-10');
        expect(room).toBeDefined();
        expect(room.id).toBe('room-10');
        expect(room.test).toBe(true);
      });
    });
  });

  describe('Player operations', () => {
    describe('addPlayer', () => {
      test('should add player with provided data', async () => {
        const playerData = {
          name: 'Alice',
          roomId: 'room-1'
        };

        await store.addPlayer('player-1', playerData);
        const player = await store.getPlayer('player-1');

        expect(player).toBeDefined();
        expect(player.name).toBe('Alice');
        expect(player.roomId).toBe('room-1');
        expect(player.connectedAt).toBeDefined();
      });

      test('should set connectedAt timestamp', async () => {
        const before = Date.now();
        await store.addPlayer('player-2', { name: 'Bob' });
        const player = await store.getPlayer('player-2');
        const after = Date.now();

        expect(player.connectedAt).toBeGreaterThanOrEqual(before);
        expect(player.connectedAt).toBeLessThanOrEqual(after);
      });
    });

    describe('getPlayer', () => {
      test('should retrieve existing player', async () => {
        await store.addPlayer('player-3', { name: 'Charlie' });
        const player = await store.getPlayer('player-3');

        expect(player).toBeDefined();
        expect(player.name).toBe('Charlie');
      });

      test('should return null for non-existent player', async () => {
        const player = await store.getPlayer('non-existent');
        expect(player).toBeNull();
      });
    });

    describe('removePlayer', () => {
      test('should remove existing player', async () => {
        await store.addPlayer('player-4', { name: 'David' });
        expect(await store.getPlayer('player-4')).toBeDefined();

        await store.removePlayer('player-4');
        expect(await store.getPlayer('player-4')).toBeNull();
      });

      test('should not throw error when removing non-existent player', async () => {
        await expect(store.removePlayer('non-existent')).resolves.not.toThrow();
      });
    });
  });

  describe('cleanup', () => {
    test('should remove rooms older than maxAge', async () => {
      // Create an old room by manipulating lastActivity
      await store.createRoom('old-room', { test: true });
      const oldRoom = await store.getRoom('old-room');
      oldRoom.lastActivity = Date.now() - 7200000; // 2 hours ago

      // Create a new room
      await store.createRoom('new-room', { test: true });

      // Cleanup rooms older than 1 hour
      await store.cleanup(3600000);

      expect(await store.getRoom('old-room')).toBeNull();
      expect(await store.getRoom('new-room')).toBeDefined();
    });

    test('should not remove recent rooms', async () => {
      await store.createRoom('recent-room', { test: true });
      await store.cleanup(3600000);

      expect(await store.getRoom('recent-room')).toBeDefined();
    });

    test('should use default maxAge of 1 hour', async () => {
      await store.createRoom('test-room', { test: true });
      const room = await store.getRoom('test-room');

      // Set lastActivity to 2 hours ago
      room.lastActivity = Date.now() - 7200000;

      await store.cleanup(); // Use default maxAge

      expect(await store.getRoom('test-room')).toBeNull();
    });

    test('should keep rooms within maxAge', async () => {
      await store.createRoom('test-room-2', { test: true });
      const room = await store.getRoom('test-room-2');

      // Set lastActivity to 30 minutes ago
      room.lastActivity = Date.now() - 1800000;

      await store.cleanup(); // Use default maxAge of 1 hour

      expect(await store.getRoom('test-room-2')).toBeDefined();
    });
  });

  describe('Integration tests', () => {
    test('should handle complete room lifecycle', async () => {
      // Create room
      await store.createRoom('lifecycle-room', { status: 'active' });

      // Add players
      await store.addPlayer('p1', { name: 'Player 1', roomId: 'lifecycle-room' });
      await store.addPlayer('p2', { name: 'Player 2', roomId: 'lifecycle-room' });

      // Get room and verify
      let room = await store.getRoom('lifecycle-room');
      expect(room).toBeDefined();

      // Update room
      await store.updateRoom('lifecycle-room', { status: 'in-progress' });
      room = await store.getRoom('lifecycle-room');
      expect(room.status).toBe('in-progress');

      // Remove players
      await store.removePlayer('p1');
      expect(await store.getPlayer('p1')).toBeNull();

      // Delete room
      await store.deleteRoom('lifecycle-room');
      expect(await store.getRoom('lifecycle-room')).toBeNull();
    });

    test('should handle multiple concurrent rooms', async () => {
      for (let i = 1; i <= 5; i++) {
        await store.createRoom(`room-${i}`, { number: i });
      }

      const rooms = await store.getAllRooms();
      expect(rooms).toHaveLength(5);

      // Delete odd rooms
      await store.deleteRoom('room-1');
      await store.deleteRoom('room-3');
      await store.deleteRoom('room-5');

      const remainingRooms = await store.getAllRooms();
      expect(remainingRooms).toHaveLength(2);
      expect(remainingRooms.find(r => r.id === 'room-2')).toBeDefined();
      expect(remainingRooms.find(r => r.id === 'room-4')).toBeDefined();
    });
  });
});
