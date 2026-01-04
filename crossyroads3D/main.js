// ============================================
// Crossy Roads 3D - Main Game Logic
// ============================================

// Game Constants
const TILE_SIZE = 2;
const GRID_SIZE = 9; // Number of tiles in a row (odd for center)
const PLAYER_START_Z = 0;
const TILE_GENERATION_DISTANCE = 20; // Generate tiles this far ahead
const TILE_REMOVE_DISTANCE = -10; // Remove tiles this far behind
const CAR_SPEED_BASE = 0.05;
const LOG_SPEED_BASE = 0.03;
const TRAIN_SPEED_BASE = 0.04;
const JUMP_COOLDOWN = 300; // milliseconds

// Bird Colors
const BIRD_COLORS = [
    0xff6b6b, // Red
    0x4ecdc4, // Cyan
    0x95e1d3, // Mint
    0xf38181, // Pink
    0xa8e6cf, // Green
    0xffd93d, // Yellow
    0x6c5ce7, // Purple
    0xfd79a8, // Rose
];

// Game State
let scene, camera, renderer;
let player;
let player2 = null; // Second player for multiplayer
let tiles = new Map(); // Map of tile coordinates to tile objects
let playerZ = PLAYER_START_Z;
let playerX = 0; // Center position
let player2Z = PLAYER_START_Z;
let player2X = 0; // Second player position
let score = 0;
let score2 = 0;
let gameState = 'menu'; // 'menu', 'playing', 'gameover'
let isMultiplayer = false;
let lastJumpTime = 0;
let lastJumpTime2 = 0;
let selectedColorIndex = 0;
let selectedColorIndex2 = 1; // Different default color for player 2
let isJumping = false;
let isJumping2 = false;
let targetX = 0;
let targetZ = playerZ;
let targetX2 = 0;
let targetZ2 = player2Z;
let playerAlive = true;
let player2Alive = true;

// Mobile touch controls
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let touchMoved = false;

// Obstacles
let cars = [];
let logs = [];
let trains = [];
let obstacles = [];
let buildings = [];

