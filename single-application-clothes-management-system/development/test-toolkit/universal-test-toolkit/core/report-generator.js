/**
 * Report Generator - Test Results Report Generation
 * 
 * Generates comprehensive test reports in JSON format
 */

const fs = require('fs');
const path = require('path');

class ReportGenerator {
    constructor() {
        this.reportsDir = path.join(__dirname, '../reports');
        this.ensureReportsDir();
    }

    // Ensure reports directory exists
    ensureReportsDir() {
        if (!fs.existsSync(this.reportsDir)) {
            fs.mkdirSync(this.reportsDir, { recursive: true });
        }
    }

    // Generate comprehensive report
    async generate(results, config) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `test-report-${timestamp}.json`;
        const filePath = path.join(this.reportsDir, fileName);

        // Calculate success rate
        const successRate = results.summary.totalTests > 0 
            ? Math.round((results.summary.passed / results.summary.totalTests) * 100)
            : 0;

        // Build comprehensive report
        const report = {
            metadata: {
                generatedAt: new Date().toISOString(),
                toolkitVersion: require('../package.json').version,
                configFile: config.configFile || 'unknown',
                executionId: this.generateExecutionId()
            },
            application: {
                name: results.appName,
                targetUrl: results.targetUrl,
                testDuration: results.duration || 0
            },
            summary: {
                totalTests: results.summary.totalTests,
                passed: results.summary.passed,
                failed: results.summary.failed,
                warnings: results.summary.warnings,
                successRate: successRate,
                pluginsExecuted: results.summary.pluginsExecuted,
                endpointsTested: results.summary.endpointsTested,
                uiComponentsTested: results.summary.uiComponentsTested
            },
            testSuites: results.testSuites,
            insights: this.generateInsights(results),
            recommendations: this.generateRecommendations(results),
            filePath: filePath,
            fileName: fileName
        };

        // Save to file
        fs.writeFileSync(filePath, JSON.stringify(report, null, 2));

        console.log(`📊 Report generated: ${fileName}`);
        return report;
    }

    // Generate test insights
    generateInsights(results) {
        const insights = [];

        // Overall health insight
        const successRate = results.summary.totalTests > 0 
            ? (results.summary.passed / results.summary.totalTests) * 100
            : 0;

        if (successRate >= 90) {
            insights.push({
                type: 'success',
                message: 'Excellent application health detected',
                detail: `${successRate.toFixed(1)}% of tests passed successfully`
            });
        } else if (successRate >= 70) {
            insights.push({
                type: 'warning',
                message: 'Good application health with room for improvement',
                detail: `${successRate.toFixed(1)}% of tests passed, ${results.summary.failed} tests failed`
            });
        } else {
            insights.push({
                type: 'critical',
                message: 'Application health needs attention',
                detail: `Only ${successRate.toFixed(1)}% of tests passed, ${results.summary.failed} tests failed`
            });
        }

        // Plugin coverage insight
        if (results.summary.pluginsExecuted > 0) {
            insights.push({
                type: 'info',
                message: 'Comprehensive testing coverage achieved',
                detail: `${results.summary.pluginsExecuted} different test types executed`
            });
        }

        // Failure pattern analysis
        const failedTests = this.extractFailedTests(results);
        if (failedTests.length > 0) {
            const failureTypes = this.analyzeFailurePatterns(failedTests);
            insights.push({
                type: 'analysis',
                message: 'Failure patterns identified',
                detail: failureTypes
            });
        }

        return insights;
    }

    // Generate recommendations
    generateRecommendations(results) {
        const recommendations = [];

        // Based on failed tests
        const failedTests = this.extractFailedTests(results);
        if (failedTests.length > 0) {
            recommendations.push({
                priority: 'high',
                category: 'reliability',
                action: 'Fix failing tests',
                detail: `Address ${failedTests.length} failing tests to improve application stability`
            });
        }

        // Based on warnings
        if (results.summary.warnings > 0) {
            recommendations.push({
                priority: 'medium',
                category: 'quality',
                action: 'Review warnings',
                detail: `Investigate ${results.summary.warnings} warning(s) to prevent future issues`
            });
        }

        // API coverage recommendation
        if (results.summary.endpointsTested === 0) {
            recommendations.push({
                priority: 'medium',
                category: 'coverage',
                action: 'Add API testing',
                detail: 'Consider adding API endpoint tests for better coverage'
            });
        }

        // UI coverage recommendation
        if (results.summary.uiComponentsTested === 0) {
            recommendations.push({
                priority: 'medium',
                category: 'coverage',
                action: 'Add UI testing',
                detail: 'Consider adding UI component tests for better user experience validation'
            });
        }

        return recommendations;
    }

    // Extract failed tests
    extractFailedTests(results) {
        const failedTests = [];
        
        for (const suite of results.testSuites) {
            for (const test of suite.tests) {
                if (test.status === 'failed') {
                    failedTests.push({
                        suite: suite.name,
                        test: test.name,
                        type: test.type,
                        message: test.message,
                        errors: test.errors
                    });
                }
            }
        }
        
        return failedTests;
    }

    // Analyze failure patterns
    analyzeFailurePatterns(failedTests) {
        const patterns = {};
        
        for (const test of failedTests) {
            const type = test.type;
            if (!patterns[type]) {
                patterns[type] = 0;
            }
            patterns[type]++;
        }
        
        return Object.entries(patterns)
            .map(([type, count]) => `${count} ${type} failure(s)`)
            .join(', ');
    }

    // Generate unique execution ID
    generateExecutionId() {
        return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // List recent reports
    listRecentReports(limit = 10) {
        try {
            const files = fs.readdirSync(this.reportsDir)
                .filter(file => file.startsWith('test-report-'))
                .sort()
                .reverse()
                .slice(0, limit);
            
            return files.map(file => ({
                fileName: file,
                filePath: path.join(this.reportsDir, file),
                createdAt: fs.statSync(path.join(this.reportsDir, file)).mtime
            }));
        } catch (error) {
            return [];
        }
    }
}

module.exports = ReportGenerator;