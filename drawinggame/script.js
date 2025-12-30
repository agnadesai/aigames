// Get canvas and context
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
function resizeCanvas() {
    const container = document.querySelector('.canvas-container');
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Make canvas large but allow it to be scrollable
    // Use viewport dimensions as base, but allow larger sizes
    const preferredWidth = Math.max(viewportWidth - 250, 1200);
    const preferredHeight = Math.max(viewportHeight - 200, 800);
    
    canvas.width = Math.min(preferredWidth, 5000);
    canvas.height = Math.min(preferredHeight, 4000);
    
    // Set drawing properties
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
}

// Initialize canvas size
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Drawing state
let isDrawing = false;
let currentTool = 'draw';
let currentColor = '#000000';
let brushSize = 5;
let startPoint = null;
let previewImageData = null;

// Get UI elements
const colorPicker = document.getElementById('colorPicker');
const brushSizeSlider = document.getElementById('brushSize');
const brushSizeValue = document.getElementById('brushSizeValue');
const drawBtn = document.getElementById('drawBtn');
const eraseBtn = document.getElementById('eraseBtn');
const paintBtn = document.getElementById('paintBtn');
const rectBtn = document.getElementById('rectBtn');
const circleBtn = document.getElementById('circleBtn');
const lineBtn = document.getElementById('lineBtn');
const triangleBtn = document.getElementById('triangleBtn');
const clearBtn = document.getElementById('clearBtn');
const saveBtn = document.getElementById('saveBtn');
const colorSwatches = document.querySelectorAll('.color-swatch');

// All tool buttons
const allToolButtons = [drawBtn, eraseBtn, paintBtn, rectBtn, circleBtn, lineBtn, triangleBtn];

// Update brush size display
brushSizeSlider.addEventListener('input', (e) => {
    brushSize = parseInt(e.target.value);
    brushSizeValue.textContent = brushSize;
});

// Color picker
colorPicker.addEventListener('input', (e) => {
    currentColor = e.target.value;
    updateActiveColorSwatch(currentColor);
});

// Color swatches
colorSwatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
        const color = swatch.getAttribute('data-color');
        currentColor = color;
        colorPicker.value = color;
        updateActiveColorSwatch(color);
    });
});

function updateActiveColorSwatch(color) {
    colorSwatches.forEach(swatch => {
        if (swatch.getAttribute('data-color') === color) {
            swatch.classList.add('active');
        } else {
            swatch.classList.remove('active');
        }
    });
}

// Function to deactivate all tool buttons
function deactivateAllTools() {
    allToolButtons.forEach(btn => btn.classList.remove('active'));
}

// Tool buttons
drawBtn.addEventListener('click', () => {
    currentTool = 'draw';
    deactivateAllTools();
    drawBtn.classList.add('active');
    canvas.style.cursor = 'crosshair';
});

eraseBtn.addEventListener('click', () => {
    currentTool = 'erase';
    deactivateAllTools();
    eraseBtn.classList.add('active');
    canvas.style.cursor = 'grab';
});

paintBtn.addEventListener('click', () => {
    currentTool = 'paint';
    deactivateAllTools();
    paintBtn.classList.add('active');
    canvas.style.cursor = 'crosshair';
});

rectBtn.addEventListener('click', () => {
    currentTool = 'rectangle';
    deactivateAllTools();
    rectBtn.classList.add('active');
    canvas.style.cursor = 'crosshair';
});

circleBtn.addEventListener('click', () => {
    currentTool = 'circle';
    deactivateAllTools();
    circleBtn.classList.add('active');
    canvas.style.cursor = 'crosshair';
});

lineBtn.addEventListener('click', () => {
    currentTool = 'line';
    deactivateAllTools();
    lineBtn.classList.add('active');
    canvas.style.cursor = 'crosshair';
});

triangleBtn.addEventListener('click', () => {
    currentTool = 'triangle';
    deactivateAllTools();
    triangleBtn.classList.add('active');
    canvas.style.cursor = 'crosshair';
});

// Clear canvas
clearBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the canvas?')) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
});

// Save canvas
saveBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'drawing.png';
    link.href = canvas.toDataURL();
    link.click();
});

// Save canvas state for preview
function saveCanvasState() {
    previewImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
}

// Restore canvas state
function restoreCanvasState() {
    if (previewImageData) {
        ctx.putImageData(previewImageData, 0, 0);
    }
}

