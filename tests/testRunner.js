// testRunner.js
import { FluxelSEOAnalyzer } from '../tests/FluxelSEOAnalyzer.js';
import { FluxelSEOReporter } from '../tests/FluxelSEOReporter.js';

export async function runSEOTest(options = {}) {
    const defaultOptions = {
        userAgent: 'Googlebot',
        viewport: { width: 375, height: 812 },
        connection: '4G',
        containerId: 'seo-report',
        runHeadless: false
    };

    const testOptions = { ...defaultOptions, ...options };

    try {
        const analyzer = new FluxelSEOAnalyzer(testOptions);
        const report = await analyzer.analyze();

        // Generate visual report if not running in headless mode
        if (!testOptions.runHeadless) {
            const reporter = new FluxelSEOReporter(testOptions.containerId);
            reporter.generateReport(report);
        }

        return {
            success: true,
            data: report,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}