// Initialize Game
function init() {
    // Disable right-click context menu
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue
    scene.fog = new THREE.Fog(0x87ceeb, 50, 150);

    // Create camera (third-person, slightly top-down)
    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 8, PLAYER_START_Z + 12);
    camera.lookAt(0, 0, PLAYER_START_Z - 2);

    // Create renderer
    const canvas = document.getElementById('gameCanvas');
    renderer = new THREE.WebGLRenderer({ 
        canvas: canvas,
        antialias: true,
        alpha: false
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Create ground plane for visual reference
    const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x7cb342,
        roughness: 0.8
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    // Initialize UI
    initUI();

    // Initialize player
    createPlayer();

    // Generate initial tiles
    generateInitialTiles();

    // Setup controls
    setupControls();

    // Handle window resize
    window.addEventListener('resize', onWindowResize);
    
    // Handle orientation change
    window.addEventListener('orientationchange', () => {
        setTimeout(onWindowResize, 100);
    });

    // Start game loop
    animate();
}

// Create Player (Low-poly Bird)
function createPlayer(isPlayer2 = false) {
    const playerGroup = new THREE.Group();
    const colorIndex = isPlayer2 ? selectedColorIndex2 : selectedColorIndex;
    const startX = isPlayer2 ? player2X : playerX;
    const startZ = isPlayer2 ? player2Z : playerZ;
    
    // Body (ellipsoid-like shape)
    const bodyGeometry = new THREE.OctahedronGeometry(0.3, 0);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: BIRD_COLORS[colorIndex],
        roughness: 0.7
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.scale.set(1, 1.2, 0.8);
    body.position.y = 0.4;
    body.castShadow = true;
    playerGroup.add(body);

    // Head (smaller sphere)
    const headGeometry = new THREE.OctahedronGeometry(0.2, 0);
    const headMaterial = new THREE.MeshStandardMaterial({ 
        color: BIRD_COLORS[colorIndex],
        roughness: 0.7
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0.3, 0.6, 0);
    head.castShadow = true;
    playerGroup.add(head);

    // Beak
    const beakGeometry = new THREE.ConeGeometry(0.05, 0.15, 4);
    const beakMaterial = new THREE.MeshStandardMaterial({ color: 0xff9800 });
    const beak = new THREE.Mesh(beakGeometry, beakMaterial);
    beak.position.set(0.45, 0.55, 0);
    beak.rotation.z = Math.PI / 2;
    playerGroup.add(beak);

    // Eye
    const eyeGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    eye.position.set(0.4, 0.65, 0.1);
    playerGroup.add(eye);

    // Wings (simple triangles)
    const wingGeometry = new THREE.ConeGeometry(0.15, 0.3, 3);
    const wingMaterial = new THREE.MeshStandardMaterial({ 
        color: BIRD_COLORS[colorIndex],
        roughness: 0.7
    });
    
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-0.2, 0.4, 0);
    leftWing.rotation.z = -Math.PI / 4;
    leftWing.rotation.x = Math.PI / 2;
    playerGroup.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(0.2, 0.4, 0);
    rightWing.rotation.z = Math.PI / 4;
    rightWing.rotation.x = Math.PI / 2;
    playerGroup.add(rightWing);

    playerGroup.position.set(startX, 0, startZ);
    playerGroup.userData.isPlayer = true;
    playerGroup.userData.isPlayer2 = isPlayer2;
    
    scene.add(playerGroup);
    
    if (isPlayer2) {
        player2 = playerGroup;
    } else {
        player = playerGroup;
    }
    
    // Create collision box (invisible)
    const boxHelper = new THREE.Box3().setFromObject(playerGroup);
    playerGroup.userData.boundingBox = boxHelper;
}

// Initialize UI
function initUI() {
    // Color selector
    const colorSelector = document.getElementById('colorSelector');
    BIRD_COLORS.forEach((color, index) => {
        const colorOption = document.createElement('div');
        colorOption.className = 'color-option';
        if (index === 0) colorOption.classList.add('selected');
        colorOption.style.backgroundColor = '#' + color.toString(16).padStart(6, '0');
        colorOption.addEventListener('click', () => {
            document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
            colorOption.classList.add('selected');
            selectedColorIndex = index;
            if (player) {
                updatePlayerColor();
            }
        });
        colorSelector.appendChild(colorOption);
    });

    // Multiplayer toggle
    const multiplayerToggle = document.getElementById('multiplayerToggle');
    const instructionsText = document.getElementById('instructionsText');
    const scoreDisplay = document.getElementById('scoreDisplay');
    multiplayerToggle.addEventListener('click', () => {
        isMultiplayer = !isMultiplayer;
        multiplayerToggle.textContent = `2 Players: ${isMultiplayer ? 'ON' : 'OFF'}`;
        multiplayerToggle.style.background = isMultiplayer ? '#4CAF50' : '#2196F3';
        document.getElementById('scoreDisplay2').style.display = isMultiplayer ? 'block' : 'none';
        instructionsText.style.display = isMultiplayer ? 'block' : 'none';
        // Update score display format
        const currentScore = scoreDisplay.textContent.replace(/^P1: /, '');
        scoreDisplay.textContent = isMultiplayer ? `P1: ${currentScore}` : currentScore;
    });

    // Start button
    document.getElementById('startButton').addEventListener('click', startGame);
    
    // Restart button
    document.getElementById('restartButton').addEventListener('click', restartGame);
}

// Update player color
function updatePlayerColor() {
    const color = BIRD_COLORS[selectedColorIndex];
    player.children.forEach(child => {
        if (child.material && child.material.color) {
            if (child.material.color.getHex() !== 0xff9800 && // Not beak
                child.material.color.getHex() !== 0x000000) { // Not eye
                child.material.color.setHex(color);
            }
        }
    });
}

// Setup Controls
function setupControls() {
    // Desktop keyboard controls
    const keys = {};
    
    window.addEventListener('keydown', (e) => {
        keys[e.key.toLowerCase()] = true;
        
        if (gameState === 'playing') {
            // Player 1 controls (WASD + Space)
            if (e.key.toLowerCase() === 'w') {
                moveForward();
                e.preventDefault();
            } else if (e.key.toLowerCase() === 'a') {
                moveLeft();
                e.preventDefault();
            } else if (e.key.toLowerCase() === 'd') {
                moveRight();
                e.preventDefault();
            } else if (e.key === ' ') {
                jump();
                e.preventDefault();
            }
            
            // Player 2 controls (Arrow keys + Enter for jump) - only in multiplayer
            if (isMultiplayer && player2) {
                if (e.key === 'ArrowUp') {
                    moveForward2();
                    e.preventDefault();
                } else if (e.key === 'ArrowLeft') {
                    moveLeft2();
                    e.preventDefault();
                } else if (e.key === 'ArrowRight') {
                    moveRight2();
                    e.preventDefault();
                } else if (e.key === 'Enter') {
                    jump2();
                    e.preventDefault();
                }
            }
        }
    });

    window.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
    });

    // Mobile touch controls - attach to both canvas and body for better compatibility
    const canvas = document.getElementById('gameCanvas');
    const handleTouchStart = (e) => {
        // Only handle game controls when playing
        if (gameState !== 'playing') return;
        
        // Check if touch is on a UI element (button, etc)
        const target = e.target;
        if (target.tagName === 'BUTTON' || target.closest('button') || target.closest('.screen.active')) {
            return; // Let UI handle it
        }
        
        e.preventDefault();
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchStartTime = Date.now();
            touchMoved = false;
        }
    };
    
    const handleTouchMove = (e) => {
        if (gameState !== 'playing') return;
        
        const target = e.target;
        if (target.tagName === 'BUTTON' || target.closest('button') || target.closest('.screen.active')) {
            return;
        }
        
        e.preventDefault();
        touchMoved = true;
    };
    
    const handleTouchEnd = (e) => {
        // Only handle game controls when playing
        if (gameState !== 'playing') return;
        
        // Check if touch is on a UI element
        const target = e.target;
        if (target.tagName === 'BUTTON' || target.closest('button') || target.closest('.screen.active')) {
            return; // Let UI handle it
        }
        
        e.preventDefault();
        
        if (!touchMoved && e.changedTouches.length > 0) {
            // Tap = jump
            const touch = e.changedTouches[0];
            const touchDuration = Date.now() - touchStartTime;
            if (touchDuration < 300) {
                // Split-screen for mobile multiplayer: left half = P1, right half = P2
                if (isMultiplayer && window.innerWidth < 768) {
                    const screenWidth = window.innerWidth;
                    const touchX = touch.clientX;
                    if (touchX < screenWidth / 2) {
                        // Left half - Player 1
                        jump();
                    } else {
                        // Right half - Player 2
                        if (player2Alive) jump2();
                    }
                } else {
                    // Single player or desktop - always Player 1
                    jump();
                }
            }
        } else if (e.changedTouches.length > 0 && touchMoved) {
            // Swipe
            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - touchStartX;
            const deltaY = touch.clientY - touchStartY;
            const deltaTime = Date.now() - touchStartTime;
            
            // Minimum swipe distance (reduced for mobile)
            const minSwipeDistance = 20;
            const minSwipeSpeed = 0.2; // pixels per ms (reduced threshold)
            
            // Split-screen for mobile multiplayer: left half = P1, right half = P2
            const isMultiplayerMobile = isMultiplayer && window.innerWidth < 768;
            const screenWidth = window.innerWidth;
            const touchStartXPos = touchStartX;
            const isPlayer2Zone = isMultiplayerMobile && touchStartXPos >= screenWidth / 2;
            
            if (deltaTime > 0 && deltaTime < 500) { // Max swipe time
                const speedX = Math.abs(deltaX) / deltaTime;
                const speedY = Math.abs(deltaY) / deltaTime;
                
                if (Math.abs(deltaY) > Math.abs(deltaX)) {
                    // Vertical swipe
                    if (deltaY < -minSwipeDistance && speedY > minSwipeSpeed) {
                        // Swipe up = move forward
                        if (isPlayer2Zone && player2Alive) {
                            moveForward2();
                        } else {
                            moveForward();
                        }
                    }
                } else {
                    // Horizontal swipe
                    if (deltaX < -minSwipeDistance && speedX > minSwipeSpeed) {
                        // Swipe left
                        if (isPlayer2Zone && player2Alive) {
                            moveLeft2();
                        } else {
                            moveLeft();
                        }
                    } else if (deltaX > minSwipeDistance && speedX > minSwipeSpeed) {
                        // Swipe right
                        if (isPlayer2Zone && player2Alive) {
                            moveRight2();
                        } else {
                            moveRight();
                        }
                    }
                }
            }
        }
    };
    
    // Attach to canvas
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // Also attach to body as fallback (helps with some mobile browsers)
    document.body.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.body.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.body.addEventListener('touchend', handleTouchEnd, { passive: false });
}

