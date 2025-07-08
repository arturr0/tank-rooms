const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Game constants
const width = 1000;
const height = 500;
const groundHeight = 40;

const room = "battle";
let players = 0;

app.use(express.static(path.join(__dirname, 'public')));

// Track active projectiles
const activeProjectiles = new Map();

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    players++;
    const playerNumber = players;
    socket.join(room);
    socket.emit('youArePlayer', playerNumber);

    if (players === 2) {
        const wind = (Math.random() * 0.05) - 0.025;
        io.to(room).emit('roomMessage', { room: room, wind: wind });
    }

    socket.on('playerUpdate', (data) => {
        // Broadcast target angle, not current angle
        socket.to(room).emit('playerMoved', {
            player: data.player,
            angle: data.angle,
            timestamp: Date.now()
        });
    });

    socket.on('projectileFired', (data) => {
        const projectileId = `${socket.id}-${Date.now()}`;
        const projectileData = {
            ...data,
            id: projectileId,
            timestamp: Date.now()
        };
        activeProjectiles.set(projectileId, projectileData);
        socket.to(room).emit('enemyProjectile', projectileData);
    });

    socket.on('playerHit', (data) => {
        // Broadcast hit to both players with projectile info
        io.to(room).emit('enemyHit', {
            player: data.player,
            projectileId: data.projectileId,
            hitPosition: data.hitPosition,
            receivedEffect: data.effect
        });

        // Remove the projectile if it hit a tank
        // if (data.projectileId) {
        //   activeProjectiles.delete(data.projectileId);
        // }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        players = 0;
        activeProjectiles.clear();
        io.to(room).emit('resetGame');
    });
});

// Cleanup old projectiles
setInterval(() => {
    const now = Date.now();
    for (const [id, proj] of activeProjectiles) {
        if (now - proj.timestamp > 10000) { // 10 second timeout
            activeProjectiles.delete(id);
        }
    }
}, 1000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('Server running on http://localhost:' + PORT);
});