export class FluxelButton {
    constructor(x, y, width, height, text, onClick) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.text = text;
        this.onClick = onClick;
        this.isHovered = false;

        // Create vertex buffer data
        this.vertices = new Float32Array([
            x, y,                   // Top left
            x + width, y,           // Top right
            x, y + height,          // Bottom left
            x + width, y + height   // Bottom right
        ]);

        this.texCoords = new Float32Array([
            0.0, 0.0,
            1.0, 0.0,
            0.0, 1.0,
            1.0, 1.0
        ]);

        // Create persistent buffers
        this.vertexBuffer = null;
        this.texCoordBuffer = null;
    }

    handleMouseMove(x, y) {
        const wasHovered = this.isHovered;
        this.isHovered = (
            x >= this.x &&
            x <= this.x + this.width &&
            y >= this.y &&
            y <= this.y + this.height
        );

        if (wasHovered !== this.isHovered) {
            console.log('Button hover state changed:', this.isHovered);
            this.renderer.render();
        }
    }

    handleClick(x, y) {
        if (this.isHovered) {
            console.log('Button clicked!');
            this.onClick?.();
        }
    }

    initBuffers(gl) {
        if (!this.vertexBuffer) {
            this.vertexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
        }

        if (!this.texCoordBuffer) {
            this.texCoordBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, this.texCoords, gl.STATIC_DRAW);
        }
    }

    render(gl) {
        const renderer = this.renderer;

        // Initialize buffers if needed
        this.initBuffers(gl);

        // Bind vertex buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.enableVertexAttribArray(renderer.positionLocation);
        gl.vertexAttribPointer(renderer.positionLocation, 2, gl.FLOAT, false, 0, 0);

        // Bind texture coordinate buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.enableVertexAttribArray(renderer.texCoordLocation);
        gl.vertexAttribPointer(renderer.texCoordLocation, 2, gl.FLOAT, false, 0, 0);

        // Set color based on hover state
        const color = this.isHovered ? [0.8, 0.8, 0.8, 1.0] : [0.7, 0.7, 0.7, 1.0];
        gl.uniform4fv(renderer.colorLocation, color);

        // Disable texturing for button background
        gl.uniform1i(renderer.useTextureLocation, false);

        // Draw button background
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // Render text
        this.renderText(gl, this.text);
    }

    renderText(gl, text) {
        const renderer = this.renderer;

        // Create temporary canvas for text rendering
        const textCanvas = document.createElement('canvas');
        const ctx = textCanvas.getContext('2d');

        // Set canvas size to match button
        textCanvas.width = this.width;
        textCanvas.height = this.height;

        // Configure text rendering
        ctx.font = '16px Arial';
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, this.width / 2, this.height / 2);

        // Create and configure texture
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        // Enable texturing for text
        gl.uniform1i(renderer.useTextureLocation, true);
        gl.uniform1i(renderer.textureLocation, 0);

        // Draw text
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
}