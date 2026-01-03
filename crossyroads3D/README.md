# Crossy Roads 3D

A complete 3D Crossy Road-style game built with Three.js, HTML, and JavaScript. Fully mobile-friendly and embeddable in iframes.

## Features

- 🐦 Cute low-poly bird characters with multiple color options
- 🎮 Desktop controls (W/A/D/Space) and mobile swipe/tap controls
- 🗺️ Infinite procedural map generation (grass, roads, rivers)
- 🚗 Moving cars and floating logs as obstacles
- 📱 Fully responsive and mobile-optimized
- 🖼️ Iframe-embeddable (no fullscreen locks, no popups)
- 🎯 Progressive difficulty scaling
- ⚡ Performance optimized for mobile browsers

## How to Run Locally

1. **Download the files:**
   - `index.html`
   - `main.js`

2. **Option A: Simple HTTP Server (Recommended)**
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Python 2
   python -m SimpleHTTPServer 8000
   
   # Using Node.js (http-server)
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   ```

3. **Option B: Open directly in browser**
   - Simply double-click `index.html` (may have CORS restrictions with Three.js CDN)

4. **Access the game:**
   - Open your browser and navigate to `http://localhost:8000`
   - Or open `index.html` directly from your file system

## How to Embed in an iframe

### Basic Embedding

```html
<iframe 
    src="path/to/index.html" 
    width="100%" 
    height="600px"
    frameborder="0"
    scrolling="no">
</iframe>
```

### Responsive Embedding

```html
<style>
    .game-container {
        position: relative;
        width: 100%;
        padding-bottom: 75%; /* 4:3 aspect ratio */
        height: 0;
        overflow: hidden;
    }
    
    .game-container iframe {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border: none;
    }
</style>

<div class="game-container">
    <iframe src="path/to/index.html"></iframe>
</div>
```

### Full Screen Embedding

```html
<iframe 
    src="path/to/index.html" 
    width="100%" 
    height="100vh"
    style="border: none; display: block;">
</iframe>
```

## Controls

### Desktop
- **W** or **↑** = Move forward (up)
- **A** or **←** = Move left
- **D** or **→** = Move right
- **Space** = Jump

### Mobile
- **Swipe Up** = Move forward
- **Swipe Left** = Move left
- **Swipe Right** = Move right
- **Tap** = Jump

## Game Mechanics

- **Grid-based movement**: Player moves tile by tile
- **Progressive difficulty**: Obstacles move faster as your score increases
- **Tile management**: Tiles are generated ahead and removed behind to optimize performance
- **Collision detection**: Hitting a car or falling in water ends the game
- **Score system**: Points increase as you move upward

## Technical Details

- **Engine**: Three.js r128
- **No build tools required**: Pure HTML/JavaScript
- **No external assets**: All geometry is procedurally generated
- **Mobile optimization**: Limited pixel ratio, optimized draw calls
- **Memory management**: Automatic cleanup of off-screen tiles
- **Responsive camera**: Auto-adjusts for mobile screens

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari (iOS/macOS)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Customization

### Change Bird Colors

Edit the `BIRD_COLORS` array in `main.js`:

```javascript
const BIRD_COLORS = [
    0xff6b6b, // Red (hex color code)
    0x4ecdc4, // Cyan
    // Add more colors...
];
```

### Adjust Game Difficulty

Modify these constants in `main.js`:

```javascript
const CAR_SPEED_BASE = 0.05;  // Base car speed
const LOG_SPEED_BASE = 0.03;  // Base log speed
const JUMP_COOLDOWN = 300;    // Milliseconds between jumps
```

### Change Map Generation

Edit the `generateRow()` function to customize tile patterns:

```javascript
if (rowIndex % 5 === 0 && rowIndex > 0) {
    tileType = 'road';  // Change frequency
}
```

## Notes

- The game uses Three.js from a CDN (cdnjs.cloudflare.com), which should work in iframes
- If you need offline support, download Three.js locally and update the script tag in `index.html`
- Right-click and text selection are disabled for better gameplay experience
- The game handles window resize and orientation changes automatically

## License

Free to use and modify for personal or commercial projects.
