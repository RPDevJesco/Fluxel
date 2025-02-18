export class FluxelSEOTester {
    constructor() {
        this.testResults = [];
    }

    async runTests() {
        this.testResults = [];

        await this.testMetaTags();
        await this.testStructuredData();
        await this.testSearchEngineSnapshot();
        await this.testStateChanges();

        return this.generateReport();
    }

    async testMetaTags() {
        const metaTags = document.getElementsByTagName('meta');
        const requiredTags = ['title', 'description'];

        requiredTags.forEach(tag => {
            const found = Array.from(metaTags).some(meta =>
                meta.name === tag && meta.content.length > 0
            );

            this.testResults.push({
                test: `Meta tag: ${tag}`,
                passed: found,
                details: found ?
                    `Found ${tag} meta tag with content` :
                    `Missing or empty ${tag} meta tag`
            });
        });
    }

    async testStructuredData() {
        const jsonLDScripts = document.querySelectorAll(
            'script[type="application/ld+json"]'
        );

        if (jsonLDScripts.length === 0) {
            this.testResults.push({
                test: 'Structured Data',
                passed: false,
                details: 'No JSON-LD script found'
            });
            return;
        }

        jsonLDScripts.forEach((script, index) => {
            try {
                const data = JSON.parse(script.textContent);
                this.validateStructuredData(data, index);
            } catch (e) {
                this.testResults.push({
                    test: `JSON-LD Script ${index}`,
                    passed: false,
                    details: `Invalid JSON: ${e.message}`
                });
            }
        });
    }

    validateStructuredData(data, index) {
        // Check required Schema.org properties
        const requiredProps = ['@context', '@type'];

        requiredProps.forEach(prop => {
            this.testResults.push({
                test: `Structured Data Property: ${prop}`,
                passed: data.hasOwnProperty(prop),
                details: data.hasOwnProperty(prop) ?
                    `Found ${prop} with value ${data[prop]}` :
                    `Missing required property ${prop}`
            });
        });
    }

    async testSearchEngineSnapshot() {
        // Create a virtual snapshot of what search engines would see
        const snapshot = {
            title: document.title,
            metaTags: {},
            structuredData: [],
            dynamicUpdates: true
        };

        // Collect meta tags
        Array.from(document.getElementsByTagName('meta')).forEach(meta => {
            if (meta.name) {
                snapshot.metaTags[meta.name] = meta.content;
            }
        });

        // Collect structured data
        document.querySelectorAll('script[type="application/ld+json"]')
            .forEach(script => {
                try {
                    snapshot.structuredData.push(JSON.parse(script.textContent));
                } catch (e) {
                    console.error('Invalid JSON-LD:', e);
                }
            });

        this.testResults.push({
            test: 'Search Engine Snapshot',
            passed: this.validateSnapshot(snapshot),
            details: 'Snapshot data: ' + JSON.stringify(snapshot, null, 2)
        });
    }

    validateSnapshot(snapshot) {
        // Basic validation of snapshot data
        return (
            snapshot.title?.length > 0 &&
            Object.keys(snapshot.metaTags).length > 0 &&
            snapshot.structuredData.length > 0
        );
    }

    async testStateChanges() {
        const initialStructuredData = this.getStructuredData();

        // Simulate state changes if possible
        if (window.counterApp) {
            const beforeCount = window.counterApp.count.get();
            window.counterApp.count.set(beforeCount + 1);

            // Wait for potential updates
            await new Promise(resolve => setTimeout(resolve, 100));

            const updatedStructuredData = this.getStructuredData();

            this.testResults.push({
                test: 'Dynamic Metadata Updates',
                passed: !this.areObjectsEqual(initialStructuredData, updatedStructuredData),
                details: 'Checking if metadata updates with state changes'
            });

            window.counterApp.count.set(beforeCount);
        }
    }

    getStructuredData() {
        const script = document.querySelector('script[type="application/ld+json"]');
        return script ? JSON.parse(script.textContent) : null;
    }

    areObjectsEqual(obj1, obj2) {
        return JSON.stringify(obj1) === JSON.stringify(obj2);
    }

    generateReport() {
        const passed = this.testResults.filter(r => r.passed).length;
        const total = this.testResults.length;

        return {
            summary: {
                total,
                passed,
                failed: total - passed,
                percentage: Math.round((passed / total) * 100)
            },
            results: this.testResults,
            timestamp: new Date().toISOString()
        };
    }
}

export async function runSEOTests() {
    const tester = new FluxelSEOTester();
    const results = await tester.runTests();

    console.log('SEO Test Results:', results);

    // Optional: Generate HTML report
    const reportHTML = generateHTMLReport(results);
    document.getElementById('seo-report').innerHTML = reportHTML;

    return results;
}

function generateHTMLReport(results) {
    return `
        <div class="seo-report">
            <h2>SEO Test Results</h2>
            <div class="summary">
                <p>Total Tests: ${results.summary.total}</p>
                <p>Passed: ${results.summary.passed}</p>
                <p>Failed: ${results.summary.failed}</p>
                <p>Success Rate: ${results.summary.percentage}%</p>
            </div>
            <div class="details">
                ${results.results.map(result => `
                    <div class="test-result ${result.passed ? 'passed' : 'failed'}">
                        <h3>${result.test}</h3>
                        <p>${result.details}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}