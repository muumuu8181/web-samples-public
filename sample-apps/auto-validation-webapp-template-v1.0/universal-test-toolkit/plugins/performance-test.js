/**
 * Performance Test Plugin - Tests application performance metrics
 * 
 * Comprehensive performance testing including load time, memory usage simulation
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

class PerformanceTestPlugin {
    constructor(config) {
        this.config = config;
        this.timeout = config.timeout || 30000;
    }

    // Execute performance test
    async execute(test) {
        const result = {
            status: 'unknown',
            message: '',
            data: {},
            errors: []
        };

        try {
            // Validate test configuration
            if (!test.performance) {
                throw new Error('Missing performance test configuration');
            }

            const perfTest = test.performance;
            const url = this.buildUrl(perfTest.path || '/');
            
            console.log(`    ⚡ Performance testing: ${url}`);

            // Run performance tests
            const metrics = await this.runPerformanceTests(url, perfTest);
            
            // Analyze results
            const analysis = this.analyzePerformance(metrics, perfTest.thresholds || {});
            
            result.status = analysis.success ? 'passed' : 'failed';
            result.message = analysis.message;
            result.data = metrics;

            if (!analysis.success) {
                result.errors = analysis.errors;
            }

        } catch (error) {
            result.status = 'failed';
            result.message = `Performance test failed: ${error.message}`;
            result.errors.push({
                type: 'performance_test_error',
                message: error.message
            });
        }

        return result;
    }

    // Build full URL
    buildUrl(path) {
        const baseUrl = this.config.targetUrl.replace(/\/$/, '');
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `${baseUrl}${cleanPath}`;
    }

    // Run comprehensive performance tests
    async runPerformanceTests(url, config) {
        const metrics = {
            url: url,
            timestamp: new Date().toISOString(),
            singleRequest: {},
            loadTest: {},
            resourceAnalysis: {},
            overview: {}
        };

        // 1. Single request performance
        console.log('      📊 Testing single request performance...');
        metrics.singleRequest = await this.testSingleRequest(url);

        // 2. Load testing (multiple concurrent requests)
        if (config.loadTest !== false) {
            console.log('      🔄 Running load test...');
            const concurrency = config.concurrency || 5;
            const requests = config.requests || 10;
            metrics.loadTest = await this.testLoad(url, concurrency, requests);
        }

        // 3. Resource analysis
        console.log('      🔍 Analyzing resources...');
        metrics.resourceAnalysis = await this.analyzeResources(url);

        // 4. Calculate overview metrics
        metrics.overview = this.calculateOverviewMetrics(metrics);

        return metrics;
    }

    // Test single request performance
    async testSingleRequest(url) {
        const startTime = process.hrtime.bigint();
        const memBefore = process.memoryUsage();
        
        try {
            const response = await this.makeRequest(url);
            const endTime = process.hrtime.bigint();
            const memAfter = process.memoryUsage();
            
            const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
            
            return {
                success: true,
                responseTime: Math.round(responseTime * 100) / 100,
                statusCode: response.statusCode,
                contentLength: response.body ? response.body.length : 0,
                headers: response.headers,
                memoryDelta: {
                    rss: memAfter.rss - memBefore.rss,
                    heapUsed: memAfter.heapUsed - memBefore.heapUsed,
                    heapTotal: memAfter.heapTotal - memBefore.heapTotal
                },
                timing: {
                    start: new Date(Number(startTime / 1000000n)).toISOString(),
                    end: new Date(Number(endTime / 1000000n)).toISOString()
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                responseTime: -1
            };
        }
    }

    // Test load performance
    async testLoad(url, concurrency, totalRequests) {
        const results = [];
        const startTime = Date.now();
        
        // Create batches of concurrent requests
        const batches = Math.ceil(totalRequests / concurrency);
        
        for (let batch = 0; batch < batches; batch++) {
            const batchSize = Math.min(concurrency, totalRequests - (batch * concurrency));
            const promises = [];
            
            for (let i = 0; i < batchSize; i++) {
                promises.push(this.testSingleRequest(url));
            }
            
            const batchResults = await Promise.all(promises);
            results.push(...batchResults);
        }
        
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        
        // Analyze results
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        const responseTimes = successful.map(r => r.responseTime);
        
        return {
            totalRequests: totalRequests,
            concurrency: concurrency,
            successful: successful.length,
            failed: failed.length,
            totalTime: totalTime,
            requestsPerSecond: Math.round((successful.length / totalTime) * 1000 * 100) / 100,
            averageResponseTime: responseTimes.length > 0 
                ? Math.round((responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) * 100) / 100 
                : 0,
            minResponseTime: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
            maxResponseTime: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
            failureRate: Math.round((failed.length / totalRequests) * 100 * 100) / 100,
            results: results
        };
    }

    // Analyze resources in the page
    async analyzeResources(url) {
        try {
            const response = await this.makeRequest(url);
            const html = response.body || '';
            
            // Count different resource types
            const scripts = this.extractResources(html, /<script[^>]*src=["']([^"']*)["'][^>]*>/gi);
            const stylesheets = this.extractResources(html, /<link[^>]*href=["']([^"']*\.css[^"']*)["'][^>]*>/gi);
            const images = this.extractResources(html, /<img[^>]*src=["']([^"']*)["'][^>]*>/gi);
            
            // Estimate total page size
            const estimatedSize = {
                html: html.length,
                scripts: scripts.length * 50000, // Rough estimate
                stylesheets: stylesheets.length * 20000, // Rough estimate
                images: images.length * 100000, // Rough estimate
                total: 0
            };
            estimatedSize.total = estimatedSize.html + estimatedSize.scripts + estimatedSize.stylesheets + estimatedSize.images;
            
            return {
                resourceCounts: {
                    scripts: scripts.length,
                    stylesheets: stylesheets.length,
                    images: images.length,
                    total: scripts.length + stylesheets.length + images.length
                },
                estimatedSizes: estimatedSize,
                resources: {
                    scripts: scripts.slice(0, 10), // Limit for report size
                    stylesheets: stylesheets.slice(0, 10),
                    images: images.slice(0, 10)
                }
            };
        } catch (error) {
            return {
                error: error.message,
                resourceCounts: { scripts: 0, stylesheets: 0, images: 0, total: 0 },
                estimatedSizes: { html: 0, scripts: 0, stylesheets: 0, images: 0, total: 0 }
            };
        }
    }

    // Extract resources from HTML
    extractResources(html, regex) {
        const resources = [];
        let match;
        
        while ((match = regex.exec(html)) !== null) {
            resources.push(match[1]);
        }
        
        return resources;
    }

    // Calculate overview metrics
    calculateOverviewMetrics(metrics) {
        const overview = {
            overallScore: 0,
            recommendations: [],
            summary: {}
        };

        // Performance score calculation (0-100)
        let score = 100;
        
        // Single request performance
        if (metrics.singleRequest.success) {
            const responseTime = metrics.singleRequest.responseTime;
            if (responseTime > 3000) score -= 30; // Very slow
            else if (responseTime > 1000) score -= 15; // Slow
            else if (responseTime > 500) score -= 5; // Moderate
            
            overview.summary.responseTime = responseTime;
        } else {
            score -= 50; // Failed request
        }

        // Load test performance
        if (metrics.loadTest.failed > 0) {
            score -= (metrics.loadTest.failureRate * 0.5); // Reduce score based on failure rate
        }

        // Resource optimization
        const resourceCount = metrics.resourceAnalysis.resourceCounts?.total || 0;
        if (resourceCount > 50) score -= 15; // Too many resources
        else if (resourceCount > 30) score -= 10;
        else if (resourceCount > 20) score -= 5;

        overview.overallScore = Math.max(0, Math.round(score));

        // Generate recommendations
        if (metrics.singleRequest.responseTime > 1000) {
            overview.recommendations.push({
                priority: 'high',
                category: 'response_time',
                message: 'Optimize response time - currently exceeds 1 second'
            });
        }

        if (metrics.loadTest.failureRate > 5) {
            overview.recommendations.push({
                priority: 'high',
                category: 'reliability',
                message: 'Address request failures under load'
            });
        }

        if (resourceCount > 30) {
            overview.recommendations.push({
                priority: 'medium',
                category: 'optimization',
                message: 'Consider reducing number of resources for faster loading'
            });
        }

        // Summary
        overview.summary = {
            responseTime: metrics.singleRequest.responseTime || 0,
            resourceCount: resourceCount,
            loadTestSuccess: metrics.loadTest.successful || 0,
            loadTestFailed: metrics.loadTest.failed || 0,
            estimatedPageSize: metrics.resourceAnalysis.estimatedSizes?.total || 0
        };

        return overview;
    }

    // Make HTTP request
    async makeRequest(url) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const isHttps = urlObj.protocol === 'https:';
            const httpModule = isHttps ? https : http;

            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || (isHttps ? 443 : 80),
                path: urlObj.pathname + urlObj.search,
                method: 'GET',
                headers: {
                    'User-Agent': 'Universal-Test-Toolkit/1.0 (Performance-Testing)',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Cache-Control': 'no-cache'
                },
                timeout: this.timeout
            };

            const req = httpModule.request(options, (res) => {
                let body = '';
                
                res.on('data', (chunk) => {
                    body += chunk;
                });

                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: body
                    });
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error(`Request timeout after ${this.timeout}ms`));
            });

            req.end();
        });
    }

    // Analyze performance results
    analyzePerformance(metrics, thresholds) {
        const analysis = {
            success: true,
            message: '',
            errors: []
        };

        // Check single request performance
        if (!metrics.singleRequest.success) {
            analysis.success = false;
            analysis.errors.push({
                type: 'request_failure',
                message: 'Single request test failed'
            });
        } else {
            // Check response time threshold
            const responseTime = metrics.singleRequest.responseTime;
            const maxResponseTime = thresholds.maxResponseTime || 5000;
            
            if (responseTime > maxResponseTime) {
                analysis.success = false;
                analysis.errors.push({
                    type: 'slow_response',
                    expected: `<${maxResponseTime}ms`,
                    actual: `${responseTime}ms`,
                    message: 'Response time exceeds threshold'
                });
            }
        }

        // Check load test results
        if (metrics.loadTest && metrics.loadTest.failureRate > (thresholds.maxFailureRate || 10)) {
            analysis.success = false;
            analysis.errors.push({
                type: 'high_failure_rate',
                expected: `<${thresholds.maxFailureRate || 10}%`,
                actual: `${metrics.loadTest.failureRate}%`,
                message: 'Load test failure rate too high'
            });
        }

        // Check performance score
        const minScore = thresholds.minPerformanceScore || 70;
        if (metrics.overview.overallScore < minScore) {
            analysis.success = false;
            analysis.errors.push({
                type: 'low_performance_score',
                expected: `>=${minScore}`,
                actual: metrics.overview.overallScore,
                message: 'Overall performance score below threshold'
            });
        }

        // Generate summary message
        if (analysis.success) {
            analysis.message = `Performance test passed (Score: ${metrics.overview.overallScore}/100, Response: ${metrics.singleRequest.responseTime}ms)`;
        } else {
            const errorCount = analysis.errors.length;
            analysis.message = `Performance test failed with ${errorCount} issue(s): ${analysis.errors.map(e => e.type).join(', ')}`;
        }

        return analysis;
    }
}

module.exports = PerformanceTestPlugin;