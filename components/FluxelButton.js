import { FluxelComponent } from "./FluxelComponent.js";

export class FluxelButton extends FluxelComponent {
    constructor(x, y, width, height, text, onClick) {
        super(x, y, width, height);
        this.text = text;
        this.onClick = onClick;
        this.textColor = [0.0, 0.0, 0.0, 1.0];
        this.fontSize = 16;
        this.fontFamily = 'Arial';
        this.isHovered = false;
        this.isActive = false;

        // Default colors (can be customized)
        this.baseColor = [0.9, 0.9, 0.9, 1.0];      // Light gray
        this.hoverColor = [0.8, 0.8, 0.8, 1.0];     // Slightly darker
        this.activeColor = [0.7, 0.7, 0.7, 1.0];    // Even darker when clicked

        // Text texture cache
        this.textTexture = null;
        this.lastText = null;
    }

    handleClick(x, y) {
        if (this.isPointInside(x, y) && this.onClick) {
            this.isActive = true;
            if (this.renderer) {
                this.renderer.requestBatchUpdate(this);
            }
            this.onClick();

            // Reset active state after a short delay
            setTimeout(() => {
                this.isActive = false;
                if (this.renderer) {
                    this.renderer.requestBatchUpdate(this);
                }
            }, 100);
        }
    }

    handleMouseMove(x, y) {
        const wasHovered = this.isHovered;
        this.isHovered = this.isPointInside(x, y);

        if (wasHovered !== this.isHovered && this.renderer) {
            this.renderer.requestBatchUpdate(this);
        }
    }

    isPointInside(x, y) {
        return (
            x >= this.x &&
            x <= this.x + this.width &&
            y >= this.y &&
            y <= this.y + this.height
        );
    }

    updateTextTexture(gl) {
        // Only update texture if text has changed
        if (this.text === this.lastText && this.textTexture) {
            return this.textTexture;
        }

        // Create temporary canvas for text rendering
        const textCanvas = document.createElement('canvas');
        const ctx = textCanvas.getContext('2d');

        // Set canvas size to match button
        textCanvas.width = this.width;
        textCanvas.height = this.height;

        // Clear the canvas with a transparent background
        ctx.clearRect(0, 0, textCanvas.width, textCanvas.height);

        // Configure text rendering
        ctx.font = `${this.fontSize}px ${this.fontFamily}`;
        ctx.fillStyle = `rgba(${this.textColor.map(c => c * 255).join(',')})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw the text
        ctx.fillText(this.text, this.width / 2, this.height / 2);

        // Create or update texture
        if (!this.textTexture) {
            this.textTexture = gl.createTexture();
        }

        gl.bindTexture(gl.TEXTURE_2D, this.textTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        this.lastText = this.text;
        return this.textTexture;
    }

    getTextureInfo() {
        return {
            texture: this.textTexture,
            needsUpdate: this.text !== this.lastText
        };
    }

    getColor() {
        if (this.isActive) return this.activeColor;
        if (this.isHovered) return this.hoverColor;
        return this.baseColor;
    }

    setColors(baseColor, hoverColor, activeColor) {
        this.baseColor = baseColor;
        this.hoverColor = hoverColor;
        this.activeColor = activeColor;
        if (this.renderer) {
            this.renderer.requestBatchUpdate(this);
        }
    }
}