// Movement Functions - Player 1
function moveForward() {
    if (gameState !== 'playing' || isJumping || !playerAlive) return;
    targetZ = playerZ + TILE_SIZE;
    targetX = playerX;
    performMove();
}

function moveLeft() {
    if (gameState !== 'playing' || isJumping || !playerAlive) return;
    const newX = Math.max(playerX - TILE_SIZE, -(GRID_SIZE - 1) * TILE_SIZE / 2);
    targetX = newX;
    targetZ = playerZ;
    performMove();
}

function moveRight() {
    if (gameState !== 'playing' || isJumping || !playerAlive) return;
    const newX = Math.min(playerX + TILE_SIZE, (GRID_SIZE - 1) * TILE_SIZE / 2);
    targetX = newX;
    targetZ = playerZ;
    performMove();
}

function jump() {
    const now = Date.now();
    if (gameState !== 'playing' || isJumping || !playerAlive || (now - lastJumpTime) < JUMP_COOLDOWN) return;
    
    lastJumpTime = now;
    isJumping = true;
    
    // Animate jump
    const startY = player.position.y;
    const jumpHeight = 0.8;
    const jumpDuration = 300;
    const startTime = Date.now();
    
    function jumpAnimation() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / jumpDuration, 1);
        
        // Parabolic jump
        const y = startY + jumpHeight * Math.sin(progress * Math.PI);
        player.position.y = y;
        
        if (progress < 1) {
            requestAnimationFrame(jumpAnimation);
        } else {
            player.position.y = startY;
            isJumping = false;
        }
    }
    
    jumpAnimation();
}

// Movement Functions - Player 2
function moveForward2() {
    if (gameState !== 'playing' || !isMultiplayer || !player2 || isJumping2 || !player2Alive) return;
    targetZ2 = player2Z + TILE_SIZE;
    targetX2 = player2X;
    performMove2();
}

function moveLeft2() {
    if (gameState !== 'playing' || !isMultiplayer || !player2 || isJumping2 || !player2Alive) return;
    const newX = Math.max(player2X - TILE_SIZE, -(GRID_SIZE - 1) * TILE_SIZE / 2);
    targetX2 = newX;
    targetZ2 = player2Z;
    performMove2();
}

function moveRight2() {
    if (gameState !== 'playing' || !isMultiplayer || !player2 || isJumping2 || !player2Alive) return;
    const newX = Math.min(player2X + TILE_SIZE, (GRID_SIZE - 1) * TILE_SIZE / 2);
    targetX2 = newX;
    targetZ2 = player2Z;
    performMove2();
}

function jump2() {
    const now = Date.now();
    if (gameState !== 'playing' || !isMultiplayer || !player2 || isJumping2 || !player2Alive || (now - lastJumpTime2) < JUMP_COOLDOWN) return;
    
    lastJumpTime2 = now;
    isJumping2 = true;
    
    // Animate jump
    const startY = player2.position.y;
    const jumpHeight = 0.8;
    const jumpDuration = 300;
    const startTime = Date.now();
    
    function jumpAnimation() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / jumpDuration, 1);
        
        // Parabolic jump
        const y = startY + jumpHeight * Math.sin(progress * Math.PI);
        player2.position.y = y;
        
        if (progress < 1) {
            requestAnimationFrame(jumpAnimation);
        } else {
            player2.position.y = startY;
            isJumping2 = false;
        }
    }
    
    jumpAnimation();
}

function performMove() {
    if (isJumping) return;
    
    isJumping = true;
    const startX = player.position.x;
    const startZ = player.position.z;
    const moveDuration = 200;
    const startTime = Date.now();
    
    function moveAnimation() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / moveDuration, 1);
        
        // Smooth easing
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        player.position.x = startX + (targetX - startX) * easeProgress;
        player.position.z = startZ + (targetZ - startZ) * easeProgress;
        
        // Small hop animation
        player.position.y = Math.sin(progress * Math.PI) * 0.3;
        
        if (progress < 1) {
            requestAnimationFrame(moveAnimation);
        } else {
            player.position.x = targetX;
            player.position.z = targetZ;
            player.position.y = 0;
            playerX = targetX;
            playerZ = targetZ;
            isJumping = false;
            
            // Update score when moving forward
            if (playerZ > PLAYER_START_Z) {
                score = Math.floor(playerZ / TILE_SIZE);
                const scoreText = isMultiplayer ? `P1: ${score}` : score;
                document.getElementById('scoreDisplay').textContent = scoreText;
            }
            
            // Generate new tiles ahead (based on furthest alive player)
            let furthestZ = playerZ;
            if (isMultiplayer && player2) {
                if (playerAlive && player2Alive) {
                    furthestZ = Math.max(playerZ, player2Z);
                } else if (playerAlive) {
                    furthestZ = playerZ;
                } else if (player2Alive) {
                    furthestZ = player2Z;
                }
            }
            generateTilesAhead(furthestZ);
            
            // Remove tiles behind (based on furthest alive player)
            removeTilesBehind(furthestZ);
            
            // Check collisions
            checkCollisions();
        }
    }
    
    moveAnimation();
}

