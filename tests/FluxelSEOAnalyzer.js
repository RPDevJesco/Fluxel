export class FluxelSEOAnalyzer {
    constructor(options = {}) {
        this.results = {
            technicalSEO: {},
            metadata: {},
            structuredData: {},
            performance: {},
            mobileCompatibility: {}
        };
        this.options = {
            userAgent: options.userAgent || 'Googlebot',
            viewport: options.viewport || { width: 375, height: 812 }, // iPhone X
            connection: options.connection || '4G',
            ...options
        };
    }

    async analyze() {
        await Promise.all([
            this.analyzeTechnicalSEO(),
            this.analyzeMetadata(),
            this.analyzeStructuredData(),
            this.analyzePerformance(),
            this.analyzeMobileCompatibility()
        ]);

        return this.generateReport();
    }

    async analyzeTechnicalSEO() {
        const results = {
            score: 0,
            tests: []
        };

        // Test URL structure
        const url = window.location.href;
        results.tests.push({
            name: 'URL Structure',
            passed: /^https?:\/\/[^/]+\/[^?#]+$/.test(url),
            details: 'URL should be clean and descriptive'
        });

        // Test page load time
        const loadTime = await this.measureLoadTime();
        results.tests.push({
            name: 'Page Load Time',
            passed: loadTime < 3000, // 3 seconds threshold
            details: `Page load time: ${loadTime}ms`
        });

        // Check for client-side rendering impact
        const firstContentfulPaint = performance.getEntriesByType('paint')
            .find(entry => entry.name === 'first-contentful-paint');

        results.tests.push({
            name: 'First Contentful Paint',
            passed: firstContentfulPaint?.startTime < 2000,
            details: `FCP: ${firstContentfulPaint?.startTime || 'N/A'}ms`
        });

        this.results.technicalSEO = results;
    }

    async analyzeMetadata() {
        const results = {
            score: 0,
            tests: []
        };

        // Title analysis
        const title = document.title;
        results.tests.push({
            name: 'Title Tag',
            passed: title && title.length >= 10 && title.length <= 60,
            details: `Title length: ${title?.length || 0} characters`
        });

        // Meta description analysis
        const metaDescription = document.querySelector('meta[name="description"]')?.content;
        results.tests.push({
            name: 'Meta Description',
            passed: metaDescription && metaDescription.length >= 120 && metaDescription.length <= 155,
            details: `Description length: ${metaDescription?.length || 0} characters`
        });

        // OpenGraph tags
        const ogTags = document.querySelectorAll('meta[property^="og:"]');
        results.tests.push({
            name: 'Open Graph Tags',
            passed: ogTags.length >= 4, // title, type, url, image minimum
            details: `Found ${ogTags.length} Open Graph tags`
        });

        this.results.metadata = results;
    }

    async analyzeStructuredData() {
        const results = {
            score: 0,
            tests: []
        };

        const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');

        for (const script of jsonLdScripts) {
            try {
                const data = JSON.parse(script.textContent);

                // Validate Schema.org structure
                results.tests.push({
                    name: 'Schema.org Validation',
                    passed: this.validateSchemaStructure(data),
                    details: `Found valid Schema.org type: ${data['@type']}`
                });

                // Check for required properties based on type
                const requiredProps = this.getRequiredProperties(data['@type']);
                const hasRequired = requiredProps.every(prop =>
                    data.hasOwnProperty(prop));

                results.tests.push({
                    name: 'Required Properties',
                    passed: hasRequired,
                    details: `Required properties present: ${hasRequired ? 'Yes' : 'No'}`
                });

            } catch (e) {
                results.tests.push({
                    name: 'JSON-LD Syntax',
                    passed: false,
                    details: `Invalid JSON-LD: ${e.message}`
                });
            }
        }

        this.results.structuredData = results;
    }

    async analyzePerformance() {
        const results = {
            score: 0,
            tests: []
        };

        // Analyze WebGL performance
        const webglInfo = this.getWebGLInfo();
        results.tests.push({
            name: 'WebGL Support',
            passed: webglInfo.supported,
            details: `WebGL ${webglInfo.version} supported: ${webglInfo.supported}`
        });

        // Frame rate analysis
        const fps = await this.measureFrameRate();
        results.tests.push({
            name: 'Frame Rate',
            passed: fps >= 30,
            details: `Average FPS: ${fps}`
        });

        // Memory usage
        const memory = performance.memory;
        if (memory) {
            const usedHeapSize = memory.usedJSHeapSize / 1048576; // Convert to MB
            results.tests.push({
                name: 'Memory Usage',
                passed: usedHeapSize < 100, // Less than 100MB
                details: `Used heap size: ${usedHeapSize.toFixed(2)}MB`
            });
        }

        this.results.performance = results;
    }

    async analyzeMobileCompatibility() {
        const results = {
            score: 0,
            tests: []
        };

        // Viewport configuration
        const viewport = document.querySelector('meta[name="viewport"]');
        results.tests.push({
            name: 'Viewport Configuration',
            passed: viewport?.content.includes('width=device-width'),
            details: 'Viewport meta tag configuration'
        });

        // Touch event handling
        results.tests.push({
            name: 'Touch Events',
            passed: 'ontouchstart' in window,
            details: 'Touch event support'
        });

        // Canvas size responsiveness
        const canvas = document.querySelector('canvas');
        if (canvas) {
            const isResponsive = canvas.style.width.includes('%') ||
                canvas.style.maxWidth.includes('%');
            results.tests.push({
                name: 'Responsive Canvas',
                passed: isResponsive,
                details: 'Canvas should be responsive'
            });
        }

        this.results.mobileCompatibility = results;
    }

    async measureLoadTime() {
        const navigationEntries = performance.getEntriesByType('navigation');
        if (navigationEntries.length > 0) {
            return navigationEntries[0].loadEventEnd;
        }
        return performance.now();
    }

    async measureFrameRate() {
        return new Promise(resolve => {
            let frames = 0;
            let lastTime = performance.now();

            const countFrames = () => {
                frames++;
                const currentTime = performance.now();

                if (currentTime - lastTime >= 1000) {
                    resolve(frames);
                } else {
                    requestAnimationFrame(countFrames);
                }
            };

            requestAnimationFrame(countFrames);
        });
    }

    getWebGLInfo() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

        return {
            supported: !!gl,
            version: gl ? (gl instanceof WebGL2RenderingContext ? '2.0' : '1.0') : 'none',
            maxTextureSize: gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : 0,
            extensions: gl ? gl.getSupportedExtensions() : []
        };
    }

    validateSchemaStructure(data) {
        return data['@context'] === 'https://schema.org' &&
            data['@type'] &&
            typeof data['@type'] === 'string';
    }

    getRequiredProperties(type) {
        const propertyMap = {
            'WebApplication': ['name', 'applicationCategory'],
            'SoftwareApplication': ['name', 'applicationCategory'],
            'InteractiveResource': ['name']
        };
        return propertyMap[type] || [];
    }

    calculateScore(tests) {
        if (!tests || tests.length === 0) return 0;
        const passed = tests.filter(test => test.passed).length;
        return Math.round((passed / tests.length) * 100);
    }

    generateReport() {
        const categories = Object.keys(this.results);
        const report = {
            overallScore: 0,
            categories: {},
            timestamp: new Date().toISOString(),
            environment: {
                userAgent: this.options.userAgent,
                viewport: this.options.viewport,
                connection: this.options.connection
            },
            details: this.results
        };

        // Calculate scores for each category
        categories.forEach(category => {
            const categoryTests = this.results[category].tests;
            report.categories[category] = {
                score: this.calculateScore(categoryTests),
                tests: categoryTests,
                weight: this.getCategoryWeight(category)
            };
        });

        // Calculate weighted overall score
        const totalWeight = Object.values(report.categories)
            .reduce((sum, cat) => sum + cat.weight, 0);

        const weightedScore = Object.values(report.categories)
            .reduce((sum, cat) => sum + (cat.score * cat.weight), 0);

        report.overallScore = Math.round(weightedScore / totalWeight);

        return report;
    }

    getCategoryWeight(category) {
        const weights = {
            technicalSEO: 0.3,
            metadata: 0.25,
            structuredData: 0.2,
            performance: 0.15,
            mobileCompatibility: 0.1
        };
        return weights[category] || 1;
    }
}

export async function runSEOAnalysis() {
    const analyzer = new FluxelSEOAnalyzer({
        userAgent: 'Googlebot',
        viewport: { width: 375, height: 812 },
        connection: '4G'
    });

    try {
        const report = await analyzer.analyze();
        console.log('SEO Analysis Complete:', report);
        return report;
    } catch (error) {
        console.error('SEO Analysis Failed:', error);
        throw error;
    }
}