export class GlyphAtlas {
    constructor(gl) {
        this.gl = gl;
        this.atlas = new Map();

        // Create atlas texture
        this.texture = gl.createTexture();
        this.textureSize = 1024; // Initial size, will grow if needed

        // Initialize atlas canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.textureSize;
        this.canvas.height = this.textureSize;
        this.ctx = this.canvas.getContext('2d', {
            willReadFrequently: true,
            alpha: true
        });

        // Track used regions in the atlas
        this.regions = new MaxRectsPacker(this.textureSize, this.textureSize);

        this.initializeTexture();
    }

    initializeTexture() {
        const gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            this.textureSize,
            this.textureSize,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null
        );

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }

    getGlyph(char, fontSettings) {
        const key = this.getGlyphKey(char, fontSettings);

        if (!this.atlas.has(key)) {
            this.renderGlyph(char, fontSettings);
        }

        return this.atlas.get(key);
    }

    getGlyphKey(char, fontSettings) {
        const { size, family, weight, style } = fontSettings;
        return `${char}-${size}-${family}-${weight}-${style}`;
    }

    renderGlyph(char, fontSettings) {
        const { size, family, weight, style } = fontSettings;
        const ctx = this.ctx;

        // Set up font context
        ctx.font = `${weight} ${style} ${size}px ${family}`;
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';

        // Measure glyph
        const metrics = ctx.measureText(char);
        const width = Math.ceil(metrics.width);
        const height = Math.ceil(size);

        // Add padding to prevent bleeding
        const padding = 1;
        const paddedWidth = width + padding * 2;
        const paddedHeight = height + padding * 2;

        // Find space in the atlas
        const region = this.regions.allocate(paddedWidth, paddedHeight);

        if (!region) {
            // Atlas is full, resize and try again
            this.resizeAtlas();
            return this.renderGlyph(char, fontSettings);
        }

        // Clear the region
        ctx.clearRect(region.x, region.y, paddedWidth, paddedHeight);

        // Draw the glyph
        ctx.fillStyle = 'white';
        ctx.fillText(char, region.x + padding, region.y + padding);

        // Update the texture
        const gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texSubImage2D(
            gl.TEXTURE_2D,
            0,
            region.x,
            region.y,
            paddedWidth,
            paddedHeight,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            this.canvas
        );

        // Store glyph info
        const glyphInfo = {
            x: region.x,
            y: region.y,
            width: paddedWidth,
            height: paddedHeight,
            advance: metrics.width,
            bearing: {
                x: metrics.actualBoundingBoxLeft,
                y: metrics.actualBoundingBoxAscent
            },
            texCoords: {
                s0: region.x / this.textureSize,
                t0: region.y / this.textureSize,
                s1: (region.x + paddedWidth) / this.textureSize,
                t1: (region.y + paddedHeight) / this.textureSize
            }
        };

        this.atlas.set(this.getGlyphKey(char, fontSettings), glyphInfo);
        return glyphInfo;
    }

    resizeAtlas() {
        // Double the size of the atlas
        const newSize = this.textureSize * 2;
        if (newSize > 8192) { // Maximum reasonable texture size
            throw new Error('Glyph atlas exceeded maximum size');
        }

        // Create new canvas
        const newCanvas = document.createElement('canvas');
        newCanvas.width = newSize;
        newCanvas.height = newSize;
        const newCtx = newCanvas.getContext('2d');

        // Copy existing content
        newCtx.drawImage(this.canvas, 0, 0);

        // Update atlas properties
        this.canvas = newCanvas;
        this.ctx = newCtx;
        this.textureSize = newSize;
        this.regions = new MaxRectsPacker(newSize, newSize);

        // Reinitialize texture with new size
        this.initializeTexture();

        // Rebuild atlas with existing glyphs
        const existingGlyphs = new Map(this.atlas);
        this.atlas.clear();

        // Re-add all glyphs
        for (const [key, _] of existingGlyphs) {
            const [char, size, family, weight, style] = key.split('-');
            this.renderGlyph(char, { size, family, weight, style });
        }
    }

    dispose() {
        const gl = this.gl;
        gl.deleteTexture(this.texture);
        this.atlas.clear();
        this.canvas = null;
        this.ctx = null;
    }
}

class MaxRectsPacker {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.freeRects = [{ x: 0, y: 0, width, height }];
    }

    allocate(width, height) {
        let bestRect = null;
        let bestScore = Infinity;
        let bestIndex = -1;

        // Find the free rectangle with the best score
        for (let i = 0; i < this.freeRects.length; i++) {
            const rect = this.freeRects[i];
            if (rect.width >= width && rect.height >= height) {
                const score = Math.min(
                    rect.width - width,
                    rect.height - height
                );
                if (score < bestScore) {
                    bestScore = score;
                    bestRect = rect;
                    bestIndex = i;
                }
            }
        }

        if (!bestRect) return null;

        // Allocate the region
        const allocated = {
            x: bestRect.x,
            y: bestRect.y,
            width,
            height
        };

        // Split remaining space
        this.splitRect(bestRect, allocated, bestIndex);

        return allocated;
    }

    splitRect(freeRect, used, index) {
        // Remove the original free rectangle
        this.freeRects.splice(index, 1);

        // Add new free rectangles for the remaining space
        if (used.x + used.width < freeRect.x + freeRect.width) {
            this.freeRects.push({
                x: used.x + used.width,
                y: freeRect.y,
                width: freeRect.width - (used.x + used.width - freeRect.x),
                height: freeRect.height
            });
        }

        if (used.y + used.height < freeRect.y + freeRect.height) {
            this.freeRects.push({
                x: freeRect.x,
                y: used.y + used.height,
                width: freeRect.width,
                height: freeRect.height - (used.y + used.height - freeRect.y)
            });
        }

        // Merge overlapping rectangles
        this.mergeFreeRects();
    }

    mergeFreeRects() {
        for (let i = 0; i < this.freeRects.length; i++) {
            for (let j = i + 1; j < this.freeRects.length; j++) {
                if (this.isContained(this.freeRects[i], this.freeRects[j])) {
                    this.freeRects.splice(j, 1);
                    j--;
                } else if (this.isContained(this.freeRects[j], this.freeRects[i])) {
                    this.freeRects.splice(i, 1);
                    i--;
                    break;
                }
            }
        }
    }

    isContained(rect1, rect2) {
        return rect1.x >= rect2.x &&
            rect1.y >= rect2.y &&
            rect1.x + rect1.width <= rect2.x + rect2.width &&
            rect1.y + rect1.height <= rect2.y + rect2.height;
    }
}