function performMove2() {
    if (isJumping2 || !player2 || !player2Alive) return;
    
    isJumping2 = true;
    const startX = player2.position.x;
    const startZ = player2.position.z;
    const moveDuration = 200;
    const startTime = Date.now();
    
    function moveAnimation() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / moveDuration, 1);
        
        // Smooth easing
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        player2.position.x = startX + (targetX2 - startX) * easeProgress;
        player2.position.z = startZ + (targetZ2 - startZ) * easeProgress;
        
        // Small hop animation
        player2.position.y = Math.sin(progress * Math.PI) * 0.3;
        
        if (progress < 1) {
            requestAnimationFrame(moveAnimation);
        } else {
            player2.position.x = targetX2;
            player2.position.z = targetZ2;
            player2.position.y = 0;
            player2X = targetX2;
            player2Z = targetZ2;
            isJumping2 = false;
            
            // Update score when moving forward
            if (player2Z > PLAYER_START_Z) {
                score2 = Math.floor(player2Z / TILE_SIZE);
                document.getElementById('scoreDisplay2').textContent = `P2: ${score2}`;
            }
            
            // Generate new tiles ahead (based on furthest alive player)
            let furthestZ = player2Z;
            if (playerAlive && player2Alive) {
                furthestZ = Math.max(playerZ, player2Z);
            } else if (playerAlive) {
                furthestZ = playerZ;
            } else if (player2Alive) {
                furthestZ = player2Z;
            }
            generateTilesAhead(furthestZ);
            
            // Remove tiles behind
            removeTilesBehind(furthestZ);
            
            // Check collisions
            checkCollisions();
        }
    }
    
    moveAnimation();
}

// Tile Generation
function generateInitialTiles() {
    for (let z = PLAYER_START_Z - 5; z < PLAYER_START_Z + TILE_GENERATION_DISTANCE; z += TILE_SIZE) {
        generateRow(z);
    }
}

function generateTilesAhead(furthestPlayerZ = playerZ) {
    const maxZ = furthestPlayerZ + TILE_GENERATION_DISTANCE;
    
    // Get the maximum Z coordinate from existing tiles
    let currentMaxZ = furthestPlayerZ - 10; // Default fallback
    if (tiles.size > 0) {
        const zValues = Array.from(tiles.keys()).map(k => {
            // Key format is "row_Z", extract Z value
            const match = k.match(/row_(-?\d+)/);
            return match ? parseInt(match[1]) : -Infinity;
        });
        currentMaxZ = Math.max(...zValues);
    }
    
    if (maxZ > currentMaxZ) {
        for (let z = currentMaxZ + TILE_SIZE; z <= maxZ; z += TILE_SIZE) {
            generateRow(z);
        }
    }
}

function generateRow(z) {
    const rowKey = `row_${z}`;
    if (tiles.has(rowKey)) return;
    
    // Determine tile type (simple pattern)
    const rowIndex = Math.floor(z / TILE_SIZE);
    let tileType = 'grass';
    
    if (rowIndex % 5 === 0 && rowIndex > 0) {
        tileType = 'road';
    } else if (rowIndex % 7 === 0 && rowIndex > 2) {
        tileType = 'river';
    } else if (rowIndex % 9 === 0 && rowIndex > 4) {
        tileType = 'railroad';
    }
    
    // For roads, determine direction for all cars in this row (like real traffic lanes)
    let roadDirection = null;
    if (tileType === 'road') {
        roadDirection = rowIndex % 2 === 0 ? 1 : -1; // Alternate directions per row
    }
    
    // For railroads, determine direction for all trains in this row
    let trainDirection = null;
    if (tileType === 'railroad') {
        trainDirection = rowIndex % 2 === 0 ? 1 : -1; // Alternate directions per row
    }
    
    const rowTiles = [];
    
    for (let x = -(GRID_SIZE - 1) * TILE_SIZE / 2; x <= (GRID_SIZE - 1) * TILE_SIZE / 2; x += TILE_SIZE) {
        const tile = createTile(x, z, tileType, roadDirection, trainDirection);
        rowTiles.push(tile);
        scene.add(tile.group);
    }
    
    tiles.set(rowKey, { type: tileType, tiles: rowTiles, z: z });
    
    // Add buildings on the sides of the map
    generateBuildingsForRow(z);
}

