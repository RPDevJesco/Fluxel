import { PerformanceMetrics } from './PerformanceMetrics.js';

export class BatchRenderer {
    constructor(gl) {
        this.gl = gl;
        this.batches = new Map();
        this.metrics = new PerformanceMetrics();

        // Pre-allocate instance data arrays
        this.maxInstances = 1000;
        this.instanceData = new Float32Array(this.maxInstances * 8); // position(2), size(2), color(4)
        this.instanceBuffer = gl.createBuffer();

        // Set up instance buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.instanceData, gl.DYNAMIC_DRAW);

        // Track texture states
        this.activeTextures = new Map();
    }

    createBatch(batchId, shaderProgram) {
        if (!this.batches.has(batchId)) {
            this.batches.set(batchId, {
                components: [],
                shader: shaderProgram,
                instanceCount: 0,
                lastUpdateTime: 0,
                lastRenderTime: 0,
                textured: batchId === 'text' || batchId === 'buttons' // These batches use textures
            });
        }
        return this.batches.get(batchId);
    }

    addToBatch(batchId, component) {
        const batch = this.batches.get(batchId);
        if (!batch) {
            console.error(`Batch ${batchId} does not exist`);
            return;
        }

        batch.components.push(component);
        batch.instanceCount = batch.components.length;
        batch.lastUpdateTime = performance.now();
    }

    updateInstanceData(batchId) {
        const batch = this.batches.get(batchId);
        if (!batch) return;

        const startTime = performance.now();

        // Update instance data for all components in the batch
        let offset = 0;
        batch.components.forEach(component => {
            // Position
            this.instanceData[offset++] = component.x;
            this.instanceData[offset++] = component.y;
            // Size
            this.instanceData[offset++] = component.width;
            this.instanceData[offset++] = component.height;
            // Color
            const color = component.getColor();
            this.instanceData[offset++] = color[0];
            this.instanceData[offset++] = color[1];
            this.instanceData[offset++] = color[2];
            this.instanceData[offset++] = color[3];
        });

        // Upload updated instance data to GPU
        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0,
            this.instanceData.subarray(0, batch.instanceCount * 8));

        const endTime = performance.now();
        this.metrics.recordBatchUpdate(batchId, endTime - startTime);
    }

    setupInstanceAttributes(shader) {
        const gl = this.gl;

        // Enable instance attributes
        gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);

        // Position attribute (vec2)
        const posLoc = shader.attributes.instancePosition;
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 32, 0);
        gl.vertexAttribDivisor(posLoc, 1);

        // Size attribute (vec2)
        const sizeLoc = shader.attributes.instanceSize;
        gl.enableVertexAttribArray(sizeLoc);
        gl.vertexAttribPointer(sizeLoc, 2, gl.FLOAT, false, 32, 8);
        gl.vertexAttribDivisor(sizeLoc, 1);

        // Color attribute (vec4)
        const colorLoc = shader.attributes.instanceColor;
        gl.enableVertexAttribArray(colorLoc);
        gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 32, 16);
        gl.vertexAttribDivisor(colorLoc, 1);
    }

    renderTexturedComponent(component, shader) {
        const gl = this.gl;

        // Get texture info and update if needed
        const { texture, needsUpdate } = component.getTextureInfo();
        if (needsUpdate) {
            component.updateTextTexture(gl);
        }

        if (texture) {
            // Set texture uniforms
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.uniform1i(shader.uniforms.texture, 0);
            gl.uniform1i(shader.uniforms.useTexture, 1);

            // Draw the component
            gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, 1);
        }
    }

    renderBatch(batch, batchId) {
        const gl = this.gl;
        const shader = batch.shader;

        // Skip empty batches
        if (batch.components.length === 0) return;

        const batchStartTime = performance.now();

        // Update instance data if needed
        if (batch.lastUpdateTime > batch.lastRenderTime) {
            this.updateInstanceData(batchId);
        }

        // Set common uniforms
        gl.useProgram(shader.program);

        if (batch.textured) {
            // Render each component individually for textured batches
            gl.uniform1i(shader.uniforms.useInstancing, 0);

            batch.components.forEach(component => {
                this.renderTexturedComponent(component, shader);
            });
        } else {
            // Render entire batch at once for non-textured components
            gl.uniform1i(shader.uniforms.useInstancing, 1);
            gl.uniform1i(shader.uniforms.useTexture, 0);

            // Set up instance attributes
            this.setupInstanceAttributes(shader);

            // Draw all instances
            gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, batch.instanceCount);
        }

        const batchEndTime = performance.now();
        this.metrics.recordBatchRender(batchId, batchEndTime - batchStartTime);
        batch.lastRenderTime = batchEndTime;
    }

    render() {
        const startTime = performance.now();

        // Render all batches
        this.batches.forEach((batch, batchId) => {
            this.renderBatch(batch, batchId);
        });

        const endTime = performance.now();
        this.metrics.recordFrameTime(endTime - startTime);
    }

    getMetrics() {
        return this.metrics.getReport();
    }

    // Clean up resources
    dispose() {
        const gl = this.gl;

        // Delete instance buffer
        gl.deleteBuffer(this.instanceBuffer);

        // Clean up batch resources
        this.batches.forEach(batch => {
            batch.components.forEach(component => {
                if (component.getTextureInfo) {
                    const { texture } = component.getTextureInfo();
                    if (texture) {
                        gl.deleteTexture(texture);
                    }
                }
            });
        });

        // Clear collections
        this.batches.clear();
        this.activeTextures.clear();
    }
}