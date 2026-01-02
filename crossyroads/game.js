// Game Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('gameOver');

// Game State
let gameState = 'menu'; // 'menu', 'playing', or 'gameOver'
let score = 0;
let level = 1; // Current level (1 = roads, 2 = trains, 3 = river, 4 = combined)
let playerName = ''; // Player's nickname
let scoreSaved = false; // Flag to prevent duplicate score saves
let cameraX = 0;
let targetCameraX = 0; // Target camera position for smooth scrolling
let roadWidth = 80;
let grassWidth = 40;
let tileSize = 40; // Each tile is 40px (grass or road section)
let deathFlash = 0; // For visual feedback on death
let deathSquish = 0; // Squish animation progress (0-1)
let deathSoundPlayed = false; // Prevent multiple sound plays

// Bird Object
const bird = {
    worldX: 0, // World position in tiles (0 = first tile)
    x: 0, // Screen position (will be calculated)
    y: canvas.height / 2,
    width: 30,
    height: 30,
    isJumping: false,
    jumpProgress: 0,
    flapFrame: 0,
    color: '#FFD700',
    targetWorldX: 0, // Target tile position
    lastWorldX: -1 // Track when bird moves to new tile
};

// Roads, Vehicles, Trains, and Logs
let roads = [];
let vehicles = [];
let trains = [];
let logs = [];

// Initialize roads based on level
function initRoads() {
    roads = [];
    vehicles = [];
    trains = [];
    logs = [];
    
    // Always start with a grass zone (safe zone)
    let currentX = 0;
    roads.push({
        x: currentX,
        width: grassWidth,
        type: 'grass'
    });
    currentX += grassWidth;
    
    // Create initial roads based on level
    let consecutiveRoads = 0; // Track consecutive roads in level 1
    for (let i = 0; i < 100; i++) {
        let tileType;
        
        if (level === 1) {
            // Level 1: Roads only, max 4 consecutive roads
            if (consecutiveRoads >= 4) {
                tileType = 'grass';
                consecutiveRoads = 0;
            } else {
                tileType = Math.random() > 0.4 ? 'road' : 'grass';
                if (tileType === 'road') {
                    consecutiveRoads++;
                } else {
                    consecutiveRoads = 0;
                }
            }
        } else if (level === 2) {
            // Level 2: Trains only
            tileType = Math.random() > 0.4 ? 'train' : 'grass';
        } else if (level === 3) {
            // Level 3: River with logs
            tileType = Math.random() > 0.4 ? 'river' : 'grass';
        } else {
            // Level 4+: Combined (roads, trains, rivers)
            const rand = Math.random();
            if (rand < 0.35) {
                tileType = 'road';
            } else if (rand < 0.65) {
                tileType = 'train';
            } else if (rand < 0.9) {
                tileType = 'river';
            } else {
                tileType = 'grass';
            }
        }
        
        if (tileType === 'road') {
            const road = {
                x: currentX,
                width: roadWidth,
                type: 'road',
                direction: Math.random() > 0.5 ? 'up' : 'down'
            };
            roads.push(road);
            
            // Add 2-4 vehicles per road
            const vehicleCount = Math.floor(Math.random() * 3) + 2;
            for (let j = 0; j < vehicleCount; j++) {
                vehicles.push({
                    x: currentX + Math.random() * roadWidth,
                    y: Math.random() * canvas.height,
                    width: 35,
                    height: 25,
                    speed: (Math.random() * 2 + 1.5) * (road.direction === 'up' ? -1 : 1),
                    type: ['car', 'truck', 'bike'][Math.floor(Math.random() * 3)],
                    roadIndex: roads.length - 1
                });
            }
            currentX += roadWidth;
        } else if (tileType === 'train') {
            const trainTrack = {
                x: currentX,
                width: roadWidth,
                type: 'train',
                direction: Math.random() > 0.5 ? 'up' : 'down'
            };
            roads.push(trainTrack);
            
            // Add 1-2 trains per track
            const trainCount = Math.floor(Math.random() * 2) + 1;
            for (let j = 0; j < trainCount; j++) {
                trains.push({
                    x: currentX + roadWidth / 2, // Center of track
                    y: Math.random() * canvas.height, // Random vertical position
                    width: 30,
                    height: 60, // Taller for vertical movement
                    speed: (Math.random() * 3 + 2) * (trainTrack.direction === 'up' ? -1 : 1),
                    roadIndex: roads.length - 1
                });
            }
            currentX += roadWidth;
        } else if (tileType === 'river') {
            const river = {
                x: currentX,
                width: roadWidth,
                type: 'river',
                direction: Math.random() > 0.5 ? 'up' : 'down'
            };
            roads.push(river);
            
            // Add 2-4 logs per river
            const logCount = Math.floor(Math.random() * 3) + 2;
            for (let j = 0; j < logCount; j++) {
                logs.push({
                    x: currentX + roadWidth / 2, // Center of river
                    y: Math.random() * canvas.height,
                    width: 20,
                    height: 50, // Taller for vertical movement
                    speed: (Math.random() * 2 + 1) * (river.direction === 'up' ? -1 : 1),
                    roadIndex: roads.length - 1
                });
            }
            currentX += roadWidth;
        } else {
            // Grass zone
            roads.push({
                x: currentX,
                width: grassWidth,
                type: 'grass'
            });
            currentX += grassWidth;
        }
    }
}

