export class PerformanceMetrics {
    constructor() {
        this.reset();
    }

    reset() {
        this.frameCount = 0;
        this.totalFrameTime = 0;
        this.batchUpdates = new Map();
        this.batchRenders = new Map();
        this.lastResetTime = performance.now();
    }

    recordFrameTime(time) {
        this.frameCount++;
        this.totalFrameTime += time;
    }

    recordBatchUpdate(batchId, time) {
        if (!this.batchUpdates.has(batchId)) {
            this.batchUpdates.set(batchId, {
                count: 0,
                totalTime: 0
            });
        }
        const stats = this.batchUpdates.get(batchId);
        stats.count++;
        stats.totalTime += time;
    }

    recordBatchRender(batchId, time) {
        if (!this.batchRenders.has(batchId)) {
            this.batchRenders.set(batchId, {
                count: 0,
                totalTime: 0
            });
        }
        const stats = this.batchRenders.get(batchId);
        stats.count++;
        stats.totalTime += time;
    }

    getReport() {
        const currentTime = performance.now();
        const elapsedSeconds = (currentTime - this.lastResetTime) / 1000;

        const report = {
            fps: this.frameCount / elapsedSeconds,
            averageFrameTime: this.totalFrameTime / this.frameCount,
            batches: {}
        };

        this.batchUpdates.forEach((stats, batchId) => {
            if (!report.batches[batchId]) {
                report.batches[batchId] = {};
            }
            report.batches[batchId].updates = {
                count: stats.count,
                averageTime: stats.totalTime / stats.count
            };
        });

        this.batchRenders.forEach((stats, batchId) => {
            if (!report.batches[batchId]) {
                report.batches[batchId] = {};
            }
            report.batches[batchId].renders = {
                count: stats.count,
                averageTime: stats.totalTime / stats.count
            };
        });

        return report;
    }
}