function createTile(x, z, type, roadDirection = null, trainDirection = null) {
    const tileGroup = new THREE.Group();
    
    let material;
    if (type === 'grass') {
        material = new THREE.MeshStandardMaterial({ 
            color: 0x7cb342,
            roughness: 0.8
        });
    } else if (type === 'road') {
        material = new THREE.MeshStandardMaterial({ 
            color: 0x424242,
            roughness: 0.9
        });
    } else if (type === 'river') {
        material = new THREE.MeshStandardMaterial({ 
            color: 0x1976d2,
            roughness: 0.3,
            transparent: true,
            opacity: 0.8
        });
    } else if (type === 'railroad') {
        material = new THREE.MeshStandardMaterial({ 
            color: 0x3e2723,
            roughness: 0.9
        });
    }
    
    const geometry = new THREE.BoxGeometry(TILE_SIZE, 0.2, TILE_SIZE);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = -0.1;
    mesh.receiveShadow = true;
    tileGroup.add(mesh);
    
    tileGroup.position.set(x, 0, z);
    
    // Add road markings
    if (type === 'road') {
        const lineGeometry = new THREE.BoxGeometry(0.1, 0.21, TILE_SIZE);
        const lineMaterial = new THREE.MeshStandardMaterial({ color: 0xffeb3b });
        const line = new THREE.Mesh(lineGeometry, lineMaterial);
        line.position.y = -0.09;
        tileGroup.add(line);
    }
    
    // Add railroad tracks
    if (type === 'railroad') {
        // Wooden ties
        const tieGeometry = new THREE.BoxGeometry(0.15, 0.15, TILE_SIZE * 0.3);
        const tieMaterial = new THREE.MeshStandardMaterial({ color: 0x5d4037 });
        for (let i = -1; i <= 1; i += 2) {
            const tie = new THREE.Mesh(tieGeometry, tieMaterial);
            tie.position.set(i * 0.4, -0.07, 0);
            tileGroup.add(tie);
        }
        // Rails (metal tracks)
        const railGeometry = new THREE.BoxGeometry(0.05, 0.1, TILE_SIZE);
        const railMaterial = new THREE.MeshStandardMaterial({ color: 0x757575, metalness: 0.8 });
        for (let i = -1; i <= 1; i += 2) {
            const rail = new THREE.Mesh(railGeometry, railMaterial);
            rail.position.set(i * 0.4, -0.02, 0);
            tileGroup.add(rail);
        }
    }
    
    // Create obstacles
    if (type === 'road') {
        // Add cars (randomly placed, not on all tiles)
        // All cars on the same road row move in the same direction (like real traffic)
        if (Math.random() > 0.5) {
            const car = createCar(x, z, roadDirection);
            cars.push(car);
            obstacles.push(car);
        }
    } else if (type === 'river') {
        // Add logs (more frequent for easier crossing)
        if (Math.random() > 0.4) {
            const log = createLog(x, z);
            logs.push(log);
            obstacles.push(log);
        }
    } else if (type === 'railroad') {
        // Add trains (less frequent than cars, but more impactful)
        if (Math.random() > 0.7) {
            const train = createTrain(x, z, trainDirection);
            trains.push(train);
            obstacles.push(train);
        }
    }
    
    return {
        group: tileGroup,
        type: type,
        x: x,
        z: z
    };
}

// Create Car
function createCar(x, z, direction = null) {
    const carGroup = new THREE.Group();
    
    // Car body
    const bodyGeometry = new THREE.BoxGeometry(0.6, 0.4, 1.2);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: Math.random() > 0.5 ? 0xff5722 : 0x2196f3,
        roughness: 0.7
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.3;
    body.castShadow = true;
    carGroup.add(body);
    
    // Car top
    const topGeometry = new THREE.BoxGeometry(0.5, 0.3, 0.8);
    const topMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x212121,
        roughness: 0.8
    });
    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.set(0, 0.55, -0.1);
    top.castShadow = true;
    carGroup.add(top);
    
    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    
    const wheelPositions = [
        [-0.3, 0.15, 0.5],
        [0.3, 0.15, 0.5],
        [-0.3, 0.15, -0.5],
        [0.3, 0.15, -0.5]
    ];
    
    wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.position.set(...pos);
        wheel.rotation.z = Math.PI / 2;
        wheel.castShadow = true;
        carGroup.add(wheel);
    });
    
    carGroup.position.set(x, 0, z);
    
    // Use provided direction (for consistent traffic flow) or random
    const carDirection = direction !== null ? direction : (Math.random() > 0.5 ? 1 : -1);
    const speed = CAR_SPEED_BASE * (1 + Math.random() * 0.5);
    
    // Rotate car to face sideways (perpendicular to road)
    // If moving right (positive X), rotate 90°; if moving left (negative X), rotate -90°
    carGroup.rotation.y = carDirection > 0 ? Math.PI / 2 : -Math.PI / 2;
    
    carGroup.userData = {
        isCar: true,
        direction: carDirection,
        speed: speed,
        startX: x,
        bounds: GRID_SIZE * TILE_SIZE / 2
    };
    
    scene.add(carGroup);
    
    return carGroup;
}

// Create Log
function createLog(x, z) {
    const logGroup = new THREE.Group();
    
    const logGeometry = new THREE.CylinderGeometry(0.3, 0.3, TILE_SIZE * 0.8, 8);
    const logMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x6d4c41,
        roughness: 0.9
    });
    const log = new THREE.Mesh(logGeometry, logMaterial);
    log.rotation.z = Math.PI / 2;
    log.position.y = 0.2;
    log.castShadow = true;
    log.receiveShadow = true;
    logGroup.add(log);
    
    logGroup.position.set(x, 0, z);
    
    // Random direction and speed
    const direction = Math.random() > 0.5 ? 1 : -1;
    const speed = LOG_SPEED_BASE * (1 + Math.random() * 0.5);
    
    logGroup.userData = {
        isLog: true,
        direction: direction,
        speed: speed,
        startX: x,
        bounds: GRID_SIZE * TILE_SIZE / 2
    };
    
    scene.add(logGroup);
    
    return logGroup;
}

