# Fluxel.js

A DOM-less UI framework that renders UI using WebGL, completely bypassing both the DOM and Shadow DOM for maximum performance.

## 🚀 Overview

Fluxel.js is a lightweight rendering engine that draws UI directly onto a canvas using GPU-accelerated rendering. Unlike traditional web frameworks, Fluxel.js:

- Does not use Virtual DOM
- Does not manipulate the DOM directly
- Does not use Shadow DOM
- Provides high-performance, low-latency updates
- Is compatible with modern browsers
- Is lightweight and easy to use

## 🛠️ Core Features

### Canvas-Based Rendering Model
Instead of relying on the DOM tree, Fluxel.js draws UI components onto a canvas dynamically:
- UI elements are rendered as graphical elements
- Everything is painted onto a canvas using WebGL
- Components are rendered similar to game engine UI

### Signal-Based State Management
- Uses a reactive signal-based update model
- Only repaints what has changed
- No reflow or layout recalculation
- No tree traversal

### GPU-Powered Rendering
- WebGL optimizations for hardware acceleration
- Efficient canvas batching
- Minimal draw calls

### Precompiled UI Components
- Components are pre-compiled into renderable objects
- Flat list structure instead of tree hierarchy
- Ultra-fast lookup and updates

## 📦 Project Structure

```
/Fluxel
  ├── index.html           # Main demo page
  ├── index.js             # Entry point
  ├── FluxelSignal.js      # Signal implementation
  ├── FluxelRenderer.js    # WebGL renderer
  ├── /components          # UI components
  │   ├── FluxelButton.js  # Button component
  │   └── FluxelText.js    # Text component
  └── /apps               
      └── CounterApp.js    # Demo counter application
```

## 🚀 Getting Started

1. Clone the repository:
```bash
git clone https://github.com/RPDevJesco/fluxel.git
cd fluxel
```

2. Start a local development server:
```bash
# Using Python
python -m http.server

# Using Node.js
npx http-server
```

3. Open `http://localhost:8000` in your browser

## 💡 Usage Example

Here's a simple counter app implementation:

```javascript
import { FluxelRenderer } from './FluxelRenderer.js';
import { FluxelSignal } from './FluxelSignal.js';
import { FluxelButton } from './components/FluxelButton.js';
import { FluxelText } from './components/FluxelText.js';

export class CounterApp {
    constructor(canvasId) {
        this.renderer = new FluxelRenderer(canvasId);
        this.count = new FluxelSignal(0);

        // Create UI components
        const incrementButton = this.renderer.createComponent(
            'increment',
            new FluxelButton(10, 10, 100, 30, '+', () => {
                this.count.set(this.count.get() + 1);
            })
        );

        // Add counter display
        const counterText = this.renderer.createComponent(
            'counter',
            new FluxelText(120, 25, () => this.count.get())
        );

        // Start rendering
        this.renderer.render();
    }
}
```

## 🔧 Technical Details

### WebGL Rendering
- Uses WebGL2 for hardware-accelerated graphics
- Efficient shader-based rendering
- Texture-based text rendering
- Optimized vertex and texture coordinate buffers

### Signal System
- Lightweight reactive state management
- Efficient subscription model
- Automatic UI updates on state changes

### Event Handling
- Canvas-based event delegation
- Efficient hit testing
- Hover and click state management

## 🙏 Acknowledgments

- WebGL2 specification and documentation
- Modern web framework design patterns
- Game engine UI rendering techniques