// Vehicle colors
const vehicleColors = {
    car: '#FF4444',
    truck: '#4444FF',
    bike: '#44FF44'
};

// Input Handling
const keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'gameOver' && keys['KeyR']) {
            restartGame();
        }
    }
    if (gameState === 'gameOver' && e.code === 'KeyR') {
        restartGame();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// Mobile Touch Support
let touchStartY = 0;
let touchStartTime = 0;

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const touchY = touch.clientY - rect.top;
    touchStartY = touchY;
    touchStartTime = Date.now();
    
    // Determine action based on touch position
    const canvasHeight = canvas.height;
    const topThird = canvasHeight / 3;
    const bottomThird = canvasHeight * 2 / 3;
    
    if (touchY < topThird) {
        // Top third - move up
        keys['ArrowUp'] = true;
    } else if (touchY > bottomThird) {
        // Bottom third - move down
        keys['ArrowDown'] = true;
    } else {
        // Middle third - jump forward
        if (!bird.isJumping && gameState === 'playing') {
            keys['Space'] = true;
        }
    }
    
    // Restart on game over
    if (gameState === 'gameOver') {
        restartGame();
    }
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    keys['ArrowUp'] = false;
    keys['ArrowDown'] = false;
    keys['Space'] = false;
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

// Get tile at index
function getTileAt(index) {
    if (index >= 0 && index < roads.length) {
        return roads[index];
    }
    return null;
}

// Get center X position of a tile
function getTileCenterX(tile) {
    return tile.x + tile.width / 2;
}

// Bird Movement
function updateBird(deltaTime) {
    // Don't allow movement when game is over
    if (gameState === 'gameOver') {
        return;
    }
    
    // Vertical movement
    if (keys['ArrowUp']) {
        bird.y -= 200 * deltaTime;
    }
    if (keys['ArrowDown']) {
        bird.y += 200 * deltaTime;
    }
    
    // Keep bird in bounds
    bird.y = Math.max(bird.height / 2, Math.min(canvas.height - bird.height / 2, bird.y));
    
    // Jump/Flap forward - move one tile forward
    if (keys['Space'] && !bird.isJumping) {
        // Make sure target tile exists
        if (bird.worldX + 1 < roads.length) {
            bird.isJumping = true;
            bird.jumpProgress = 0;
            bird.flapFrame = 0;
            bird.targetWorldX = bird.worldX + 1; // Move to next tile
            score += 10;
        }
    }
    
    // Handle jump animation
    if (bird.isJumping) {
        bird.jumpProgress += deltaTime * 6; // Jump duration
        bird.flapFrame += deltaTime * 20;
        
        if (bird.jumpProgress >= 1) {
            bird.isJumping = false;
            bird.jumpProgress = 0;
            // Ensure target tile is valid before updating
            if (bird.targetWorldX < roads.length) {
                bird.worldX = bird.targetWorldX;
                bird.lastWorldX = bird.worldX; // Mark that bird moved to new tile
            } else {
                // If target doesn't exist, stay on current tile
                bird.targetWorldX = bird.worldX;
            }
        }
    }
    
    // Ensure bird.worldX is within valid bounds
    if (bird.worldX >= roads.length) {
        bird.worldX = Math.max(0, roads.length - 1);
    }
    if (bird.targetWorldX >= roads.length) {
        bird.targetWorldX = bird.worldX;
    }
    
    // Update bird's world position and screen position
    const currentTile = getTileAt(bird.worldX);
    const targetTile = getTileAt(bird.targetWorldX);
    
    // Safety check: if current tile doesn't exist, reset to first tile
    if (!currentTile) {
        if (roads.length > 0) {
            bird.worldX = 0;
            bird.targetWorldX = 0;
        }
        return;
    }
    
    let birdWorldX;
    
    if (bird.isJumping && targetTile) {
        // During jump, interpolate between current and target tile
        const startX = getTileCenterX(currentTile);
        const endX = getTileCenterX(targetTile);
        birdWorldX = startX + (endX - startX) * bird.jumpProgress;
    } else {
        // Not jumping, use current tile center
        birdWorldX = getTileCenterX(currentTile);
    }
    
    // Calculate screen position
    bird.x = birdWorldX - cameraX;
    
    // Update camera target only when bird is NOT jumping or when it lands on a new tile
    // This prevents the "running" glitch by avoiding constant camera adjustments during jump
    if (!bird.isJumping) {
        const targetBirdScreenX = 150;
        const birdActualWorldX = getTileCenterX(currentTile);
        targetCameraX = birdActualWorldX - targetBirdScreenX;
    }
    // During jump, camera target stays fixed to prevent jittery movement
}

// Update Vehicles
function updateVehicles(deltaTime) {
    // Don't update vehicles when game is over
    if (gameState === 'gameOver') {
        return;
    }
    
    vehicles.forEach(vehicle => {
        vehicle.y += vehicle.speed * 60 * deltaTime;
        
        // Wrap around screen
        if (vehicle.speed > 0 && vehicle.y > canvas.height + vehicle.height) {
            vehicle.y = -vehicle.height;
        } else if (vehicle.speed < 0 && vehicle.y < -vehicle.height) {
            vehicle.y = canvas.height + vehicle.height;
        }
    });
}

// Update Trains
function updateTrains(deltaTime) {
    if (gameState === 'gameOver') {
        return;
    }
    
    trains.forEach(train => {
        train.y += train.speed * 60 * deltaTime;
        
        // Wrap around screen vertically
        if (train.speed > 0 && train.y > canvas.height + train.height) {
            train.y = -train.height;
        } else if (train.speed < 0 && train.y < -train.height) {
            train.y = canvas.height + train.height;
        }
    });
}

// Track if bird is on a log
let birdOnLog = false;
let birdLogSpeed = 0;

// Update Logs
function updateLogs(deltaTime) {
    if (gameState === 'gameOver') {
        return;
    }
    
    logs.forEach(log => {
        log.y += log.speed * 60 * deltaTime;
        
        // Wrap around screen vertically
        if (log.speed > 0 && log.y > canvas.height + log.height) {
            log.y = -log.height;
        } else if (log.speed < 0 && log.y < -log.height) {
            log.y = canvas.height + log.height;
        }
    });
    
    // Check if bird is on a log (for river mechanics)
    birdOnLog = false;
    birdLogSpeed = 0;
    
    const currentTile = getTileAt(bird.worldX);
    if (currentTile && currentTile.type === 'river') {
        // Check current tile
        logs.forEach(log => {
            if (log.roadIndex === bird.worldX) {
                const logRect = {
                    x: log.x - cameraX - log.width / 2,
                    y: log.y - log.height / 2,
                    width: log.width,
                    height: log.height
                };
                const birdRect = {
                    x: bird.x - bird.width / 2,
                    y: bird.y - bird.height / 2,
                    width: bird.width,
                    height: bird.height
                };
                
                if (birdRect.x < logRect.x + logRect.width &&
                    birdRect.x + birdRect.width > logRect.x &&
                    birdRect.y < logRect.y + logRect.height &&
                    birdRect.y + birdRect.height > logRect.y) {
                    birdOnLog = true;
                    birdLogSpeed = log.speed;
                    // Move bird vertically with log
                    bird.y += log.speed * 60 * deltaTime;
                    // Keep bird in bounds
                    bird.y = Math.max(bird.height / 2, Math.min(canvas.height - bird.height / 2, bird.y));
                }
            }
        });
        
        // If bird is in water and not on a log (and not jumping to safety), it dies
        if (!birdOnLog && !bird.isJumping) {
            triggerGameOver();
        }
    }
}

// Smooth camera following
function updateCamera(deltaTime) {
    // Don't update camera when game is over
    if (gameState === 'gameOver') {
        return;
    }
    
    // Smoothly interpolate camera to target position
    // Use slower, more controlled camera movement to prevent "running" glitch
    const cameraSpeed = 400; // pixels per second (reduced from 800)
    const diff = targetCameraX - cameraX;
    if (Math.abs(diff) > 1) {
        // Use smooth interpolation instead of linear movement
        const lerpFactor = Math.min(1, cameraSpeed * deltaTime / Math.max(1, Math.abs(diff)));
        cameraX += diff * lerpFactor;
    } else {
        cameraX = targetCameraX;
    }
    
    // Generate more roads ahead
    const lastRoad = roads[roads.length - 1];
    const lastRoadEnd = lastRoad.x + lastRoad.width;
    
    if (lastRoadEnd < cameraX + canvas.width + 500) {
        let currentX = lastRoadEnd;
        // Count consecutive roads at the end of current roads array for level 1
        let consecutiveRoads = 0;
        if (level === 1 && roads.length > 0) {
            for (let i = roads.length - 1; i >= 0; i--) {
                if (roads[i].type === 'road') {
                    consecutiveRoads++;
                } else {
                    break;
                }
            }
        }
        
        for (let i = 0; i < 20; i++) {
            let tileType;
            
            if (level === 1) {
                // Level 1: Roads only, max 4 consecutive roads
                if (consecutiveRoads >= 4) {
                    tileType = 'grass';
                    consecutiveRoads = 0;
                } else {
                    tileType = Math.random() > 0.4 ? 'road' : 'grass';
                    if (tileType === 'road') {
                        consecutiveRoads++;
                    } else {
                        consecutiveRoads = 0;
                    }
                }
            } else if (level === 2) {
                tileType = Math.random() > 0.4 ? 'train' : 'grass';
            } else if (level === 3) {
                tileType = Math.random() > 0.4 ? 'river' : 'grass';
            } else {
                const rand = Math.random();
                if (rand < 0.35) {
                    tileType = 'road';
                } else if (rand < 0.65) {
                    tileType = 'train';
                } else if (rand < 0.9) {
                    tileType = 'river';
                } else {
                    tileType = 'grass';
                }
            }
            
            if (tileType === 'road') {
                const road = {
                    x: currentX,
                    width: roadWidth,
                    type: 'road',
                    direction: Math.random() > 0.5 ? 'up' : 'down'
                };
                roads.push(road);
                
                const vehicleCount = Math.floor(Math.random() * 3) + 2;
                for (let j = 0; j < vehicleCount; j++) {
                    vehicles.push({
                        x: currentX + Math.random() * roadWidth,
                        y: Math.random() * canvas.height,
                        width: 35,
                        height: 25,
                        speed: (Math.random() * 2 + 1.5) * (road.direction === 'up' ? -1 : 1),
                        type: ['car', 'truck', 'bike'][Math.floor(Math.random() * 3)],
                        roadIndex: roads.length - 1
                    });
                }
                currentX += roadWidth;
            } else if (tileType === 'train') {
                const trainTrack = {
                    x: currentX,
                    width: roadWidth,
                    type: 'train',
                    direction: Math.random() > 0.5 ? 'up' : 'down'
                };
                roads.push(trainTrack);
                
                const trainCount = Math.floor(Math.random() * 2) + 1;
                for (let j = 0; j < trainCount; j++) {
                    trains.push({
                        x: currentX + roadWidth / 2, // Center of track
                        y: Math.random() * canvas.height, // Random vertical position
                        width: 30,
                        height: 60, // Taller for vertical movement
                        speed: (Math.random() * 3 + 2) * (trainTrack.direction === 'up' ? -1 : 1),
                        roadIndex: roads.length - 1
                    });
                }
                currentX += roadWidth;
            } else if (tileType === 'river') {
                const river = {
                    x: currentX,
                    width: roadWidth,
                    type: 'river',
                    direction: Math.random() > 0.5 ? 'up' : 'down'
                };
                roads.push(river);
                
                const logCount = Math.floor(Math.random() * 3) + 2;
                for (let j = 0; j < logCount; j++) {
                    logs.push({
                        x: currentX + roadWidth / 2, // Center of river
                        y: Math.random() * canvas.height,
                        width: 20,
                        height: 50, // Taller for vertical movement
                        speed: (Math.random() * 2 + 1) * (river.direction === 'up' ? -1 : 1),
                        roadIndex: roads.length - 1
                    });
                }
                currentX += roadWidth;
            } else {
                roads.push({
                    x: currentX,
                    width: grassWidth,
                    type: 'grass'
                });
                currentX += grassWidth;
            }
        }
    }
    
    // Store the bird's current tile before filtering
    const birdCurrentTile = getTileAt(bird.worldX);
    const birdTileX = birdCurrentTile ? birdCurrentTile.x : 0;
    
    // Remove roads behind camera, but keep roads the bird is on or near
    const minKeepX = Math.min(cameraX - 500, birdTileX - 200);
    const roadsBeforeFilter = roads.length;
    roads = roads.filter(road => road.x + road.width > minKeepX);
    const roadsRemoved = roadsBeforeFilter - roads.length;
    
    // Recalculate bird's worldX index after filtering (indices may have shifted)
    if (birdCurrentTile) {
        const newIndex = roads.findIndex(r => r.x === birdTileX);
        if (newIndex >= 0) {
            bird.worldX = newIndex;
            // Also update target if it was set
            if (bird.targetWorldX >= roadsRemoved) {
                bird.targetWorldX = Math.max(0, bird.targetWorldX - roadsRemoved);
            }
        } else if (roads.length > 0) {
            // If bird's tile was removed, find nearest or use first
            bird.worldX = 0;
            bird.targetWorldX = 0;
        }
    }
    
    // Update vehicle road indices after filtering
    vehicles = vehicles.filter(vehicle => {
        // Only find roads of type 'road' - vehicles should never be on grass/train/river
        const road = roads.find(r => 
            vehicle.x >= r.x && vehicle.x <= r.x + r.width && r.type === 'road'
        );
        if (road) {
            vehicle.roadIndex = roads.indexOf(road);
            return true;
        }
        return false;
    });
    
    // Update train and log road indices after filtering
    trains = trains.filter(train => {
        // Find the train track that contains this train's x position (trains move vertically)
        const road = roads.find(r => 
            train.x >= r.x && train.x <= r.x + r.width && r.type === 'train'
        );
        if (road) {
            train.roadIndex = roads.indexOf(road);
            return true;
        }
        return false;
    });
    
    logs = logs.filter(log => {
        // Find the road that contains this log's center position
        const road = roads.find(r => 
            log.x >= r.x && log.x <= r.x + r.width && r.type === 'river'
        );
        if (road) {
            log.roadIndex = roads.indexOf(road);
            return true;
        }
        return false;
    });
}

// Collision Detection
function checkCollisions() {
    // Get the tile the bird is currently on (or moving to during jump)
    let checkTile = getTileAt(bird.worldX);
    
    // During jump, check both current and target tiles
    if (bird.isJumping) {
        const targetTile = getTileAt(bird.targetWorldX);
        // Check the tile we're moving through
        checkTile = targetTile || checkTile;
    }
    
    if (!checkTile) return;
    
    const birdRect = {
        x: bird.x,
        y: bird.y - bird.height / 2,
        width: bird.width,
        height: bird.height
    };
    
    // Check collisions with vehicles (roads)
    if (checkTile.type === 'road') {
        vehicles.forEach(vehicle => {
            if (vehicle.roadIndex === bird.worldX || 
                (bird.isJumping && vehicle.roadIndex === bird.targetWorldX)) {
                const vehicleRect = {
                    x: vehicle.x - cameraX,
                    y: vehicle.y - vehicle.height / 2,
                    width: vehicle.width,
                    height: vehicle.height
                };
                
                if (birdRect.x < vehicleRect.x + vehicleRect.width &&
                    birdRect.x + birdRect.width > vehicleRect.x &&
                    birdRect.y < vehicleRect.y + vehicleRect.height &&
                    birdRect.y + birdRect.height > vehicleRect.y) {
                    triggerGameOver();
                    return;
                }
            }
        });
    }
    
    // Check collisions with trains
    if (checkTile.type === 'train') {
        trains.forEach(train => {
            if (train.roadIndex === bird.worldX || 
                (bird.isJumping && train.roadIndex === bird.targetWorldX)) {
                const trainRect = {
                    x: train.x - cameraX,
                    y: train.y - train.height / 2,
                    width: train.width,
                    height: train.height
                };
                
                if (birdRect.x < trainRect.x + trainRect.width &&
                    birdRect.x + birdRect.width > trainRect.x &&
                    birdRect.y < trainRect.y + trainRect.height &&
                    birdRect.y + birdRect.height > trainRect.y) {
                    triggerGameOver();
                    return;
                }
            }
        });
    }
    
    // Water collision is handled in updateLogs function
}

// Leaderboard Functions
function getLeaderboard() {
    const leaderboard = localStorage.getItem('crossyRoadLeaderboard');
    return leaderboard ? JSON.parse(leaderboard) : [];
}

function saveToLeaderboard(name, score) {
    const leaderboard = getLeaderboard();
    leaderboard.push({ name: name || 'Anonymous', score: Math.floor(score), date: new Date().toISOString() });
    
    // Sort by score (descending) and keep top 10
    leaderboard.sort((a, b) => b.score - a.score);
    const top10 = leaderboard.slice(0, 10);
    
    localStorage.setItem('crossyRoadLeaderboard', JSON.stringify(top10));
    return top10;
}

function displayLeaderboard() {
    const leaderboard = getLeaderboard();
    const listElement = document.getElementById('leaderboardList');
    
    if (leaderboard.length === 0) {
        listElement.innerHTML = '<p style="color: white; font-size: 18px;">No scores yet. Be the first!</p>';
        return;
    }
    
    listElement.innerHTML = leaderboard.map((entry, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        return `
            <div class="leaderboard-entry">
                <span class="leaderboard-rank">${medal}</span>
                <span class="leaderboard-name">${entry.name}</span>
                <span class="leaderboard-score">${entry.score}</span>
            </div>
        `;
    }).join('');
}

function showLeaderboard() {
    displayLeaderboard();
    document.getElementById('leaderboard').classList.add('show');
}

function hideLeaderboard() {
    document.getElementById('leaderboard').classList.remove('show');
}

function showNameInput(isGameStart = true) {
    const nameInputMenu = document.querySelector('.name-input-menu h2');
    const submitButton = document.getElementById('nameSubmitButton');
    if (nameInputMenu) {
        nameInputMenu.textContent = isGameStart ? 'Enter Your Nickname' : 'Enter Your Name';
    }
    if (submitButton) {
        submitButton.textContent = isGameStart ? 'Start Game' : 'Save Score';
        submitButton.onclick = isGameStart ? savePlayerName : saveScore;
    }
    document.getElementById('nameInput').classList.add('show');
    document.getElementById('playerName').focus();
}

function hideNameInput() {
    document.getElementById('nameInput').classList.remove('show');
    document.getElementById('playerName').value = '';
}

function savePlayerName() {
    const nameInput = document.getElementById('playerName');
    playerName = nameInput.value.trim() || 'Anonymous';
    hideNameInput();
    
    // After name is saved, show level selection
    const levelSelect = document.getElementById('levelSelect');
    if (levelSelect) {
        levelSelect.classList.remove('hidden');
    }
}

function saveScore() {
    // Prevent duplicate saves
    if (scoreSaved) return;
    
    // Use stored player name
    saveToLeaderboard(playerName || 'Anonymous', score);
    scoreSaved = true;
    
    // Don't show leaderboard automatically - user must press button
}

function skipNameInput() {
    playerName = 'Anonymous';
    hideNameInput();
    
    // After skipping, show level selection
    const levelSelect = document.getElementById('levelSelect');
    if (levelSelect) {
        levelSelect.classList.remove('hidden');
    }
}

// Allow Enter key to submit name
document.addEventListener('DOMContentLoaded', () => {
    const nameInput = document.getElementById('playerName');
    if (nameInput) {
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                // Check if we're at game start or game end
                const submitButton = document.getElementById('nameSubmitButton');
                if (submitButton && submitButton.textContent === 'Start Game') {
                    savePlayerName();
                } else {
                    saveScore();
                }
            }
        });
    }
    
    // Show name input when page loads
    setTimeout(() => {
        showNameInput(true);
    }, 100);
});

