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

// Get UI elements
const colorPicker = document.getElementById('colorPicker');
const brushSizeSlider = document.getElementById('brushSize');
const brushSizeValue = document.getElementById('brushSizeValue');
const drawBtn = document.getElementById('drawBtn');
const eraseBtn = document.getElementById('eraseBtn');
const clearBtn = document.getElementById('clearBtn');
const saveBtn = document.getElementById('saveBtn');
const colorSwatches = document.querySelectorAll('.color-swatch');

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

// Tool buttons
drawBtn.addEventListener('click', () => {
    currentTool = 'draw';
    drawBtn.classList.add('active');
    eraseBtn.classList.remove('active');
    canvas.style.cursor = 'crosshair';
});

eraseBtn.addEventListener('click', () => {
    currentTool = 'erase';
    eraseBtn.classList.add('active');
    drawBtn.classList.remove('active');
    canvas.style.cursor = 'grab';
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

// Drawing functions
function startDrawing(e) {
    isDrawing = true;
    const point = getPoint(e);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
}

function draw(e) {
    if (!isDrawing) return;
    
    const point = getPoint(e);
    
    if (currentTool === 'draw') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = currentColor;
    } else {
        ctx.globalCompositeOperation = 'destination-out';
    }
    
    ctx.lineWidth = brushSize;
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
}

function stopDrawing() {
    if (isDrawing) {
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
    draw(e);
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