// Flood fill algorithm
function floodFill(x, y, fillColor) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;
    
    // Convert fill color to RGBA
    const fillR = parseInt(fillColor.slice(1, 3), 16);
    const fillG = parseInt(fillColor.slice(3, 5), 16);
    const fillB = parseInt(fillColor.slice(5, 7), 16);
    const fillA = 255;
    
    // Get target color at starting point
    const startIdx = (Math.floor(y) * width + Math.floor(x)) * 4;
    const targetR = data[startIdx];
    const targetG = data[startIdx + 1];
    const targetB = data[startIdx + 2];
    const targetA = data[startIdx + 3];
    
    // If target color matches fill color, return
    if (targetR === fillR && targetG === fillG && targetB === fillB && targetA === fillA) {
        return;
    }
    
    // Stack-based flood fill
    const stack = [[Math.floor(x), Math.floor(y)]];
    const visited = new Set();
    
    while (stack.length > 0) {
        const [px, py] = stack.pop();
        const key = `${px},${py}`;
        
        if (visited.has(key) || px < 0 || px >= width || py < 0 || py >= height) {
            continue;
        }
        
        const idx = (py * width + px) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];
        
        // Check if pixel matches target color (with tolerance for anti-aliasing)
        if (Math.abs(r - targetR) < 10 && Math.abs(g - targetG) < 10 && 
            Math.abs(b - targetB) < 10 && Math.abs(a - targetA) < 10) {
            visited.add(key);
            
            // Fill the pixel
            data[idx] = fillR;
            data[idx + 1] = fillG;
            data[idx + 2] = fillB;
            data[idx + 3] = fillA;
            
            // Add neighbors to stack
            stack.push([px + 1, py]);
            stack.push([px - 1, py]);
            stack.push([px, py + 1]);
            stack.push([px, py - 1]);
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
}

// Drawing functions
function startDrawing(e) {
    if (currentTool === 'paint') {
        const point = getPoint(e);
        floodFill(point.x, point.y, currentColor);
        return;
    }
    
    if (['rectangle', 'circle', 'line', 'triangle'].includes(currentTool)) {
        isDrawing = true;
        startPoint = getPoint(e);
        saveCanvasState();
        return;
    }
    
    // Free draw or erase
    isDrawing = true;
    const point = getPoint(e);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
}

function draw(e) {
    if (!isDrawing) return;
    
    // Handle shape tools
    if (startPoint && ['rectangle', 'circle', 'line', 'triangle'].includes(currentTool)) {
        const currentPoint = getPoint(e);
        
        // Restore canvas and draw preview
        restoreCanvasState();
        
        ctx.strokeStyle = currentColor;
        ctx.fillStyle = currentColor;
        ctx.lineWidth = brushSize;
        ctx.globalCompositeOperation = 'source-over';
        
        if (currentTool === 'rectangle') {
            const width = currentPoint.x - startPoint.x;
            const height = currentPoint.y - startPoint.y;
            ctx.strokeRect(startPoint.x, startPoint.y, width, height);
        } else if (currentTool === 'circle') {
            const radius = Math.sqrt(
                Math.pow(currentPoint.x - startPoint.x, 2) + 
                Math.pow(currentPoint.y - startPoint.y, 2)
            );
            ctx.beginPath();
            ctx.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI);
            ctx.stroke();
        } else if (currentTool === 'line') {
            ctx.beginPath();
            ctx.moveTo(startPoint.x, startPoint.y);
            ctx.lineTo(currentPoint.x, currentPoint.y);
            ctx.stroke();
        } else if (currentTool === 'triangle') {
            ctx.beginPath();
            ctx.moveTo(startPoint.x, startPoint.y);
            ctx.lineTo(currentPoint.x, currentPoint.y);
            ctx.lineTo(startPoint.x * 2 - currentPoint.x, currentPoint.y);
            ctx.closePath();
            ctx.stroke();
        }
        return;
    }
    
    // Handle free draw or erase
    const point = getPoint(e);
    
    if (currentTool === 'draw') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = currentColor;
    } else if (currentTool === 'erase') {
        ctx.globalCompositeOperation = 'destination-out';
    }
    
    ctx.lineWidth = brushSize;
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
}

function stopDrawing() {
    if (isDrawing && startPoint) {
        // Finalize shape drawing
        previewImageData = null;
        startPoint = null;
        isDrawing = false;
    } else if (isDrawing) {
        // Free draw or erase
        isDrawing = false;
        ctx.beginPath();
    }
}

// Get point coordinates (handles both mouse and touch)
function getPoint(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    if (e.touches && e.touches.length > 0) {
        return {
            x: (e.touches[0].clientX - rect.left) * scaleX,
            y: (e.touches[0].clientY - rect.top) * scaleY
        };
    } else {
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }
}

// Mouse events
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

// Touch events (for mobile)
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startDrawing(e);
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (['rectangle', 'circle', 'line', 'triangle'].includes(currentTool)) {
        draw(e);
    } else {
        draw(e);
    }
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    stopDrawing();
});

canvas.addEventListener('touchcancel', (e) => {
    e.preventDefault();
    stopDrawing();
});

// Prevent context menu on long press
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// Initialize with black color active
updateActiveColorSwatch(currentColor);