// Sound effect for death
function playDeathSound() {
    if (deathSoundPlayed) return;
    deathSoundPlayed = true;
    
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Create a dramatic "squish" sound - low frequency with quick decay
        oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.type = 'sawtooth';
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
        // Fallback if audio context fails
        console.log('Audio not available');
    }
}

// Game Over Function
function triggerGameOver() {
    if (gameState === 'gameOver') return; // Prevent multiple triggers
    
    gameState = 'gameOver';
    deathFlash = 1.0; // Start flash effect
    deathSquish = 0; // Start squish animation
    deathSoundPlayed = false; // Reset sound flag
    gameOverElement.style.display = 'block';
    
    // Play death sound
    playDeathSound();
    
    // Stop bird movement
    bird.isJumping = false;
    bird.jumpProgress = 0;
    
    // Automatically save score with stored player name (only once)
    if (playerName && !scoreSaved) {
        setTimeout(() => {
            saveScore();
        }, 1000);
    }
}

// Rendering
function drawBird() {
    ctx.save();
    
    // Death flatten animation - bird becomes a yellow blob circle
    if (gameState === 'gameOver') {
        // Update flatten animation - slower for visibility
        if (deathSquish < 1) {
            deathSquish = Math.min(1, deathSquish + 0.08);
        }
        
        // Calculate flatten effect - bird becomes a wide flat blob
        const flattenX = 1 + deathSquish * 1.5; // Wider when flattened (1.5x - smaller width)
        const flattenY = Math.max(0.15, 1 - deathSquish * 0.85); // Flatter (85% reduction)
        
        ctx.translate(bird.x, bird.y);
        ctx.scale(flattenX, flattenY);
        
        // Flattened bird as yellow blob circle
        // Yellow color - bright yellow that fades slightly as it flattens
        const yellowIntensity = Math.max(0.7, 1 - deathSquish * 0.2);
        ctx.fillStyle = `rgb(255, ${Math.floor(215 * yellowIntensity)}, 0)`;
        ctx.beginPath();
        // Draw as a circular blob - starts as circle, becomes wider flat blob
        const blobRadius = bird.width / 2 * (1 + deathSquish * 0.8); // Smaller width expansion
        const blobHeight = bird.height / 2 * flattenY;
        // Create a blob-like circle that's wider when flattened
        ctx.ellipse(0, 0, blobRadius, blobHeight, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Add some texture to make it look more blob-like
        if (deathSquish > 0.3) {
            // Add some darker yellow spots for blob texture
            ctx.fillStyle = `rgba(200, 150, 0, ${0.3 * deathSquish})`;
            ctx.beginPath();
            ctx.arc(-blobRadius * 0.3, -blobHeight * 0.5, blobRadius * 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(blobRadius * 0.3, blobHeight * 0.5, blobRadius * 0.15, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // X eyes (dead) - visible on yellow
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        const eyeY = -blobHeight * 2;
        const eyeSize = 3 * (1 - deathSquish * 0.4);
        ctx.beginPath();
        ctx.moveTo(-5 - eyeSize, eyeY);
        ctx.lineTo(-2, eyeY - eyeSize);
        ctx.moveTo(-2, eyeY);
        ctx.lineTo(-5 - eyeSize, eyeY - eyeSize);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(2, eyeY);
        ctx.lineTo(5 + eyeSize, eyeY - eyeSize);
        ctx.moveTo(5 + eyeSize, eyeY);
        ctx.lineTo(2, eyeY - eyeSize);
        ctx.stroke();
        
        ctx.restore();
        return;
    }
    
    // Normal bird drawing - Yellow Bird Character
    // Jump animation - slight vertical bounce
    let jumpOffset = 0;
    if (bird.isJumping) {
        jumpOffset = Math.sin(bird.jumpProgress * Math.PI) * 15;
    }
    
    // Flap animation
    const wingOffset = Math.sin(bird.flapFrame) * 5;
    
    ctx.translate(bird.x, bird.y + jumpOffset);
    
    // Yellow Bird Body (rounder, more bird-like)
    ctx.fillStyle = '#FFD700'; // Bright yellow
    ctx.beginPath();
    // Draw a more rounded, bird-like body
    ctx.ellipse(0, 2, bird.width / 2.2, bird.height / 2.3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Add a white belly patch for character
    ctx.fillStyle = '#FFFACD'; // Light yellow/cream
    ctx.beginPath();
    ctx.ellipse(0, 4, bird.width / 3, bird.height / 3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Wings (flapping) - more visible and animated
    const wingFlap = bird.isJumping ? Math.abs(Math.sin(bird.flapFrame)) * 8 : 0;
    ctx.fillStyle = '#FFA500'; // Orange-yellow wings
    ctx.beginPath();
    ctx.ellipse(-10, wingOffset - wingFlap, 10, 14, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(10, -wingOffset + wingFlap, 10, 14, 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Wing details (darker orange)
    ctx.fillStyle = '#FF8C00';
    ctx.beginPath();
    ctx.ellipse(-10, wingOffset - wingFlap, 6, 8, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(10, -wingOffset + wingFlap, 6, 8, 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Beak (orange, more prominent)
    ctx.fillStyle = '#FF6600';
    ctx.beginPath();
    ctx.moveTo(bird.width / 2 + 2, 0);
    ctx.lineTo(bird.width / 2 + 12, -4);
    ctx.lineTo(bird.width / 2 + 12, 4);
    ctx.closePath();
    ctx.fill();
    
    // Beak highlight
    ctx.fillStyle = '#FF8800';
    ctx.beginPath();
    ctx.moveTo(bird.width / 2 + 4, -1);
    ctx.lineTo(bird.width / 2 + 10, -3);
    ctx.lineTo(bird.width / 2 + 10, 1);
    ctx.closePath();
    ctx.fill();
    
    // Eye (black with white highlight)
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(6, -6, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye highlight
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(7, -7, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Small crest/feather on top of head
    ctx.fillStyle = '#FFA500';
    ctx.beginPath();
    ctx.moveTo(0, -bird.height / 2 - 3);
    ctx.lineTo(-3, -bird.height / 2 - 8);
    ctx.lineTo(3, -bird.height / 2 - 8);
    ctx.closePath();
    ctx.fill();
    
    // Legs (simple orange sticks)
    ctx.strokeStyle = '#FF6600';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-4, bird.height / 2);
    ctx.lineTo(-4, bird.height / 2 + 6);
    ctx.moveTo(4, bird.height / 2);
    ctx.lineTo(4, bird.height / 2 + 6);
    ctx.stroke();
    
    ctx.restore();
}

function drawRoads() {
    roads.forEach(road => {
        const screenX = road.x - cameraX;
        
        if (screenX + road.width < 0 || screenX > canvas.width) return;
        
        if (road.type === 'grass') {
            // Grass zone
            ctx.fillStyle = '#7CB342';
            ctx.fillRect(screenX, 0, road.width, canvas.height);
            
            // Grass texture
            ctx.fillStyle = '#558B2F';
            for (let i = 0; i < road.width; i += 5) {
                for (let j = 0; j < canvas.height; j += 10) {
                    if (Math.random() > 0.7) {
                        ctx.fillRect(screenX + i, j, 2, 3);
                    }
                }
            }
        } else if (road.type === 'road') {
            // Road
            ctx.fillStyle = '#424242';
            ctx.fillRect(screenX, 0, road.width, canvas.height);
            
            // Road markings
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 10]);
            ctx.beginPath();
            ctx.moveTo(screenX + road.width / 2, 0);
            ctx.lineTo(screenX + road.width / 2, canvas.height);
            ctx.stroke();
            ctx.setLineDash([]);
        } else if (road.type === 'train') {
            // Train track
            ctx.fillStyle = '#2C2C2C';
            ctx.fillRect(screenX, 0, road.width, canvas.height);
            
            // Rails (vertical)
            ctx.strokeStyle = '#8B7355';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(screenX + road.width / 2 - 10, 0);
            ctx.lineTo(screenX + road.width / 2 - 10, canvas.height);
            ctx.moveTo(screenX + road.width / 2 + 10, 0);
            ctx.lineTo(screenX + road.width / 2 + 10, canvas.height);
            ctx.stroke();
            
            // Cross ties (horizontal)
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 2;
            for (let i = 0; i < canvas.height; i += 20) {
                ctx.beginPath();
                ctx.moveTo(screenX + 10, i);
                ctx.lineTo(screenX + road.width - 10, i);
                ctx.stroke();
            }
        } else if (road.type === 'river') {
            // River/Water
            ctx.fillStyle = '#1E88E5';
            ctx.fillRect(screenX, 0, road.width, canvas.height);
            
            // Water waves
            ctx.strokeStyle = '#1565C0';
            ctx.lineWidth = 2;
            for (let i = 0; i < road.width; i += 20) {
                for (let j = 0; j < canvas.height; j += 30) {
                    ctx.beginPath();
                    ctx.moveTo(screenX + i, j);
                    ctx.quadraticCurveTo(screenX + i + 10, j + 5, screenX + i + 20, j);
                    ctx.stroke();
                }
            }
        }
    });
}

function drawVehicles() {
    vehicles.forEach(vehicle => {
        const road = roads[vehicle.roadIndex];
        // Only draw vehicles on roads, not on grass/train/river
        if (!road || road.type !== 'road') return;
        
        const screenX = vehicle.x - cameraX;
        
        if (screenX + vehicle.width < 0 || screenX > canvas.width) return;
        
        ctx.fillStyle = vehicleColors[vehicle.type];
        ctx.fillRect(
            screenX - vehicle.width / 2,
            vehicle.y - vehicle.height / 2,
            vehicle.width,
            vehicle.height
        );
        
        // Vehicle details
        ctx.fillStyle = '#000';
        // Windows
        ctx.fillRect(screenX - vehicle.width / 2 + 5, vehicle.y - vehicle.height / 2 + 5, 8, 8);
        ctx.fillRect(screenX + vehicle.width / 2 - 13, vehicle.y - vehicle.height / 2 + 5, 8, 8);
        
        // Wheels
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(screenX - vehicle.width / 2 + 8, vehicle.y + vehicle.height / 2, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(screenX + vehicle.width / 2 - 8, vehicle.y + vehicle.height / 2, 4, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawTrains() {
    trains.forEach(train => {
        const road = roads[train.roadIndex];
        if (!road) return;
        
        const screenX = train.x - cameraX;
        const trainLeft = screenX - train.width / 2;
        const trainRight = screenX + train.width / 2;
        const trainTop = train.y - train.height / 2;
        const trainBottom = train.y + train.height / 2;
        
        // Only draw if train is visible on screen
        if (trainRight < 0 || trainLeft > canvas.width || trainBottom < 0 || trainTop > canvas.height) return;
        
        // Train body (vertical orientation)
        ctx.fillStyle = '#8B0000';
        ctx.fillRect(
            trainLeft,
            trainTop,
            train.width,
            train.height
        );
        
        // Train windows (vertical orientation)
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(trainLeft + 5, trainTop + 10, 8, 12);
        ctx.fillRect(trainLeft + 5, trainTop + 30, 8, 12);
        ctx.fillRect(trainRight - 13, trainTop + 10, 8, 12);
        ctx.fillRect(trainRight - 13, trainTop + 30, 8, 12);
        
        // Train wheels (on sides for vertical train)
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(trainLeft - 3, trainTop + 15, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(trainLeft - 3, trainTop + 45, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(trainRight + 3, trainTop + 15, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(trainRight + 3, trainTop + 45, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Smoke (only on the side moving forward - top or bottom)
        ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
        if (train.speed < 0) {
            // Moving up, smoke on top
            ctx.beginPath();
            ctx.arc(screenX, trainTop - 5, 8, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Moving down, smoke on bottom
            ctx.beginPath();
            ctx.arc(screenX, trainBottom + 5, 8, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

function drawLogs() {
    logs.forEach(log => {
        const river = roads[log.roadIndex];
        if (!river) return;
        
        const screenX = log.x - cameraX;
        const logLeft = screenX - log.width / 2;
        const logRight = screenX + log.width / 2;
        const logTop = log.y - log.height / 2;
        const logBottom = log.y + log.height / 2;
        
        // Only draw if log is visible on screen
        if (logRight < 0 || logLeft > canvas.width || logBottom < 0 || logTop > canvas.height) return;
        
        // Log body (brown wood) - vertical orientation
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(
            logLeft,
            logTop,
            log.width,
            log.height
        );
        
        // Log texture (rings) - vertical orientation
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(screenX, log.y, log.width / 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(screenX, log.y - 15, log.width / 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(screenX, log.y + 15, log.width / 3, 0, Math.PI * 2);
        ctx.stroke();
    });
}

function render() {
    // Clear canvas
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw game elements if playing or game over (to show death animation)
    if (gameState === 'playing' || gameState === 'gameOver') {
        // Draw roads/tracks/rivers
        drawRoads();
        
        // Draw logs (behind bird)
        drawLogs();
        
        // Draw vehicles
        drawVehicles();
        
        // Draw trains
        drawTrains();
        
        // Draw bird (includes death animation)
        drawBird();
    }
    
    // Death flash effect
    if (deathFlash > 0) {
        ctx.fillStyle = `rgba(255, 0, 0, ${deathFlash * 0.5})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        deathFlash -= 0.05;
        if (deathFlash < 0) deathFlash = 0;
    }
    
    // Game over overlay
    if (gameState === 'gameOver') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw game over text on canvas
        ctx.fillStyle = '#ff6b6b';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 30);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px Arial';
        ctx.fillText('Press R to Restart', canvas.width / 2, canvas.height / 2 + 30);
    }
    
    // Update score and level
    scoreElement.textContent = `Distance: ${Math.floor(score)} | Level: ${level}`;
}

// Game Loop
let lastTime = 0;
function gameLoop(currentTime) {
    const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;
    
    // Only update game if playing, but always render
    if (gameState === 'playing') {
        updateBird(deltaTime);
        updateVehicles(deltaTime);
        updateTrains(deltaTime);
        updateLogs(deltaTime);
        updateCamera(deltaTime);
        checkCollisions();
        
        // Level progression: advance level every 500 points
        const newLevel = Math.floor(score / 500) + 1;
        if (newLevel > level && newLevel <= 4) {
            level = newLevel;
        }
    }
    
    render();
    requestAnimationFrame(gameLoop);
}

// Restart Game
function restartGame() {
    gameState = 'playing';
    score = 0;
    scoreSaved = false; // Reset flag for new game
    // Keep the current level instead of resetting to 1
    cameraX = 0;
    targetCameraX = 0;
    bird.worldX = 0; // Start at first tile (which is now always grass)
    bird.targetWorldX = 0;
    bird.y = canvas.height / 2;
    bird.isJumping = false;
    bird.jumpProgress = 0;
    deathFlash = 0;
    deathSquish = 0;
    deathSoundPlayed = false;
    gameOverElement.style.display = 'none';
    
    // Hide name input and leaderboard if open
    hideNameInput();
    hideLeaderboard();
    
    initRoads();
    
    // Set initial camera position - bird starts at first tile (grass zone)
    const firstTile = getTileAt(0);
    if (firstTile && firstTile.type === 'grass') {
        bird.x = getTileCenterX(firstTile);
        const targetBirdScreenX = 150;
        targetCameraX = getTileCenterX(firstTile) - targetBirdScreenX;
        cameraX = targetCameraX;
    }
}

// Level selection function
function startGame(selectedLevel) {
    // Make sure we have a player name
    if (!playerName) {
        playerName = 'Anonymous';
    }
    
    level = selectedLevel;
    gameState = 'playing';
    scoreSaved = false; // Reset flag for new game
    
    // Hide level select menu
    const levelSelect = document.getElementById('levelSelect');
    if (levelSelect) {
        levelSelect.classList.add('hidden');
    }
    
    // Initialize game
    initRoads();
    // Set initial position - bird always starts at first tile (grass zone)
    const firstTile = getTileAt(0);
    if (firstTile && firstTile.type === 'grass') {
        bird.x = getTileCenterX(firstTile);
        const targetBirdScreenX = 150;
        targetCameraX = getTileCenterX(firstTile) - targetBirdScreenX;
        cameraX = targetCameraX;
    }
}

// Don't auto-start - wait for level selection
// The game loop will run but won't update until a level is selected
gameLoop(0);

// One-time leaderboard reset - remove this after running once
localStorage.removeItem('crossyRoadLeaderboard');
console.log('Leaderboard cleared!');
