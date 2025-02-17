# Fluxel.js

A high-performance, DOM-less UI framework that renders interfaces directly with WebGL, featuring hardware-accelerated effects and efficient state management.

## 🚀 Overview

Fluxel.js is a cutting-edge rendering engine that draws UI directly onto a canvas using GPU-accelerated rendering. Unlike traditional web frameworks, Fluxel.js:

- Bypasses the DOM completely for maximum performance
- Uses WebGL for hardware-accelerated rendering
- Implements efficient batched rendering
- Provides built-in shader-based effects
- Features high-quality text rendering
- Supports modern reactive state management

## 🎨 Feature Highlights

### Advanced Rendering Engine
- WebGL2-based rendering pipeline
- Shader-based UI effects
- Hardware-accelerated gradients and animations
- Efficient batch rendering system
- High-quality text rendering with proper kerning

### Component System
```javascript
// Example button component
const incrementButton = renderer.createComponent(
    'increment',
    new FluxelButton(10, 10, 100, 40, '+', () => {
        counter.increment();
    })
);

// Example text component
const counterText = renderer.createComponent(
    'counter',
    new FluxelText(120, 25, 
        () => counter.getValue().toString(),
        {
            fontSize: 32,
            fontWeight: 'bold',
            textColor: [0.2, 0.2, 0.8, 1.0]
        }
    )
);
```

### Signal-Based State Management
```javascript
const counter = new FluxelSignal(0);

counter.subscribe((newValue) => {
    console.log(`Counter updated: ${newValue}`);
});
```

### Shader-Based Effects
```glsl
// Example of built-in button shader
float roundedRectangle(vec2 position, vec2 size, float radius) {
    vec2 q = abs(position) - size + vec2(radius);
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
}

void main() {
    // Hardware-accelerated rounded corners and gradients
    if (uIsButton) {
        vec2 pixelPos = vTexCoord * vSize;
        float radius = 12.0;
        float dist = roundedRectangle(pixelPos - vSize/2.0, vSize/2.0, radius);
        // ... gradient effects
    }
}
```

## 🛠️ Getting Started

### Installation
```bash
git clone https://github.com/yourusername/fluxel.js.git
cd fluxel.js
```

### Basic Usage
```javascript
// Create a new renderer
const renderer = new FluxelRenderer('canvas-id');

// Create a signal for state management
const counter = new FluxelSignal(0);

// Create UI components
const button = renderer.createComponent(
    'increment',
    new FluxelButton(10, 10, 100, 40, '+', () => {
        counter.set(counter.get() + 1);
    })
);

// Start rendering
renderer.render();
```

## 📦 Project Structure

```
/Fluxel
  ├── src/
  │   ├── core/
  │   │   ├── FluxelRenderer.js     # Main rendering engine
  │   │   ├── BatchRenderer.js      # Batched rendering system
  │   │   ├── BufferManager.js      # WebGL buffer management
  │   │   └── FluxelSignal.js       # State management
  │   └── components/
  │       ├── FluxelComponent.js    # Base component class
  │       ├── FluxelButton.js       # Button component
  │       └── FluxelText.js         # Text component
  └── apps/
      └── counter/                  # Counter demo app
```

## 🔧 Advanced Features

### Custom Components
```javascript
class CustomComponent extends FluxelComponent {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.color = [1.0, 0.0, 0.0, 1.0]; // Red
    }

    handleClick(x, y) {
        if (this.isPointInside(x, y)) {
            // Handle click event
        }
    }
}
```

### Performance Monitoring
```javascript
// Get performance metrics
const metrics = renderer.getMetrics();
console.log(`FPS: ${metrics.fps}`);
console.log(`Draw calls: ${metrics.drawCalls}`);
```

## 🎯 Upcoming Features

- Flexible layout engine
- Animation system
- Advanced event handling
- Component lifecycle management
- Developer tools
- Additional UI components

## 🙏 Acknowledgments

- WebGL2 specifications and documentation
- Modern web framework design patterns
- Game engine UI rendering techniques