// Create Building
function createBuilding(x, z, height = null) {
    const buildingGroup = new THREE.Group();
    
    // Random height if not specified (2-5 stories)
    const buildingHeight = height !== null ? height : (2 + Math.random() * 3);
    const buildingWidth = TILE_SIZE * 0.8;
    const buildingDepth = TILE_SIZE * 0.8;
    
    // Building body
    const bodyGeometry = new THREE.BoxGeometry(buildingWidth, buildingHeight, buildingDepth);
    const buildingColors = [
        0x757575, // Gray
        0x607d8b, // Blue gray
        0x78909c, // Light blue gray
        0x90a4ae, // Lighter gray
        0x546e7a, // Dark blue gray
        0x9e9e9e, // Medium gray
    ];
    const bodyColor = buildingColors[Math.floor(Math.random() * buildingColors.length)];
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: bodyColor,
        roughness: 0.8
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = buildingHeight / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    buildingGroup.add(body);
    
    // Add windows
    const windowRows = Math.floor(buildingHeight / 1.5);
    const windowCols = 2;
    const windowSize = 0.3;
    const windowSpacing = buildingWidth / (windowCols + 1);
    
    for (let row = 0; row < windowRows; row++) {
        const yPos = (row + 1) * (buildingHeight / (windowRows + 1));
        for (let col = 0; col < windowCols; col++) {
            const xPos = (col + 1 - windowCols / 2) * windowSpacing;
            
            // Window frame
            const windowGeometry = new THREE.BoxGeometry(windowSize, windowSize * 0.7, 0.05);
            const windowMaterial = new THREE.MeshStandardMaterial({ 
                color: Math.random() > 0.7 ? 0xffd700 : 0x1565c0, // Some windows lit (gold), others dark (blue)
                emissive: Math.random() > 0.7 ? 0xffd700 : 0x000000,
                emissiveIntensity: Math.random() > 0.7 ? 0.3 : 0
            });
            const window = new THREE.Mesh(windowGeometry, windowMaterial);
            window.position.set(xPos, yPos, buildingDepth / 2 + 0.01);
            buildingGroup.add(window);
        }
    }
    
    // Add a simple roof
    const roofGeometry = new THREE.BoxGeometry(buildingWidth * 1.1, 0.2, buildingDepth * 1.1);
    const roofMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x424242,
        roughness: 0.9
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = buildingHeight + 0.1;
    roof.castShadow = true;
    buildingGroup.add(roof);
    
    buildingGroup.position.set(x, 0, z);
    buildingGroup.castShadow = true;
    buildingGroup.receiveShadow = true;
    
    scene.add(buildingGroup);
    
    return buildingGroup;
}

// Generate Buildings for a Row
function generateBuildingsForRow(z) {
    // Place buildings on the left and right sides of the map
    const mapEdge = (GRID_SIZE * TILE_SIZE) / 2 + TILE_SIZE;
    const buildingSpacing = TILE_SIZE * 1.5;
    
    // Left side buildings
    const leftBuildingX = -mapEdge;
    if (Math.random() > 0.3) { // 70% chance to spawn a building
        const building = createBuilding(leftBuildingX, z);
        buildings.push(building);
    }
    
    // Right side buildings
    const rightBuildingX = mapEdge;
    if (Math.random() > 0.3) { // 70% chance to spawn a building
        const building = createBuilding(rightBuildingX, z);
        buildings.push(building);
    }
}

// Create Train
function createTrain(x, z, direction = null) {
    const trainGroup = new THREE.Group();
    
    // Train consists of engine + carriages (3-4 segments)
    const numCarriages = 2 + Math.floor(Math.random() * 2); // 2-3 carriages + engine = 3-4 total
    
    for (let i = 0; i < numCarriages; i++) {
        const isEngine = i === 0;
        const carriageGroup = new THREE.Group();
        
        // Carriage body (longer than cars)
        const bodyLength = isEngine ? 1.8 : 1.6;
        const bodyGeometry = new THREE.BoxGeometry(0.7, 0.5, bodyLength);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: isEngine ? 0xe53935 : (Math.random() > 0.5 ? 0x1976d2 : 0x388e3c),
            roughness: 0.7
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.4;
        body.castShadow = true;
        carriageGroup.add(body);
        
        // Windows
        const windowGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.4);
        const windowMaterial = new THREE.MeshStandardMaterial({ color: 0x1565c0, transparent: true, opacity: 0.6 });
        for (let j = -1; j <= 1; j += 2) {
            const window = new THREE.Mesh(windowGeometry, windowMaterial);
            window.position.set(j * 0.3, 0.5, 0);
            carriageGroup.add(window);
        }
        
        // Wheels (larger than car wheels)
        const wheelGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.12, 16);
        const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
        
        const wheelPositions = [
            [-0.35, 0.2, 0.6],
            [0.35, 0.2, 0.6],
            [-0.35, 0.2, -0.6],
            [0.35, 0.2, -0.6]
        ];
        
        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.position.set(...pos);
            wheel.rotation.z = Math.PI / 2;
            wheel.castShadow = true;
            carriageGroup.add(wheel);
        });
        
        // Position carriage along the train
        const spacing = 1.5;
        carriageGroup.position.z = (i - numCarriages / 2) * spacing;
        trainGroup.add(carriageGroup);
    }
    
    trainGroup.position.set(x, 0, z);
    
    // Use provided direction (for consistent train flow) or random
    const trainDirection = direction !== null ? direction : (Math.random() > 0.5 ? 1 : -1);
    const speed = TRAIN_SPEED_BASE * (1 + Math.random() * 0.3); // Trains move more consistently
    
    // Rotate train to face sideways (perpendicular to tracks)
    trainGroup.rotation.y = trainDirection > 0 ? Math.PI / 2 : -Math.PI / 2;
    
    trainGroup.userData = {
        isTrain: true,
        direction: trainDirection,
        speed: speed,
        startX: x,
        bounds: GRID_SIZE * TILE_SIZE / 2
    };
    
    scene.add(trainGroup);
    
    return trainGroup;
}

// Remove Tiles Behind Player
function removeTilesBehind() {
    const removeZ = playerZ + TILE_REMOVE_DISTANCE;
    
    tiles.forEach((tileData, key) => {
        if (tileData.z < removeZ) {
            // Remove tile meshes
            tileData.tiles.forEach(tile => {
                scene.remove(tile.group);
                tile.group.traverse(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                });
            });
            
            tiles.delete(key);
        }
    });
    
    // Remove obstacles behind player
    obstacles = obstacles.filter(obstacle => {
        if (obstacle.position.z < removeZ) {
            scene.remove(obstacle);
            obstacle.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
            return false;
        }
        return true;
    });
    
    cars = cars.filter(car => car.parent === scene);
    logs = logs.filter(log => log.parent === scene);
    trains = trains.filter(train => train.parent === scene);
    
    // Remove buildings behind player
    buildings = buildings.filter(building => {
        if (building.position.z < removeZ) {
            scene.remove(building);
            building.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
            return false;
        }
        return true;
    });
}

