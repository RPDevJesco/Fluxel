export class FluxelSEOReporter {
    constructor(containerId = 'seo-report') {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container element with id '${containerId}' not found`);
        }
        this.injectStyles();
    }

    injectStyles() {
        const styleId = 'fluxel-seo-styles';
        if (document.getElementById(styleId)) return;

        const styles = `
            .fluxel-seo-report {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
                max-width: 1200px;
                margin: 20px auto;
                padding: 20px;
                background: #fff;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }

            .fluxel-seo-header {
                text-align: center;
                margin-bottom: 30px;
            }

            .fluxel-seo-score-overview {
                display: flex;
                justify-content: center;
                align-items: center;
                margin-bottom: 40px;
            }

            .fluxel-seo-score-circle {
                position: relative;
                width: 150px;
                height: 150px;
                margin: 20px;
            }

            .fluxel-seo-score-circle svg {
                transform: rotate(-90deg);
            }

            .fluxel-seo-score-number {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 2em;
                font-weight: bold;
            }

            .fluxel-seo-categories {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }

            .fluxel-seo-category {
                background: #f8f9fa;
                border-radius: 6px;
                padding: 20px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            }

            .fluxel-seo-category-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }

            .fluxel-seo-category-score {
                font-size: 1.2em;
                font-weight: bold;
                color: #fff;
                background: #4CAF50;
                padding: 4px 12px;
                border-radius: 12px;
            }

            .fluxel-seo-test {
                background: #fff;
                border-radius: 4px;
                padding: 12px;
                margin-bottom: 10px;
            }

            .fluxel-seo-test.passed {
                border-left: 4px solid #4CAF50;
            }

            .fluxel-seo-test.failed {
                border-left: 4px solid #f44336;
            }

            .fluxel-seo-test-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }

            .fluxel-seo-test-status {
                font-size: 0.9em;
                padding: 2px 8px;
                border-radius: 8px;
            }

            .fluxel-seo-test-status.passed {
                background: #E8F5E9;
                color: #2E7D32;
            }

            .fluxel-seo-test-status.failed {
                background: #FFEBEE;
                color: #C62828;
            }

            .fluxel-seo-test-details {
                font-size: 0.9em;
                color: #666;
            }

            .fluxel-seo-meta {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                font-size: 0.9em;
                color: #666;
            }

            @media (max-width: 768px) {
                .fluxel-seo-categories {
                    grid-template-columns: 1fr;
                }

                .fluxel-seo-score-circle {
                    width: 120px;
                    height: 120px;
                }
            }
        `;

        const styleElement = document.createElement('style');
        styleElement.id = styleId;
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);
    }

    createScoreCircle(score, size = 150) {
        const radius = size * 0.4;
        const circumference = 2 * Math.PI * radius;
        const dashOffset = circumference * (1 - score / 100);
        const color = this.getScoreColor(score);

        return `
            <div class="fluxel-seo-score-circle">
                <svg width="${size}" height="${size}">
                    <circle
                        cx="${size/2}"
                        cy="${size/2}"
                        r="${radius}"
                        stroke="#eee"
                        stroke-width="8"
                        fill="none"
                    />
                    <circle
                        cx="${size/2}"
                        cy="${size/2}"
                        r="${radius}"
                        stroke="${color}"
                        stroke-width="8"
                        fill="none"
                        stroke-dasharray="${circumference}"
                        stroke-dashoffset="${dashOffset}"
                        style="transition: stroke-dashoffset 1s ease-in-out"
                    />
                </svg>
                <div class="fluxel-seo-score-number" style="color: ${color}">${score}%</div>
            </div>
        `;
    }

    getScoreColor(score) {
        if (score >= 90) return '#4CAF50';
        if (score >= 70) return '#8BC34A';
        if (score >= 50) return '#FFC107';
        if (score >= 30) return '#FF9800';
        return '#f44336';
    }

    generateTestHTML(test) {
        return `
            <div class="fluxel-seo-test ${test.passed ? 'passed' : 'failed'}">
                <div class="fluxel-seo-test-header">
                    <strong>${test.name}</strong>
                    <span class="fluxel-seo-test-status ${test.passed ? 'passed' : 'failed'}">
                        ${test.passed ? 'PASSED' : 'FAILED'}
                    </span>
                </div>
                <div class="fluxel-seo-test-details">
                    ${test.details}
                </div>
            </div>
        `;
    }

    generateCategoryHTML(category, data) {
        const color = this.getScoreColor(data.score);
        return `
            <div class="fluxel-seo-category">
                <div class="fluxel-seo-category-header">
                    <h3>${this.formatCategoryName(category)}</h3>
                    <span class="fluxel-seo-category-score" style="background: ${color}">
                        ${data.score}%
                    </span>
                </div>
                <div class="fluxel-seo-category-tests">
                    ${data.tests.map(test => this.generateTestHTML(test)).join('')}
                </div>
            </div>
        `;
    }

    formatCategoryName(category) {
        return category
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase());
    }

    generateReport(report) {
        const html = `
            <div class="fluxel-seo-report">
                <div class="fluxel-seo-header">
                    <h1>Fluxel SEO Analysis Report</h1>
                    <p>Analysis completed at ${new Date(report.timestamp).toLocaleString()}</p>
                </div>
                
                <div class="fluxel-seo-score-overview">
                    ${this.createScoreCircle(report.overallScore)}
                </div>

                <div class="fluxel-seo-categories">
                    ${Object.entries(report.categories)
            .map(([category, data]) => this.generateCategoryHTML(category, data))
            .join('')}
                </div>

                <div class="fluxel-seo-meta">
                    <h3>Test Environment</h3>
                    <p>User Agent: ${report.environment.userAgent}</p>
                    <p>Viewport: ${report.environment.viewport.width}x${report.environment.viewport.height}</p>
                    <p>Connection: ${report.environment.connection}</p>
                </div>
            </div>
        `;

        this.container.innerHTML = html;
    }
}

// Usage example:
export async function visualizeSEOReport(report, containerId = 'seo-report') {
    try {
        const reporter = new FluxelSEOReporter(containerId);
        reporter.generateReport(report);
    } catch (error) {
        console.error('Error generating SEO report visualization:', error);
        throw error;
    }
}