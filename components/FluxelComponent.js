export class FluxelComponent {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.isHovered = false;
        this.isActive = false;
        this.isVisible = true;
        this.renderer = null;

        // Default colors
        this.baseColor = [0.9, 0.9, 0.9, 1.0];      // Light gray
        this.hoverColor = [0.8, 0.8, 0.8, 1.0];     // Slightly darker
        this.activeColor = [0.7, 0.7, 0.7, 1.0];    // Even darker when clicked
        this.disabledColor = [0.6, 0.6, 0.6, 0.5];  // Semi-transparent gray
    }

    isPointInside(x, y) {
        return (
            this.isVisible &&
            x >= this.x &&
            x <= this.x + this.width &&
            y >= this.y &&
            y <= this.y + this.height
        );
    }

    handleMouseMove(x, y) {
        if (!this.isVisible) return;

        const wasHovered = this.isHovered;
        this.isHovered = this.isPointInside(x, y);

        if (wasHovered !== this.isHovered && this.renderer) {
            this.renderer.requestBatchUpdate(this);
        }
    }

    handleClick(x, y) {
        // Base component doesn't handle clicks
        // Subclasses should override this if needed
    }

    getColor() {
        if (!this.isVisible) return this.disabledColor;
        if (this.isActive) return this.activeColor;
        if (this.isHovered) return this.hoverColor;
        return this.baseColor;
    }

    setColors(baseColor, hoverColor, activeColor, disabledColor) {
        this.baseColor = baseColor || this.baseColor;
        this.hoverColor = hoverColor || this.hoverColor;
        this.activeColor = activeColor || this.activeColor;
        this.disabledColor = disabledColor || this.disabledColor;

        if (this.renderer) {
            this.renderer.requestBatchUpdate(this);
        }
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
        if (this.renderer) {
            this.renderer.requestBatchUpdate(this);
        }
    }

    setSize(width, height) {
        this.width = width;
        this.height = height;
        if (this.renderer) {
            this.renderer.requestBatchUpdate(this);
        }
    }

    setVisible(visible) {
        if (this.isVisible !== visible) {
            this.isVisible = visible;
            if (this.renderer) {
                this.renderer.requestBatchUpdate(this);
            }
        }
    }

    // Helper method to convert color array to CSS string
    colorToCss(color) {
        return `rgba(${Math.round(color[0] * 255)}, ${Math.round(color[1] * 255)}, ${Math.round(color[2] * 255)}, ${color[3]})`;
    }
}