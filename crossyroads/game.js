// Game Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('gameOver');

// Game State
let gameState = 'playing'; // 'playing' or 'gameOver'
let score = 0;
let cameraX = 0;
let targetCameraX = 0; // Target camera position for smooth scrolling
let roadWidth = 80;
let grassWidth = 40;
let tileSize = 40; // Each tile is 40px (grass or road section)
let deathFlash = 0; // For visual feedback on death

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

// Roads and Vehicles
let roads = [];
let vehicles = [];

// Initialize roads
function initRoads() {
    roads = [];
    vehicles = [];
    
    // Always start with a grass zone (safe zone)
    let currentX = 0;
    roads.push({
        x: currentX,
        width: grassWidth,
        type: 'grass'
    });
    currentX += grassWidth;
    
    // Create initial roads (starting after first grass zone)
    for (let i = 0; i < 100; i++) {
        const isRoad = Math.random() > 0.4; // 60% chance of road
        
        if (isRoad) {
            // Road
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
        for (let i = 0; i < 20; i++) {
            const isRoad = Math.random() > 0.4; // 60% chance of road
            
            if (isRoad) {
                // Road
                const road = {
                    x: currentX,
                    width: roadWidth,
                    type: 'road',
                    direction: Math.random() > 0.5 ? 'up' : 'down'
                };
                roads.push(road);
                
                // Add vehicles
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
        // Find the road this vehicle belongs to by position
        const road = roads.find(r => 
            vehicle.x >= r.x && vehicle.x <= r.x + r.width
        );
        if (road) {
            vehicle.roadIndex = roads.indexOf(road);
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
    
    // Only check collisions if bird is on a road
    if (checkTile && checkTile.type === 'road') {
        const birdRect = {
            x: bird.x,
            y: bird.y - bird.height / 2,
            width: bird.width,
            height: bird.height
        };
        
        vehicles.forEach(vehicle => {
            // Check if vehicle is on the same road
            if (vehicle.x >= checkTile.x && vehicle.x <= checkTile.x + checkTile.width) {
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
                    // Player died - collided with vehicle
                    triggerGameOver();
                    return; // Exit early to prevent multiple triggers
                }
            }
        });
    }
}

// Game Over Function
function triggerGameOver() {
    if (gameState === 'gameOver') return; // Prevent multiple triggers
    
    gameState = 'gameOver';
    deathFlash = 1.0; // Start flash effect
    gameOverElement.style.display = 'block';
    
    // Stop bird movement
    bird.isJumping = false;
    bird.jumpProgress = 0;
}

// Rendering
function drawBird() {
    // Don't draw bird if game is over
    if (gameState === 'gameOver') {
        return;
    }
    
    ctx.save();
    
    // Jump animation - slight vertical bounce
    let jumpOffset = 0;
    if (bird.isJumping) {
        jumpOffset = Math.sin(bird.jumpProgress * Math.PI) * 15;
    }
    
    // Flap animation
    const wingOffset = Math.sin(bird.flapFrame) * 5;
    
    ctx.translate(bird.x, bird.y + jumpOffset);
    
    // Bird body
    ctx.fillStyle = bird.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, bird.width / 2, bird.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Wings (flapping)
    if (bird.isJumping) {
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.ellipse(-8, wingOffset, 8, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(8, -wingOffset, 8, 12, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Beak
    ctx.fillStyle = '#FF6600';
    ctx.beginPath();
    ctx.moveTo(bird.width / 2, 0);
    ctx.lineTo(bird.width / 2 + 8, -3);
    ctx.lineTo(bird.width / 2 + 8, 3);
    ctx.closePath();
    ctx.fill();
    
    // Eye
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(5, -5, 3, 0, Math.PI * 2);
    ctx.fill();
    
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
        } else {
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
        }
    });
}

function drawVehicles() {
    vehicles.forEach(vehicle => {
        const road = roads[vehicle.roadIndex];
        if (!road) return;
        
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

function render() {
    // Clear canvas
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw roads
    drawRoads();
    
    // Draw vehicles
    drawVehicles();
    
    // Draw bird
    drawBird();
    
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
    
    // Update score
    scoreElement.textContent = `Distance: ${Math.floor(score)}`;
}

// Game Loop
let lastTime = 0;
function gameLoop(currentTime) {
    const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;
    
    if (gameState === 'playing') {
        updateBird(deltaTime);
        updateVehicles(deltaTime);
        updateCamera(deltaTime);
        checkCollisions();
    }
    
    render();
    requestAnimationFrame(gameLoop);
}

// Restart Game
function restartGame() {
    gameState = 'playing';
    score = 0;
    cameraX = 0;
    targetCameraX = 0;
    bird.worldX = 0; // Start at first tile (which is now always grass)
    bird.targetWorldX = 0;
    bird.y = canvas.height / 2;
    bird.isJumping = false;
    bird.jumpProgress = 0;
    deathFlash = 0;
    gameOverElement.style.display = 'none';
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

// Initialize and Start
initRoads();
// Set initial position - bird always starts at first tile (grass zone)
const firstTile = getTileAt(0);
if (firstTile && firstTile.type === 'grass') {
    bird.x = getTileCenterX(firstTile);
    const targetBirdScreenX = 150;
    targetCameraX = getTileCenterX(firstTile) - targetBirdScreenX;
    cameraX = targetCameraX;
}
gameLoop(0);
