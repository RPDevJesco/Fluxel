export class BufferManager {
    constructor(gl) {
        this.gl = gl;

        // Create global vertex and texture coordinate buffers
        this.vertexBuffer = gl.createBuffer();
        this.texCoordBuffer = gl.createBuffer();

        // Maps to track buffer allocations
        this.vertexAllocations = new Map();
        this.texCoordAllocations = new Map();

        // Current offset in buffers
        this.vertexOffset = 0;
        this.texCoordOffset = 0;

        // Array to store all vertex and texture coordinate data
        this.vertexData = new Float32Array(1000);
        this.texCoordData = new Float32Array(1000);
    }

    allocateBufferSpace(component, vertices, texCoords) {
        const vertexOffset = this.vertexOffset;
        const texCoordOffset = this.texCoordOffset;

        // Copy vertex data into global buffer
        this.vertexData.set(vertices, vertexOffset);
        this.texCoordData.set(texCoords, texCoordOffset);

        // Store allocation information
        this.vertexAllocations.set(component, {
            offset: vertexOffset,
            size: vertices.length
        });

        this.texCoordAllocations.set(component, {
            offset: texCoordOffset,
            size: texCoords.length
        });

        // Update offsets
        this.vertexOffset += vertices.length;
        this.texCoordOffset += texCoords.length;

        // Upload data to GPU
        this.updateBuffers();

        return {
            vertexOffset,
            texCoordOffset,
            vertexSize: vertices.length,
            texCoordSize: texCoords.length
        };
    }

    updateBuffers() {
        const gl = this.gl;

        // Update vertex buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertexData, gl.STATIC_DRAW);

        // Update texture coordinate buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.texCoordData, gl.STATIC_DRAW);
    }

    setupForRendering(gl, renderer) {

        // Bind vertex buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.enableVertexAttribArray(renderer.shaderProgram.attributes.position);
        gl.vertexAttribPointer(
            renderer.shaderProgram.attributes.position,
            2, gl.FLOAT, false, 0, 0
        );

        // Bind texture coordinate buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.enableVertexAttribArray(renderer.shaderProgram.attributes.texCoord);
        gl.vertexAttribPointer(
            renderer.shaderProgram.attributes.texCoord,
            2, gl.FLOAT, false, 0, 0
        );
    }
}