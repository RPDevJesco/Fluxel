export class FluxelRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.gl = this.canvas.getContext('webgl2');
        this.components = new Map();

        // Initialize GL
        this.setupGL();

        // Add event listeners
        this.setupEventListeners();
    }

    setupGL() {
        const gl = this.gl;

        if (!gl) {
            console.error('WebGL2 context not available');
            return;
        }

        // Set viewport and clear color
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clearColor(1.0, 1.0, 1.0, 1.0);

        // Enable blending for text rendering
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        const vertexShader = `
            attribute vec2 position;
            attribute vec2 texCoord;
            varying vec2 vTexCoord;
            uniform vec2 uResolution;
            
            void main() {
                // Convert position to clip space
                vec2 clipSpace = (position / uResolution) * 2.0 - 1.0;
                // Flip Y coordinate
                clipSpace.y = -clipSpace.y;
                gl_Position = vec4(clipSpace, 0.0, 1.0);
                vTexCoord = texCoord;
            }
        `;

        const fragmentShader = `
            precision mediump float;
            varying vec2 vTexCoord;
            uniform sampler2D uTexture;
            uniform vec4 uColor;
            uniform bool uUseTexture;
            
            void main() {
                if (uUseTexture) {
                    vec4 texColor = texture2D(uTexture, vTexCoord);
                    gl_FragColor = texColor * uColor;
                } else {
                    gl_FragColor = uColor;
                }
            }
        `;

        // Compile and link shaders
        const vs = this.compileShader(vertexShader, gl.VERTEX_SHADER);
        const fs = this.compileShader(fragmentShader, gl.FRAGMENT_SHADER);
        this.program = this.createProgram(vs, fs);
        gl.useProgram(this.program);

        // Set up attributes and uniforms
        this.positionLocation = gl.getAttribLocation(this.program, 'position');
        this.texCoordLocation = gl.getAttribLocation(this.program, 'texCoord');
        this.resolutionLocation = gl.getUniformLocation(this.program, 'uResolution');
        this.colorLocation = gl.getUniformLocation(this.program, 'uColor');
        this.textureLocation = gl.getUniformLocation(this.program, 'uTexture');
        this.useTextureLocation = gl.getUniformLocation(this.program, 'uUseTexture');

        // Set resolution
        gl.uniform2f(this.resolutionLocation, this.canvas.width, this.canvas.height);
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

            console.log('Canvas clicked at:', x, y);

            this.components.forEach(component => {
                if (component.handleClick) {
                    component.handleClick(x, y);
                }
            });
        });
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

    createComponent(id, component) {
        component.renderer = this;
        this.components.set(id, component);
        return component;
    }

    render() {
        const gl = this.gl;
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(this.program);

        this.components.forEach(component => component.render(gl));
        requestAnimationFrame(() => this.render());
    }
}
