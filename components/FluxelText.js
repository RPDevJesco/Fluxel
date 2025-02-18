import { FluxelComponent } from './FluxelComponent.js';

export class FluxelText extends FluxelComponent {
    constructor(x, y, getValue, options = {}) {
        super(x, y, options.width || 100, options.height || 40);

        this.getValue = getValue;
        this.fontSettings = {
            size: options.fontSize || 24,
            family: options.fontFamily || 'Arial',
            weight: options.fontWeight || 'normal',
            style: options.fontStyle || 'normal'
        };

        this.textColor = options.textColor || [0.0, 0.0, 0.0, 1.0];
        this.align = options.align || 'center';
        this.baseline = options.baseline || 'middle';
        this.padding = options.padding || 5;

        // Texture management
        this.texture = null;
        this.lastValue = null;
        this.needsUpdate = true;

        // WebGL resources
        this.vertexBuffer = null;
        this.indexBuffer = null;
        this.vao = null;
    }

    initializeGLResources(gl) {
        if (this.vao) return;

        // Create VAO
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        // Create vertex buffer
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

        // Create quad vertices
        const vertices = new Float32Array([
            0.0, 0.0,  // Bottom-left
            1.0, 0.0,  // Bottom-right
            0.0, 1.0,  // Top-left
            1.0, 1.0   // Top-right
        ]);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        // Set up vertex attributes
        gl.enableVertexAttribArray(0); // position attribute
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        // texture coordinate buffer
        const texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);

        const texCoords = new Float32Array([
            0.0, 0.0,  // Bottom-left
            1.0, 0.0,  // Bottom-right
            0.0, 1.0,  // Top-left
            1.0, 1.0   // Top-right
        ]);
        gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

        // Set up texture coordinate attribute
        gl.enableVertexAttribArray(1); // texCoord attribute
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);

        // Create index buffer
        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

        const indices = new Uint16Array([
            0, 1, 2,    // First triangle
            2, 1, 3     // Second triangle
        ]);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

        // Cleanup
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }

    getTextureInfo() {
        const currentValue = this.getValue();
        return {
            texture: this.texture,
            needsUpdate: currentValue !== this.lastValue || this.needsUpdate
        };
    }

    measureTextWidth(text) {
        const measureCanvas = document.createElement('canvas');
        const ctx = measureCanvas.getContext('2d');

        ctx.font = `${this.fontSettings.weight} ${this.fontSettings.size}px ${this.fontSettings.family}`;

        const metrics = ctx.measureText(text);

        return Math.ceil(metrics.width + 20); // 10px padding on each side
    }

    updateTextTexture(gl) {
        const currentValue = this.getValue();

        // Measure the text width first
        const requiredWidth = this.measureTextWidth(currentValue.toString());

        // Update component width if needed
        if (requiredWidth > this.width) {
            this.width = requiredWidth;
            if (this.parent && this.parent.needsLayout) {
                this.parent.needsLayout = true;
            }
        }

        // Create temporary canvas for text rendering
        const textCanvas = document.createElement('canvas');
        const ctx = textCanvas.getContext('2d');

        // Set canvas size
        textCanvas.width = this.width;
        textCanvas.height = this.height;

        // Configure text rendering
        ctx.font = `${this.fontSettings.weight} ${this.fontSettings.size}px ${this.fontSettings.family}`;
        ctx.fillStyle = `rgba(${this.textColor.map(c => c * 255).join(',')})`;
        ctx.textAlign = this.align;
        ctx.textBaseline = this.baseline;

        // Clear the canvas
        ctx.clearRect(0, 0, textCanvas.width, textCanvas.height);

        // Calculate text position
        let textX = this.width / 2;
        if (this.align === 'left') textX = 10; // Add left padding
        if (this.align === 'right') textX = this.width - 10;

        let textY = this.height / 2;
        if (this.baseline === 'top') textY = 10;
        if (this.baseline === 'bottom') textY = this.height - 10;

        // Draw the text
        ctx.fillText(currentValue.toString(), textX, textY);

        // Create or update texture
        if (!this.texture) {
            this.texture = gl.createTexture();
        }

        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        this.lastValue = currentValue;
        this.needsUpdate = false;
        return this.texture;
    }

    getColor() {
        return this.textColor;
    }

    setFont(options = {}) {
        let changed = false;

        if (options.size && options.size !== this.fontSettings.size) {
            this.fontSettings.size = options.size;
            changed = true;
        }

        if (options.family && options.family !== this.fontSettings.family) {
            this.fontSettings.family = options.family;
            changed = true;
        }

        if (options.weight && options.weight !== this.fontSettings.weight) {
            this.fontSettings.weight = options.weight;
            changed = true;
        }

        if (options.style && options.style !== this.fontSettings.style) {
            this.fontSettings.style = options.style;
            changed = true;
        }

        if (changed) {
            this.needsUpdate = true;
            if (this.renderer) {
                this.renderer.requestBatchUpdate(this);
            }
        }
    }

    setColor(color) {
        this.textColor = color;
        this.needsUpdate = true;
        if (this.renderer) {
            this.renderer.requestBatchUpdate(this);
        }
    }

    dispose(gl) {
        if (this.texture) {
            gl.deleteTexture(this.texture);
            this.texture = null;
        }
        if (this.vao) {
            gl.deleteVertexArray(this.vao);
            this.vao = null;
        }
        if (this.vertexBuffer) {
            gl.deleteBuffer(this.vertexBuffer);
            this.vertexBuffer = null;
        }
        if (this.indexBuffer) {
            gl.deleteBuffer(this.indexBuffer);
            this.indexBuffer = null;
        }
    }
}