// Update Obstacles
function updateObstacles() {
    const difficultyMultiplier = 1 + (score / 100) * 0.1; // Increase speed with score
    
    obstacles.forEach(obstacle => {
        if (obstacle.userData.isCar) {
            // Cars move continuously in one direction (like real traffic)
            obstacle.position.x += obstacle.userData.direction * obstacle.userData.speed * difficultyMultiplier;
            
            // When car goes off screen, wrap around to the other side
            const bounds = obstacle.userData.bounds;
            if (obstacle.userData.direction > 0 && obstacle.position.x > bounds + 2) {
                // Moving right, teleport to left side
                obstacle.position.x = -bounds - 2;
            } else if (obstacle.userData.direction < 0 && obstacle.position.x < -bounds - 2) {
                // Moving left, teleport to right side
                obstacle.position.x = bounds + 2;
            }
        } else if (obstacle.userData.isTrain) {
            // Trains move continuously in one direction (like real trains)
            obstacle.position.x += obstacle.userData.direction * obstacle.userData.speed * difficultyMultiplier;
            
            // When train goes off screen, wrap around to the other side
            const bounds = obstacle.userData.bounds;
            if (obstacle.userData.direction > 0 && obstacle.position.x > bounds + 3) {
                // Moving right, teleport to left side
                obstacle.position.x = -bounds - 3;
            } else if (obstacle.userData.direction < 0 && obstacle.position.x < -bounds - 3) {
                // Moving left, teleport to right side
                obstacle.position.x = bounds + 3;
            }
        } else if (obstacle.userData.isLog) {
            // Logs still move back and forth
            obstacle.position.x += obstacle.userData.direction * obstacle.userData.speed * difficultyMultiplier;
            
            // Wrap around for logs
            if (Math.abs(obstacle.position.x) > obstacle.userData.bounds) {
                obstacle.userData.direction *= -1;
            }
        }
    });
}

// Kill a player (used in multiplayer - only ends game if both players are dead)
function killPlayer(isPlayer2 = false) {
    if (isPlayer2) {
        if (!player2Alive) return; // Already dead
        player2Alive = false;
        if (player2) {
            // Make player 2 invisible
            player2.visible = false;
            player2.position.y = -10; // Move off screen
        }
    } else {
        if (!playerAlive) return; // Already dead
        playerAlive = false;
        if (player) {
            // Make player 1 invisible
            player.visible = false;
            player.position.y = -10; // Move off screen
        }
    }
    
    // Check if game should end
    if (!isMultiplayer) {
        // Single player mode - game ends immediately
        gameOver();
    } else {
        // Multiplayer mode - only end if both players are dead
        if (!playerAlive && !player2Alive) {
            gameOver();
        }
    }
}

// Collision Detection
function checkCollisions() {
    // Check player 1 (only if alive)
    if (playerAlive && player) {
        const playerBox = new THREE.Box3().setFromObject(player);
        playerBox.expandByScalar(0.3); // Add padding
        
        obstacles.forEach(obstacle => {
            const obstacleBox = new THREE.Box3().setFromObject(obstacle);
            
            if (playerBox.intersectsBox(obstacleBox)) {
                if (obstacle.userData.isCar || obstacle.userData.isTrain) {
                    // Hit by car or train
                    killPlayer(false);
                    return;
                }
            }
        });
        
        // Check if player 1 is on water without a log
        const playerTileZ = Math.round(playerZ / TILE_SIZE) * TILE_SIZE;
        const rowKey = `row_${playerTileZ}`;
        const tileData = tiles.get(rowKey);
        
        if (tileData && tileData.type === 'river') {
            // Check if player is on a log
            let onLog = false;
            logs.forEach(log => {
                // Check if log is on the same row (Z coordinate)
                const logZ = log.position.z;
                const zDistance = Math.abs(logZ - playerZ);
                
                if (zDistance < 1.0) { // More lenient Z distance check
                    // Check X position - player needs to be close to log's X position
                    const xDistance = Math.abs(log.position.x - player.position.x);
                    const logLength = TILE_SIZE * 0.9; // Log length (updated to match geometry)
                    
                    // Player is on log if within log's length/2 + some padding (more forgiving)
                    if (xDistance < (logLength / 2 + 0.6)) {
                        onLog = true;
                        // Move player with log (sync both visual and grid position)
                        player.position.x = log.position.x;
                        playerX = log.position.x;
                        targetX = log.position.x;
                    }
                }
            });
            
            if (!onLog && Math.abs(player.position.y) < 0.5) {
                // In water without log
                killPlayer(false);
                return;
            }
        }
    }
    
    // Check player 2 (if multiplayer and alive)
    if (isMultiplayer && player2Alive && player2) {
        const player2Box = new THREE.Box3().setFromObject(player2);
        player2Box.expandByScalar(0.3);
        
        obstacles.forEach(obstacle => {
            const obstacleBox = new THREE.Box3().setFromObject(obstacle);
            
            if (player2Box.intersectsBox(obstacleBox)) {
                if (obstacle.userData.isCar || obstacle.userData.isTrain) {
                    // Hit by car or train
                    killPlayer(true);
                    return;
                }
            }
        });
        
        // Check if player 2 is on water without a log
        const player2TileZ = Math.round(player2Z / TILE_SIZE) * TILE_SIZE;
        const rowKey2 = `row_${player2TileZ}`;
        const tileData2 = tiles.get(rowKey2);
        
        if (tileData2 && tileData2.type === 'river') {
            let onLog2 = false;
            logs.forEach(log => {
                const logZ = log.position.z;
                const zDistance = Math.abs(logZ - player2Z);
                
                if (zDistance < 1.0) {
                    const xDistance = Math.abs(log.position.x - player2.position.x);
                    const logLength = TILE_SIZE * 0.9;
                    
                    if (xDistance < (logLength / 2 + 0.6)) {
                        onLog2 = true;
                        player2.position.x = log.position.x;
                        player2X = log.position.x;
                        targetX2 = log.position.x;
                    }
                }
            });
            
            if (!onLog2 && Math.abs(player2.position.y) < 0.5) {
                killPlayer(true);
                return;
            }
        }
    }
}

