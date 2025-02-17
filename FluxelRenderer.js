import { BatchRenderer } from './BatchRenderer.js';
import { BufferManager } from './BufferManager.js';
import { GlyphAtlas } from './GlyphAtlas.js';
import { FluxelButton } from "./components/FluxelButton.js";
import { FluxelText } from "./components/FluxelText.js";

export class FluxelRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas with id ${canvasId} not found`);
        }

        this.gl = this.canvas.getContext('webgl2');
        if (!this.gl) {
            throw new Error('WebGL 2 is not available');
        }

        this.components = new Map();
        this.pendingUpdates = new Set();

        // Initialize managers
        this.setupManagers();
        this.setupShaders();
        this.setupGeometry();
        this.setupEventListeners();

        // Performance monitoring
        this.lastPerformanceLog = performance.now();
        this.performanceLogInterval = 1000;
    }

    resizeCanvas() {
        const displayWidth = this.canvas.clientWidth;
        const displayHeight = this.canvas.clientHeight;

        if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    setupManagers() {
        const gl = this.gl;

        // Initialize managers
        this.bufferManager = new BufferManager(gl);
        this.batchRenderer = new BatchRenderer(gl);
        this.glyphAtlas = new GlyphAtlas(gl);
    }

    setupShaders() {
        const gl = this.gl;

        const vertexShader = `#version 300 es
            in vec2 position;
            in vec2 texCoord;
            
            uniform vec2 uResolution;
            uniform vec2 uPosition;
            uniform vec2 uSize;
            uniform vec4 uColor;
            uniform bool uIsButton;
            uniform bool uIsPressed;
            
            out vec2 vTexCoord;
            out vec4 vColor;
            out vec2 vSize;
            
            void main() {
                vec2 pos = position * uSize + uPosition;
                vec2 clipSpace = (pos / uResolution) * 2.0 - 1.0;
                clipSpace.y = -clipSpace.y;
                gl_Position = vec4(clipSpace, 0.0, 1.0);
                vTexCoord = texCoord;
                vColor = uColor;
                vSize = uSize;
            }
        `;

        const fragmentShader = `#version 300 es
            precision mediump float;
            
            in vec2 vTexCoord;
            in vec4 vColor;
            in vec2 vSize;
            
            uniform sampler2D uTexture;
            uniform bool uUseTexture;
            uniform bool uIsButton;
            uniform bool uIsPressed;
            
            out vec4 fragColor;
            
            float roundedRectangle(vec2 position, vec2 size, float radius) {
                vec2 q = abs(position) - size + vec2(radius);
                return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
            }
            
            void main() {
                if (uIsButton) {
                    // Button rendering with gradient and rounded corners
                    vec2 pixelPos = vTexCoord * vSize;
                    float radius = 12.0;
                    
                    float dist = roundedRectangle(pixelPos - vSize/2.0, vSize/2.0, radius);
                    
                    if (dist > 0.0) {
                        discard;
                    }
                    
                    float gradientPos = vTexCoord.y;
                    vec4 baseColor = vColor;
                    
                    float topHighlight = smoothstep(0.0, 0.2, gradientPos);
                    float bottomShadow = smoothstep(0.8, 1.0, gradientPos);
                    
                    vec4 finalColor = baseColor;
                    finalColor.rgb *= mix(1.2, 0.8, gradientPos);
                    
                    if (!uIsPressed) {
                        finalColor.rgb += vec3(0.2) * (1.0 - topHighlight);
                        finalColor.rgb -= vec3(0.2) * bottomShadow;
                    } else {
                        finalColor.rgb *= 0.9;
                    }
                    
                    fragColor = finalColor;
                } else if (uUseTexture) {
                    // Text rendering
                    vec4 texColor = texture(uTexture, vTexCoord);
                    fragColor = vec4(vColor.rgb, texColor.a * vColor.a);
                } else {
                    // Basic shape rendering
                    fragColor = vColor;
                }
            }
        `;

        // Create and compile shaders
        const vs = this.compileShader(vertexShader, gl.VERTEX_SHADER);
        const fs = this.compileShader(fragmentShader, gl.FRAGMENT_SHADER);
        const program = this.createProgram(vs, fs);

        this.shaderProgram = {
            program: program,
            attributes: {
                position: gl.getAttribLocation(program, 'position'),
                texCoord: gl.getAttribLocation(program, 'texCoord')
            },
            uniforms: {
                resolution: gl.getUniformLocation(program, 'uResolution'),
                position: gl.getUniformLocation(program, 'uPosition'),
                size: gl.getUniformLocation(program, 'uSize'),
                color: gl.getUniformLocation(program, 'uColor'),
                texture: gl.getUniformLocation(program, 'uTexture'),
                useTexture: gl.getUniformLocation(program, 'uUseTexture'),
                isButton: gl.getUniformLocation(program, 'uIsButton'),
                isPressed: gl.getUniformLocation(program, 'uIsPressed')
            }
        };

        // Enable blending for transparency
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }

    setupGeometry() {
        // Create quad vertices (0 to 1 range)
        const vertices = new Float32Array([
            0.0, 0.0,  // Bottom-left
            1.0, 0.0,  // Bottom-right
            0.0, 1.0,  // Top-left
            1.0, 1.0   // Top-right
        ]);

        const texCoords = new Float32Array([
            0.0, 0.0,  // Bottom-left
            1.0, 0.0,  // Bottom-right
            0.0, 1.0,  // Top-left
            1.0, 1.0   // Top-right
        ]);

        // Allocate buffer space
        this.quadGeometry = this.bufferManager.allocateBufferSpace(
            'quad',
            vertices,
            texCoords
        );
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            this.components.forEach(component => {
                if (component.handleMouseMove) {
                    component.handleMouseMove(x, y);
                }
            });
        });

        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            this.components.forEach(component => {
                if (component.handleClick) {
                    component.handleClick(x, y);
                }
            });
        });
    }

    createComponent(id, component) {
        component.renderer = this;

        // Initialize GL resources for text components
        if (component instanceof FluxelText) {
            component.initializeGLResources(this.gl);
        }

        this.components.set(id, component);
        return component;
    }

    renderComponent(component) {
        const gl = this.gl;

        // Set component-specific uniforms
        gl.uniform2f(
            this.shaderProgram.uniforms.position,
            component.x,
            component.y
        );
        gl.uniform2f(
            this.shaderProgram.uniforms.size,
            component.width,
            component.height
        );

        const color = component.getColor();
        gl.uniform4f(
            this.shaderProgram.uniforms.color,
            color[0],
            color[1],
            color[2],
            color[3]
        );

        if (component instanceof FluxelText) {
            this.renderText(component);
        } else if (component instanceof FluxelButton) {
            this.renderButtonWithDepth(component);
        } else {
            // Basic component rendering
            gl.uniform1i(this.shaderProgram.uniforms.useTexture, 0);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
    }

    renderButtonWithDepth(button) {
        const gl = this.gl;

        // Enable blending for smooth edges
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // Set button-specific uniforms
        gl.uniform1i(this.shaderProgram.uniforms.isButton, 1);
        gl.uniform1i(this.shaderProgram.uniforms.isPressed, button.isActive);
        gl.uniform1i(this.shaderProgram.uniforms.useTexture, 0);

        // Render main button body with gradient and rounded corners
        this.setRenderUniforms(
            button.x,
            button.y,
            button.width,
            button.height,
            button.getColor()
        );
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // Render button text
        gl.uniform1i(this.shaderProgram.uniforms.isButton, 0);
        this.renderButtonText(button);
    }

    renderButtonText(button) {
        const gl = this.gl;

        const { texture, needsUpdate } = button.getTextureInfo();
        if (needsUpdate) {
            button.updateTextTexture(gl);
        }

        if (texture) {
            // Enable texturing for text
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.uniform1i(this.shaderProgram.uniforms.texture, 0);
            gl.uniform1i(this.shaderProgram.uniforms.useTexture, 1);

            // Render text centered on button
            this.setRenderUniforms(
                button.x,
                button.y,
                button.width,
                button.height,
                [1, 1, 1, 1]  // White color for text
            );
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

            // Reset texture state
            gl.uniform1i(this.shaderProgram.uniforms.useTexture, 0);
        }
    }

    renderText(textComponent) {
        const gl = this.gl;

        // Reset button state
        gl.uniform1i(this.shaderProgram.uniforms.isButton, 0);

        const { texture, needsUpdate } = textComponent.getTextureInfo();
        if (needsUpdate) {
            textComponent.updateTextTexture(gl);
        }

        if (texture) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.uniform1i(this.shaderProgram.uniforms.texture, 0);
            gl.uniform1i(this.shaderProgram.uniforms.useTexture, 1);

            this.setRenderUniforms(
                textComponent.x,
                textComponent.y,
                textComponent.width,
                textComponent.height,
                textComponent.getColor()
            );
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

            // Reset texture state
            gl.uniform1i(this.shaderProgram.uniforms.useTexture, 0);
        }
    }

    setRenderUniforms(x, y, width, height, color) {
        const gl = this.gl;
        gl.uniform2f(this.shaderProgram.uniforms.position, x, y);
        gl.uniform2f(this.shaderProgram.uniforms.size, width, height);
        gl.uniform4f(
            this.shaderProgram.uniforms.color,
            color[0], color[1], color[2], color[3]
        );
    }

    requestBatchUpdate(component) {
        this.pendingUpdates.add(component);
    }

    render() {
        const gl = this.gl;
        const currentTime = performance.now();

        // Clear and setup
        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(this.shaderProgram.program);

        // Update canvas size and viewport
        this.resizeCanvas();

        // Set shared uniforms
        gl.uniform2f(
            this.shaderProgram.uniforms.resolution,
            this.canvas.width,
            this.canvas.height
        );

        // Set up buffer bindings
        this.bufferManager.setupForRendering(gl, this);

        // Render all components
        this.components.forEach((component, id) => {
            if (component.isVisible) {
                this.renderComponent(component);
            }
        });

        // Performance logging uncomment to be spammed
        if (currentTime - this.lastPerformanceLog > this.performanceLogInterval) {
            //this.logPerformanceMetrics();
            this.lastPerformanceLog = currentTime;
        }

        requestAnimationFrame(() => this.render());
    }

    compileShader(source, type) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        }
        return shader;
    }

    createProgram(vs, fs) {
        const gl = this.gl;
        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program link error:', gl.getProgramInfoLog(program));
        }
        return program;
    }

    logPerformanceMetrics() {
        console.log('Render Stats:', {
            canvasSize: `${this.canvas.width}x${this.canvas.height}`,
            componentCount: this.components.size
        });
    }

    dispose() {
        const gl = this.gl;

        // Dispose of all components
        this.components.forEach(component => {
            if (component.dispose) {
                component.dispose(gl);
            }
        });

        // Dispose of managers
        this.batchRenderer.dispose();
        this.bufferManager.dispose();
        this.glyphAtlas.dispose();

        // Clear collections
        this.components.clear();
        this.pendingUpdates.clear();
    }
}