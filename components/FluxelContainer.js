import { FluxelComponent } from './FluxelComponent.js';

export class FluxelContainer extends FluxelComponent {
    constructor(x, y, width, height, options = {}) {
        super(x, y, width, height);

        this.children = new Map();
        this.layout = options.layout || 'flex';
        this.direction = options.direction || 'row';
        this.padding = options.padding || 0;
        this.gap = options.gap || 0;
        this.justify = options.justify || 'start'; // start, center, end, space-between
        this.align = options.align || 'start';     // start, center, end, stretch

        // Background styling
        this.backgroundColor = options.backgroundColor || [0, 0, 0, 0];
        this.borderRadius = options.borderRadius || 0;
        this.elevation = options.elevation || 0;

        // Cache for layout calculations
        this.layoutCache = new Map();
        this.needsLayout = true;
    }

    addChild(id, component) {
        this.children.set(id, {
            component,
            flex: 1,
            margin: { top: 0, right: 0, bottom: 0, left: 0 }
        });

        component.parent = this;
        this.needsLayout = true;

        if (this.renderer) {
            this.renderer.requestBatchUpdate(this);
        }

        return component;
    }

    removeChild(id) {
        const child = this.children.get(id);
        if (child) {
            child.component.parent = null;
            this.children.delete(id);
            this.needsLayout = true;

            if (this.renderer) {
                this.renderer.requestBatchUpdate(this);
            }
        }
    }

    setChildFlex(id, flex) {
        const child = this.children.get(id);
        if (child) {
            child.flex = flex;
            this.needsLayout = true;
        }
    }

    setChildMargin(id, margin) {
        const child = this.children.get(id);
        if (child) {
            child.margin = { ...child.margin, ...margin };
            this.needsLayout = true;
        }
    }

    calculateLayout() {
        if (!this.needsLayout) return;

        const innerWidth = this.width - (this.padding * 2);
        const innerHeight = this.height - (this.padding * 2);

        if (this.layout === 'flex') {
            this.calculateFlexLayout(innerWidth, innerHeight);
        } else if (this.layout === 'grid') {
            this.calculateGridLayout(innerWidth, innerHeight);
        }

        this.needsLayout = false;
    }

    calculateFlexLayout(innerWidth, innerHeight) {
        const isRow = this.direction === 'row';
        const mainAxis = isRow ? innerWidth : innerHeight;
        const crossAxis = isRow ? innerHeight : innerWidth;

        // Calculate total flex and gap space
        const totalGap = this.gap * (this.children.size - 1);
        const totalFlex = Array.from(this.children.values())
            .reduce((sum, child) => sum + child.flex, 0);

        // Calculate unit size for flex distribution
        const availableSpace = mainAxis - totalGap;
        const flexUnit = availableSpace / totalFlex;

        let currentPosition = this.padding;

        this.children.forEach((child, id) => {
            const size = flexUnit * child.flex;

            // Calculate position based on direction
            if (isRow) {
                child.component.x = this.x + currentPosition;
                child.component.y = this.y + this.padding;
                child.component.width = size;
                child.component.height = crossAxis;
            } else {
                child.component.x = this.x + this.padding;
                child.component.y = this.y + currentPosition;
                child.component.width = crossAxis;
                child.component.height = size;
            }

            // Apply margin adjustments
            child.component.x += child.margin.left;
            child.component.y += child.margin.top;
            child.component.width -= (child.margin.left + child.margin.right);
            child.component.height -= (child.margin.top + child.margin.bottom);

            currentPosition += size + this.gap;

            // Cache the layout
            this.layoutCache.set(id, {
                x: child.component.x,
                y: child.component.y,
                width: child.component.width,
                height: child.component.height
            });
        });
    }

    calculateGridLayout(innerWidth, innerHeight) {
        const { columns = 1, rows = 1 } = this.gridConfig || {};

        // Calculate cell dimensions
        const totalGapX = this.gap * (columns - 1);
        const totalGapY = this.gap * (rows - 1);
        const cellWidth = (innerWidth - totalGapX) / columns;
        const cellHeight = (innerHeight - totalGapY) / rows;

        let currentRow = 0;
        let currentCol = 0;

        this.children.forEach((child, id) => {
            // Calculate grid position
            const x = this.x + this.padding + (currentCol * (cellWidth + this.gap));
            const y = this.y + this.padding + (currentRow * (cellHeight + this.gap));

            // Apply position and size to component
            child.component.x = x + child.margin.left;
            child.component.y = y + child.margin.top;
            child.component.width = cellWidth - (child.margin.left + child.margin.right);
            child.component.height = cellHeight - (child.margin.top + child.margin.bottom);

            // Cache the layout
            this.layoutCache.set(id, {
                x: child.component.x,
                y: child.component.y,
                width: child.component.width,
                height: child.component.height
            });

            // Move to next grid position
            currentCol++;
            if (currentCol >= columns) {
                currentCol = 0;
                currentRow++;
            }
        });
    }

    render(gl, shader) {
        this.calculateLayout();

        if (this.backgroundColor[3] > 0) {
            gl.useProgram(shader.program);

            gl.uniform2f(shader.uniforms.position, this.x, this.y);
            gl.uniform2f(shader.uniforms.size, this.width, this.height);

            gl.uniform4fv(shader.uniforms.color, this.backgroundColor);

            gl.uniform1f(shader.uniforms.borderRadius, this.borderRadius);

            if (this.elevation > 0) {
                gl.uniform1f(shader.uniforms.elevation, this.elevation);
                gl.uniform2f(shader.uniforms.shadowOffset, 0, this.elevation * 2);
                gl.uniform1f(shader.uniforms.shadowBlur, this.elevation * 4);
                gl.uniform4fv(shader.uniforms.shadowColor, [0, 0, 0, 0.2]);
            }

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }

        this.children.forEach(child => {
            if (child.component.isVisible) {
                child.component.render(gl, shader);
            }
        });
    }

    setGridConfig(config) {
        this.gridConfig = {
            columns: config.columns || 1,
            rows: config.rows || 1,
            ...config
        };
        this.needsLayout = true;

        if (this.renderer) {
            this.renderer.requestBatchUpdate(this);
        }
    }

    setBackgroundStyle(options) {
        if (options.backgroundColor !== undefined) {
            this.backgroundColor = options.backgroundColor;
        }
        if (options.borderRadius !== undefined) {
            this.borderRadius = options.borderRadius;
        }
        if (options.elevation !== undefined) {
            this.elevation = options.elevation;
        }

        if (this.renderer) {
            this.renderer.requestBatchUpdate(this);
        }
    }

    getScaleFactor() {
        return this.currentScaleFactor || 1;
    }

    setMinSize(width, height) {
        this.minWidth = width;
        this.minHeight = height;
        this.needsLayout = true;
        if (this.renderer) {
            this.renderer.requestBatchUpdate(this);
        }
    }

    setMaxSize(width, height) {
        this.maxWidth = width;
        this.maxHeight = height;
        this.needsLayout = true;
        if (this.renderer) {
            this.renderer.requestBatchUpdate(this);
        }
    }

    resetScale() {
        this.currentScaleFactor = 1;
        this.needsLayout = true;
        if (this.renderer) {
            this.renderer.requestBatchUpdate(this);
        }
    }

    dispose(gl) {
        // Clean up children
        this.children.forEach(child => {
            if (child.component.dispose) {
                child.component.dispose(gl);
            }
        });

        this.children.clear();
        this.layoutCache.clear();

        super.dispose(gl);
    }
}