// Camera Update
function updateCamera() {
    if (gameState !== 'playing') return;
    
    let centerX, centerZ, furthestZ;
    
    if (isMultiplayer && player2) {
        // In multiplayer, camera centers between alive players and follows the furthest one
        if (playerAlive && player2Alive) {
            // Both alive - center between them
            centerX = (playerX + player2X) / 2;
            furthestZ = Math.max(playerZ, player2Z);
            centerZ = (playerZ + player2Z) / 2;
        } else if (playerAlive) {
            // Only player 1 alive
            centerX = playerX;
            furthestZ = playerZ;
            centerZ = playerZ;
        } else if (player2Alive) {
            // Only player 2 alive
            centerX = player2X;
            furthestZ = player2Z;
            centerZ = player2Z;
        } else {
            // Both dead (shouldn't happen, but safety check)
            return;
        }
    } else {
        // Single player mode
        centerX = playerX;
        furthestZ = playerZ;
        centerZ = playerZ;
    }
    
    // Camera should be behind the furthest player (at furthestZ + offset)
    // Camera follows upward, never downward
    const cameraOffsetZ = 12; // Camera stays this distance behind player
    const cameraTargetZ = Math.max(camera.position.z, furthestZ + cameraOffsetZ);
    
    // Smooth camera follow
    camera.position.z += (cameraTargetZ - camera.position.z) * 0.1;
    camera.position.x = centerX;
    
    // Look at center area (slightly ahead)
    camera.lookAt(centerX, 0, centerZ - 2);
    
    // Adjust zoom for mobile (slightly wider in multiplayer when both alive)
    const isMobile = window.innerWidth < 768;
    const baseFov = isMobile ? 70 : 60;
    const targetFov = isMultiplayer && playerAlive && player2Alive ? baseFov + 5 : baseFov; // Wider view in multiplayer
    if (Math.abs(camera.fov - targetFov) > 0.1) {
        camera.fov += (targetFov - camera.fov) * 0.1;
        camera.updateProjectionMatrix();
    }
}

// Game State Functions
function startGame() {
    gameState = 'playing';
    document.getElementById('startScreen').classList.remove('active');
    score = 0;
    score2 = 0;
    playerZ = PLAYER_START_Z;
    playerX = 0;
    player2Z = PLAYER_START_Z;
    player2X = isMultiplayer ? -2 : 0; // Start player 2 slightly to the left in multiplayer
    playerAlive = true;
    player2Alive = true;
    document.getElementById('scoreDisplay').textContent = isMultiplayer ? 'P1: 0' : '0';
    document.getElementById('scoreDisplay2').textContent = 'P2: 0';
    
    // Reset player 1 position
    player.visible = true;
    player.position.set(playerX, 0, playerZ);
    targetX = 0;
    targetZ = PLAYER_START_Z;
    
    // Create/reset player 2 if multiplayer
    if (isMultiplayer) {
        if (player2) {
            scene.remove(player2);
            player2.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material && child.material.map) child.material.map.dispose();
            });
        }
        createPlayer(true); // Create player 2
        player2.visible = true;
        player2.position.set(player2X, 0, player2Z);
        targetX2 = player2X;
        targetZ2 = player2Z;
    } else {
        // Remove player 2 if it exists
        if (player2) {
            scene.remove(player2);
            player2.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material && child.material.map) child.material.map.dispose();
            });
            player2 = null;
        }
    }
    
    camera.position.set(0, 8, PLAYER_START_Z + 12);
    camera.lookAt(0, 0, PLAYER_START_Z - 2);
}

function restartGame() {
    // Clear all tiles and obstacles
    tiles.forEach(tileData => {
        tileData.tiles.forEach(tile => {
            scene.remove(tile.group);
            tile.group.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        });
    });
    tiles.clear();
    
    obstacles.forEach(obstacle => {
        scene.remove(obstacle);
        obstacle.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
    });
    obstacles = [];
    cars = [];
    logs = [];
    trains = [];
    buildings = [];
    
    // Clear buildings
    buildings.forEach(building => {
        scene.remove(building);
        building.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material && child.material.map) child.material.map.dispose();
        });
    });
    
    // Reset player
    scene.remove(player);
    player.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material && child.material.map) child.material.map.dispose();
    });
    // Reset players
    scene.remove(player);
    player.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material && child.material.map) child.material.map.dispose();
    });
    
    if (player2) {
        scene.remove(player2);
        player2.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material && child.material.map) child.material.map.dispose();
        });
        player2 = null;
    }
    
    createPlayer(false); // Create player 1
    
    // Reset game state
    gameState = 'menu';
    document.getElementById('gameOverScreen').classList.remove('active');
    document.getElementById('startScreen').classList.add('active');
}

function gameOver() {
    gameState = 'gameover';
    if (isMultiplayer && player2) {
        document.getElementById('finalScore').textContent = `P1: ${score} | P2: ${score2}`;
    } else {
        document.getElementById('finalScore').textContent = `Score: ${score}`;
    }
    document.getElementById('gameOverScreen').classList.add('active');
}

// Window Resize Handler
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    
    if (gameState === 'playing') {
        updateObstacles();
        updateCamera();
        checkCollisions();
    }
    
    renderer.render(scene, camera);
}

// Initialize when page loads
window.addEventListener('load', init);