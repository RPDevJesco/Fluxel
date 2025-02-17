export class FluxelText {
    constructor(x, y, getValue) {
        this.x = x;
        this.y = y;
        this.getValue = getValue;

        // Create vertex buffer data for a quad
        this.vertices = new Float32Array([
            x, y,               // Top left
            x + 100, y,        // Top right
            x, y + 40,         // Bottom left
            x + 100, y + 40    // Bottom right
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

        // Get current value
        const value = this.getValue();

        // Create temporary canvas for text rendering
        const textCanvas = document.createElement('canvas');
        const ctx = textCanvas.getContext('2d');

        // Set canvas size
        textCanvas.width = 100;
        textCanvas.height = 40;

        // Configure text rendering
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(value.toString(), textCanvas.width / 2, textCanvas.height / 2);

        // Create and configure texture
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        // Set uniforms for text rendering
        gl.uniform4fv(renderer.colorLocation, [0.0, 0.0, 0.0, 1.0]);
        gl.uniform1i(renderer.useTextureLocation, true);
        gl.uniform1i(renderer.textureLocation, 0);

        // Draw text
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
}