const app = require('./app.js'); // Import the Express app
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');
const express = require('express');
const port = process.env.PORT || 3000;
const server = http.createServer(app);
const lockFile = require('lockfile');
const io = socketIo(server);

app.use('/public', express.static(path.join(__dirname, "public")));

// Game constants
const width = 1000;
const height = 500;
const groundHeight = 40;

// Track rooms data
const rooms = new Map(); // roomName -> { players: number, activeProjectiles: Map }

// Define the path to your JSON file
const jsonFilePath = path.join(__dirname, 'data', 'players.json');
const lockFilePath = path.join(__dirname, 'data', 'players.lock');
const users = [];

io.on('connection', (socket) => {
    console.log('We have a new client: ' + socket.id);

    // Track the server the client joined
    socket.on('joinServer', (data) => {
        console.log("j0");

        const ROOM = `room_${data.index}`;
        socket.serverIndex = data.index;
        console.log("j");

        // Initialize room if it doesn't exist
        if (!rooms.has(ROOM)) {
            rooms.set(ROOM, {
                players: 0,
                activeProjectiles: new Map()
            });
        }

        const roomData = rooms.get(ROOM);

        lockFile.lock(lockFilePath, { wait: 5000 }, (lockErr) => {
            if (lockErr) {
                console.error('Error acquiring lock:', lockErr);
                socket.emit('error', 'Server error: Unable to acquire lock');
                return;
            }

            fs.readFile(jsonFilePath, 'utf8', (err, fileData) => {
                if (err) {
                    console.error('Error reading JSON file:', err);
                    socket.emit('error', 'Server error: Unable to read server data');
                    lockFile.unlock(lockFilePath, (unlockErr) => {
                        if (unlockErr) {
                            console.error('Error releasing lock:', unlockErr);
                        }
                    });
                    return;
                }

                try {
                    let jsonData = JSON.parse(fileData);
                    const server = jsonData[data.index];

                    if (!server) {
                        socket.emit('error', 'Invalid server index');
                        lockFile.unlock(lockFilePath, (unlockErr) => {
                            if (unlockErr) {
                                console.error('Error releasing lock:', unlockErr);
                            }
                        });
                        return;
                    }

                    if (data.player === 1) {
                        server.block = 0; // Unblock for user2
                        server.user1 = data.inputText;
                    } else if (data.player === 2) {
                        server.user2 = data.inputText;
                    } else {
                        socket.disconnect(true);
                        lockFile.unlock(lockFilePath, (unlockErr) => {
                            if (unlockErr) {
                                console.error('Error releasing lock:', unlockErr);
                            }
                        });
                        return;
                    }

                    fs.writeFile(jsonFilePath, JSON.stringify(jsonData, null, 2), (writeErr) => {
                        if (writeErr) {
                            console.error('Error writing to JSON file:', writeErr);
                        } else {
                            users.push([data.index, data.inputText, socket.id, data.player]);
                            socket.join(ROOM);

                            // Track player in room
                            roomData.players++;
                            socket.emit('youArePlayer', data.player);

                            // If both players joined, start the game
                            if (roomData.players === 2) {
                                const wind = (Math.random() * 0.05) - 0.025;
                                io.to(ROOM).emit('roomMessage', { room: ROOM, wind: wind });
                            }
                        }

                        lockFile.unlock(lockFilePath, (unlockErr) => {
                            if (unlockErr) {
                                console.error('Error releasing lock:', unlockErr);
                            }
                        });
                    });
                } catch (err) {
                    console.error('Error parsing JSON data:', err);
                    socket.emit('error', 'Server error: Unable to parse server data');
                    lockFile.unlock(lockFilePath, (unlockErr) => {
                        if (unlockErr) {
                            console.error('Error releasing lock:', unlockErr);
                        }
                    });
                }
            });
        });
    });

    // Handle player updates
    socket.on('playerUpdate', (data) => {
        if (socket.serverIndex !== undefined) {
            const ROOM = `room_${socket.serverIndex}`;
            // Broadcast target angle, not current angle
            socket.to(ROOM).emit('playerMoved', {
                player: data.player,
                angle: data.angle,
                timestamp: Date.now()
            });
        }
    });

    // Handle projectile firing
    socket.on('projectileFired', (data) => {
        if (socket.serverIndex !== undefined) {
            const ROOM = `room_${socket.serverIndex}`;
            const roomData = rooms.get(ROOM);

            if (roomData) {
                const projectileId = `${socket.id}-${Date.now()}`;
                const projectileData = {
                    ...data,
                    id: projectileId,
                    timestamp: Date.now()
                };
                roomData.activeProjectiles.set(projectileId, projectileData);
                socket.to(ROOM).emit('enemyProjectile', projectileData);
            }
        }
    });

    // Handle player hit
    socket.on('playerHit', (data) => {
        if (socket.serverIndex !== undefined) {
            const ROOM = `room_${socket.serverIndex}`;
            const roomData = rooms.get(ROOM);

            if (roomData) {
                // Broadcast hit to both players with projectile info
                io.to(ROOM).emit('enemyHit', {
                    player: data.player,
                    projectileId: data.projectileId,
                    hitPosition: data.hitPosition,
                    receivedEffect: data.effect
                });

                // Remove the projectile if it hit a tank
                if (data.projectileId) {
                    roomData.activeProjectiles.delete(data.projectileId);
                }
            }
        }
    });

    // Handle client disconnection
    socket.on('disconnect', () => {
        if (socket.serverIndex !== undefined) {
            const ROOM = `room_${socket.serverIndex}`;
            const roomData = rooms.get(ROOM);

            // Notify remaining player about disconnection
            socket.to(ROOM).emit('opponentLeft', {
                message: 'Your opponent has disconnected.',
                type: 'disconnect',
                wind: roomData?.currentWind || 0  // Send current wind if available
            });

            if (roomData) {
                // Decrement player count
                roomData.players = Math.max(0, roomData.players - 1);

                // Clear all projectiles
                roomData.activeProjectiles.clear();

                // Reset game state if not enough players
                if (roomData.players < 2) {
                    roomData.gameStarted = false;
                    io.to(ROOM).emit('resetGame');
                }

                // Remove room if empty
                if (roomData.players === 0) {
                    rooms.delete(ROOM);
                }
            }

            // Update server data in JSON file
            lockFile.lock(lockFilePath, { wait: 5000 }, (lockErr) => {
                if (lockErr) {
                    console.error('Error acquiring lock:', lockErr);
                    return;
                }

                fs.readFile(jsonFilePath, 'utf8', (err, fileData) => {
                    if (err) {
                        console.error('Error reading JSON file:', err);
                        lockFile.unlock(lockFilePath, (unlockErr) => {
                            if (unlockErr) console.error('Error releasing lock:', unlockErr);
                        });
                        return;
                    }

                    try {
                        let jsonData = JSON.parse(fileData);
                        const serverIndex = socket.serverIndex;

                        if (jsonData[serverIndex]) {
                            // Update player count
                            jsonData[serverIndex].players = Math.max(0, jsonData[serverIndex].players - 1);

                            // Clear player data
                            for (let i = 0; i < users.length; i++) {
                                if (socket.id === users[i][2]) {
                                    if (jsonData[users[i][0]].user1 === users[i][1]) {
                                        jsonData[users[i][0]].user1 = '';
                                    } else if (jsonData[users[i][0]].user2 === users[i][1]) {
                                        jsonData[users[i][0]].user2 = '';
                                    }

                                    // Unblock server if empty
                                    if (jsonData[serverIndex].players === 0) {
                                        jsonData[users[i][0]].block = 0;
                                    }

                                    // Remove user from tracking
                                    users.splice(i, 1);
                                    break;
                                }
                            }

                            // Write updated data
                            fs.writeFile(jsonFilePath, JSON.stringify(jsonData, null, 2), (writeErr) => {
                                if (writeErr) {
                                    console.error('Error writing to JSON file:', writeErr);
                                } else {
                                    console.log(`Player disconnected from room ${ROOM}. Updated server data.`);
                                }

                                lockFile.unlock(lockFilePath, (unlockErr) => {
                                    if (unlockErr) console.error('Error releasing lock:', unlockErr);
                                });
                            });
                        } else {
                            lockFile.unlock(lockFilePath, (unlockErr) => {
                                if (unlockErr) console.error('Error releasing lock:', unlockErr);
                            });
                        }
                    } catch (err) {
                        console.error('Error parsing JSON data:', err);
                        lockFile.unlock(lockFilePath, (unlockErr) => {
                            if (unlockErr) console.error('Error releasing lock:', unlockErr);
                        });
                    }
                });
            });
        }
    });
});

// Cleanup old projectiles for all rooms
setInterval(() => {
    const now = Date.now();
    rooms.forEach((roomData, roomName) => {
        for (const [id, proj] of roomData.activeProjectiles) {
            if (now - proj.timestamp > 10000) { // 10 second timeout
                roomData.activeProjectiles.delete(id);
            }
        }
    });
}, 1000);

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});